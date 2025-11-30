const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;

// Session Configuration
app.use(session({
    secret: 'blockchain-doc-verify-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// DB Connection (SQLite)
const dbPath = path.resolve(__dirname, '../database_v2.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        // 1. USERS table - Expanded
        db.run(`CREATE TABLE IF NOT EXISTS USERS (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'uploader', 'verifier')),
            mobile TEXT,
            pin TEXT, -- For Admin
            designation TEXT, -- For Verifier
            org_name TEXT, -- For Verifier/Uploader
            org_type TEXT, -- For Uploader
            gov_id_path TEXT, -- For Verifier
            institution_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (institution_id) REFERENCES INSTITUTIONS(institution_id)
        )`);

        // 2. INSTITUTIONS table
        db.run(`CREATE TABLE IF NOT EXISTS INSTITUTIONS (
            institution_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            code TEXT,
            type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. DOCUMENTS table
        db.run(`CREATE TABLE IF NOT EXISTS DOCUMENTS (
            doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            institution_id INTEGER,
            title TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size TEXT,
            storage_path TEXT,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES USERS(user_id),
            FOREIGN KEY (institution_id) REFERENCES INSTITUTIONS(institution_id)
        )`);

        // 4. DOCUMENT_HASHES table
        db.run(`CREATE TABLE IF NOT EXISTS DOCUMENT_HASHES (
            hash_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER NOT NULL UNIQUE,
            sha256_hash TEXT NOT NULL,
            blockchain_tx TEXT,
            contract_address TEXT,
            block_number INTEGER,
            anchored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES DOCUMENTS(doc_id)
        )`);

        // 5. VERIFICATIONS table
        db.run(`CREATE TABLE IF NOT EXISTS VERIFICATIONS (
            verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER,
            verifier_id INTEGER NOT NULL,
            uploaded_hash TEXT,
            stored_hash TEXT,
            result TEXT NOT NULL CHECK (result IN ('AUTHENTIC', 'TAMPERED', 'REVOKED')),
            verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES DOCUMENTS(doc_id),
            FOREIGN KEY (verifier_id) REFERENCES USERS(user_id)
        )`);

        // 6. REVOKED_DOCUMENTS table
        db.run(`CREATE TABLE IF NOT EXISTS REVOKED_DOCUMENTS (
            revoke_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER NOT NULL UNIQUE,
            reason TEXT,
            revoked_by INTEGER NOT NULL,
            revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES DOCUMENTS(doc_id),
            FOREIGN KEY (revoked_by) REFERENCES USERS(user_id)
        )`);

        // 7. AUDIT_LOGS table
        db.run(`CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES USERS(user_id)
        )`);

        // 8. ANNOUNCEMENTS table (New)
        db.run(`CREATE TABLE IF NOT EXISTS ANNOUNCEMENTS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES USERS(user_id)
        )`);

        // Create default test users
        const createUsers = async () => {
            const users = [
                { name: 'System Admin', email: 'admin@blockverify.com', password: 'admin123', role: 'admin', mobile: '1234567890', pin: '1234' },
                { name: 'Document Uploader', email: 'uploader@blockverify.com', password: 'upload123', role: 'uploader', mobile: '9876543210', org_name: 'ABC University' },
                { name: 'Document Verifier', email: 'verifier@blockverify.com', password: 'verify123', role: 'verifier', mobile: '5555555555', org_name: 'Background Check Co' }
            ];

            for (const user of users) {
                const hash = await bcrypt.hash(user.password, 12);
                const instId = user.role === 'uploader' ? 1 : null;

                db.run(`INSERT OR IGNORE INTO USERS (name, email, password_hash, role, mobile, pin, org_name, institution_id) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [user.name, user.email, hash, user.role, user.mobile, user.pin, user.org_name, instId]);
            }
        };

        createUsers().then(() => {
            console.log('✅ Database schema updated & default users checked');
        });

        // Default Institutions
        db.run(`INSERT OR IGNORE INTO INSTITUTIONS (institution_id, name, contact_email, type) VALUES (1, 'ABC University', 'admin@abcuniversity.edu', 'Educational')`);
    });
}

// Multer Setup
const upload = multer({ dest: 'uploads/' });

