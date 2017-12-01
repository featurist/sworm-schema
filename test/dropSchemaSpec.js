const assert = require('assert')
const fs = require('mz/fs')
const SwormSchema = require('..')

describe('drop schema', () => {
  it('drops tables defined in the schema', async () => {
    const swormSchema = new SwormSchema({
      url: 'sqlite:test/db/test.db',
      schema: {
        people: {
          id: {type: 'integer'},
          name: {type: 'text'},
        },
        places: {
          id: {type: 'integer'},
          name: {type: 'text'},
        }
      }
    })
    await swormSchema.create()

    const db = swormSchema.connect()

    const tables = (await db.query(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `)).map(table => table.name)

    assert.deepEqual(tables, ['people', 'places'])


    await swormSchema.drop()

    const dbExists = await fs.exists(swormSchema.config.config.filename)
    assert.equal(dbExists, false)
  })
})
