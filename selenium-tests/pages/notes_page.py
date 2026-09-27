"""
notes_page.py — Page Object pour les pages de notes, bordereaux et validation.

Pages couvertes :
- /inscription/bordereaux  (bordereaux-page) — Upload bordereaux, historique, recherche
- /inscription/validation-bordereaux  (validation-bordereaux-page) — Validation cabinet comptable
- /inscription/finance/types-bordereaux  (types-bordereaux-page) — Types d'opérations
- /inscription/paiements  (paiements-page) — Paiements et échéancier

Sélecteurs basés sur les templates HTML des composants

Usage :
    from pages.notes_page import NotesPage
    page = NotesPage(driver)
    page.navigate_to_bordereaux()
    page.upload_bordereau()
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select
import re

# =============================================================================
# SÉLECTEURS — Bordereaux (bordereaux-page)
# =============================================================================

SELECTOR_BORDEREAUX_PAGE = "app-bordereaux-page"
SELECTOR_HEADER = "app-header-title[title='Mes bordereaux']"
SELECTOR_UPLOAD_BOUTON = "app-custom-button[text='Uploader un bordereau']"
SELECTOR_SEARCH_INPUT = "input[ngModel='searchTerm']"
SELECTOR_STATUS_SELECT = "select[ngModel='selectedStatus']"
SELECTOR_BORDEREAUX_TABLE = "table"
SELECTOR_BORDEREAU_ROW = "tbody tr"
SELECTOR_BORDEREAU_REFERENCE = "td:has-text('Référence')"
SELECTOR_BORDEREAU_FICHIER = "td:has-text('Fichier')"
SELECTOR_BORDEREAU_STATUT = "td:has-text('Statut')"
SELECTOR_BORDEREAU_MONTANT = "td:has-text('Montant')"
SELECTOR_BORDEREAU_DATE = "td:has-text('Date')"
SELECTOR_BORDEREAU_ACTION = "td:has-text('Action')"
SELECTOR_NO_BORDEREAUX = "td:has-text('Aucun bordereau uploadé')"

# =============================================================================
# SÉLECTEURS — Validation Bordereaux (validation-bordereaux-page)
# =============================================================================

SELECTOR_VALIDATION_PAGE = "app-validation-bordereaux-page"
SELECTOR_HEADER_VALIDATION = "app-header-title[title='Validation des bordereaux']"
SELECTOR_SUCCESS_MSG = ".bg-green-100"
SELECTOR_API_ERROR = ".bg-red-100"
SELECTOR_FILTER_SECTION = "div.bg-white.border.border-gray-200.rounded-lg.p-4"
SELECTOR_ANNEE_SELECT = "select[ngModel='selectedAnneeId']"
SELECTOR_NIVEAU_SELECT = "select[ngModel='selectedNiveauId']"
SELECTOR_PARCOURS_SELECT = "select[ngModel='selectedParcoursId']"
SELECTOR_FILTRES_ACTIONS = "button:has-text('Effacer les filtres')"
SELECTOR_BREADCRUMB = ".bg-gradient-to-r.from-blue-50.to-indigo-50"
SELECTOR_BORDEREAUX_LIST = "table"
SELECTOR_BORDEREAU_EN_COURS = ".bg-gray-50"

# =============================================================================
# SÉLECTEURS — Types Bordereaux (types-bordereaux-page)
# =============================================================================

SELECTOR_TYPES_PAGE = "app-types-bordereaux-page"
SELECTOR_HEADER_TYPES = "app-header-title[title='Types d\\'opérations']"
SELECTOR_NOUVEAU_BOUTON = "app-custom-button[text='Nouveau type']"
SELECTOR_TYPES_TABLE = "table"
SELECTOR_TYPE_ROW = "tbody tr"
SELECTOR_TYPE_CODE = "td:has-text('Code')"
SELECTOR_TYPE_LIBELLE = "td:has-text('Libellé')"
SELECTOR_TYPE_ACTIF = "td:has-text('Actif')"
SELECTOR_TYPE_ACTION = "td:has-text('Actions')"
SELECTOR_TYPES_MODAL = "app-custom-modal"
SELECTOR_INPUT_CODE = "input[formcontrolname='code']"
SELECTOR_INPUT_LIBELLE = "input[formcontrolname='libelle']"
SELECTOR_INPUT_ACTIF = "input[formcontrolname='actif']"
SELECTOR_ENREGISTRER_TYPE = "app-custom-button[type='submit']"
SELECTOR_ANNULER_TYPE = "app-custom-button[text='Annuler']"

# =============================================================================
# SÉLECTEURS — Paiements (paiements-page)
# =============================================================================

SELECTOR_PAIEMENTS_PAGE = "app-paiements-page"
SELECTOR_HEADER_PAIEMENTS = "app-header-title[title='Paiements']"
SELECTOR_ECHEANCIER_CARD = ".echeancier-card"
SELECTOR_ECHEANCIER_SUMMARY = ".echeancier-summary"
SELECTOR_TOTAL_RESTANT = ".echeancier-stat-value"
SELECTOR_PROCHAINE_ECHEANCE = ".echeancier-stat.highlight"
SELECTOR_ECHEANCIER_TABLE = ".echeancier-table"
SELECTOR_ECHEANCIER_ROW = ".echeancier-table tbody tr"
SELECTOR_PAYER_BOUTON = "button.payer-btn:has-text('Payer cette échéance')"
SELECTOR_NO_ECHEANCES = ".echeancier-empty"
SELECTOR_ECHEANCE_STATUT = "app-custom-badge"
SELECTOR_NOUVEAU_PAIEMENT_BOUTON = "app-custom-button[text='Nouveau paiement']"

# =============================================================================
# CLASSES
# =============================================================================

class NotesPage:
    """Page Object pour les pages de notes, bordereaux et validation."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # =====================================================================
    # BORDEREAUX
    # =====================================================================

    def navigate_to_bordereaux(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des bordereaux."""
        url = f"{base_url}/inscription/bordereaux"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_BORDEREAUX_PAGE)))
        print(f"[NOTES] Page bordereaux chargée : {url}")

    def click_upload_bordereau(self):
        """Clique sur le bouton 'Uploader un bordereau'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_UPLOAD_BOUTON))).click()
        print("[NOTES] Bouton 'Uploader un bordereau' cliqué.")

    def upload_bordereau_file(self, file_path: str):
        """Upload un fichier de bordereau via le système de fichiers."""
        # Attendre que le modal d'upload s'ouvre
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file'], app-custom-modal")))
        file_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='file']")
        if file_inputs:
            file_inputs[0].clear()
            file_inputs[0].send_keys(file_path)
            print(f"[NOTES] Bordereau uploadé : {file_path}")
        else:
            # Fallback: chercher dans le modal
            modal = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_TYPES_MODAL)
            inputs = modal.find_elements(By.CSS_SELECTOR, "input[type='file']")
            if inputs:
                inputs[0].send_keys(file_path)

    def search_bordereaux(self, search_term: str):
        """Recherche des bordereaux."""
        input_el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SEARCH_INPUT)))
        input_el.clear()
        input_el.send_keys(search_term)
        print(f"[NOTES] Recherche : '{search_term}'")

    def filter_by_status(self, status_value: str):
        """Filtre les bordereaux par statut."""
        select = Select(self.driver.find_element(By.CSS_SELECTOR, SELECTOR_STATUS_SELECT))
        select.select_by_value(status_value)
        print(f"[NOTES] Filtre statut : {status_value}")

    def get_bordereaux_count(self) -> int:
        """Récupère le nombre de bordereaux."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_BORDEREAUX_TABLE)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW))

    def get_bordereau_references(self) -> list:
        """Récupère les références bancaires des bordereaux."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW)
        refs = []
        for row in rows:
            try:
                cell = row.find_element(By.CSS_SELECTOR, "td:first-child")
                refs.append(cell.text.strip())
            except Exception:
                pass
        return refs

    def get_bordereau_statut(self, index: int = 0) -> str:
        """Récupère le statut d'un bordereau."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW)
            if index < len(rows):
                return rows[index].text.split("Statut")[-1].strip().split("\n")[0]
        except Exception:
            pass
        return ""

    def get_bordereau_montant(self, index: int = 0) -> str:
        """Récupère le montant d'un bordereau."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW)
            if index < len(rows):
                cell = rows[index].find_elements(By.CSS_SELECTOR, "td")
                for cell_el in cell:
                    if "FCFA" in cell_el.text or "XAF" in cell_el.text:
                        return cell_el.text.strip()
        except Exception:
            pass
        return ""

    def is_no_bordereaux(self) -> bool:
        """Vérifie qu'aucun bordereau n'est uploadé."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_NO_BORDEREAUX)))
            return True
        except Exception:
            return False

    def is_bordereau_displayed(self, reference_contains: str = "") -> bool:
        """Vérifie qu'un bordereau est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW)))
            if reference_contains:
                rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BORDEREAU_ROW)
                for row in rows:
                    if reference_contains in row.text:
                        return True
                return False
            return True
        except Exception:
            return False

    # =====================================================================
    # VALIDATION BORDEREAUX
    # =====================================================================

    def navigate_to_validation(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de validation des bordereaux."""
        url = f"{base_url}/inscription/validation-bordereaux"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_VALIDATION_PAGE)))
        print(f"[NOTES] Page validation bordereaux chargée : {url}")

    def select_annee(self, annee_id: str):
        """Sélectionne une année académique."""
        select = Select(self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_ANNEE_SELECT))))
        select.select_by_value(annee_id)
        print(f"[NOTES] Année sélectionnée : {annee_id}")

    def select_niveau(self, niveau_id: str):
        """Sélectionne un niveau d'étude."""
        select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_NIVEAU_SELECT)
        Select(select).select_by_value(niveau_id)
        print(f"[NOTES] Niveau sélectionné : {niveau_id}")

    def select_parcours(self, parcours_id: str):
        """Sélectionne un parcours."""
        select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_PARCOURS_SELECT)
        Select(select).select_by_value(parcours_id)
        print(f"[NOTES] Parcours sélectionné : {parcours_id}")

    def clear_filters(self):
        """Efface les filtres."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_FILTRES_ACTIONS))).click()
        print("[NOTES] Filtres effacés.")

    def get_breadcrumb_text(self) -> str:
        """Récupère le texte du fil d'Ariane."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_BREADCRUMB)
            return el.text.strip()
        except Exception:
            return ""

    def wait_for_validation_loaded(self, timeout=20):
        """Attend que la page de validation soit chargée."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_VALIDATION_PAGE)))
        print("[NOTES] Page validation chargée.")

    # =====================================================================
    # TYPES BORDEREAUX
    # =====================================================================

    def navigate_to_types(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des types de bordereaux."""
        url = f"{base_url}/inscription/finance/types-bordereaux"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TYPES_PAGE)))
        print(f"[NOTES] Page types bordereaux chargée : {url}")

    def click_nouveau_type(self):
        """Clique sur le bouton 'Nouveau type'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_NOUVEAU_BOUTON))).click()
        print("[NOTES] Bouton 'Nouveau type' cliqué.")

    def create_type(self, code: str, libelle: str):
        """Crée un nouveau type de bordereau."""
        input_code = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_INPUT_CODE)))
        input_code.clear()
        input_code.send_keys(code)

        input_libelle = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_LIBELLE)
        input_libelle.clear()
        input_libelle.send_keys(libelle)
        print(f"[NOTES] Type créé : code={code}, libellé={libelle}")

    def click_enregistrer_type(self):
        """Enregistre le type."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_ENREGISTRER_TYPE))).click()
        print("[NOTES] Type enregistré.")

    def click_annuler_type(self):
        """Annule la création du type."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_ANNULER_TYPE))).click()
        print("[NOTES] Annulation du type.")

    def get_types_count(self) -> int:
        """Récupère le nombre de types."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TYPES_TABLE)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TYPE_ROW))

    def get_type_codes(self) -> list:
        """Récupère les codes des types."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TYPE_ROW)
        return [row.find_element(By.CSS_SELECTOR, "td:first-child").text.strip() for row in rows]

    def get_type_libelles(self) -> list:
        """Récupère les libellés des types."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TYPE_ROW)
        return [row.find_element(By.CSS_SELECTOR, "td:nth-child(2)").text.strip() for row in rows]

    def toggle_type_active(self, index: int = 0):
        """Bascule l'état actif d'un type."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TYPE_ROW)
            if index < len(rows):
                rows[index].find_element(By.CSS_SELECTOR, "button").click()
                print("[NOTES] Type actif/inactif basculé.")
        except Exception:
            pass

    def is_type_displayed(self, code: str = "") -> bool:
        """Vérifie qu'un type est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TYPES_TABLE)))
            if code:
                rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TYPE_ROW)
                for row in rows:
                    if code in row.text:
                        return True
                return False
            return True
        except Exception:
            return False

    # =====================================================================
    # PAIEMENTS
    # =====================================================================

    def navigate_to_paiements(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des paiements."""
        url = f"{base_url}/inscription/paiements"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_PAIEMENTS_PAGE)))
        print(f"[NOTES] Page paiements chargée : {url}")

    def get_total_restant(self) -> str:
        """Récupère le total restant."""
        try:
            return self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TOTAL_RESTANT))).text.strip()
        except Exception:
            return ""

    def get_prochaine_echeance(self) -> str:
        """Récupère la prochaine échéance."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_PROCHAINE_ECHEANCE)
            return el.text.strip()
        except Exception:
            return ""

    def get_echeances_count(self) -> int:
        """Récupère le nombre d'échéances."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_ECHEANCIER_TABLE)))
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_ECHEANCIER_ROW))
        except Exception:
            return 0

    def get_echeance_info(self, index: int = 0) -> dict:
        """Récupère les informations d'une échéance."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_ECHEANCIER_ROW)
            if index < len(rows):
                row_text = rows[index].text
                parts = row_text.split("\n")
                return {"text": row_text.strip(), "parts": parts}
        except Exception:
            pass
        return {}

    def is_payer_button_visible(self) -> bool:
        """Vérifie que le bouton 'Payer' est visible."""
        try:
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_PAYER_BOUTON)) > 0
        except Exception:
            return False

    def click_payer_echeance(self):
        """Clique sur le bouton 'Payer cette échéance'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_PAYER_BOUTON))).click()
        print("[NOTES] Paiement d'échéance cliqué.")

    def is_no_echeances(self) -> bool:
        """Vérifie qu'il n'y a pas d'échéances."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_NO_ECHEANCES)))
            return True
        except Exception:
            return False

    def click_nouveau_paiement(self):
        """Clique sur 'Nouveau paiement'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_NOUVEAU_PAIEMENT_BOUTON))).click()
        print("[NOTES] Bouton 'Nouveau paiement' cliqué.")

    def wait_for_paiements_loaded(self, timeout=20):
        """Attend que la page des paiements soit chargée."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_PAIEMENTS_PAGE)))
        print("[NOTES] Page paiements chargée.")

    # =====================================================================
    # Messages / Erreurs
    # =====================================================================

    def get_success_message(self) -> str:
        """Récupère le message de succès."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SUCCESS_MSG)
            return el.text.strip()
        except Exception:
            return ""

    def get_error_message(self) -> str:
        """Récupère le message d'erreur."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_API_ERROR)
            return el.text.strip()
        except Exception:
            return ""

    # =====================================================================
    # Dashboard générique
    # =====================================================================

    def is_page_displayed(self, page_type: str = "bordereaux") -> bool:
        """Vérifie qu'une page de notes est affichée."""
        selectors = {
            "bordereaux": SELECTOR_BORDEREAUX_PAGE,
            "validation": SELECTOR_VALIDATION_PAGE,
            "types": SELECTOR_TYPES_PAGE,
            "paiements": SELECTOR_PAIEMENTS_PAGE,
        }
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selectors.get(page_type, SELECTOR_BORDEREAUX_PAGE))))
            return True
        except Exception:
            return False
