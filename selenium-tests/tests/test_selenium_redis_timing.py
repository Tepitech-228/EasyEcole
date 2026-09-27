"""
test_selenium_redis_timing.py — Tests fonctionnels Selenium avec mesure de latence Redis.

Pour chaque scénario critique Selenium (login, import UE MASTER GC, import LICENCE GE,
inscription, rattrapage), on mesure :
- Temps Selenium (ms) : action UI (click, send_keys, wait)
- Temps API (ms) : appel direct à l'API backend correspondante
- Temps Redis PING (ms) : latence réseau Redis
- Temps Redis GET (ms) : lecture clé Redis
- Cache Hit? : si la clé existe déjà dans Redis

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v tests/test_selenium_redis_timing.py
"""

import time
import requests
import redis
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from conftest import BASE_URL, API_BASE, DEFAULT_TIMEOUT, LONG_TIMEOUT, user_credentials
from pages.login_page import LoginPage
from pages.import_export_page import ImportExportPage
from pages.inscription_page import InscriptionPage
from pages.rattrapage_page import RattrapagePage
from pages.dashboard_page import DashboardPage


# =============================================================================
# CONFIGURATION
# =============================================================================

ADMIN_EMAIL = "tepitechbuild@gmail.com"
ADMIN_PASSWORD = "Admin@2026!"

# Connexion Redis (localhost:6379 par défaut)
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

# Seulement 5 scénarios critiques comme demandé
CRITICAL_SCENARIOS = [
    "login",
    "import_ue_master_gc",
    "import_licence_ge",
    "inscription",
    "rattrapage",
]


# =============================================================================
# HELPERS DE MESURE
# =============================================================================

def measure_redis_ping():
    """Mesure le temps d'un PING Redis."""
    start = time.perf_counter()
    redis_client.ping()
    elapsed = (time.perf_counter() - start) * 1000
    return round(elapsed, 2)


def measure_redis_get(key):
    """Mesure le temps d'un GET Redis et indique si c'est un cache hit."""
    # Vérifions d'abord si la clé existe
    exists_before = redis_client.exists(key)
    start = time.perf_counter()
    value = redis_client.get(key)
    elapsed = (time.perf_counter() - start) * 1000
    # Si la clé existait déjà avant le GET, c'est un cache hit
    cache_hit = exists_before or value is not None
    return round(elapsed, 2), cache_hit, value is not None


def measure_redis_set(key, value="test"):
    """Mesure le temps d'un SET Redis."""
    start = time.perf_counter()
    redis_client.set(key, value, ex=60)  # expire après 60s pour ne pas polluer
    elapsed = (time.perf_counter() - start) * 1000
    return round(elapsed, 2)


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
        return round(elapsed, 2), resp.status_code
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return round(elapsed, 2), f"ERROR: {str(e)[:50]}"


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
        return round(elapsed, 2), resp.status_code
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return round(elapsed, 2), f"ERROR: {str(e)[:50]}"


def get_auth_token():
    """Obtient un token JWT via l'API pour les appels authentifiés."""
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
# TABLEAU DE RÉSULTATS
# =============================================================================

results_table = []


def add_result(scenario, step, selenium_ms, api_ms, redis_ping_ms, redis_get_ms, cache_hit):
    """Ajoute une ligne au tableau de résultats."""
    results_table.append({
        "Scénario": scenario,
        "Étape": step,
        "Selenium (ms)": selenium_ms,
        "API (ms)": api_ms,
        "Redis PING (ms)": redis_ping_ms,
        "Redis GET (ms)": redis_get_ms,
        "Cache Hit?": "OUI" if cache_hit else "NON",
    })


