#!/bin/sh

set -eu

backup_dir=${BACKUP_DIR:-/backups/mysql}
offsite_dir=${BACKUP_OFFSITE_DIR:-}
retention_days=${BACKUP_RETENTION_DAYS:-14}
retry_seconds=${BACKUP_RETRY_SECONDS:-900}
export TZ=${TZ:-UTC}

mkdir -p "$backup_dir"

wait_for_database() {
  attempt=1
  max_attempts=${DB_CONNECT_ATTEMPTS:-30}
  until MYSQL_PWD="${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}" mysqladmin ping \
    --host="${DB_HOST:-db}" \
    --port="${DB_PORT:-3306}" \
    --user="${MYSQL_USER:-root}" \
    --connect-timeout=5 \
    --silent
  do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "[backup][error] MySQL unavailable after ${max_attempts} attempts" >&2
      return 1
    fi
    echo "[backup] MySQL not ready; retry ${attempt}/${max_attempts} in 10s"
    attempt=$((attempt + 1))
    sleep 10
  done
}

create_backup() {
  timestamp=$(date -u +%Y%m%dT%H%M%SZ)
  target="${backup_dir}/${DB_NAME}_${timestamp}.sql.gz"
  files_target="${backup_dir}/${DB_NAME}_${timestamp}_files.tar.gz"
  sql_temporary="${backup_dir}/.${DB_NAME}_${timestamp}.sql.tmp"
  dump_temporary="${target}.tmp"
  files_temporary="${files_target}.tmp"

  # Garde-fou WS22 : ne jamais sauvegarder des dossiers locaux vides si les
  # montages CIFS ne sont pas presents.
  if [ "${REQUIRE_WS22_MOUNT:-false}" = "true" ]; then
    for marker in \
      /data/uploads/.ws22-mounted \
      /data/storage/.ws22-mounted \
      /data/pv/.ws22-mounted \
      /data/documents/.ws22-mounted
    do
      if [ ! -f "$marker" ]; then
        echo "[backup][error] montage WS22 absent : $marker" >&2
        return 1
      fi
    done
  fi

  if ! wait_for_database; then
    return 1
  fi

  if ! MYSQL_PWD="${MYSQL_PASSWORD}" mysqldump \
    --single-transaction \
    --quick \
    --routines \
    --events \
    --triggers \
    --hex-blob \
    --host="${DB_HOST:-db}" \
    --port="${DB_PORT:-3306}" \
    --user="${MYSQL_USER:-root}" \
    "${DB_NAME}" > "$sql_temporary"
  then
    echo "[backup][error] mysqldump failed; no database backup published" >&2
    rm -f "$sql_temporary" "$dump_temporary" "$files_temporary"
    return 1
  fi

  if [ ! -s "$sql_temporary" ] || ! gzip -c "$sql_temporary" > "$dump_temporary" || ! gzip -t "$dump_temporary"; then
    echo "[backup][error] SQL dump is empty or gzip validation failed" >&2
    rm -f "$sql_temporary" "$dump_temporary" "$files_temporary"
    return 1
  fi

  if ! tar -czf "$files_temporary" -C /data uploads storage pv documents || ! tar -tzf "$files_temporary" >/dev/null; then
    echo "[backup][error] uploaded files archive failed; backup pair not published" >&2
    rm -f "$sql_temporary" "$dump_temporary" "$files_temporary"
    return 1
  fi

  # Copie du dump SQL vers le partage WS22 (optionnel).
  # On ne copie PAS l'archive des fichiers : elle serait une copie de la
  # source sur le meme serveur WS22. L'archive reste dans le volume local.
  if [ -n "$offsite_dir" ]; then
    if [ ! -f "${offsite_dir}/.ws22-mounted" ]; then
      echo "[backup][error] montage offsite absent : ${offsite_dir}" >&2
      rm -f "$sql_temporary" "$dump_temporary" "$files_temporary"
      return 1
    fi
    offsite_target="${offsite_dir}/$(basename "$target")"
    if ! cp -f "$dump_temporary" "$offsite_target" || ! gzip -t "$offsite_target"; then
      echo "[backup][error] copie offsite du dump SQL invalide" >&2
      rm -f "$sql_temporary" "$dump_temporary" "$files_temporary" "$offsite_target"
      return 1
    fi
  fi

  rm -f "$sql_temporary"
  mv "$dump_temporary" "$target"
  mv "$files_temporary" "$files_target"
  find "$backup_dir" -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
  find "$backup_dir" -type f -name '*_files.tar.gz' -mtime "+${retention_days}" -delete
  if [ -n "$offsite_dir" ]; then
    find "$offsite_dir" -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
  fi
  echo "[backup] verified database and files backup created: ${target}"
  return 0
}

backup_with_retry() {
  until create_backup; do
    echo "[backup][error] backup failed; retrying in ${retry_seconds}s" >&2
    sleep "$retry_seconds"
  done
}

seconds_until_next_backup() {
  now=$(date +%s)
  scheduled_today=$(date -d 'today 23:50' +%s)
  if [ "$scheduled_today" -le "$now" ]; then
    scheduled_today=$(date -d 'tomorrow 23:50' +%s)
  fi
  echo $((scheduled_today - now))
}

if [ "${BACKUP_RUN_ONCE:-false}" = "true" ]; then
  backup_with_retry
  exit 0
fi

while :; do
  wait_seconds=$(seconds_until_next_backup)
  echo "[backup] next daily database backup at 23:50 ${TZ} (in ${wait_seconds}s)"
  sleep "$wait_seconds"
  backup_with_retry
done
