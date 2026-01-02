const knex = require('knex');
const path = require('path');

// Vercel filesystem is read-only, so we must use in-memory DB there.
// Note: Data will not persist on Vercel.
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? ':memory:' : path.resolve(__dirname, 'vudungeo.sqlite');

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true,
});

async function initDb() {
    const exists = await db.schema.hasTable('characters');
    if (!exists) {
        await db.schema.createTable('characters', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('realm').notNullable();
            table.string('region').notNullable();
            table.float('score');
            table.timestamp('last_crawled_at');
            table.json('raw_data');
            table.timestamp('created_at').defaultTo(db.raw("(datetime('now', '+3 hours'))"));
            table.unique(['name', 'realm', 'region']);
        });
        console.log('Database initialized: characters table created.');
    }

    const logsExists = await db.schema.hasTable('app_log');
    if (!logsExists) {
        await db.schema.createTable('app_log', (table) => {
            table.increments('id').primary();
            table.string('log_type').notNullable(); // ERROR, WARNING, INFO
            table.text('message').notNullable();
            table.text('stack');
            table.json('details');
            table.timestamp('created_at').defaultTo(db.raw("(datetime('now', '+3 hours'))"));
        });
        console.log('Database initialized: app_log table created.');
    }
}

module.exports = { db, initDb };
