const querySchema = require('./querySchema')

module.exports = function (input, actualSchema) {
  const missing = {}
  const schema = querySchema(input)
  const tables = schema.tables
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
    message: Object.keys(missing).length === 0 && schema.unknownTables.length === 0 ? 'OK' : 'Incompatible',
    missing,
    unknownTables: schema.unknownTables
  }
}
