const sworm = require('sworm')
const always = require('../always')

module.exports = {
    createDatabase (config) {
      var _config = JSON.parse(JSON.stringify(config))

      var name = _config.config.database
      delete _config.config.database

      var db = sworm.db(_config)
      return db.connect().then(() => {
        return always(db.query('create database if not exists ' + name), () => {
          return db.close()
        })
      })
    },

    dropDatabase (config) {
      var _config = JSON.parse(JSON.stringify(config))
      var name = _config.config.database
      delete _config.config.database

      var db = sworm.db(_config)

      return db.connect().then(() => {
        return always(
          db.connect().then(() => {
            return db.query('drop database if exists ' + name)
          }),
          () => {
            return db.close()
          }
        )
      })
    },

    column (name, config) {
      var primaryKey = config.primaryKey ? 'primary key' : ''
      var type = primaryKey ? 'serial' : config.type

      var nullable = config.primaryKey
        ? ''
        : config.null == true ? 'null' : 'not null'

      var defaultValue = config.defaultValue
        ? `default '${config.defaultValue}'`
        : ''
      return [name, type, nullable, primaryKey, defaultValue]
        .filter(x => x)
        .join(' ')
    },
  }
