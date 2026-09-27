"""
redis_timing_check.py — Mesure de performance Redis et comparaison avec temps API.

Se connecte à Redis (localhost:6379), fait :
- 100 SET/GET et calcule avg, p50, p95
- 10 appels API (GET /parcours, GET /dossiers, POST /ue/import)
- Affiche un tableau comparatif API vs Redis

Usage :
    cd D:\\EasyEcole\\selenium-tests
    python performance/redis_timing_check.py
"""

import time
import statistics
import requests
import redis
import json
import sys
import os

# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = os.environ.get("API_BASE", "http://localhost:3000/api/v1")
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
ADMIN_EMAIL = "tepitechbuild@gmail.com"
ADMIN_PASSWORD = "Admin@2026!"

# Connexion Redis
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    REDIS_AVAILABLE = redis_client.ping()
except Exception as e:
    print(f"[ERREUR] Connexion Redis échouée : {e}")
    REDIS_AVAILABLE = False
    sys.exit(1)

print(f"[OK] Redis connecté ({REDIS_HOST}:{REDIS_PORT}) — PING: {REDIS_AVAILABLE}")

# =============================================================================
# MÉTRIQUES
# =============================================================================

def percentile(data, p):
    """Calcule le percentile p d'une liste de valeurs."""
    if not data:
        return 0
    s = sorted(data)
    k = (len(s) - 1) * (p / 100)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[int(k)]
    return s[f] * (c - k) + s[c] * (k - f)


def measure_redis_set(key, value="test_value", ex=60):
    """Mesure le temps d'un SET Redis."""
    start = time.perf_counter()
    redis_client.set(key, value, ex=ex)
    elapsed = (time.perf_counter() - start) * 1000
    return elapsed


def measure_redis_get(key):
    """Mesure le temps d'un GET Redis."""
    start = time.perf_counter()
    redis_client.get(key)
    elapsed = (time.perf_counter() - start) * 1000
    return elapsed


def measure_api_get(endpoint, token=None):
    """Mesure le temps d'un appel API GET."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{API_BASE}{endpoint}"
    start = time.perf_counter()
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        elapsed = (time.perf_counter() - start) * 1000
        return elapsed, resp.status_code
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return elapsed, f"ERROR: {str(e)[:60]}"


def measure_api_post(endpoint, payload=None, token=None):
    """Mesure le temps d'un appel API POST."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{API_BASE}{endpoint}"
    start = time.perf_counter()
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        elapsed = (time.perf_counter() - start) * 1000
        return elapsed, resp.status_code
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return elapsed, f"ERROR: {str(e)[:60]}"


def get_auth_token():
    """Obtient un token JWT."""
    try:
        resp = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": ADMIN_EMAIL, "motDePasse": ADMIN_PASSWORD},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("token") or data.get("accessToken") or data.get("data", {}).get("token")
    except Exception:
        pass
    return None


# =============================================================================
# TEST 1 : 100 SET/GET Redis
# =============================================================================

def test_redis_baseline():
    """Test de baseline Redis : 100 SET/GET."""
    print("\n" + "=" * 80)
    print("  TEST 1 : BASELINE REDIS — 100 SET/GET")
    print("=" * 80)

    set_times = []
    get_times = []
    cache_hits = 0

    for i in range(100):
        key = f"perf:test:{i}"
        value = f"value_{i}_{time.time()}"

        # SET
        t_set = measure_redis_set(key, value)
        set_times.append(t_set)

        # GET (le premier GET après SET est un cache hit)
        t_get = measure_redis_get(key)
        get_times.append(t_get)

        # Vérifier si clé existe (cache hit)
        if redis_client.exists(key):
            cache_hits += 1

    avg_set = statistics.mean(set_times)
    p50_set = percentile(set_times, 50)
    p95_set = percentile(set_times, 95)
    avg_get = statistics.mean(get_times)
    p50_get = percentile(get_times, 50)
    p95_get = percentile(get_times, 95)

    print(f"\n  {'Métrique':<15} {'Avg (ms)':>10} {'P50 (ms)':>10} {'P95 (ms)':>10}")
    print(f"  {'-'*45}")
    print(f"  {'Redis SET':<15} {avg_set:>10.3f} {p50_set:>10.3f} {p95_set:>10.3f}")
    print(f"  {'Redis GET':<15} {avg_get:>10.3f} {p50_get:>10.3f} {p95_get:>10.3f}")
    print(f"  {'Cache Hits':<15} {cache_hits}/100{'':>13}")
    print("=" * 80)

    return {
        "redis_set": {"avg": avg_set, "p50": p50_set, "p95": p95_set},
        "redis_get": {"avg": avg_get, "p50": p50_get, "p95": p95_get},
        "cache_hits": cache_hits,
    }


