#!/bin/sh
# =============================================================================
# EasyEcole - Sauvegarde MySQL EXTERNE + archive des documents
#
# Cible : base MySQL 8.0 hebergee sur la VM DB (DB_HOST), hors Docker.
# Ecrit dans /app/backups (monte depuis /mnt/easyecole-storage) :
#   mysql/<base>_<timestamp>.sql.gz (+ .sha256)
#   files/documents_<timestamp>.tar.gz (+ .sha256)
#
# Variables :
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS   connexion MySQL
#   BACKUP_RETENTION_DAYS                          defaut 14
#   BACKUP_INTERVAL_SECONDS                        defaut 86400
#   BACKUP_SET_GTID_PURGED                         ON/OFF (defaut ON)
#   BACKUP_RUN_ONCE                                true = un seul passage
#   BACKUP_DIR                                     defaut /app/backups
#   DOCUMENTS_DIR                                  defaut /app/documents
#
# Droits MySQL recommandes pour l'utilisateur de backup (base easyecole) :
#   GRANT SELECT, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT
#     ON easyecole.* TO 'easyecole_backup'@'<IP_VM_APP>';
#   -- si BACKUP_SET_GTID_PURGED=ON :
#   GRANT PROCESS, RELOAD, REPLICATION CLIENT ON *.* TO 'easyecole_backup'@'<IP_VM_APP>';
#   FLUSH PRIVILEGES;
#
# Test ponctuel :
#   BACKUP_RUN_ONCE=true docker compose -f docker-compose.prod.yml up mysql-backup
# =============================================================================

set -eu

DB_HOST="${DB_HOST:?DB_HOST must be set}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:?DB_NAME must be set}"
DB_USER="${DB_USER:?DB_USER must be set}"
DB_PASS="${DB_PASS:?DB_PASS must be set}"

BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
DOCUMENTS_DIR="${DOCUMENTS_DIR:-/app/documents}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
SET_GTID_PURGED="${BACKUP_SET_GTID_PURGED:-ON}"
RUN_ONCE="${BACKUP_RUN_ONCE:-false}"

MYSQL_DIR="$BACKUP_DIR/mysql"
FILES_DIR="$BACKUP_DIR/files"

# Evite le mot de passe dans la ligne de commande (visible via ps).
export MYSQL_PWD="$DB_PASS"

log() {
  echo "[backup] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

checksum() {
  file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" > "$file.sha256"
  else
    openssl dgst -sha256 "$file" > "$file.sha256"
  fi
}

cleanup() {
  find "$MYSQL_DIR" -type f \( -name '*.sql.gz' -o -name '*.sql.gz.sha256' \) \
    -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
  find "$FILES_DIR" -type f \( -name '*.tar.gz' -o -name '*.tar.gz.sha256' \) \
    -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
  find "$MYSQL_DIR" -type f -name '.dump_*' -mtime +1 -delete 2>/dev/null || true
}

dump_database() {
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  tmp="$MYSQL_DIR/.dump_${DB_NAME}_${ts}.sql"
  file="$MYSQL_DIR/${DB_NAME}_${ts}.sql.gz"

  log "dump de $DB_NAME vers $file"

  if ! mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --default-character-set=utf8mb4 \
    --no-tablespaces \
    --set-gtid-purged="$SET_GTID_PURGED" \
    --databases "$DB_NAME" > "$tmp"; then
    log "ECHEC du dump MySQL"
    rm -f "$tmp"
    return 1
  fi

  if ! gzip -9 -c "$tmp" > "$file"; then
    log "ECHEC de la compression"
    rm -f "$tmp" "$file"
    return 1
  fi
  rm -f "$tmp"

  if ! gzip -t "$file"; then
    log "ECHEC : archive gzip invalide ($file)"
    rm -f "$file"
    return 1
  fi

  checksum "$file"
  log "dump OK ($(du -h "$file" | cut -f1))"
}

archive_documents() {
  if [ ! -d "$DOCUMENTS_DIR" ]; then
    log "ECHEC : $DOCUMENTS_DIR introuvable, archive ignoree"
    return 1
  fi

  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  file="$FILES_DIR/documents_${ts}.tar.gz"

  log "archive des documents vers $file"
  if ! tar -czf "$file" -C "$DOCUMENTS_DIR" .; then
    log "ECHEC de l'archive des documents"
    rm -f "$file"
    return 1
  fi

  if ! gzip -t "$file"; then
    log "ECHEC : archive tar.gz invalide ($file)"
    rm -f "$file"
    return 1
  fi

  checksum "$file"
  log "archive OK ($(du -h "$file" | cut -f1))"
}

run_once() {
  status=0
  dump_database || status=1
  archive_documents || status=1
  cleanup
  return "$status"
}

mkdir -p "$MYSQL_DIR" "$FILES_DIR"

if [ "$RUN_ONCE" = "true" ]; then
  log "mode RUN_ONCE active"
  run_once
  exit $?
fi

log "demarrage : intervalle ${INTERVAL_SECONDS}s, retention ${RETENTION_DAYS}j"
while true; do
  run_once || log "un ou plusieurs backups ont echoue (nouvel essai dans ${INTERVAL_SECONDS}s)"
  sleep "$INTERVAL_SECONDS"
done
