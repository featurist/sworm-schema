const sworm = require('sworm')
const always = require('../always')

module.exports = {
    createDatabase (config) {
      var _config = JSON.parse(JSON.stringify(config))

      var name = _config.config.database
      _config.config.database = 'postgres'

      var db = sworm.db(_config)

      return always(
        db.connect().then(() => {
          return db
            .query('select * from pg_database where datname = @name', {
              name: name,
            })
            .then(function (rows) {
              if (!rows.length) {
                return db.query(
                  'create database ' + name,
                  {},
                  {statement: true}
                )
              }
            })
        }),
        () => {
          return db.close()
        }
      )
    },

    dropDatabase (config) {
      var _config = JSON.parse(JSON.stringify(config))
      var name = _config.config.database
      _config.config.database = 'postgres'

      var db = sworm.db(_config)

      return always(
        db.connect().then(() => {
          return db.query('drop database if exists ' + name)
        }),
        () => {
          return db.close()
        }
      )
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