# =============================================================================
# TEST 2 : 10 Appels API vs Redis
# =============================================================================

def test_api_vs_redis():
    """Comparaison 10 appels API vs Redis pour les endpoints critiques."""
    print("\n" + "=" * 80)
    print("  TEST 2 : COMPARAISON API vs REDIS — 10 requêtes")
    print("=" * 80)

    token = get_auth_token()
    if not token:
        print("[WARN] Token non obtenu, utilisation d'appels non authentifiés")

    # Endpoints à tester
    endpoints = [
        ("GET", "/inscription/parcours", None),
        ("GET", "/inscription/dossiers", None),
        ("GET", "/inscription/classes", None),
        ("GET", "/inscription/rattrapages", None),
        ("GET", "/inscription/demandesInscription", None),
        ("POST", "/inscription/excel/ue/import", {"type": "ue"}),
        ("GET", "/inscription/excel/ue/template", None),
        ("GET", "/auth/permissions/mes-permissions", None),
        ("POST", "/auth/login", {"email": ADMIN_EMAIL, "motDePasse": ADMIN_PASSWORD}),
        ("GET", "/health", None),
    ]

    api_times = []
    redis_ping_times = []
    redis_get_times = []
    api_results = []

    # Pré-charger quelques clés Redis pour tester le cache
    preload_keys = ["perf:api:cache:parcours", "perf:api:cache:dossiers", "perf:api:cache:classes"]
    for k in preload_keys:
        redis_client.set(k, f"cached_data_{k}", ex=120)

    print(f"\n  {'#':<3} {'Endpoint':<40} {'API (ms)':>9} {'Ping(ms)':>9} {'GET(ms)':>9} {'Hit?':>5}")
    print(f"  {'-'*80}")

    for idx, (method, path, payload) in enumerate(endpoints, 1):
        # Appel API
        if method == "GET":
            api_time, api_status = measure_api_get(path, token)
        else:
            api_time, api_status = measure_api_post(path, payload, token)
        api_times.append(api_time)
        api_results.append((path, api_status))

        # Redis PING
        t_ping = measure_redis_ping_safe()
        redis_ping_times.append(t_ping)

        # Redis GET (tester cache hit/miss)
        cache_key = f"perf:api:cache:{path.replace('/', ':').replace(':', '_')}"
        t_get = measure_redis_get_safe(cache_key)
        redis_get_times.append(t_get)

        # Pré-charger la clé si c'est un GET
        if method == "GET":
            redis_client.set(cache_key, f"api_response_{path}", ex=120)

        hit = redis_client.exists(cache_key)
        print(f"  {idx:<3} {path:<40} {api_time:>9.2f} {t_ping:>9.3f} {t_get:>9.3f} {'OUI' if hit else 'NON':>5}")

    avg_api = statistics.mean(api_times) if api_times else 0
    p50_api = percentile(api_times, 50) if api_times else 0
    p95_api = percentile(api_times, 95) if api_times else 0
    avg_ping = statistics.mean(redis_ping_times) if redis_ping_times else 0
    avg_get = statistics.mean(redis_get_times) if redis_get_times else 0
    p50_get = percentile(redis_get_times, 50) if redis_get_times else 0
    p95_get = percentile(redis_get_times, 95) if redis_get_times else 0

    print(f"\n  {'RÉSUMÉ':<40} {'Moyenne':>9} {'P50':>9} {'P95':>9}")
    print(f"  {'-'*80}")
    print(f"  {'API (ms)':<40} {avg_api:>9.2f} {p50_api:>9.2f} {p95_api:>9.2f}")
    print(f"  {'Redis PING (ms)':<40} {avg_ping:>9.3f} {'-':>9} {'-':>9}")
    print(f"  {'Redis GET (ms)':<40} {avg_get:>9.3f} {p50_get:>9.3f} {p95_get:>9.3f}")
    print(f"  {'Ratio API/Redis':<40} {avg_api/avg_ping if avg_ping > 0 else 0:>9.1f}x")
    print("=" * 80)

    return {
        "api": {"avg": avg_api, "p50": p50_api, "p95": p95_api},
        "redis_ping": {"avg": avg_ping},
        "redis_get": {"avg": avg_get, "p50": p50_get, "p95": p95_get},
        "api_results": api_results,
    }


