const sworm = require('sworm')
const parseUrl = require('./parseUrl')
const Driver = require('./driver')
const validateQuery = require('./validateQuery')

module.exports = class SwormSchema {
  constructor ({url, schema}) {
    this.url = url
    this.config = parseUrl(url)
    this.schema = schema
    this.driver = new Driver(this.config.driver)
  }

  create () {
    const config = this.config
    const driver = this.driver

    if (driver.createDatabase) {
      return driver.createDatabase(config).then(() => {
        return driver.createTables(config, this.schema)
      })
    } else {
      return driver.createTables(config, this.schema)
    }
  }

  drop () {
    return this.driver.dropDatabase(this.config)
  }

  clean () {
    return this.driver.deleteFromTables(this.config, this.schema)
  }

  connect () {
    return sworm.db(this.config)
  }

  validateQuery (query) {
    return validateQuery(query, this.schema)
  }
}