// Blockchain Simulation (Simplified)
class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
    }
    addBlock(data) {
        const block = {
            index: this.chain.length + 1,
            timestamp: new Date().toISOString(),
            data: data,
            hash: crypto.randomBytes(32).toString('hex'),
            gasUsed: Math.floor(Math.random() * 100000) + 21000
        };
        this.chain.push(block);
        return block;
    }
}
const myBlockchain = new Blockchain();

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
    next();
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.session.userRole || !roles.includes(req.session.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// --- API ROUTES ---

// 1. Registration
app.post('/api/register', async (req, res) => {
    const {
        name, email, password, role, mobile,
        pin, designation, org_name, org_type,
        inst_address, inst_contact, inst_code
    } = req.body;

    try {
        const hash = await bcrypt.hash(password, 12);

        // Handle Institution Creation for Uploaders
        let institutionId = null;
        if (role === 'uploader') {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO INSTITUTIONS (name, address, contact_email, contact_phone, code, type) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                    [org_name, inst_address, email, mobile, inst_code, org_type],
                    function (err) {
                        if (err) reject(err);
                        else {
                            institutionId = this.lastID;
                            resolve();
                        }
                    });
            });
        }

        db.run(`INSERT INTO USERS (name, email, password_hash, role, mobile, pin, designation, org_name, org_type, institution_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hash, role, mobile, pin, designation, org_name, org_type, institutionId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, userId: this.lastID });
            });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM USERS WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.is_active === 0) return res.status(403).json({ error: 'Account deactivated' });

        req.session.userId = user.user_id;
        req.session.userRole = user.role;
        req.session.institutionId = user.institution_id;

        db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)`,
            [user.user_id, 'LOGIN', 'User logged in', req.ip]);

        res.json({ success: true, user: { id: user.user_id, name: user.name, role: user.role } });
    });
});

app.post('/api/logout', (req, res) => {
    if (req.session.userId) {
        db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`, [req.session.userId, 'LOGOUT', 'User logged out']);
    }
    req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', requireAuth, (req, res) => {
    db.get('SELECT user_id, name, email, role, institution_id FROM USERS WHERE user_id = ?', [req.session.userId], (err, user) => {
        res.json({ user });
    });
});

// 3. Upload (Uploader/Admin)
app.post('/api/upload', requireAuth, requireRole(['admin', 'uploader']), upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const hash = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
    const block = myBlockchain.addBlock({ fileName: req.file.originalname, hash });
    const tx = `0x${crypto.randomBytes(32).toString('hex')}`;

    db.run(`INSERT INTO DOCUMENTS (user_id, institution_id, title, file_name, file_type, file_size, storage_path, category) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.session.userId, req.session.institutionId, req.file.originalname, req.file.originalname, req.file.mimetype, req.file.size, req.file.path, 'General'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const docId = this.lastID;

            db.run(`INSERT INTO DOCUMENT_HASHES (doc_id, sha256_hash, blockchain_tx, block_number) VALUES (?, ?, ?, ?)`,
                [docId, hash, tx, block.index]);

            db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
                [req.session.userId, 'UPLOAD', `Uploaded ${req.file.originalname}`]);

            fs.unlinkSync(req.file.path);
            res.json({ success: true, document: { docId, hash, tx, blockIndex: block.index } });
        });
});

// 4. Verify (Verifier/Admin)
app.post('/api/verify', requireAuth, upload.single('file'), (req, res) => {
    let hashToVerify = req.body.hash;
    if (req.file) {
        hashToVerify = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
        fs.unlinkSync(req.file.path);
    }

    db.get('SELECT * FROM DOCUMENT_HASHES WHERE sha256_hash = ?', [hashToVerify], (err, record) => {
        let result = 'TAMPERED';
        let docId = null;

        if (record) {
            docId = record.doc_id;
            db.get('SELECT * FROM REVOKED_DOCUMENTS WHERE doc_id = ?', [docId], (err, revoked) => {
                result = revoked ? 'REVOKED' : 'AUTHENTIC';
                logVerification(req.session.userId, docId, hashToVerify, record.sha256_hash, result);
                res.json({ result, authentic: result === 'AUTHENTIC', revoked: !!revoked, reason: revoked?.reason });
            });
        } else {
            logVerification(req.session.userId, null, hashToVerify, null, result);
            res.json({ result, authentic: false });
        }
    });
});

function logVerification(userId, docId, uploadedHash, storedHash, result) {
    db.run(`INSERT INTO VERIFICATIONS (doc_id, verifier_id, uploaded_hash, stored_hash, result) VALUES (?, ?, ?, ?, ?)`,
        [docId, userId, uploadedHash, storedHash, result]);
}

