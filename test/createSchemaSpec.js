const assert = require('assert')
const SwormSchema = require('..')

describe('create schema', () => {
  it('creates tables defined in the schema', async () => {
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

    const peopleSchema = await db.query(`PRAGMA table_info('people')`)
    const placesSchema = await db.query(`PRAGMA table_info('places')`)

    assert.deepEqual(peopleSchema, [
      {
        cid: 0,
        name: 'id',
        type: 'integer',
        pk: 0,
        notnull: 1,
        dflt_value: null
      },
      {
        cid: 1,
        name: 'name',
        type: 'text',
        pk: 0,
        notnull: 1,
        dflt_value: null
      },
    ])

    assert.deepEqual(placesSchema, [
      {
        cid: 0,
        name: 'id',
        type: 'integer',
        pk: 0,
        notnull: 1,
        dflt_value: null
      },
      {
        cid: 1,
        name: 'name',
        type: 'text',
        pk: 0,
        notnull: 1,
        dflt_value: null
      },
    ])
  })
})
