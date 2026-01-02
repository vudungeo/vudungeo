const knex = require('knex');
const path = require('path');

// Properly handle POSTGRES_URL - Vercel Postgres already includes sslmode in the connection string
// If it doesn't have it, we need to add it, but we shouldn't double-add query params
let connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set');
}

// Only add sslmode if it's not already in the connection string
if (!connectionString.includes('sslmode=')) {
    connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

const db = knex({
    client: 'pg',
    connection: connectionString,
    searchPath: ['knex', 'public'],
    pool: {
        min: 0,
        max: 1, // Vercel serverless functions should use minimal connections
    },
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
                // knex.fn.now() works for Postgres
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
