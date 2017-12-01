# SWORM Schema [![npm version](https://img.shields.io/npm/v/sworm-schema.svg)](https://www.npmjs.com/package/sworm-schema) [![npm](https://img.shields.io/npm/dm/sworm-schema.svg)](https://www.npmjs.com/package/sworm-schema) [![Build Status](https://travis-ci.org/featurist/sworm-schema.svg?branch=master)](https://travis-ci.org/featurist/sworm-schema)

A companion to the popular [SWORM](https://github.com/featurist/sworm) ORM.

SWORM Schema is used to automate creating, deleting and cleaning of test databases.

You can also use it to validate that the schema has all the tables and columns required to run a particular query. This is really useful if you are integrating with an existing database and are trying to figure out what parts of the schema your test database needs.

## Install

  `npm i sworm-schema --save-dev`

  `yarn add sworm-schema --dev`

## How to use it

Firstly lets define our schema and suply a url connection string the datbase.
The most common way of using this is with sqlite:

```js
const SwormSchema = require('sworm-schema')

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
```

Now create the database

```js
await swormSchema.create()
```

You'll want to use the same connection string for the application you have under test.
Or if you just want to play with database using [SWORM](https://github.com/featurist/sworm) you can just do this:

```js
const db = await swormSchema.connect()

const person = db.model({table: 'people'})
const place = db.model({table: 'places'})

await person({id: 1, name: 'bob'}).save()
await person({id: 2, name: 'julie'}).save()
await place({id: 1, name: 'stroud'}).save()
await place({id: 2, name: 'auckland'}).save()

await db.query(`select id, name from people`)
```

You might want to clean up the data afterwards:

```js
await swormSchema.clean()
```

Or if you just want to get rid of the whole database:

```js
await swormSchema.drop()
```
