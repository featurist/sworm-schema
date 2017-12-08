const groupBy = require('lowscore/groupBy')
const indexBy = require('lowscore/indexBy')
const uniq = require('lowscore/uniq')
const sqliteParser = require('sqlite-parser')


module.exports = function (query) {
  const ast = sqliteParser(query);
  const identifiers = []

  function findIdentifiers(obj) {
    if (obj.type === 'identifier') {
      identifiers.push(obj)
    } else  {
      const children = Object.values(obj)
      children.forEach(child => {
        if (typeof child === 'object') {
          findIdentifiers(child)
        }
      })
    }
  }

  findIdentifiers(ast)

  const tablesByName = groupBy(identifiers
    .filter(ident => ident.variant === 'table')
    .map(table => {
      return {
        name: table.name,
        alias: table.alias,
      }
    }), 'name')


  const aliasToTable = {}
  const tables = []
  Object.keys(tablesByName).forEach(tableName => {
    const table = {
      name: tableName,
    }
    const aliases = uniq(tablesByName[tableName].map(t => t.alias))
    aliases.forEach(alias => {
      aliasToTable[alias] = table
    })
    tables.push(table)
  })

  const columns = identifiers
    .filter(ident => ident.variant === 'column')
    .map(column => {
      let table = ''
      let name = column.name
      const nameParts = column.name.split('.')

      if (nameParts.length === 2) {
        table = nameParts[0]
        name = nameParts[1]
      }
      if (aliasToTable[table]) {
        table = aliasToTable[table].name
      }
      return {
        table,
        name,
      }
    })

  const schema = {
    tables: {},
    unknownColumns: []
  }
  tables.forEach(table => {
    table.columns = uniq(columns.filter(column => column.table === table.name).map(column => column.name))
    const tableSchema = {}

    table.columns.forEach(column => {
      tableSchema[column] = {type: 'unknown'}
    })

    schema.tables[table.name] = tableSchema
  })

  schema.unknownColumns = uniq(columns.filter(column => !column.table).map(column => column.name))

  return schema
}
