#!/bin/bash
# Warning: This drops tables!
docker-compose exec -T postgres psql -U postgres -d db_proj -c "DROP TABLE IF EXISTS Verification_History, Audit_Log, Document_Metadata, Users CASCADE;"
