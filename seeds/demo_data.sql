-- seeds/demo_data.sql

INSERT INTO Users (name, email, password_hash, role) VALUES
('Alice Admin', 'alice@example.com', 'hash_secret', 'Admin'),
('Bob Student', 'bob@example.com', 'hash_secret', 'Student');

INSERT INTO Document_Metadata (user_id, title, type, description, mongo_file_id, blockchain_hash, file_size, file_format) VALUES
(2, 'Project Report', 'Report', 'Final Semester Project', 'mongo_id_123', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2MB', 'PDF');
