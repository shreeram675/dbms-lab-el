const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database_v2.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🌱 Seeding database with sample data...\n');

// Sample document data
const sampleDocuments = [
    { title: 'Academic Transcript 2023', institution_id: 1, file_name: 'transcript_2023.pdf', file_type: 'application/pdf' },
    { title: 'Degree Certificate', institution_id: 1, file_name: 'degree_cert.pdf', file_type: 'application/pdf' },
    { title: 'Research Paper - AI Ethics', institution_id: 2, file_name: 'research_ai.pdf', file_type: 'application/pdf' },
    { title: 'Course Completion Certificate', institution_id: 1, file_name: 'course_cert.pdf', file_type: 'application/pdf' },
    { title: 'Medical Records 2023', institution_id: 3, file_name: 'medical_2023.pdf', file_type: 'application/pdf' },
    { title: 'Employment Contract', institution_id: 2, file_name: 'employment.pdf', file_type: 'application/pdf' },
    { title: 'Tax Documents 2023', institution_id: 1, file_name: 'tax_2023.pdf', file_type: 'application/pdf' },
    { title: 'Property Deed', institution_id: 3, file_name: 'property_deed.pdf', file_type: 'application/pdf' },
];

function generateHash(text) {
    return crypto.createHash('sha256').update(text + Date.now() + Math.random()).digest('hex');
}

function insertDocuments() {
    return new Promise((resolve, reject) => {
        let inserted = 0;

        sampleDocuments.forEach((doc, index) => {
            const hash = generateHash(doc.title);
            const blockchainTx = generateHash(hash);

            db.run(
                `INSERT INTO DOCUMENTS (user_id, institution_id, title, file_name, file_type, file_size, storage_path, created_at) 
                 VALUES (2, ?, ?, ?, ?, '1.2 MB', '/uploads/${doc.file_name}', datetime('now', '-${index} days'))`,
                [doc.institution_id, doc.title, doc.file_name, doc.file_type],
                function (err) {
                    if (err) {
                        console.error('Error inserting document:', err.message);
                        inserted++;
                        if (inserted === sampleDocuments.length) resolve();
                        return;
                    }

                    const docId = this.lastID;
                    console.log(`✓ Inserted: ${doc.title} (ID: ${docId})`);

                    // Insert document hash
                    db.run(
                        `INSERT INTO DOCUMENT_HASHES (doc_id, sha256_hash, blockchain_tx, anchored_at) 
                         VALUES (?, ?, ?, datetime('now', '-${index} days'))`,
                        [docId, hash, blockchainTx],
                        (err) => {
                            if (err) console.error('Error inserting hash:', err.message);
                        }
                    );

                    // Insert some verifications (70% authentic, 30% tampered)
                    const isAuthentic = Math.random() > 0.3;
                    const result = isAuthentic ? 'AUTHENTIC' : 'TAMPERED';

                    db.run(
                        `INSERT INTO VERIFICATIONS (doc_id, verifier_id, uploaded_hash, stored_hash, result, verified_at) 
                         VALUES (?, 3, ?, ?, ?, datetime('now', '-${Math.floor(index / 2)} hours'))`,
                        [docId, hash, hash, result],
                        (err) => {
                            if (err) console.error('Error inserting verification:', err.message);

                            inserted++;
                            if (inserted === sampleDocuments.length) {
                                resolve();
                            }
                        }
                    );
                }
            );
        });
    });
}

async function seed() {
    try {
        await insertDocuments();

        console.log('\n📊 Database Statistics:');
        console.log('─'.repeat(50));

        // Get stats
        db.get('SELECT COUNT(*) as count FROM DOCUMENTS', (err, row) => {
            console.log(`✅ Total Documents: ${row.count}`);
        });

        db.get('SELECT COUNT(*) as count FROM VERIFICATIONS', (err, row) => {
            console.log(`✅ Total Verifications: ${row.count}`);
        });

        db.get(`SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN result = 'AUTHENTIC' THEN 1 ELSE 0 END) as authentic,
                    SUM(CASE WHEN result != 'AUTHENTIC' THEN 1 ELSE 0 END) as tampered
                FROM VERIFICATIONS`, (err, row) => {
            console.log(`\n   Authentic: ${row.authentic}`);
            console.log(`   Tampered: ${row.tampered}`);
            console.log(`   Tampering Rate: ${((row.tampered / row.total) * 100).toFixed(1)}%`);
        });

        db.get(`SELECT i.name, COUNT(d.doc_id) as doc_count
                FROM INSTITUTIONS i
                LEFT JOIN DOCUMENTS d ON i.institution_id = d.institution_id
                GROUP BY i.institution_id`, [], (err, row) => {
            console.log(`\n📚 Documents by Institution:`);
        });

        db.all(`SELECT i.name, COUNT(d.doc_id) as doc_count
                FROM INSTITUTIONS i
                LEFT JOIN DOCUMENTS d ON i.institution_id = d.institution_id
                GROUP BY i.institution_id`, [], (err, rows) => {
            rows.forEach(row => {
                console.log(`   ${row.name}: ${row.doc_count} documents`);
            });

            console.log('\n' + '─'.repeat(50));
            console.log(`✨ Database seeded successfully!\n`);
            console.log(`🔍 Test the analytics dashboard:`);
            console.log(`   1. Uploader: uploader@blockverify.com / upload123`);
            console.log(`   2. Admin: admin@blockverify.com / admin123\n`);

            db.close();
        });

    } catch (err) {
        console.error('❌ Error seeding database:', err);
        db.close();
    }
}

seed();
