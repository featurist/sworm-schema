const sworm = require('sworm')
const flatten = require('lowscore/flatten')
const always = require('./always')

const drivers = {
  pg: require('./drivers/pg'),
  mysql: require('./drivers/mysql'),
  sqlite: require('./drivers/sqlite'),
}
function driverByName (name) {
  var driver = drivers[name] || {}
  driver.name = name
  return driver
}

function resolveDriverSpecificOptions (config, driver) {
  var resolved = {}

  Object.keys(config).forEach(key => {
    var value = config[key]

    resolved[key] = typeof value === 'function'
      ? value(driver)
      : typeof value === 'object' ? value[driver.name] : value
  })

  return resolved
}

module.exports = class Driver {
  constructor(name) {
    const driver = driverByName(name)
    Object.assign(this, driver)
    if (!driver) {
      throw new Error('no such driver ' + name)
    }
  }

  tableStatements (name, columns) {
    var columnDefinitions = columns.map(column => {
      var columnOptions = typeof column.definition == 'object'
        ? resolveDriverSpecificOptions(column.definition, this)
        : resolveDriverSpecificOptions({type: column.definition}, this)

      return {name: column.name, definition: columnOptions}
    })

    var columnsSql = columnDefinitions
      .map(column => {
        return this.column(column.name, column.definition)
      })
      .join(',\n  ')

    let statements = [`create table if not exists ${name} (\n  ${columnsSql}\n);`]

    let indexes = columnDefinitions.filter(c => c.definition.index)
    indexes.forEach(column => {
      statements.push(
        `create index if not exists ${name}_${column.name} on ${name} (${column.name});`
      )
    })

    return statements
  }

  createTables (config, schema) {
    var db = sworm.db(config)
    return Promise.resolve(
      this.setOptions && this.setOptions(db)
    ).then(() => {
      let statements = Object.keys(schema).map(name => {
        var columnsDefinition = schema[name]
        var resolvedColumns = typeof columnsDefinition === 'function'
          ? columnsDefinition(this)
          : columnsDefinition

        var columns = Object.keys(resolvedColumns).map(name => {
          return {name: name, definition: resolvedColumns[name]}
        })

        return this.tableStatements(name, columns, this)
      })

      let sql = flatten(statements).join('\n')
      return always(db.query(sql, {}, {multiline: true}), () => db.close())
    })
  }

  deleteFromTables (config, schema) {
    const db = sworm.db(config)

    return Promise.resolve(
      this.setOptions && this.setOptions(db)
    ).then(() => {
      let statements = Object.keys(schema).map(name => {
        return `DELETE FROM ${name};`
      })
      let sql = flatten(['BEGIN;'].concat(statements).concat(['COMMIT;'])).join(
        '\n'
      )
      return always(db.query(sql, {}, {multiline: true}), () => db.close())
    })
  }
}
