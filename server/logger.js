const { db } = require('./db');

async function log(type, message, stack = null, details = null) {
    try {
        await db('app_log').insert({
            log_type: type,
            message: message,
            stack: stack,
            details: details ? JSON.stringify(details) : null
        });
    } catch (err) {
        // Fallback to console if DB logging fails
        console.error('FAILED TO LOG TO DB:', err);
        console.error('ORIGINAL LOG:', type, message, stack, details);
    }
}

async function logError(message, error = null, details = null) {
    const stack = error && error.stack ? error.stack : null;
    const msg = error && !message ? error.message : message;
    await log('ERROR', msg, stack, details);
}

async function logWarning(message, details = null) {
    await log('WARNING', message, null, details);
}

async function logInfo(message, details = null) {
    await log('INFO', message, null, details);
}

module.exports = {
    logError,
    logWarning,
    logInfo
};
