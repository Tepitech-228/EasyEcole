"""
dashboard_page.py — Page Object pour le dashboard / accueil EasyEcole V4.

Navigation principale depuis la page d'accueil :
- /inscription/demandes  (inscription)
- /inscription/reinscription/wizard  (réinscription)
- /inscription/rattrapage/sessions  (rattrapage)
- /inscription/bordereaux  (bordereaux/notes)
- /inscription/paiements  (paiements)
- /inscription/import-export-excel  (import/export)

Usage :
    from pages.dashboard_page import DashboardPage
    page = DashboardPage(driver)
    page.navigate()
    page.go_to_inscription()
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver

# =============================================================================
# SÉLECTEURS — Basés sur dashboard-page.component.html et base-layout
# =============================================================================

# Conteneur principal du dashboard
SELECTOR_DASHBOARD_CONTAINER = ".dashboard-surface"
SELECTOR_PAGE_CONTAINER = ".page-container"
SELECTOR_HEADER_TITLE = "app-header-title"

# Navigation sidebar / menu (dans base-layout)
SELECTOR_NAV_LINKS = "nav a, [class*='sidebar'] a, [class*='menu'] a"
SELECTOR_NAV_INSCRIPTION = "a[routerlink*='/inscription/demandes']"
SELECTOR_NAV_REINSCRIPTION = "a[routerlink*='/inscription/reinscription']"
SELECTOR_NAV_RATTAPAGE = "a[routerlink*='/inscription/rattrapage']"
SELECTOR_NAV_BORDEREAUX = "a[routerlink*='/inscription/bordereaux']"
SELECTOR_NAV_PAIEMENTS = "a[routerlink*='/inscription/paiements']"

# Cartes / statistiques du dashboard admin
SELECTOR_STAT_CARD = ".admin-overview-hero, [class*='stat-card'], [class*='dashboard-card']"
SELECTOR_STAT_NUMBER = ".text-2xl.font-bold, [class*='stat-number']"
SELECTOR_DASHBOARD_TITLE = "h1"

# Boutons d'action rapides
SELECTOR_BTN_NEW = "app-custom-button[text*='Nouveau'], button[class*='btn-primary']"
SELECTOR_WELCOME_TEXT = ".text-2xl, h1[class*='font-bold']"

# Messages de succès / erreur
SELECTOR_SUCCESS_MESSAGE = ".bg-green-100, .alert-success, [class*='bg-emerald-100']"
SELECTOR_ERROR_MESSAGE = ".bg-red-100, .alert-danger, [class*='bg-red-100']"
SELECTOR_ALERT = "app-custom-alert"

# Chargement
SELECTOR_LOADING_SPINNER = "app-loading-spinner, .spinner"

# =============================================================================
# URLS
# =============================================================================

URL_DASHBOARD = "/accueil"
URL_INSCRIPTION_DEMANDES = "/inscription/demandes"
URL_REINSCRIPTION_WIZARD = "/inscription/reinscription/wizard"
URL_REINSCRIPTION_PLANIFIER = "/inscription/reinscription/planifier"
URL_RATTAPAGE_SESSIONS = "/inscription/rattrapage/sessions"
URL_RATTAPAGE_COMITE = "/inscription/rattrapage/comite"
URL_RATTAPAGE_MES_DEMANDES = "/inscription/rattrapage/mes-demandes"
URL_RATTAPAGE_PAIEMENTS = "/inscription/rattrapage/paiements"
URL_BORDEREAUX = "/inscription/bordereaux"
URL_VALIDATION_BORDEREAUX = "/inscription/validation-bordereaux"
URL_TYPES_BORDEREAUX = "/inscription/finance/types-bordereaux"
URL_PAIEMENTS = "/inscription/paiements"
URL_IMPORT_EXPORT = "/inscription/import-export-excel"
URL_CLASSES = "/inscription/classes"
URL_MON_DOSSIER = "/inscription/mon-dossier"
URL_COMITE_VALIDATION = "/inscription/comite-validation"


class DashboardPage:
    """Page Object pour le dashboard / accueil d'EasyEcole."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # -------------------------------------------------------------------------
    # Navigation
    # -------------------------------------------------------------------------

    def navigate(self, base_url: str = "http://localhost:4200"):
        """Navigue vers le dashboard."""
        self.driver.get(f"{base_url}{URL_DASHBOARD}")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DASHBOARD_CONTAINER)))
        print("[DASHBOARD] Page d'accueil chargée.")

    def go_to_inscription(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des demandes d'inscription."""
        url = f"{base_url}{URL_INSCRIPTION_DEMANDES}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".wizard-page, .demandes-page, app-inscription-wizard-page")))
        print(f"[DASHBOARD] Page d'inscription chargée : {url}")

    def go_to_reinscription(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de réinscription."""
        url = f"{base_url}{URL_REINSCRIPTION_WIZARD}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".reinscription-wizard")))
        print(f"[DASHBOARD] Page de réinscription chargée : {url}")

    def go_to_rattrapage_sessions(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des sessions de rattrapage."""
        url = f"{base_url}{URL_RATTAPAGE_SESSIONS}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-rattrapage-sessions-page")))
        print(f"[DASHBOARD] Page rattrapage sessions chargée : {url}")

    def go_to_rattrapage_comite(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page du comité de rattrapage."""
        url = f"{base_url}{URL_RATTAPAGE_COMITE}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-rattrapage-comite-page")))
        print(f"[DASHBOARD] Page rattrapage comité chargée : {url}")

    def go_to_rattrapage_mes_demandes(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page mes demandes de rattrapage."""
        url = f"{base_url}{URL_RATTAPAGE_MES_DEMANDES}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-rattrapage-mes-demandes-page")))
        print(f"[DASHBOARD] Page mes demandes rattrapage chargée : {url}")

    def go_to_rattrapage_paiements(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page paiements rattrapage."""
        url = f"{base_url}{URL_RATTAPAGE_PAIEMENTS}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-rattrapage-paiements-page")))
        print(f"[DASHBOARD] Page rattrapage paiements chargée : {url}")

    def go_to_bulletins(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des bulletins."""
        url = f"{base_url}/bulletins"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-liste-bulletins-page")))
        print(f"[DASHBOARD] Page bulletins chargée : {url}")

    def go_to_bordereaux(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des bordereaux."""
        url = f"{base_url}{URL_BORDEREAUX}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-bordereaux-page")))
        print(f"[DASHBOARD] Page bordereaux chargée : {url}")

    def go_to_validation_bordereaux(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de validation des bordereaux."""
        url = f"{base_url}{URL_VALIDATION_BORDEREAUX}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-validation-bordereaux-page")))
        print(f"[DASHBOARD] Page validation bordereaux chargée : {url}")

    def go_to_types_bordereaux(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des types de bordereaux."""
        url = f"{base_url}{URL_TYPES_BORDEREAUX}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-types-bordereaux-page")))
        print(f"[DASHBOARD] Page types bordereaux chargée : {url}")

    def go_to_paiements(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des paiements."""
        url = f"{base_url}{URL_PAIEMENTS}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-paiements-page")))
        print(f"[DASHBOARD] Page paiements chargée : {url}")

    def go_to_import_export(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page d'import/export."""
        url = f"{base_url}{URL_IMPORT_EXPORT}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".page-container, app-import-export-excel-page")))
        print(f"[DASHBOARD] Page import/export chargée : {url}")

    def go_to_classes(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des classes."""
        url = f"{base_url}{URL_CLASSES}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-liste-classes-page")))
        print(f"[DASHBOARD] Page classes chargée : {url}")

    def go_to_comite_validation(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de validation du comité."""
        url = f"{base_url}{URL_COMITE_VALIDATION}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-comite-validation-page")))
        print(f"[DASHBOARD] Page comité validation chargée : {url}")

    # -------------------------------------------------------------------------
    # Éléments du dashboard
    # -------------------------------------------------------------------------

    def get_dashboard_title(self) -> str:
        """Récupère le titre du dashboard."""
        try:
            el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DASHBOARD_TITLE)))
            return el.text.strip()
        except Exception:
            return ""

    def get_welcome_text(self) -> str:
        """Récupère le texte de bienvenue."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_WELCOME_TEXT)
            return el.text.strip()
        except Exception:
            return ""

    def is_dashboard_displayed(self) -> bool:
        """Vérifie que le dashboard est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DASHBOARD_CONTAINER)))
            return True
        except Exception:
            return False

    def get_success_message(self) -> str:
        """Récupère le message de succès."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SUCCESS_MESSAGE)
            return el.text.strip()
        except Exception:
            return ""

    def get_error_message(self) -> str:
        """Récupère le message d'erreur."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ERROR_MESSAGE)
            return el.text.strip()
        except Exception:
            return ""

    def is_loading_visible(self) -> bool:
        """Vérifie si le spinner de chargement est visible."""
        try:
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LOADING_SPINNER)) > 0
        except Exception:
            return False

    def wait_for_dashboard_ready(self, timeout=20):
        """Attend que le dashboard soit complètement chargé."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DASHBOARD_CONTAINER)))
        # Attendre la disparition du spinner
        try:
            self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, SELECTOR_LOADING_SPINNER)))
        except Exception:
            pass
        print("[DASHBOARD] Dashboard prêt.")

    # -------------------------------------------------------------------------
    # Navigation par rôle (pour le dashboard admin)
    # -------------------------------------------------------------------------

    def get_admin_statistics(self) -> dict:
        """Récupère les statistiques du dashboard admin."""
        stats = {}
        try:
            cards = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_STAT_CARD)
            for i, card in enumerate(cards):
                numbers = card.find_elements(By.CSS_SELECTOR, SELECTOR_STAT_NUMBER)
                if numbers:
                    try:
                        stats[f"card_{i}"] = int(numbers[0].text.strip().replace(",", ""))
                    except ValueError:
                        stats[f"card_{i}"] = numbers[0].text.strip()
        except Exception:
            pass
        print(f"[DASHBOARD] Statistiques : {stats}")
        return stats

    def is_admin_dashboard(self) -> bool:
        """Vérifie si on est sur le dashboard admin."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".admin-command-center")))
            return True
        except Exception:
            return False

    def wait_for_demandes_loaded(self, timeout=20):
        """Attend que la page des demandes soit chargée."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".demandes-page, .hierarchy-layout")))
        print("[DASHBOARD] Page des demandes chargée.")

    def get_inscription_wizard_element(self, selector: str) -> bool:
        """Vérifie la présence d'un élément dans le wizard d'inscription."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
            return True
        except Exception:
            return False

    def get_wizard_step(self) -> int:
        """Récupère l'étape actuelle du wizard."""
        try:
            active_steps = self.driver.find_elements(By.CSS_SELECTOR, ".wizard-step, [class*='step']")
            for i, step in enumerate(active_steps):
                if step.is_displayed():
                    return i + 1
        except Exception:
            pass
        return 0