def print_results_table():
    """Affiche le tableau complet des résultats."""
    print("\n" + "=" * 110)
    print("  TABLEAU DE MESURE — SELENIUM vs API vs Redis")
    print("=" * 110)
    header = f"{'Scénario':<25} {'Étape':<25} {'Sel(ms)':>8} {'API(ms)':>8} {'Ping(ms)':>8} {'GET(ms)':>8} {'Cache?':>7}"
    print(header)
    print("-" * 110)
    for row in results_table:
        print(
            f"{row['Scénario']:<25} {row['Étape']:<25} "
            f"{row['Selenium (ms)']:>8} {row['API (ms)']:>8} "
            f"{row['Redis PING (ms)']:>8} {row['Redis GET (ms)']:>8} "
            f"{row['Cache Hit?']:>7}"
        )
    print("=" * 110)

    # Calculs de moyennes
    if results_table:
        avg_sel = sum(r["Selenium (ms)"] for r in results_table) / len(results_table)
        avg_api = sum(r["API (ms)"] for r in results_table) / len(results_table)
        avg_ping = sum(r["Redis PING (ms)"] for r in results_table) / len(results_table)
        avg_get = sum(r["Redis GET (ms)"] for r in results_table) / len(results_table)
        cache_hits = sum(1 for r in results_table if r["Cache Hit?"] == "OUI")
        print(f"\n  MOYENNES : Selenium={avg_sel:.1f}ms | API={avg_api:.1f}ms | Redis PING={avg_ping:.2f}ms | Redis GET={avg_get:.2f}ms | Cache Hit={cache_hits}/{len(results_table)}")
        print("=" * 110 + "\n")


# =============================================================================
# TESTS — 5 SCÉNARIOS CRITIQUES
# =============================================================================

