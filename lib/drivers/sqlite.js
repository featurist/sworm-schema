const fs = require('mz/fs')

module.exports = {
    setOptions (db) {
      return Promise.all([
        db.query('pragma synchronous=0;'),
        db.query('pragma journal_mode=MEMORY;'),
      ])
    },

    dropDatabase (config) {
      return fs.unlink(config.config.filename)
    },

    column: function (name, config) {
      var type = config.type
      var primaryKey = config.primaryKey ? 'primary key' : ''

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
