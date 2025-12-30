
const fs = require('fs');
const https = require('https');
const path = require('path');

const regions = {
    eu: 'https://raw.githubusercontent.com/mooreatv/WowApiClient/master/Realms_eu.json',
    us: 'https://raw.githubusercontent.com/mooreatv/WowApiClient/master/Realms_us.json'
};

const output = {
    eu: [],
    us: [],
    kr: [], // Placeholder
    tw: []  // Placeholder
};

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Fetching realms...');
    try {
        const [euData, usData] = await Promise.all([
            fetchUrl(regions.eu),
            fetchUrl(regions.us)
        ]);

        // specific extraction based on the known format of that repo
        // The repo returns an array of objects. We need 'name' and 'slug'.
        // Note: The repo might have different structure. Let's inspect or assume standard keys.
        // Usually it's { realms: [...] } or just [...]

        // Let's assume it's valid JSON.
        // Based on usual Blizzard API dumps, it has 'slug'.

        // Helper to process
        const process = (data) => {
            // If data is array
            const list = Array.isArray(data) ? data : (data.realms || []);
            // console.log('Sample item:', list[0]); 
            return list.map(r => ({
                name: r.name || r.slug || 'Unknown',
                slug: r.slug
            })).filter(r => r.slug).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        };

        output.eu = process(euData);
        output.us = process(usData);

        const outputPath = path.join(__dirname, '../src/assets/realms.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Realms saved to ${outputPath}`);
        console.log(`EU: ${output.eu.length}, US: ${output.us.length}`);

    } catch (error) {
        console.error('Error fetching realms:', error);
    }
}

main();
