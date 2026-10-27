#!/usr/bin/env bash
# =============================================================================
# EasyEcole - Initialisation du stockage documentaire (VM APP)
#
# Cree l'arborescence cible sur les deux montages :
#   /mnt/easyecole-documents  -> documents importes et generes
#   /mnt/easyecole-storage    -> sauvegardes (dumps MySQL, archives, GED)
#
# Structure :
#   documents/
#     uploads/<annee-academique>/<type>/<sous-type?>/   (documents importes)
#     created/<annee-academique>/<type>/<sous-type?>/   (documents generes)
#     uploads/_legacy/public/                           (ancien /app/public)
#     created/_legacy/storage/                          (ancien /app/storage)
#     created/_legacy/pv/                               (ancien /app/uploads)
#   storage/
#     mysql/  ged/  files/  tmp/
#
# Le script est IDEMPOTENT : il ne supprime aucun fichier existant.
#
# En production, il est execute AUTOMATIQUEMENT par le service one-shot
# `init-storage` de docker-compose.yml, avant le demarrage du backend.
# Aucune commande manuelle n'est necessaire sur la VM.
#
# Annees academiques :
#   - arguments positionnels     : ./script 2023-2024 2024-2025 2025-2026
#   - variable ACADEMIC_YEARS    : "2023-2024 2024-2025 2025-2026"
#   - variable ACADEMIC_YEAR     : "2025-2026" (compatibilite)
#   - sinon decouverte auto      : annees presentes en base
#                                  (ins_annees_academiques), dossiers deja
#                                  crees, puis annee courante.
#
# Usage :
#   sudo ./scripts/init-document-storage.sh 2023-2024 2024-2025 2025-2026
#   sudo env ACADEMIC_YEARS="2023-2024 2024-2025 2025-2026" ./scripts/init-document-storage.sh
#   sudo env ACADEMIC_YEAR=2025-2026 ./scripts/init-document-storage.sh
#   SKIP_MOUNT_CHECK=true ./scripts/init-document-storage.sh   # test local
#
# Decouverte en base (optionnelle) :
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS (ou DB_PASSWORD)
#   Les variables sont lues depuis l'environnement, puis depuis ENV_FILE,
#   ./.env ou /opt/mon-app/.env si ces fichiers existent.
#   SKIP_DB_DISCOVERY=true pour desactiver.
#
# Autres options :
#   INCLUDE_CURRENT_YEAR=false  ne pas ajouter l'annee courante
#   INCLUDE_NEXT_YEAR=true      pre-creer aussi l'annee suivante
#   ACADEMIC_YEAR_FROM=2020     premiere annee de la plage (defaut : plus
#                               ancienne annee connue)
#   ACADEMIC_YEAR_UNTIL=2050    derniere annee de la plage (defaut : 2050).
#                               La valeur 2050 cree jusqu'a 2050-2051.
#   SKIP_YEAR_RANGE=true        ne creer que les annees explicites/decouvertes
# =============================================================================

set -euo pipefail

# Charge un fichier .env sans ecraser les variables deja definies.
load_env_file() {
  local file="$1" line key value
  [ -f "$file" ] || return 0

  echo "[init-storage] Chargement des variables depuis $file"
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in
      ''|\#*) continue ;;
    esac
    line="${line#export }"
    key="${line%%=*}"
    value="${line#*=}"
    key="${key//[[:space:]]/}"

    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi
    if [ -z "${!key:-}" ]; then
      if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
      fi
      export "$key=$value"
    fi
  done < "$file"
}

if [ -n "${ENV_FILE:-}" ]; then
  load_env_file "$ENV_FILE"
else
  load_env_file "$PWD/.env"
  load_env_file "/opt/mon-app/.env"
fi

DOCUMENTS_ROOT="${DOCUMENTS_ROOT:-${DOCUMENTS_HOST_PATH:-/mnt/easyecole-documents}}"
STORAGE_ROOT="${BACKUP_STORAGE_ROOT:-${BACKUP_STORAGE_HOST_PATH:-/mnt/easyecole-storage}}"

current_academic_year() {
  local year month start
  year="$(date +%Y)"
  month="$(date +%m)"
  if [ "$((10#$month))" -ge 9 ]; then
    start="$year"
  else
    start="$((year - 1))"
  fi
  printf '%s-%s\n' "$start" "$((start + 1))"
}

normalize_year() {
  local raw="$1"
  raw="${raw//[[:space:]]/}"
  if [[ "$raw" =~ ^([0-9]{4})[-/]([0-9]{4})$ ]]; then
    printf '%s-%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  elif [[ "$raw" =~ ^([0-9]{4})$ ]]; then
    printf '%s-%s\n' "$raw" "$((10#$raw + 1))"
  else
    return 1
  fi
}

year_start() {
  local normalized
  normalized="$(normalize_year "$1" || true)"
  [ -n "$normalized" ] || return 1
  printf '%s\n' "${normalized%%-*}"
}

ACADEMIC_YEAR_LIST=()

