const { db } = require('./db');
const fs = require('fs');
const path = require('path');

// Load realm data to find slugs
const realmsPath = path.resolve(__dirname, '../src/assets/realms.json');
const allRealms = JSON.parse(fs.readFileSync(realmsPath, 'utf8'));

async function migrate() {
    console.log('Starting migration: Correcting realm names to slugs...');

    const characters = await db('characters').select('*');
    let updatedCount = 0;

    for (const char of characters) {
        const region = char.region;
        const currentRealm = char.realm; // Could be "Twisting Nether" or "twisting-nether"

        const regionRealms = allRealms[region] || [];

        // Find the realm in our list. 
        // It might match by name (en_US) or by slug.
        const match = regionRealms.find(r => {
            const slugMatch = r.slug === currentRealm;
            const nameMatch = typeof r.name === 'string' ? r.name === currentRealm : (r.name.en_US === currentRealm || r.name.en_GB === currentRealm);
            return slugMatch || nameMatch;
        });

        if (match && match.slug !== currentRealm) {
            console.log(`Updating ${char.name}: ${currentRealm} -> ${match.slug}`);

            // Update the record
            await db('characters')
                .where({ id: char.id })
                .update({ realm: match.slug });

            updatedCount++;
        }
    }

    console.log(`Migration finished. Updated ${updatedCount} records.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
