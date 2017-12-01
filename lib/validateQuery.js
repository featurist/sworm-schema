const querySchema = require('./querySchema')

module.exports = function (query, actualSchema) {
  const tables = querySchema(query)
  const missing = {}
  const tableNames = Object.keys(tables)

  tableNames.forEach(table => {
    const tableSchema = actualSchema[table] || {}
    const columnNames = Object.keys(tables[table])
    columnNames.forEach(column => {
      if (!tableSchema[column]) {
        if (!missing[table]) {
          missing[table] = {}
        }
        missingTable = missing[table]
        missingTable[column] = {type: 'unknown'}
      }
    })
  })

  return {
    message: 'OK',
    missing,
  }
}