add_year() {
  local input="$1" normalized existing

  normalized="$(normalize_year "$input" || true)"
  if [ -z "$normalized" ]; then
    if [ -n "$input" ]; then
      echo "[init-storage] Annee ignoree (format attendu AAAA-AAAA) : $input" >&2
    fi
    return 0
  fi

  if [ ${#ACADEMIC_YEAR_LIST[@]} -gt 0 ]; then
    for existing in "${ACADEMIC_YEAR_LIST[@]}"; do
      if [ "$existing" = "$normalized" ]; then
        return 0
      fi
    done
  fi

  ACADEMIC_YEAR_LIST+=("$normalized")
}

discover_existing_years() {
  local origin dir base
  for origin in uploads created; do
    [ -d "$DOCUMENTS_ROOT/$origin" ] || continue
    for dir in "$DOCUMENTS_ROOT/$origin"/*; do
      [ -d "$dir" ] || continue
      base="$(basename "$dir")"
      if [[ "$base" =~ ^[0-9]{4}-[0-9]{4}$ ]]; then
        add_year "$base"
      fi
    done
  done
}

discover_db_years() {
  if [ "${SKIP_DB_DISCOVERY:-false}" = "true" ]; then
    return 0
  fi
  if ! command -v mysql >/dev/null 2>&1; then
    return 0
  fi

  local host="${DB_HOST:-}"
  local port="${DB_PORT:-3306}"
  local name="${DB_NAME:-}"
  local user="${DB_USER:-}"
  local pass="${DB_PASS:-${DB_PASSWORD:-}}"

  if [ -z "$host" ] || [ -z "$name" ] || [ -z "$user" ]; then
    echo "[init-storage] Decouverte en base ignoree (DB_HOST/DB_NAME/DB_USER non definis)."
    return 0
  fi

  echo "[init-storage] Decouverte des annees academiques en base ($host/$name)..."

  local rows
  rows="$(MYSQL_PWD="$pass" mysql --connect-timeout=5 --protocol=TCP \
    -h "$host" -P "$port" -u "$user" -N -B \
    -e "SELECT DISTINCT libelle FROM ins_annees_academiques WHERE libelle IS NOT NULL AND libelle <> '' AND deletedAt IS NULL ORDER BY libelle" \
    "$name" 2>/dev/null || true)"

  if [ -z "$rows" ]; then
    echo "[init-storage] Aucune annee recuperee depuis la base (acces MySQL indisponible ou table vide)."
    return 0
  fi

  while IFS= read -r row; do
    [ -n "$row" ] && add_year "$row"
  done <<< "$rows"
}

CATEGORIES=(
  finances
  pedagogique
  administratif
  ressources_humaines
  communication
  orientation
  bibliotheque
  elearning
  inscription
  ged
  docgen
  divers
)

# Exemple de sous-classement demande : .../finances/filieres/
SUBCATEGORIES=(filieres)

echo "[init-storage] Montages :"
echo "  documents = $DOCUMENTS_ROOT"
echo "  storage   = $STORAGE_ROOT"

if [ "${SKIP_MOUNT_CHECK:-false}" != "true" ]; then
  for dir in "$DOCUMENTS_ROOT" "$STORAGE_ROOT"; do
    if [ ! -d "$dir" ]; then
      echo "[init-storage] ERREUR : $dir n'existe pas."
      echo "  Monter le partage avant de relancer le script."
      exit 1
    fi
    if command -v mountpoint >/dev/null 2>&1 && ! mountpoint -q "$dir"; then
      echo "[init-storage] ERREUR : $dir n'est pas un point de montage."
      echo "  Verifier /etc/fstab puis relancer."
      echo "  Pour un test local uniquement : SKIP_MOUNT_CHECK=true."
      exit 1
    fi
  done
fi

mkdir -p "$DOCUMENTS_ROOT/uploads" "$DOCUMENTS_ROOT/created"

# 1. Annees fournies explicitement (arguments, ACADEMIC_YEARS, ACADEMIC_YEAR).
for arg in "$@"; do
  add_year "$arg"
done

if [ -n "${ACADEMIC_YEARS:-}" ]; then
  IFS=', ' read -r -a requested_years <<< "$ACADEMIC_YEARS"
  for year in "${requested_years[@]}"; do
    add_year "$year"
  done
fi

if [ -n "${ACADEMIC_YEAR:-}" ]; then
  IFS=', ' read -r -a requested_years <<< "$ACADEMIC_YEAR"
  for year in "${requested_years[@]}"; do
    add_year "$year"
  done
fi

# 2. Annees deja presentes sur le montage.
discover_existing_years

# 3. Annees presentes en base (si le client MySQL et les variables sont dispo).
discover_db_years

# 4. Annee courante et, si demande, annee suivante.
CURRENT_ACADEMIC_YEAR="$(current_academic_year)"
if [ "${INCLUDE_CURRENT_YEAR:-true}" = "true" ]; then
  add_year "$CURRENT_ACADEMIC_YEAR"
fi
if [ "${INCLUDE_NEXT_YEAR:-false}" = "true" ]; then
  current_start="${CURRENT_ACADEMIC_YEAR%%-*}"
  add_year "$((10#$current_start + 1))"
fi

# 5. Plage continue jusqu'a ACADEMIC_YEAR_UNTIL (2050 par defaut).
if [ "${SKIP_YEAR_RANGE:-false}" != "true" ]; then
  if [ -n "${ACADEMIC_YEAR_FROM:-}" ]; then
    range_from_start="$(year_start "$ACADEMIC_YEAR_FROM" || true)"
  else
    range_from_start=""
    for academic_year in "${ACADEMIC_YEAR_LIST[@]}"; do
      candidate_start="${academic_year%%-*}"
      if [ -z "$range_from_start" ] || [ "$((10#$candidate_start))" -lt "$((10#$range_from_start))" ]; then
        range_from_start="$candidate_start"
      fi
    done
  fi

  range_until_start="$(year_start "${ACADEMIC_YEAR_UNTIL:-2050}" || true)"

  if [ -z "$range_from_start" ]; then
    range_from_start="${CURRENT_ACADEMIC_YEAR%%-*}"
  fi

  if [ -z "$range_until_start" ]; then
    echo "[init-storage] ACADEMIC_YEAR_UNTIL invalide, plage ignoree." >&2
  elif [ "$((10#$range_from_start))" -le "$((10#$range_until_start))" ]; then
    echo "[init-storage] Plage : ${range_from_start}-$((10#$range_from_start + 1)) a ${range_until_start}-$((10#$range_until_start + 1))"
    for ((start_year = 10#$range_from_start; start_year <= 10#$range_until_start; start_year++)); do
      add_year "$start_year"
    done
  else
    echo "[init-storage] Plage ignoree : ACADEMIC_YEAR_FROM > ACADEMIC_YEAR_UNTIL." >&2
  fi
fi

if [ ${#ACADEMIC_YEAR_LIST[@]} -eq 0 ]; then
  add_year "$CURRENT_ACADEMIC_YEAR"
fi

mapfile -t ACADEMIC_YEAR_LIST < <(printf '%s\n' "${ACADEMIC_YEAR_LIST[@]}" | sort -u)

echo "  annees    = ${ACADEMIC_YEAR_LIST[*]}"

for academic_year in "${ACADEMIC_YEAR_LIST[@]}"; do
  for origin in uploads created; do
    for category in "${CATEGORIES[@]}"; do
      mkdir -p "$DOCUMENTS_ROOT/$origin/$academic_year/$category"
      for subcategory in "${SUBCATEGORIES[@]}"; do
        mkdir -p "$DOCUMENTS_ROOT/$origin/$academic_year/$category/$subcategory"
      done
    done
  done
done

# Dossiers de compatibilite pour les anciens chemins du code (public/,
# storage/ et uploads/pv). Ils seront supprimes apres migration complete.
mkdir -p \
  "$DOCUMENTS_ROOT/uploads/_legacy/public" \
  "$DOCUMENTS_ROOT/created/_legacy/storage" \
  "$DOCUMENTS_ROOT/created/_legacy/pv"

# Sauvegardes / replicas : dumps MySQL, archives de fichiers, sauvegardes GED.
mkdir -p "$STORAGE_ROOT/mysql" "$STORAGE_ROOT/ged" "$STORAGE_ROOT/files" "$STORAGE_ROOT/tmp"

# Marqueurs utilises par docker-entrypoint.sh pour refuser de demarrer si le
# montage est absent (REQUIRE_DOCUMENTS_MOUNT=true).
{
  echo "EasyEcole documents mount"
  echo "created=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "academic_years=$(IFS=,; echo "${ACADEMIC_YEAR_LIST[*]}")"
} > "$DOCUMENTS_ROOT/.easyecole-mounted"

{
  echo "EasyEcole backup mount"
  echo "created=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$STORAGE_ROOT/.easyecole-mounted"

if [ "${FIX_PERMISSIONS:-true}" = "true" ] && [ "$(id -u)" = "0" ]; then
  echo "[init-storage] Alignement des droits sur 1000:1000 (utilisateur node)..."
  chown -R 1000:1000 "$DOCUMENTS_ROOT" "$STORAGE_ROOT"
  chmod -R u+rwX,g+rwX "$DOCUMENTS_ROOT" "$STORAGE_ROOT"
fi

echo "[init-storage] OK"
echo "  annees academiques :"
for academic_year in "${ACADEMIC_YEAR_LIST[@]}"; do
  echo "    - $academic_year"
done
echo "  documents importes : $DOCUMENTS_ROOT/uploads/<annee>/<type>/<sous-type?>/"
echo "  documents generes  : $DOCUMENTS_ROOT/created/<annee>/<type>/<sous-type?>/"
echo "  sauvegardes        : $STORAGE_ROOT/{mysql,ged,files}/"
echo "  marqueurs          : $DOCUMENTS_ROOT/.easyecole-mounted, $STORAGE_ROOT/.easyecole-mounted"
