"""
conftest.py — Fixtures pytest pour la suite Selenium EasyEcole V4

Configure le driver Chrome, l'URL de base, et helpers de connexion.
Chaque test utilise le driver comme fixture (scope=function par défaut).
Capture d'écran automatique en cas d'échec.
"""

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL = os.environ.get("BASE_URL", "http://localhost:4200")
"""URL du frontend Angular EasyEcole."""

API_BASE = os.environ.get("API_BASE", "http://localhost:3000/api/v1")
"""URL du backend Express."""

SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
"""Répertoire de sauvegarde des captures d'écran d'échec."""

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Délais d'attente globaux
DEFAULT_TIMEOUT = 20  # secondes
LONG_TIMEOUT = 60    # secondes pour les imports lents


# =============================================================================
# FIXTURE : driver Chrome
# =============================================================================

@pytest.fixture(scope="function")
def driver(request):
    """
    Fixture principale : lance Chrome pour chaque test.
    - headless si la variable d'environnement HEADLESS=1
    - Capture d'écran automatique en cas d'échec
    - Fermeture propre après le test
    """
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--allow-insecure-localhost")

    # Mode headless si demandé (utile pour les CI)
    if os.environ.get("HEADLESS", "0") == "1":
        chrome_options.add_argument("--headless")

    # Auto-gestion du chromedriver via webdriver-manager
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # Timeout implicite
    driver.implicitly_wait(DEFAULT_TIMEOUT)

    # Injecter l'objet wait dans le driver pour les helpers
    driver.wait = WebDriverWait(driver, DEFAULT_TIMEOUT)
    driver.long_wait = WebDriverWait(driver, LONG_TIMEOUT)

    yield driver

    # --- Teardown : capture d'écran en cas d'échec + fermeture ---
    if request.session.testsfailed:
        _take_screenshot(driver, request)

    driver.quit()


# =============================================================================
# FIXTURE : user_credentials (identifiants de connexion)
# =============================================================================

@pytest.fixture(scope="session")
def user_credentials():
    """
    Identifiants de test pour la démo.
    Source : D:\\EasyEcole\\COMPTES.md
    Compte admin : identifiant 'admin' / email 'tepitechbuild@gmail.com' / mot de passe 'Admin@2026!'
    """
    return {
        "email": "tepitechbuild@gmail.com",
        "username": "admin",
        "password": "Admin@2026!",
    }


# =============================================================================
# FIXTURE : authenticated_driver (login automatique avant les tests)
# =============================================================================

@pytest.fixture(scope="function")
def authenticated_driver(driver, user_credentials):
    """
    Fixture qui connecte automatiquement le driver avant le test.
    Se déconnecte après le test (reset de session).
    """
    login(driver, user_credentials["email"], user_credentials["password"])
    yield driver
    # Teardown : retourner sur la page de login pour reset la session
    try:
        driver.get(f"{BASE_URL}/auth/connexion")
        time.sleep(2)
    except Exception:
        pass


# =============================================================================
# HELPERS — Authentification
# =============================================================================

def login(driver, email_or_username, password):
    """
    Effectue la connexion via l'interface Angular.
    Remplit le formulaire de connexion et clique sur 'Se connecter'.
    """
    driver.get(f"{BASE_URL}/auth/connexion")

    # Champ email/nom d'utilisateur (formControlName="usernameOrEmail")
    username_field = driver.wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[formcontrolname='usernameOrEmail']"))
    )
    username_field.clear()
    username_field.send_keys(email_or_username)

    # Champ mot de passe (formControlName="password")
    password_field = driver.find_element(By.CSS_SELECTOR, "input[formcontrolname='password']")
    password_field.clear()
    password_field.send_keys(password)

    # Bouton "Se connecter" (type="submit" dans le form)
    login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    login_button.click()

    # Attendre la redirection après connexion (vérifier que la page d'accueil ou le dashboard s'affiche)
    try:
        driver.long_wait.until(
            EC.any_of(
                EC.url_contains("/accueil"),
                EC.url_contains("/inscription"),
                EC.presence_of_element_located((By.CSS_SELECTOR, ".page-container")),
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-header-title"))
            )
        )
    except Exception:
        # Si la redirection ne se fait pas, on vérifie qu'il n'y a pas d'erreur affichée
        pass


def login_via_api(driver, email, password):
    """
    Connexion via l'API backend (POST /api/v1/auth/login).
    Stocke le token JWT dans le localStorage du navigateur.
    Utile pour contourner l'OTP en environnement dev.
    """
    import urllib.request
    import json

    payload = {"email": email, "motDePasse": password}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/auth/login",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            token = body.get("token") or body.get("accessToken") or body.get("data", {}).get("token")
            if token:
                driver.get(f"{BASE_URL}/auth/connexion")
                driver.execute_script(
                    f"localStorage.setItem('_token', arguments[0]);",
                    token
                )
                return token
    except Exception as e:
        print(f"[INFO] Login API échoué ({e}), fallback vers login UI")
    return None


# =============================================================================
# HELPERS — Attentes et recherche d'éléments
# =============================================================================

def wait_for_element(driver, by, value, timeout=DEFAULT_TIMEOUT):
    """Attend la présence d'un élément."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_for_clickable(driver, by, value, timeout=DEFAULT_TIMEOUT):
    """Attend qu'un élément soit cliquable."""
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def wait_for_text(driver, by, value, text, timeout=DEFAULT_TIMEOUT):
    """Attend qu'un élément contienne un texte spécifique."""
    return WebDriverWait(driver, timeout).until(
        EC.text_to_be_present_in_element((by, value), text)
    )


def wait_for_success_message(driver, timeout=DEFAULT_TIMEOUT):
    """Attend l'apparition d'un message de succès."""
    return wait_for_element(driver, By.CSS_SELECTOR, ".successMessage, [class*='success'], .alert-success", timeout)


# =============================================================================
# HELPERS — Capture d'écran
# =============================================================================

def _take_screenshot(driver, request):
    """Capture d'écran en cas d'échec du test."""
    test_name = request.node.name.replace("/", "_").replace(" ", "_")
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"{test_name}_{timestamp}.png"
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    try:
        driver.save_screenshot(filepath)
        print(f"\n[SCREENSHOT] Échec de '{test_name}' → {filepath}")
    except Exception as e:
        print(f"\n[SCREENSHOT] Impossible de sauvegarder : {e}")


def take_screenshot(driver, name):
    """Capture d'écran manuelle avec un nom donné."""
    filepath = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    driver.save_screenshot(filepath)
    print(f"[SCREENSHOT] {filepath}")
    return filepath


# =============================================================================
# HELPERS — Navigation
# =============================================================================

def navigate_to_import_export(driver, import_type="ue", tab="import", format_type="docx"):
    """
    Navigue vers la page d'import/export avec les paramètres de requête.
    URL : /inscription/import-export-excel?type=ue&tab=import
    """
    url = f"{BASE_URL}/inscription/import-export-excel?type={import_type}&tab={tab}"
    driver.get(url)
    # Attendre que la page se charge
    wait_for_element(driver, By.CSS_SELECTOR, ".page-container", LONG_TIMEOUT)
    print(f"[NAVIGATION] Page chargée : {url}")
