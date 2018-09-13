const groupBy = require('lowscore/groupBy')
const indexBy = require('lowscore/indexBy')
const uniq = require('lowscore/uniq')
const mapObject = require('lowscore/mapObject')
const sqliteParser = require('sqlite-parser')


module.exports = function (query) {
  const ast = sqliteParser(query);

  const createdTables = []
  const tableSchemas = {}
  const unknownTables = []

  function findTables(obj, tables = []) {
    if (obj.type === 'identifier' && obj.variant === 'table') {
      tables.push({
        name: obj.name,
        alias: obj.alias,
      })
      createdTables.push(obj.name)
    }
    // e.g. the result of a SELECT statement with an alias
    else if (typeof obj.source === 'object' && !!obj.source.alias) {
      tables.push({
        name: '',
        alias: obj.source.alias,
      })
    }

    const children = Object.values(obj)
    children.forEach(child => {
      if (typeof child === 'object') {
        findTables(child, tables)
      }
    })
    return tables
  }

  function validate(obj) {
    if (obj['type'] === 'statement' && obj['variant'] !== 'list') {
      const statement = obj
      if (statement['result']) {
        const tablesInScope = findTables(statement['from'])

        const columnsWithTableRefs = statement['result'].filter(res => res.type === 'identifier' && res.variant === 'column')
          .map(column => {
            const nameParts = column.name.split('.')
            if (nameParts.length === 2) {
              const tableRef = nameParts[0]
              const columnName = nameParts[1]
              return {
                tableRef,
                columnName
              }
            }
          })
          .filter(col => !!col)

        const referencedTables = groupBy(columnsWithTableRefs, 'tableRef')
        Object.keys(referencedTables).forEach(tableRef => {
          const matchedTable = tablesInScope.find(t => t.name === tableRef || t.alias === tableRef)
          if (!matchedTable) {
            unknownTables.push(tableRef)
          }
          else if (matchedTable.name) { // gotta be a 'real' table
            if (!tableSchemas[matchedTable.name]) {
              tableSchemas[matchedTable.name] = new Set()
            }
            referencedTables[tableRef].forEach(tr => tableSchemas[matchedTable.name].add(tr.columnName))
          }          
        })
      }
    }
    const children = Object.values(obj)
    children.forEach(child => {
      if (typeof child === 'object') {
        validate(child)
      }
    })
  }

  validate(ast)

  return {
    tables: mapObject(tableSchemas, columnSet => {
      const tableSchema = {}
      columnSet.forEach(column => {
        tableSchema[column] = {type: 'unknown'}
      })
      return tableSchema
    }),
    unknownTables: uniq(unknownTables)
  }
}
