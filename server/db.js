const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'pg',
    connection: process.env.POSTGRES_URL + "?sslmode=require",
    searchPath: ['knex', 'public'],
});

async function initDb() {
    try {
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
                // knex.fn.now() works for both SQLite and Postgres
                table.timestamp('created_at').defaultTo(db.fn.now());
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
                table.timestamp('created_at').defaultTo(db.fn.now());
            });
            console.log('Database initialized: app_log table created.');
        }
    } catch (err) {
        console.error('Initial DB connection/setup failed. This might be temporary if DB is waking up.', err);
        // Rethrow if you want to stop the server, or swallow if you want to try later on request
        // For Vercel, it's better to log and let the function continue, subsequent requests might succeed.
        // But if init fails, tables might be missing.
        throw err;
    }
}

module.exports = { db, initDb };
