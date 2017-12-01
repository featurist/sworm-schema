const assert = require('assert')
const fs = require('mz/fs')
const SwormSchema = require('..')

describe('validate query', () => {
  it('returns no changes when the schema matches the query', async () => {
    const swormSchema = new SwormSchema({
      url: 'sqlite:test/db/test.db',
      schema: {
        people: {
          id: {type: 'integer'},
          name: {type: 'text'},
        },
      }
    })

    const missingSchema = swormSchema.validateQuery(`
      select people.id, people.name
      from people
    `)

    assert.deepEqual(missingSchema, {
      message: 'OK',
      missing: {}
    })
  })

  it('returns the missing tables/columns when the schema does not match', async () => {
    const swormSchema = new SwormSchema({
      url: 'sqlite:test/db/test.db',
      schema: {
        people: {
          id: {type: 'integer'},
          name: {type: 'text'},
        },
      }
    })

    const missingSchema = swormSchema.validateQuery(`
      select people.id, people.name
      from people

      union

      select places.id, places.name
      from places
    `)

    assert.deepEqual(missingSchema, {
      message: 'OK',
      missing: {
        places: {
          id: { type: 'unknown' },
          name: { type: 'unknown' },
        }
      }
    })
  })
})
