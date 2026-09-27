"""
reinscription_page.py — Page Object pour le wizard de réinscription.

Pages couvertes :
- /inscription/reinscription/wizard  (reinscription-wizard-page)
  Étape 1 : vérification éligibilité
  Étape 2 : documents à fournir
  Étape 3 : bordereau de paiement
  Étape 4 : récapitulatif & confirmation
  Étape 5 : suivi du dossier

Sélecteurs basés sur reinscription-wizard-page.component.html

Usage :
    from pages.reinscription_page import ReinscriptionPage
    page = ReinscriptionPage(driver)
    page.navigate()
    page.start_reinscription()
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select

# =============================================================================
# SÉLECTEURS — Basés sur reinscription-wizard-page.component.html
# =============================================================================

# Conteneur
SELECTOR_REINSCRIPTION_WIZARD = ".reinscription-wizard"
SELECTOR_WIZARD_HEADER = ".wizard-header"
SELECTOR_WIZARD_PROGRESS = ".wizard-progress"
SELECTOR_PROGRESS_LABELS = ".progress-labels span"
SELECTOR_PROGRESS_FILL = ".progress-fill"

# Étape 1 — Vérification / Bienvenue
SELECTOR_WELCOME_CARD = ".welcome-card"
SELECTOR_EMPTY_STATE = ".empty-state"
SELECTOR_INFO_GRID = ".infos-grid"
SELECTOR_INFO_ITEM = ".info-item"
SELECTOR_INFO_LABEL = ".label"
SELECTOR_INFO_VALUE = ".value"
SELECTOR_MATRICULE = ".info-item:has(.label:has-text('Matricule')) .value"
SELECTOR_PARCOURS_LABEL = ".info-item:has(.label:has-text('Parcours')) .value"
SELECTOR_NIVEAU_LABEL = ".info-item:has(.label:has-text('Niveau')) .value"
SELECTOR_CLASSE_LABEL = ".info-item:has(.label:has-text('Classe')) .value"
SELECTOR_ANNEE_LABEL = ".info-item:has(.label:has-text('Année académique')) .value"
SELECTOR_SOLDE_DETTE = ".info-warning .value"
SELECTOR_SESSION_TARGET = ".session-target"
SELECTOR_NOTICE = ".notice"
SELECTOR_BTN_OCR = "button:has-text('Pré-remplir par OCR')"
SELECTOR_BTN_FAIRE_REINSCRIPTION = "button.btn-primary.btn-lg:has-text('Faire ma réinscription')"
SELECTOR_BTN_PREMIERE_INSCRIPTION = "button:has-text('Faire ma 1ère inscription')"

# Étape 2 — Documents
SELECTOR_DOC_LIST = ".doc-list"
SELECTOR_DOC_ITEM = ".doc-item"
SELECTOR_DOC_CHECK = ".doc-check"
SELECTOR_DOC_LIBELLE = ".doc-libelle"
SELECTOR_DOC_FILENAME = ".doc-filename"
SELECTOR_DOC_FILE_INPUT = "input[type='file']"
SELECTOR_STEP_ACTIONS = ".step-actions"
SELECTOR_BTN_SUIVANT_DOCUMENTS = "button.btn-primary:has-text('Suivant : Bordereau →')"
SELECTOR_BTN_RETOUR = "button.btn-outline:has-text('← Retour')"
SELECTOR_BTN_REINSCRIPTION = "button.btn-primary:has-text('Faire ma réinscription')"
SELECTOR_6_PIECES = "p:has-text('6 pièces')"

# Étape 3 — Bordereau
SELECTOR_BORDEREAU_BOX = ".bordereau-box"
SELECTOR_FORM_GRID = ".form-grid"
SELECTOR_INPUT_MONTANT = "input[type='number']"
SELECTOR_INPUT_REFERENCE = "input[type='text']"
SELECTOR_SELECT_MODALITE = "select[ngModel='modalite']"
SELECTOR_BTN_RECAP = "button.btn-primary:has-text('Récapitulatif →')"

# Étape 4 — Récapitulatif
SELECTOR_RECAP_SECTION = ".recap-section"
SELECTOR_RECAP_LIST = ".recap-list"
SELECTOR_RECAP_LIST_ITEM = ".recap-list li"
SELECTOR_BTN_CONFIRMER_SOUMISSION = "button.btn-primary.btn-lg:has-text('Confirmer la soumission')"

# Étape 5 — Suivi
SELECTOR_SUCCESS_BANNER = ".success-banner"
SELECTOR_PIPELINE_TIMELINE = ".pipeline-timeline"
SELECTOR_PIPELINE_STEP = ".pipeline-step"
SELECTOR_PLANIFICATIONS = ".recap-section:has(h3:has-text('Planification'))"
SELECTOR_PLANIFICATION_ITEM = ".recap-section ul li"
SELECTOR_BTN_NOUVELLE_REINSCRIPTION = "button:has-text('Nouvelle réinscription')"

# Messages
SELECTOR_SUCCESS_MESSAGE = ".alert-success"
SELECTOR_ERROR_MESSAGE = ".alert-error"
SELECTOR_LOADING = ".wizard-loader"

# =============================================================================
# CLASSES
# =============================================================================

class ReinscriptionPage:
    """Page Object pour le wizard de réinscription."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # -------------------------------------------------------------------------
    # Navigation
    # -------------------------------------------------------------------------

    def navigate(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de réinscription."""
        url = f"{base_url}/inscription/reinscription/wizard"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_REINSCRIPTION_WIZARD)))
        print(f"[REINSCRIPTION] Page de réinscription chargée : {url}")

    # -------------------------------------------------------------------------
    # Étape 1 — Vérification éligibilité
    # -------------------------------------------------------------------------

    def is_eligible(self) -> bool:
        """Vérifie que l'étudiant est éligible (déjà inscrit)."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_WELCOME_CARD)))
            return True
        except Exception:
            return False

    def is_not_eligible(self) -> bool:
        """Vérifie que l'étudiant n'est pas éligible (pas inscrit)."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_EMPTY_STATE)))
            return True
        except Exception:
            return False

    def get_matricule(self) -> str:
        """Récupère le matricule."""
        try:
            return self.wait.until(EC.presence_of_element_located(
                (By.CSS_SELECTOR, SELECTOR_MATRICULE)
            )).text.strip()
        except Exception:
            return ""

    def get_parcours(self) -> str:
        """Récupère le parcours."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_PARCOURS_LABEL)
            return el.text.strip()
        except Exception:
            return ""

    def get_niveau(self) -> str:
        """Récupère le niveau."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_NIVEAU_LABEL)
            return el.text.strip()
        except Exception:
            return ""

    def get_classe(self) -> str:
        """Récupère la classe."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_CLASSE_LABEL)
            return el.text.strip()
        except Exception:
            return ""

    def get_annee_academique(self) -> str:
        """Récupère l'année académique."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ANNEE_LABEL)
            return el.text.strip()
        except Exception:
            return ""

    def get_solde_dette(self) -> str:
        """Récupère le solde de la dette."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SOLDE_DETTE)
            return el.text.strip()
        except Exception:
            return ""

    def get_session_cible(self) -> str:
        """Récupère la session cible."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SESSION_TARGET)
            return el.text.strip()
        except Exception:
            return ""

    def is_not_inscribed(self) -> bool:
        """Vérifie le message 'pas encore inscrit'."""
        try:
            el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_EMPTY_STATE)))
            return "pas encore inscrit" in el.text.lower()
        except Exception:
            return False

    def click_preremplir_ocr(self):
        """Clique sur 'Pré-remplir par OCR'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_OCR))).click()
        print("[REINSCRIPTION] OCR pré-remplissage lancé.")

    def click_faire_reinscription(self):
        """Lance la réinscription (Étape 1 → Étape 2)."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_FAIRE_REINSCRIPTION))).click()
        print("[REINSCRIPTION] Réinscription lancée → Étape 2.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".step-documents")))

    def click_premiere_inscription(self):
        """Clique sur 'Faire ma 1ère inscription'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_PREMIERE_INSCRIPTION))).click()
        print("[REINSCRIPTION] Redirection vers la 1ère inscription.")

    # -------------------------------------------------------------------------
    # Étape 2 — Documents
    # -------------------------------------------------------------------------

    def get_documents_requis(self) -> list:
        """Récupère la liste des documents requis."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_ITEM)
        docs = []
        for el in elements:
            libelle = el.find_element(By.CSS_SELECTOR, SELECTOR_DOC_LIBELLE).text
            filename = el.find_element(By.CSS_SELECTOR, SELECTOR_DOC_FILENAME)
            try:
                fname = filename.text.strip()
            except Exception:
                fname = ""
            docs.append({"libelle": libelle, "fichier": fname})
        return docs

    def get_documents_count(self) -> int:
        """Récupère le nombre de documents requis."""
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_ITEM))

    def get_document_check(self, index: int) -> str:
        """Récupère l'état de la coche d'un document (✓ ou ○)."""
        items = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_ITEM)
        if index < len(items):
            check = items[index].find_element(By.CSS_SELECTOR, SELECTOR_DOC_CHECK)
            return check.text.strip()
        return ""

    def upload_document(self, file_path: str, index: int = 0):
        """Upload un document."""
        file_inputs = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_FILE_INPUT)
        if index < len(file_inputs):
            file_inputs[index].clear()
            file_inputs[index].send_keys(file_path)
            print(f"[REINSCRIPTION] Document uploadé (index {index}) : {file_path}")
        else:
            raise Exception(f"Document index {index} introuvable")

    def get_uploaded_filename(self, index: int = 0) -> str:
        """Récupère le nom du fichier uploadé."""
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_FILENAME)
            if index < len(elements):
                return elements[index].text.strip()
        except Exception:
            pass
        return ""

    def click_suivant_documents(self):
        """Passe à l'étape suivante (Étape 2 → Étape 3)."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_SUIVANT_DOCUMENTS))).click()
        print("[REINSCRIPTION] Étape 2 → Étape 3 (Bordereau).")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".step-bordereau")))

    # -------------------------------------------------------------------------
    # Étape 3 — Bordereau
    # -------------------------------------------------------------------------

    def has_bordereau_file(self) -> bool:
        """Vérifie si un bordereau est attaché."""
        try:
            box = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_BORDEREAU_BOX)
            return "has-file" in box.get_attribute("class")
        except Exception:
            return False

    def set_montant(self, montant: str):
        """Saisit le montant."""
        input_el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_INPUT_MONTANT)))
        input_el.clear()
        input_el.send_keys(montant)
        print(f"[REINSCRIPTION] Montant : {montant}")

    def set_reference_bancaire(self, reference: str):
        """Saisit la référence bancaire."""
        input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_REFERENCE)
        input_el.clear()
        input_el.send_keys(reference)
        print(f"[REINSCRIPTION] Référence bancaire : {reference}")

    def set_modalite(self, modalite: str):
        """Sélectionne la modalité de paiement."""
        select = Select(self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_MODALITE))
        select.select_by_value(modalite)
        print(f"[REINSCRIPTION] Modalité : {modalite}")

    def click_recapitulatif(self):
        """Va au récapitulatif (Étape 3 → Étape 4)."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_RECAP))).click()
        print("[REINSCRIPTION] → Récapitulatif (Étape 4).")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".step-recap")))

    # -------------------------------------------------------------------------
    # Étape 4 — Récapitulatif & Confirmation
    # -------------------------------------------------------------------------

    def get_recap_parcours(self) -> str:
        """Récupère le résumé du parcours."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, f"{SELECTOR_RECAP_SECTION} p strong:first-child")
            return el.text.strip()
        except Exception:
            return ""

    def get_documents_recap_list(self) -> list:
        """Récupère la liste des documents dans le récapitulatif."""
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, f"{SELECTOR_RECAP_SECTION} ul li")
            return [el.text.strip() for el in elements]
        except Exception:
            return []

    def get_bordereau_recap(self) -> str:
        """Récupère le résumé du bordereau."""
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, f"{SELECTOR_RECAP_SECTION}:nth-child(3) ul li")
            return elements[0].text.strip() if elements else ""
        except Exception:
            return ""

    def click_confirmer_soumission(self):
        """Confirme la soumission du dossier de réinscription."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_CONFIRMER_SOUMISSION))).click()
        print("[REINSCRIPTION] Soumission confirmée → Étape 5.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".step-suivi")))

    # -------------------------------------------------------------------------
    # Étape 5 — Suivi
    # -------------------------------------------------------------------------

    def is_submission_successful(self) -> bool:
        """Vérifie que le dossier a été soumis avec succès."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SUCCESS_BANNER)))
            return "soumis avec succès" in self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SUCCESS_BANNER).text.lower()
        except Exception:
            return False

    def get_pipeline_status(self) -> list:
        """Récupère les étapes du pipeline."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_PIPELINE_STEP)
        return [el.text.strip() for el in elements]

    def get_planifications(self) -> list:
        """Récupère les planifications de réinscription."""
        items = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_PLANIFICATION_ITEM)
        return [item.text.strip() for item in items]

    def click_nouvelle_reinscription(self):
        """Clique sur 'Nouvelle réinscription'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_NOUVELLE_REINSCRIPTION))).click()
        print("[REINSCRIPTION] Nouvelle réinscription lancée.")

    # -------------------------------------------------------------------------
    # Progression
    # -------------------------------------------------------------------------

    def get_current_step(self) -> int:
        """Détecte l'étape actuelle du wizard."""
        labels = {
            "Ma réinscription": 1,
            "Documents": 2,
            "Bordereau": 3,
            "Récapitulatif": 4,
            "Suivi": 5,
        }
        for label, step in labels.items():
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, f".progress-labels span:has-text('{label}')")
                if "active" in el.get_attribute("class"):
                    return step
            except Exception:
                continue
        return 0

    def get_progress_width(self) -> int:
        """Récupère la largeur de la barre de progression."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_PROGRESS_FILL)
            style = el.get_attribute("style")
            # Extraire le pourcentage
            import re
            match = re.search(r'width:\s*([\d.]+)%', style)
            return float(match.group(1)) if match else 0
        except Exception:
            return 0

    # -------------------------------------------------------------------------
    # Messages / Erreurs
    # -------------------------------------------------------------------------

    def get_error_message(self) -> str:
        """Récupère le message d'erreur."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ERROR_MESSAGE)
            return el.text.strip()
        except Exception:
            return ""

    def get_success_message(self) -> str:
        """Récupère le message de succès."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SUCCESS_MESSAGE)
            return el.text.strip()
        except Exception:
            return ""

    def has_error(self) -> bool:
        """Vérifie qu'un message d'erreur est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_ERROR_MESSAGE)))
            return True
        except Exception:
            return False

    def is_wizard_displayed(self) -> bool:
        """Vérifie que le wizard de réinscription est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_REINSCRIPTION_WIZARD)))
            return True
        except Exception:
            return False

    def is_loading(self) -> bool:
        """Vérifie si le wizard est en cours de chargement."""
        try:
            return self.driver.find_element(By.CSS_SELECTOR, SELECTOR_LOADING).is_displayed()
        except Exception:
            return False
