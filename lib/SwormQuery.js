const groupBy = require('lowscore/groupBy')
const indexBy = require('lowscore/indexBy')
const uniq = require('lowscore/uniq')
const compact = require('lowscore/compact')
const sqliteParser = require('sqlite-parser')

module.exports = class SwormQuery {
  constructor ({schema, query}) {
    this.schema = schema
    this.query = query
    this.ast = sqliteParser(query)
  }

  analyse () {
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

    findIdentifiers(this.ast)
    this.identifiers = identifiers

    const columns = identifiers
      .filter(identifier => identifier.variant === 'column')
      .map(identifier => identifier.name)
      .sort()


    const tables = {}
    identifiers
      .filter(ident => ident.variant === 'table')
      .forEach(table => {
        tables[table.alias] = table.name
      })


    this.tables = tables
    this.columns = columns
    this.mappings = columns.map((fullColumnName, index) => {
      const tableAlias = fullColumnName.substring(0, fullColumnName.indexOf('.'))
      const column = fullColumnName.substring(fullColumnName.indexOf('.')+1)
      return {
        sql: `${fullColumnName} as "column${index}"`,
        column,
        alias: `column${index}`,
        table: tables[tableAlias],
        tableAlias,
      }
    })
  }

  asFetchAll () {
    const columns = this.mappings.map(column => column.sql).join(', ')
    return this.query.replace(/select[\s\S]*?from/i, `select ${columns}\nfrom`)
      .split('\n')
      .map(line => line.trim())
      .join('\n')
  }

  async fetchData (db) {
    this.analyse()
    const results = await db.query(this.asFetchAll())

    const tables = {}
    results.forEach(row => {
      const newRow = {}
      const tableColumns = {}
      Object.keys(row).forEach(alias => {
        const mapping = this.mappings.find(m => m.alias === alias)
        tableColumns[mapping.tableAlias] = tableColumns[mapping.tableAlias] || {
          table: mapping.table,
          columns: {},
        }
        tableColumns[mapping.tableAlias].columns[mapping.column] = row[alias]
      })

      Object.values(tableColumns).forEach(tableEntry => {
        const columns = compact(Object.values(tableEntry.columns))
        if (columns.length > 0) {
          const name = tableEntry.table
          tables[name] = tables[name] || []
          tables[name].push(tableEntry)
        }
      })
    })

    const mergedEntries = []
    Object.keys(tables).forEach(tableName => {
      const rows = tables[tableName]
      const tableDefinition = this.schema[tableName]
      const columnDefinitions = Object.keys(tableDefinition).map(column => ({
        name: column,
        primaryKey: tableDefinition[column].primaryKey,
      }))
      const primaryKey = columnDefinitions.find(column => column.primaryKey).name
      const rowGroups = groupBy(rows, table => {
        return table.columns[primaryKey]
      })

      Object.values(rowGroups).forEach(rows => {
        const row = Object.assign.apply(null, rows)
        mergedEntries.push(row)
      })
    })

    return mergedEntries
  }
}
