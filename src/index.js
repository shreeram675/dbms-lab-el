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
const dbPath = path.resolve(__dirname, '../database.sqlite');
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
        // 1. USERS table
        db.run(`CREATE TABLE IF NOT EXISTS USERS (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'uploader', 'verifier')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. INSTITUTIONS table
        db.run(`CREATE TABLE IF NOT EXISTS INSTITUTIONS (
            institution_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            contact_email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. DOCUMENTS table (renamed from Document_Metadata)
        db.run(`CREATE TABLE IF NOT EXISTS DOCUMENTS (
            doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            institution_id INTEGER,
            title TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size TEXT,
            storage_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES USERS(user_id),
            FOREIGN KEY (institution_id) REFERENCES INSTITUTIONS(institution_id)
        )`);

        // 4. DOCUMENT_HASHES table (separate from Documents)
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
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES USERS(user_id)
        )`);

        // Create default test users with hashed passwords
        const createUsers = async () => {
            const users = [
                { name: 'System Admin', email: 'admin@blockverify.com', password: 'admin123', role: 'admin' },
                { name: 'Document Uploader', email: 'uploader@blockverify.com', password: 'upload123', role: 'uploader' },
                { name: 'Document Verifier', email: 'verifier@blockverify.com', password: 'verify123', role: 'verifier' }
            ];

            for (const user of users) {
                const hash = await bcrypt.hash(user.password, 12);
                db.run(`INSERT OR IGNORE INTO USERS (name, email, password_hash, role) 
                        VALUES (?, ?, ?, ?)`, [user.name, user.email, hash, user.role]);
            }
        };

        createUsers().then(() => {
            console.log('✅ All 7 tables initialized + Test users created');
        });

        // Create default institutions
        db.run(`INSERT OR IGNORE INTO INSTITUTIONS (institution_id, name, contact_email) VALUES (1, 'ABC University', 'admin@abcuniversity.edu')`);
        db.run(`INSERT OR IGNORE INTO INSTITUTIONS (institution_id, name, contact_email) VALUES (2, 'XYZ Corporation', 'hr@xyzcorp.com')`);
        db.run(`INSERT OR IGNORE INTO INSTITUTIONS (institution_id, name, contact_email) VALUES (3, 'Government Office', 'verify@gov.in')`);
    });
}

// Multer Setup
const upload = multer({ dest: 'uploads/' });

// Blockchain Simulation
class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(
            this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)
        ).digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new Block(0, new Date().toISOString(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
    }
}

const myBlockchain = new Blockchain();

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Authentication Middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// Authorization Middleware
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.session.userRole || !roles.includes(req.session.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', session: !!req.session.userId });
});

// Authentication APIs
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    db.get('SELECT * FROM USERS WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.user_id;
        req.session.userRole = user.role;
        req.session.userName = user.name;

        // Log login
        db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
            [user.user_id, 'LOGIN', `User ${user.email} logged in`]);

        res.json({
            success: true,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

app.post('/api/logout', (req, res) => {
    const userId = req.session.userId;

    if (userId) {
        db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
            [userId, 'LOGOUT', 'User logged out']);
    }

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

app.get('/api/me', requireAuth, (req, res) => {
    db.get('SELECT user_id, name, email, role FROM USERS WHERE user_id = ?',
        [req.session.userId], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        });
});

// Institutions API
app.get('/api/institutions', (req, res) => {
    db.all('SELECT * FROM INSTITUTIONS', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ institutions: rows });
    });
});

// Upload Document (Admin/Uploader only)
app.post('/api/upload', requireAuth, requireRole(['admin', 'uploader']), upload.single('file'), (req, res) => {
    try {
        const file = req.file;
        const { institutionId } = req.body;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const userId = req.session.userId;
        const hash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');

        // Create blockchain block
        const newBlock = new Block(
            myBlockchain.chain.length,
            new Date().toISOString(),
            { fileName: file.originalname, hash: hash }
        );
        myBlockchain.addBlock(newBlock);

        // Simulated blockchain details
        const blockchainTx = `0x${crypto.randomBytes(32).toString('hex')}`;
        const contractAddress = '0xBlockchainContractAddress123';

        // Store document
        const stmt = db.prepare(`INSERT INTO DOCUMENTS (user_id, institution_id, title, file_name, file_type, file_size, storage_path) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(userId, institutionId || null, file.originalname, file.originalname, file.mimetype, file.size, file.path, function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const docId = this.lastID;

            // Store hash separately
            db.run(`INSERT INTO DOCUMENT_HASHES (doc_id, sha256_hash, blockchain_tx, contract_address, block_number) 
                    VALUES (?, ?, ?, ?, ?)`,
                [docId, hash, blockchainTx, contractAddress, newBlock.index], (hashErr) => {
                    if (hashErr) {
                        console.error('Hash insert error:', hashErr.message);
                    }
                });

            // Audit log
            db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
                [userId, 'UPLOAD', `Uploaded document: ${file.originalname}, Hash: ${hash}`]);

            fs.unlinkSync(file.path); // Cleanup

            res.json({
                success: true,
                document: { docId, hash, blockIndex: newBlock.index, tx: blockchainTx }
            });
        });
        stmt.finalize();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Verify Document
