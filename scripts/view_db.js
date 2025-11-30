const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const tables = [
    'USERS',
    'INSTITUTIONS',
    'DOCUMENTS',
    'DOCUMENT_HASHES',
    'VERIFICATIONS',
    'REVOKED_DOCUMENTS',
    'AUDIT_LOGS'
];

async function viewDatabase() {
    console.log('=== Database Content Summary ===\n');

    for (const table of tables) {
        await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                if (err) {
                    console.error(`Error reading ${table}:`, err.message);
                    resolve();
                    return;
                }

                console.log(`Table: ${table} (${rows.length} rows)`);
                if (rows.length > 0) {
                    console.table(rows);
                } else {
                    console.log('  (Empty)');
                }
                console.log('\n-----------------------------------\n');
                resolve();
            });
        });
    }

    db.close();
}

viewDatabase();
