const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { db, initDb } = require('./db');
const logger = require('./logger');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Initialize database
initDb().catch(err => {
    logger.logError('Failed to initialize database', err);
    console.error('Failed to initialize database:', err);
});

// Logs Endpoints
app.get('/api/v1/logs', async (req, res) => {
    try {
        const logs = await db('app_log').select('*').orderBy('created_at', 'desc').limit(100);
        const formatted = logs.map(l => ({
            ...l,
            details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        res.status(500).json({ message: 'Failed to fetch logs' });
    }
});

app.post('/api/v1/logs', async (req, res) => {
    const { type, message, stack, details } = req.body;
    if (!type || !message) {
        return res.status(400).json({ message: 'Missing type or message' });
    }

    try {
        if (type === 'ERROR') {
            await logger.logError(message, { stack }, details);
        } else if (type === 'WARNING') {
            await logger.logWarning(message, details);
        } else {
            await logger.logInfo(message, details);
        }
        res.status(201).json({ message: 'Log recorded' });
    } catch (error) {
        console.error('Failed to record log:', error);
        res.status(500).json({ message: 'Failed to record log' });
    }
});

// Profile proxy (Directly from Raider.io via backend if needed, or we just use Vite proxy)
// For now, let's keep it simple and handle the Archive listing separately.

// Get all stored characters (to show history/persistence)
app.get('/api/v1/characters', async (req, res) => {
    try {
        const characters = await db('characters').select('*').orderBy('created_at', 'desc');
        // Map raw_data back to objects
        const formatted = characters.map(c => {
            try {
                return {
                    ...c,
                    raw_data: typeof c.raw_data === 'string' ? JSON.parse(c.raw_data) : c.raw_data
                };
            } catch (e) {
                logger.logError(`Failed to parse raw_data for character ${c.id}`, e);
                return {
                    ...c,
                    raw_data: null
                };
            }
        });
        res.json(formatted);
    } catch (error) {
        logger.logError('Fetch Error (GET /characters)', error);
        res.status(500).json({ message: 'Failed to retrieve characters' });
    }
});

// Lookup specific character in archive
app.get('/api/v1/characters/:region/:realm/:name', async (req, res) => {
    const { region, realm, name } = req.params;
    try {
        const character = await db('characters')
            .where({ region, realm, name })
            .first();

        if (!character) {
            return res.status(404).json({ message: 'Character not found in local archive' });
        }

        res.json({
            ...character,
            raw_data: JSON.parse(character.raw_data)
        });
    } catch (error) {
        logger.logError('Lookup Error (GET /characters/:region/:realm/:name)', error, { region, realm, name });
        res.status(500).json({ message: 'Failed to lookup character' });
    }
});

// Save character data manually
app.post('/api/v1/characters', async (req, res) => {
    const data = req.body;
    if (!data || !data.name || !data.realm) {
        return res.status(400).json({ message: 'Invalid character data' });
    }

    try {
        let score = 0;
        if (data.mythic_plus_scores_by_season && data.mythic_plus_scores_by_season.length > 0) {
            score = data.mythic_plus_scores_by_season[0].scores.all;
        }

        await db('characters')
            .insert({
                name: data.name,
                realm: data.realm,
                region: data.region || 'eu',
                score: score,
                last_crawled_at: data.last_crawled_at,
                raw_data: JSON.stringify(data)
            })
            .onConflict(['name', 'realm', 'region'])
            .merge();

        res.status(201).json({ message: 'Character archived successfully' });
    } catch (error) {
        logger.logError('Archive Error (POST /characters)', error, { name: data.name, realm: data.realm });
        res.status(500).json({ message: 'Failed to archive character' });
    }
});

// Delete character from archive
app.delete('/api/v1/characters/:region/:realm/:name', async (req, res) => {
    const { region, realm, name } = req.params;
    try {
        const deleted = await db('characters')
            .where({ region, realm, name })
            .delete();

        if (!deleted) {
            return res.status(404).json({ message: 'Character not found in archive' });
        }

        res.json({ message: 'Character deleted from archive successfully' });
    } catch (error) {
        logger.logError('Delete Error (DELETE /characters)', error, { region, realm, name });
        res.status(500).json({ message: 'Failed to delete character from archive' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
