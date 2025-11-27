#!/bin/bash
docker-compose exec -T postgres psql -U postgres -d db_proj < migrations/001_init_schema.sql
