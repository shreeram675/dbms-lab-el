const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// DB Connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'db_proj',
    password: process.env.DB_PASS || 'postgres',
    port: process.env.DB_PORT || 5432,
});

app.get('/', (req, res) => {
    res.send('Hello from Backend!');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
