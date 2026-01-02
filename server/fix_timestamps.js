const { db } = require('./db');

async function fixTimestamps() {
    console.log('Starting migration: Adjusting existing timestamps to GMT+3...');

    // Directly use SQL to update the created_at column by adding 3 hours
    // SQLite's datetime function is perfect for this.
    try {
        const updatedCount = await db('characters')
            .update({
                created_at: db.raw("datetime(created_at, '+3 hours')")
            });

        console.log(`Migration finished. Adjusted ${updatedCount} records.`);
    } catch (err) {
        console.error('Migration failed:', err);
    }

    process.exit(0);
}

fixTimestamps();
