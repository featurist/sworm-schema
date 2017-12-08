const querySchema = require('./querySchema')

module.exports = function (input, actualSchema) {
  const queries = input.split(/UNION/i)
  const missing = {}
  let unknownColumns = []
  queries.forEach(query => {
    const schema = querySchema(query)
    const tables = schema.tables
    const tableNames = Object.keys(tables)
    unknownColumns = unknownColumns.concat(schema.unknownColumns)

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
  })

  return {
    message: Object.keys(missing).length === 0 && unknownColumns.length === 0 ? 'OK' : 'Incompatible',
    missing,
    unknownColumns
  }
}
