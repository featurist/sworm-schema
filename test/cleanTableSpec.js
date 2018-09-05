const assert = require('assert')
const SwormSchema = require('..')

describe('clean tables', () => {
  it('removes all data from the tables', async () => {
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
    await swormSchema.connect()

    const db = swormSchema.db

    const person = db.model({table: 'people'})
    const place = db.model({table: 'places'})

    await person({id: 1, name: 'bob'}).save()
    await person({id: 2, name: 'julie'}).save()
    await place({id: 1, name: 'stroud'}).save()
    await place({id: 2, name: 'auckland'}).save()

    const queryAll = () => {
      return db.query(`
        select id, name
        from people

        union

        select id, name
        from places
      `)
    }

    const results = await queryAll()
    assert.equal(results.length, 4)

    await swormSchema.clean()

    const noResults = await queryAll()
    assert.equal(noResults.length, 0)
  })
})
