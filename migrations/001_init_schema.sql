-- migrations/001_init_schema.sql

CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Admin', 'Organization')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Document_Metadata (
    document_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mongo_file_id VARCHAR(50) NOT NULL,
    blockchain_hash CHAR(64) NOT NULL,
    file_size VARCHAR(20),
    file_format VARCHAR(10),
    version_number INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Audit_Log (
    log_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    remarks TEXT,
    FOREIGN KEY (document_id) REFERENCES Document_Metadata(document_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Verification_History (
    verification_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(20) NOT NULL CHECK (result IN ('Valid', 'Invalid', 'Tampered')),
    blockchain_hash_matched BOOLEAN NOT NULL,
    FOREIGN KEY (document_id) REFERENCES Document_Metadata(document_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