// 5. Analytics & Dashboard APIs
app.get('/api/dashboard/admin', requireAuth, requireRole(['admin']), (req, res) => {
    const queries = {
        totalDocs: 'SELECT COUNT(*) as c FROM DOCUMENTS',
        totalVerifications: 'SELECT COUNT(*) as c FROM VERIFICATIONS',
        authVsTampered: `SELECT result, COUNT(*) as c FROM VERIFICATIONS GROUP BY result`,
        topInstitutions: `SELECT i.name, COUNT(d.doc_id) as c FROM INSTITUTIONS i JOIN DOCUMENTS d ON i.institution_id = d.institution_id GROUP BY i.name ORDER BY c DESC LIMIT 10`,
        dailyVerifications: `SELECT date(verified_at) as d, COUNT(*) as c FROM VERIFICATIONS GROUP BY d ORDER BY d DESC LIMIT 7`,
        revokedStats: `SELECT COUNT(*) as c FROM REVOKED_DOCUMENTS`,
        fileTypes: `SELECT file_type, COUNT(*) as c FROM DOCUMENTS GROUP BY file_type`,
        recentActivity: `SELECT * FROM AUDIT_LOGS ORDER BY timestamp DESC LIMIT 10`
    };

    const runQuery = (sql) => new Promise((resolve) => db.all(sql, (err, rows) => resolve(rows)));

    Promise.all(Object.values(queries).map(runQuery)).then(results => {
        res.json({
            stats: {
                totalDocs: results[0][0].c,
                totalVerifications: results[1][0].c,
                revokedCount: results[5][0].c
            },
            charts: {
                authVsTampered: results[2],
                topInstitutions: results[3],
                dailyVerifications: results[4],
                fileTypes: results[6]
            },
            activity: results[7],
            blockchain: {
                blocks: myBlockchain.chain.length,
                avgGas: 21500, // Mock
                status: 'Connected'
            }
        });
    });
});

app.get('/api/dashboard/uploader', requireAuth, requireRole(['uploader']), (req, res) => {
    const instId = req.session.institutionId;
    const queries = {
        myDocs: `SELECT COUNT(*) as c FROM DOCUMENTS WHERE institution_id = ?`,
        verificationsOnMyDocs: `SELECT v.result, COUNT(*) as c FROM VERIFICATIONS v JOIN DOCUMENTS d ON v.doc_id = d.doc_id WHERE d.institution_id = ? GROUP BY v.result`,
        uploadTrend: `SELECT date(created_at) as d, COUNT(*) as c FROM DOCUMENTS WHERE institution_id = ? GROUP BY d ORDER BY d DESC LIMIT 7`,
        recentDocs: `SELECT * FROM DOCUMENTS WHERE institution_id = ? ORDER BY created_at DESC LIMIT 5`
    };

    const runQuery = (sql) => new Promise((resolve) => db.all(sql, [instId], (err, rows) => resolve(rows)));

    Promise.all(Object.values(queries).map(runQuery)).then(results => {
        res.json({
            stats: { totalDocs: results[0][0]?.c || 0 },
            charts: {
                verificationResults: results[1],
                uploadTrend: results[2]
            },
            recentDocs: results[3]
        });
    });
});

app.get('/api/dashboard/verifier', requireAuth, requireRole(['verifier']), (req, res) => {
    const userId = req.session.userId;
    const queries = {
        myVerifications: `SELECT COUNT(*) as c FROM VERIFICATIONS WHERE verifier_id = ?`,
        myResults: `SELECT result, COUNT(*) as c FROM VERIFICATIONS WHERE verifier_id = ? GROUP BY result`,
        history: `SELECT v.*, d.title FROM VERIFICATIONS v LEFT JOIN DOCUMENTS d ON v.doc_id = d.doc_id WHERE v.verifier_id = ? ORDER BY v.verified_at DESC LIMIT 10`
    };

    const runQuery = (sql) => new Promise((resolve) => db.all(sql, [userId], (err, rows) => resolve(rows)));

    Promise.all(Object.values(queries).map(runQuery)).then(results => {
        res.json({
            stats: { totalVerifications: results[0][0]?.c || 0 },
            charts: { results: results[1] },
            history: results[2]
        });
    });
});

// 6. User Management (Admin)
app.get('/api/users', requireAuth, requireRole(['admin']), (req, res) => {
    db.all('SELECT user_id, name, email, role, is_active, created_at FROM USERS', (err, rows) => {
        res.json(rows);
    });
});

app.post('/api/users/:id/toggle', requireAuth, requireRole(['admin']), (req, res) => {
    db.run(`UPDATE USERS SET is_active = NOT is_active WHERE user_id = ?`, [req.params.id], (err) => {
        res.json({ success: true });
    });
});

// Fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
