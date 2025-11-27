#!/bin/bash
docker-compose exec -T postgres psql -U postgres -d db_proj < seeds/demo_data.sql