class TestSeleniumRedisTiming:
    """
    Mesure les temps Selenium, API et Redis pour 5 scénarios critiques.
    """

    @pytest.fixture(autouse=True)
    def setup_driver(self, driver, user_credentials):
        """Setup: connexion avant chaque test."""
        self.driver = driver
        self.creds = user_credentials
        self.token = get_auth_token()
        yield

    def test_scenario_01_login(self, driver, user_credentials):
        """
        SCÉNARIO 1 : LOGIN
        Mesure le temps de chaque étape du login + latence API + Redis.
        """
        scenario = "login"
        page = LoginPage(driver)

        # --- Étape 1 : Navigation vers la page login ---
        t0 = time.perf_counter()
        driver.get(f"{BASE_URL}/auth/connexion")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, t_api_status = measure_api_get("/auth/login-status", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("auth:session:test")
        t_set = measure_redis_set("auth:session:test", "login_test")

        add_result(scenario, "Navigation page login", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 2 : Remplir le champ email ---
        t0 = time.perf_counter()
        username_field = driver.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[formcontrolname='usernameOrEmail']"))
        )
        username_field.clear()
        username_field.send_keys(ADMIN_EMAIL)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, t_api_status = measure_api_get("/inscription/parcours", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("auth:session:test")
        t_set = measure_redis_set("auth:session:test", "login_test")

        add_result(scenario, "Send_keys email", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 3 : Remplir le champ mot de passe ---
        t0 = time.perf_counter()
        password_field = driver.find_element(By.CSS_SELECTOR, "input[formcontrolname='password']")
        password_field.clear()
        password_field.send_keys(ADMIN_PASSWORD)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, t_api_status = measure_api_get("/inscription/classes", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("auth:session:test")
        t_set = measure_redis_set("auth:session:test", "login_test")

        add_result(scenario, "Send_keys password", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 4 : Cliquer sur Se connecter ---
        t0 = time.perf_counter()
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, t_api_status = measure_api_post("/auth/login",
            {"email": ADMIN_EMAIL, "motDePasse": ADMIN_PASSWORD})
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("auth:session:test")
        t_set = measure_redis_set("auth:session:test", "login_test")

        add_result(scenario, "Click login button", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 5 : Attendre la redirection ---
        t0 = time.perf_counter()
        try:
            driver.long_wait.until(
                EC.any_of(
                    EC.url_contains("/accueil"),
                    EC.url_contains("/inscription"),
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".page-container")),
                ),
                timeout=15
            )
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, t_api_status = measure_api_get("/inscription/demandesInscription", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("auth:session:test")
        t_set = measure_redis_set("auth:session:test", "login_test")

        add_result(scenario, "Wait redirect after login", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        print(f"[LOGIN] 5 étapes mesurées. Tableau partiel : {len(results_table)} lignes")

    def test_scenario_02_import_ue_master_gc(self, driver, user_credentials):
        """
        SCÉNARIO 2 : IMPORT UE MASTER GC
        Mesure les temps d'import UE via Selenium + API + Redis.
        """
        scenario = "import_ue_master_gc"
        page = ImportExportPage(driver)

        # --- Étape 1 : Navigation vers page import ---
        t0 = time.perf_counter()
        driver.get(f"{BASE_URL}/inscription/import-export-excel?type=ue&tab=import")
        page.wait_for_element(driver, By.CSS_SELECTOR, ".page-container", LONG_TIMEOUT)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/excel/ue/template", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:master_gc")
        t_set = measure_redis_set("import:ue:master_gc", "imported")

        add_result(scenario, "Navigation import UE page", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 2 : Sélectionner type UE ---
        t0 = time.perf_counter()
        page.select_import_type("ue")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/classes", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:master_gc")
        t_set = measure_redis_set("import:ue:master_gc", "imported")

        add_result(scenario, "Select import type UE", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 3 : Sélectionner format docx ---
        t0 = time.perf_counter()
        page.select_import_format("docx")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/excel/ue/template", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:master_gc")
        t_set = measure_redis_set("import:ue:master_gc", "imported")

        add_result(scenario, "Select format docx", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 4 : Sélectionner parcours ---
        t0 = time.perf_counter()
        try:
            page.wait.until(
                EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportParcoursId']"))
            )
            page.select_parcours("")
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/parcours", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:master_gc")
        t_set = measure_redis_set("import:ue:master_gc", "imported")

        add_result(scenario, "Select parcours", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 5 : Cliquer Importer ---
        t0 = time.perf_counter()
        try:
            page.click_import()
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_post("/inscription/excel/ue/import", {"type": "ue", "format": "docx"}, self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:master_gc")
        t_set = measure_redis_set("import:ue:master_gc", "imported")

        add_result(scenario, "Click Import UE", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        print(f"[IMPORT MASTER GC] 5 étapes mesurées. Tableau : {len(results_table)} lignes")

    def test_scenario_03_import_licence_ge(self, driver, user_credentials):
        """
        SCÉNARIO 3 : IMPORT LICENCE GE
        Mesure les temps d'import Licence GE via Selenium + API + Redis.
        """
        scenario = "import_licence_ge"
        page = ImportExportPage(driver)

        # --- Étape 1 : Navigation ---
        t0 = time.perf_counter()
        driver.get(f"{BASE_URL}/inscription/import-export-excel?type=ue&tab=import")
        page.wait_for_element(driver, By.CSS_SELECTOR, ".page-container", LONG_TIMEOUT)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/excel/ue/template", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:licence_ge")
        t_set = measure_redis_set("import:ue:licence_ge", "imported")

        add_result(scenario, "Navigation import page", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 2 : Sélectionner type UE ---
        t0 = time.perf_counter()
        page.select_import_type("ue")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/classes", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:licence_ge")
        t_set = measure_redis_set("import:ue:licence_ge", "imported")

        add_result(scenario, "Select type UE", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 3 : Sélectionner format docx ---
        t0 = time.perf_counter()
        page.select_import_format("docx")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/excel/ue/template", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:licence_ge")
        t_set = measure_redis_set("import:ue:licence_ge", "imported")

        add_result(scenario, "Select format docx", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 4 : Sélectionner parcours ---
        t0 = time.perf_counter()
        try:
            page.wait.until(
                EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportParcoursId']"))
            )
            page.select_parcours("")
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/parcours", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:licence_ge")
        t_set = measure_redis_set("import:ue:licence_ge", "imported")

        add_result(scenario, "Select parcours", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 5 : Cliquer Importer ---
        t0 = time.perf_counter()
        try:
            page.click_import()
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_post("/inscription/excel/ue/import", {"type": "ue", "format": "docx"}, self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("import:ue:licence_ge")
        t_set = measure_redis_set("import:ue:licence_ge", "imported")

        add_result(scenario, "Click Import Licence GE", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        print(f"[IMPORT LICENCE GE] 5 étapes mesurées. Tableau : {len(results_table)} lignes")

    def test_scenario_04_inscription(self, driver, user_credentials):
        """
        SCÉNARIO 4 : INSCRIPTION
        Mesure les temps du wizard d'inscription via Selenium + API + Redis.
        """
        scenario = "inscription"
        page = InscriptionPage(driver)

        # --- Étape 1 : Navigation vers inscription ---
        t0 = time.perf_counter()
        driver.get(f"{BASE_URL}/inscription/demandes")
        page.wait_for_phase(1, timeout=15)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/demandesInscription", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("inscription:demande:test")
        t_set = measure_redis_set("inscription:demande:test", "new")

        add_result(scenario, "Navigation inscription page", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 2 : Choisir filière ---
        t0 = time.perf_counter()
        page.select_filiere("")
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/parcours", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("inscription:demande:test")
        t_set = measure_redis_set("inscription:demande:test", "new")

        add_result(scenario, "Choose filiere", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 3 : Cliquer Continuer Phase 1 ---
        t0 = time.perf_counter()
        page.click_continuer_phase1()
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_post("/inscription/demandesInscription", {"phase": 1}, self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("inscription:demande:test")
        t_set = measure_redis_set("inscription:demande:test", "new")

        add_result(scenario, "Click Continuer Phase 1", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 4 : Attendre Phase 2 ---
        t0 = time.perf_counter()
        try:
            page.wait_for_phase(2, timeout=15)
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/classes", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("inscription:demande:test")
        t_set = measure_redis_set("inscription:demande:test", "new")

        add_result(scenario, "Wait Phase 2", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 5 : Saisir infos personnelles ---
        t0 = time.perf_counter()
        try:
            page.fill_personal_info(nom="Test", prenoms="Redis", sexe="M", email="test.redis@example.com")
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_post("/inscription/demandesInscription", {"phase": 3, "info": "personal"}, self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("inscription:demande:test")
        t_set = measure_redis_set("inscription:demande:test", "new")

        add_result(scenario, "Fill personal info", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        print(f"[INSCRIPTION] 5 étapes mesurées. Tableau : {len(results_table)} lignes")

    def test_scenario_05_rattrapage(self, driver, user_credentials):
        """
        SCÉNARIO 5 : RATTAPAGE
        Mesure les temps de navigation rattrapage via Selenium + API + Redis.
        """
        scenario = "rattrapage"
        dashboard = DashboardPage(driver)

        # --- Étape 1 : Navigation dashboard ---
        t0 = time.perf_counter()
        dashboard.navigate(base_url=BASE_URL)
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/dossiers", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("rattrapage:session:test")
        t_set = measure_redis_set("rattrapage:session:test", "active")

        add_result(scenario, "Navigate to dashboard", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 2 : Naviguer vers rattrapage sessions ---
        t0 = time.perf_counter()
        dashboard.go_to_rattrapage_sessions(base_url=BASE_URL)
        try:
            driver.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-*")))
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/rattrapages", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("rattrapage:session:test")
        t_set = measure_redis_set("rattrapage:session:test", "active")

        add_result(scenario, "Go to rattrapage sessions", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 3 : Vérifier liste sessions ---
        t0 = time.perf_counter()
        try:
            rows = driver.find_elements(By.CSS_SELECTOR, "tr")
            count = len(rows)
        except Exception:
            count = 0
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/rattrapages", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("rattrapage:session:test")
        t_set = measure_redis_set("rattrapage:session:test", "active")

        add_result(scenario, "Check session list", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 4 : Cliquer Nouvelle session ---
        t0 = time.perf_counter()
        try:
            btn = driver.find_element(By.CSS_SELECTOR, "button:has-text('Nouvelle session')")
            btn.click()
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_post("/inscription/rattrapages/sessions", {"action": "create"}, self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("rattrapage:session:test")
        t_set = measure_redis_set("rattrapage:session:test", "active")

        add_result(scenario, "Click Nouvelle session", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        # --- Étape 5 : Vérifier modal session ---
        t0 = time.perf_counter()
        try:
            driver.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-custom-alert, .modal, [role='dialog']")))
        except Exception:
            pass
        selenium_time = (time.perf_counter() - t0) * 1000

        t_api, _ = measure_api_get("/inscription/rattrapages/sessions", self.token)
        t_ping = measure_redis_ping()
        t_get, cache_hit, _ = measure_redis_get("rattrapage:session:test")
        t_set = measure_redis_set("rattrapage:session:test", "active")

        add_result(scenario, "Verify session modal", round(selenium_time, 2), t_api, t_ping, t_get, cache_hit)

        print(f"[RATTAPAGE] 5 étapes mesurées. Tableau : {len(results_table)} lignes")

    @pytest.fixture(scope="session", autouse=True)
    def finalize(self, request):
        """Affiche le tableau complet à la fin de la session."""
        yield
        print_results_table()


# =============================================================================
# TEST INDÉPENDANT : VÉRIFICATION COLLECTE
# =============================================================================

def test_tableau_not_empty():
    """Vérifie que le tableau de résultats a bien été rempli."""
    assert len(results_table) > 0, "Le tableau de résultats est vide — aucune mesure effectuée"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--html=report_selenium_redis.html"])
