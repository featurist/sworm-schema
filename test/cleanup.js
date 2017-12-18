const fs = require('mz/fs')

beforeEach(async () => {
  if (await fs.exists('test/db/test.db')) {
    await fs.unlink('test/db/test.db')
  }
})
