var urlUtils = require('url')
var patterns = [
  [
    /^sqlite:(.*)/,
    function (_, filename) {
      return {
        driver: 'sqlite',
        config: {
          filename: filename,
        },
      }
    },
  ],
  [
    /^oracle:(.*)/,
    function (_) {
      var url = urlUtils.parse(_)
      var auth = url.auth && url.auth.split(':')
      var user = auth ? auth[0] : undefined
      var password = auth ? auth[1] : undefined

      return oracleOptions(user, password, url.host + url.pathname)
    },
  ],
  [
    /^postgres:(.*)/,
    function (_) {
      var url = urlUtils.parse(_)
      var auth = url.auth && url.auth.split(':')

      return {
        driver: 'pg',
        config: {
          user: auth ? auth[0] : undefined,
          password: auth ? auth[1] : undefined,
          host: url.hostname,
          port: url.port ? url.port : undefined,
          database: url.pathname.replace(/^\//, ''),
        },
      }
    },
  ],
  [
    /^mysql:(.*)/,
    function (_) {
      var url = urlUtils.parse(_)
      var auth = url.auth && url.auth.split(':')

      return {
        driver: 'mysql',
        config: {
          user: auth ? auth[0] : undefined,
          password: auth ? auth[1] : undefined,
          host: url.hostname,
          port: url.port ? url.port : undefined,
          database: url.pathname.replace(/^\//, ''),
        },
      }
    },
  ],
  [
    /^jdbc:oracle:thin:([^\/]+)\/([^@]+)@(.*)/,
    function (_, user, password, connectString) {
      return oracleOptions(user, password, connectString)
    },
  ],
]

module.exports = function (string) {
  for (var n = 0, l = patterns.length; n < l; n++) {
    var pattern = patterns[n]

    var match = pattern[0].exec(string)
    if (match) {
      var result = pattern[1].apply(undefined, match)
      if (result) {
        return result
      }
    }
  }

  throw new Error(`no database driver found for connection URL: \`${string}'`)
}

function oracleOptions (user, password, connectString) {
  require('./oracleCtrlCHandler')

  return {
    driver: 'oracle',
    config: {
      user: user,
      password: password,
      connectString: connectString,
      pool: true,

      options: {
        maxRows: 10000,
        queueTimeout: 120000,
      },
    },
    setupSession: function (db) {
      return db.statement("alter session set time_zone = 'UTC'")
    },
  }
}
