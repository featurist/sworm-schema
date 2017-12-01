
module.exports = function always (promise, fn) {
  return promise.then(fn, e => {
    return fn().then(() => {
      throw e
    })
  })
}
