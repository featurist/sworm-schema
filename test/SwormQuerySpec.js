require('./cleanup')
const {Schema, Query} = require('../')
const assert = require('assert')

describe('SwormQuery', () => {
  it('lists all the columns that are used in the query including original aliases', () => {
    const schema = {
      people: {
        id: {type: 'integer', primaryKey: true},
        name: {type: 'text'},
      },
      orgs: {
        id: {type: 'integer', primaryKey: true},
        name: {type: 'text'},
      }
    }
    const query = new Query({
      schema,
      query: `
      select p.name, o.name
      from people p inner join
      orgs o on p.id = o.id
    `})

    query.analyse()

    assert.deepEqual(query.tables, {
      'o': 'orgs',
      'p': 'people',
    })

    assert.deepEqual(query.columns, [
      'o.id',
      'o.name',
      'p.id',
      'p.name',
    ])

    assert.deepEqual(query.mappings, [
      {
        sql: 'o.id as "column0"',
        column: 'id',
        alias: 'column0',
        table: 'orgs',
        tableAlias: 'o',
      },
      {
        sql: 'o.name as "column1"',
        column: 'name',
        alias: 'column1',
        table: 'orgs',
        tableAlias: 'o',
      },
      {
        sql: 'p.id as "column2"',
        column: 'id',
        alias: 'column2',
        table: 'people',
        tableAlias: 'p',
      },
      {
        sql: 'p.name as "column3"',
        column: 'name',
        alias: 'column3',
        table: 'people',
        tableAlias: 'p',
      },
    ])
  })

  it('creates a query with all of the join data in the select statement', () => {
    const schema = {
      people: {
        id: {type: 'integer', primaryKey: true},
        name: {type: 'text'},
      },
      orgs: {
        id: {type: 'integer', primaryKey: true},
        name: {type: 'text'},
      }
    }
    const query = new Query({
      schema,
      query: `
      select p.name, o.name
      from people p inner join
      orgs o on p.id = o.id
    `})

    query.analyse()

    assert.equal(query.asFetchAll(), `
select o.id as "column0", o.name as "column1", p.id as "column2", p.name as "column3"
from people p inner join
orgs o on p.id = o.id
`)
  })

  it('adds columns with not null constraints', () => {
    const schema = {
      people: {
        id: {type: 'integer', primaryKey: true},
        orgId: {type: 'integer', null: false},
        parentId: {type: 'integer', null: true},
        name: {type: 'text'},
      }
    }
    const query = new Query({
      schema,
      query: `
      select p.name from people p
    `})


    query.analyse()

    assert.equal(query.asFetchAll(), `
select p.name as "column0", p.id as "column2", p.orgId as "column3"
from people p
`)
  })

  it('converts data from result set to writeable model', async () => {
    const swormSchema = new Schema({
      url: 'sqlite:test/db/test.db',
      schema: {
        people: {
          id: {type: 'integer', primaryKey: true},
          orgId: {type: 'integer'},
          parentId: {type: 'integer', null: true},
          name: {type: 'text'},
        },
        orgs: {
          id: {type: 'integer', primaryKey: true},
          name: {type: 'text'},
        }
      }
    })
    await swormSchema.create()
    const db = swormSchema.connect()
    const person = db.model({table: 'people'})
    const org = db.model({table: 'orgs'})

    await person({id: 1, orgId: 1, name: 'jill'}).save()
    await person({id: 2, orgId: 1, parentId: 1, name: 'julie'}).save()
    await org({id: 1, name: 'featurist'}).save()

    const query = new Query({schema: swormSchema.schema, query: `
      select p.name, parent.name as parent, o.name orgName
      from people p inner join
        orgs o on p.orgId = o.id left join
        people parent on p.parentId = p.id
    `})

    const model = await query.fetchData(db)

    assert.deepEqual(model, [
      {table: 'orgs', columns: {id: 1, name: 'featurist'}},
      {table: 'people', columns: {id: 1, orgid: 1, parentid: null, name: 'jill'}},
      {table: 'people', columns: {id: 2, orgid: 1, parentid: 1, name: 'julie'}},
    ])
  })
})