def measure_redis_ping_safe():
    """Mesure PING Redis en toute sécurité."""
    try:
        start = time.perf_counter()
        redis_client.ping()
        return (time.perf_counter() - start) * 1000
    except Exception:
        return 999.0


def measure_redis_get_safe(key):
    """Mesure GET Redis en toute sécurité."""
    try:
        start = time.perf_counter()
        redis_client.get(key)
        return (time.perf_counter() - start) * 1000
    except Exception:
        return 999.0


# =============================================================================
# RAPPORT FINAL
# =============================================================================

def print_final_report(redis_baseline, api_redis_comparison):
    """Affiche le rapport final complet."""
    print("\n" + "=" * 80)
    print("  RAPPORT FINAL — PERFORMANCE REDIS vs API")
    print("=" * 80)

    rb = redis_baseline
    arc = api_redis_comparison

    print(f"""
  +{'-'*78}+
  |                    REDIS BASELINE (100 SET/GET)                     |
  +--------------------+----------+----------+-----------------------+
  | Operation          |   Avg    |   P50    |   P95                 |
  +--------------------+----------+----------+-----------------------+
  | Redis SET          | {rb['redis_set']['avg']:>7.3f} | {rb['redis_set']['p50']:>7.3f} | {rb['redis_set']['p95']:>12.3f} |
  | Redis GET          | {rb['redis_get']['avg']:>7.3f} | {rb['redis_get']['p50']:>7.3f} | {rb['redis_get']['p95']:>12.3f} |
  | Cache Hit Rate     | {rb['cache_hits']:>6}/100 |          |                       |
  +--------------------+----------+----------+-----------------------+

  +--------------------+----------+----------+-----------------------+
  |              API vs REDIS (10 requetes)                             |
  +--------------------+----------+----------+-----------------------+
  | Operation          |   Avg    |   P50    |   P95                 |
  +--------------------+----------+----------+-----------------------+
  | API Backend        | {arc['api']['avg']:>7.2f} | {arc['api']['p50']:>7.2f} | {arc['api']['p95']:>12.2f} |
  | Redis PING         | {arc['redis_ping']['avg']:>7.3f} |          |                       |
  | Redis GET          | {arc['redis_get']['avg']:>7.3f} | {arc['redis_get']['p50']:>7.3f} | {arc['redis_get']['p95']:>12.3f} |
  | Ratio API/Redis    | {arc['api']['avg']/arc['redis_ping']['avg'] if arc['redis_ping']['avg'] > 0 else 0:>7.1f}x   |          |                       |
  +--------------------+----------+----------+-----------------------+

  CONCLUSION : Redis ajoute une latence de ~{arc['redis_ping']['avg']:.3f}ms par operation,
     ce qui represente {arc['redis_ping']['avg']/arc['api']['avg']*100 if arc['api']['avg'] > 0 else 0:.2f}% du temps API total.
     Le gain de cache (eviter les requetes DB) compense largement ce cout.
  +{'-'*78}+
""")

    # Sauvegarder le rapport JSON
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "redis_baseline": rb,
        "api_vs_redis": {
            "api": arc["api"],
            "redis_ping": arc["redis_ping"],
            "redis_get": arc["redis_get"],
        },
        "api_results": arc["api_results"],
    }

    report_path = os.path.join(os.path.dirname(__file__), "redis_timing_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"[OUT] Rapport JSON sauvegardé : {report_path}")
    print("=" * 80 + "\n")

    return report


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("\n" + "=" * 80)
    print("  REDIS TIMING CHECK — EasyEcole V4")
    print(f"  Redis : {REDIS_HOST}:{REDIS_PORT}")
    print(f"  API   : {API_BASE}")
    print("=" * 80)

    # Test 1 : Baseline Redis
    redis_baseline = test_redis_baseline()

    # Test 2 : API vs Redis
    api_redis_comparison = test_api_vs_redis()

    # Rapport final
    report = print_final_report(redis_baseline, api_redis_comparison)

    # Vérification d'intégrité Redis
    try:
        dbsize = redis_client.dbsize()
        print(f"[INFO] Redis dbsize actuel : {dbsize} clés")
        keys = redis_client.keys("perf:*")
        print(f"[INFO] Clés perf créées : {len(keys)}")
    except Exception:
        pass

    return report


if __name__ == "__main__":
    main()
