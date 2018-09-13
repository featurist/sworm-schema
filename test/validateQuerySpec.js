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
      missing: {},
      unknownTables: []
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
      message: 'Incompatible',
      missing: {
        places: {
          id: { type: 'unknown' },
          name: { type: 'unknown' },
        }
      },
      unknownTables: []
    })
  })

  it('correctly identifies columns when query with aliased tables of the same name are in a union', async () => {
    const swormSchema = new SwormSchema({
      url: 'sqlite:test/db/test.db',
      schema: {}
    })

    const missingSchema = swormSchema.validateQuery(`
      select p.id, p.name
      from people p

      union

      select p.id, p.name
      from places p
    `)

    assert.deepEqual(missingSchema, {
      message: 'Incompatible',
      missing: {
        people: {
          id: { type: 'unknown' },
          name: { type: 'unknown' },
        },
        places: {
          id: { type: 'unknown' },
          name: { type: 'unknown' },
        }
      },
      unknownTables: []
    })
  })

  it('identifies columns that are not associated with a table', async () => {
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
      select p.bananas, p.name
      from people p
    `)

    assert.deepEqual(missingSchema, {
      message: 'Incompatible',
      missing: {
        people: {
          bananas: { type: 'unknown' }
        }
      },
      unknownTables: []
    })
  })

  it('identifies unknown tables', async () => {
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
      select p.id, foo.bar
      from people p
    `)

    assert.deepEqual(missingSchema, {
      message: 'Incompatible',
      missing: {},
      unknownTables: ['foo']
    })
  })
})
