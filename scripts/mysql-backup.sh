#!/bin/sh

set -eu

backup_dir=${BACKUP_DIR:-/backups/mysql}
retention_days=${BACKUP_RETENTION_DAYS:-14}
interval_seconds=${BACKUP_INTERVAL_SECONDS:-86400}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
target="${backup_dir}/${DB_NAME}_${timestamp}.sql.gz"
temporary="${target}.tmp"

mkdir -p "$backup_dir"

mysqldump \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  --hex-blob \
  --host="${DB_HOST:-db}" \
  --port="${DB_PORT:-3306}" \
  --user="${MYSQL_USER:-root}" \
  --password="${MYSQL_PASSWORD}" \
  "${DB_NAME}" | gzip -c > "$temporary"

mv "$temporary" "$target"
tar -czf "${backup_dir}/${DB_NAME}_${timestamp}_files.tar.gz" -C /data uploads storage
find "$backup_dir" -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
find "$backup_dir" -type f -name '*_files.tar.gz' -mtime "+${retention_days}" -delete

echo "[backup] created ${target}"

if [ "${BACKUP_RUN_ONCE:-false}" = "true" ]; then
  exit 0
fi

while :; do
  sleep "$interval_seconds"
  timestamp=$(date -u +%Y%m%dT%H%M%SZ)
  target="${backup_dir}/${DB_NAME}_${timestamp}.sql.gz"
  temporary="${target}.tmp"
  mysqldump --single-transaction --routines --events --triggers --hex-blob \
    --host="${DB_HOST:-db}" --port="${DB_PORT:-3306}" \
    --user="${MYSQL_USER:-root}" --password="${MYSQL_PASSWORD}" \
    "${DB_NAME}" | gzip -c > "$temporary"
  mv "$temporary" "$target"
  tar -czf "${backup_dir}/${DB_NAME}_${timestamp}_files.tar.gz" -C /data uploads storage
  find "$backup_dir" -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
  find "$backup_dir" -type f -name '*_files.tar.gz' -mtime "+${retention_days}" -delete
  echo "[backup] created ${target}"
done