app.post('/api/verify', requireAuth, upload.single('file'), (req, res) => {
    try {
        let hashToVerify;
        const userId = req.session.userId;

        if (req.file) {
            hashToVerify = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
            fs.unlinkSync(req.file.path);
        } else if (req.body.hash) {
            hashToVerify = req.body.hash;
        } else {
            return res.status(400).json({ error: 'No file or hash provided' });
        }

        // Check if hash exists
        db.get('SELECT * FROM DOCUMENT_HASHES WHERE sha256_hash = ?', [hashToVerify], (err, hashRecord) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            let result, docId = null;

            if (hashRecord) {
                docId = hashRecord.doc_id;

                // Check if revoked
                db.get('SELECT * FROM REVOKED_DOCUMENTS WHERE doc_id = ?', [docId], (revErr, revoked) => {
                    if (revoked) {
                        result = 'REVOKED';
                    } else {
                        result = 'AUTHENTIC';
                    }

                    // Log verification
                    db.run(`INSERT INTO VERIFICATIONS (doc_id, verifier_id, uploaded_hash, stored_hash, result) 
                            VALUES (?, ?, ?, ?, ?)`,
                        [docId, userId, hashToVerify, hashRecord.sha256_hash, result]);

                    db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
                        [userId, 'VERIFY', `Verification result: ${result}, Hash: ${hashToVerify}`]);

                    res.json({
                        authentic: result === 'AUTHENTIC',
                        result,
                        revoked: result === 'REVOKED',
                        reason: revoked ? revoked.reason : null
                    });
                });
            } else {
                result = 'TAMPERED';
                db.run(`INSERT INTO VERIFICATIONS (verifier_id, uploaded_hash, result) VALUES (?, ?, ?)`,
                    [userId, hashToVerify, result]);
                db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
                    [userId, 'VERIFY', `Verification result: TAMPERED`]);

                res.json({ authentic: false, result: 'TAMPERED' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
    db.all(`SELECT d.*, dh.sha256_hash, dh.blockchain_tx, i.name as institution_name 
            FROM DOCUMENTS d 
            LEFT JOIN DOCUMENT_HASHES dh ON d.doc_id = dh.doc_id 
            LEFT JOIN INSTITUTIONS i ON d.institution_id = i.institution_id 
            ORDER BY d.created_at DESC LIMIT 10`, [], (err, rows) => {
        if (err) {
            return res.json({ documents: [], blocks: myBlockchain.chain });
        }
        res.json({ documents: rows, blocks: myBlockchain.chain });
    });
});

// Revoke Document (Admin only)
app.post('/api/revoke/:docId', requireAuth, requireRole(['admin']), (req, res) => {
    const { docId } = req.params;
    const { reason } = req.body;
    const userId = req.session.userId;

    db.run(`INSERT INTO REVOKED_DOCUMENTS (doc_id, reason, revoked_by) VALUES (?, ?, ?)`,
        [docId, reason, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            db.run(`INSERT INTO AUDIT_LOGS (user_id, action, description) VALUES (?, ?, ?)`,
                [userId, 'REVOKE', `Revoked document ID: ${docId}, Reason: ${reason}`]);

            res.json({ success: true });
        });
});

// Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
