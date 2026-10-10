#!/bin/sh
# Creates the notification service's database and role next to the API's, so neither service can
# read the other's tables (ADR-010). PostgreSQL runs this once, when the data volume is empty:
# an existing stack picks it up after "docker compose down -v".
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v role="$NOTIFICATION_DB_USER" \
  -v password="$NOTIFICATION_DB_PASSWORD" \
  -v database="$NOTIFICATION_DB" <<'SQL'
CREATE ROLE :"role" LOGIN PASSWORD :'password';
CREATE DATABASE :"database" OWNER :"role";
SQL
