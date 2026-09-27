"""
inscription_page.py — Page Object pour le wizard d'inscription (1ère inscription).

Pages couvertes :
- /inscription/demandes/:id  (inscription-wizard-page)
  Phase 1 : choix de la filière
  Phase 2 : choix de session + documents
  Phase 3 : informations personnelles
  Phase 4 : récapitulatif + soumission
  Phase 5 : statut de l'inscription

Sélecteurs basés sur inscription-wizard-page.component.html

Usage :
    from pages.inscription_page import InscriptionPage
    page = InscriptionPage(driver)
    page.navigate()
    page.select_filiere("...")
    page.submit_inscription()
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select

# =============================================================================
# SÉLECTEURS — Basés sur inscription-wizard-page.component.html
# =============================================================================

# Conteneur du wizard
SELECTOR_WIZARD_PAGE = ".wizard-page"
SELECTOR_WIZARD_HEADER = "header.wizard-header"
SELECTOR_WIZARD_STEPS = ".wizard-step"

# Phase 1 — Choix de la filière
SELECTOR_FILIERE_SELECT = "#filiereSelect"
SELECTOR_FILIERE_OPTION = "#filiereSelect option"
SELECTOR_FILIERE_BADGE = ".filiere-badge"
SELECTOR_FILIERE_CHOISIE = ".filiere-badge__icon"
SELECTOR_BTN_PHASE1 = "button.btn-primary:has-text('Continuer')"
SELECTOR_BTN_PHASE1_XPATH = "//button[contains(@class, 'btn-primary') and contains(., 'Continuer')]"

# Phase 2 — Session + documents
SELECTOR_SESSION_SELECT = "select.form-control.native-select"  # session dropdown
SELECTOR_SESSION_OPTION = "select.form-control.native-select option"
SELECTOR_DOCUMENTS_REQUIS = ".doc-row"
SELECTOR_DOC_LABEL = ".doc-label"
SELECTOR_DOC_FILE_INPUT = "input[type='file']"
SELECTOR_DOC_FILENAME = ".doc-filename"
SELECTOR_BTN_SOUMETTRE_PIECES = "//button[contains(., 'Soumettre les pièces')]"
SELECTOR_BTN_SOUMETTRE_PIECES_CSS = "button.btn-primary[disabled='false']:has-text('Soumettre les pièces')"

# Phase 3 — Informations personnelles
SELECTOR_FORM_GROUP = ".form-group"
SELECTOR_INPUT_NOM = "input[formControlName='nom'], input[ngModel]:nth-child(1)"  # Nom
SELECTOR_INPUT_PRENOMS = "input[formControlName='prenoms']"
SELECTOR_INPUT_SEXE = "select[formControlName='sexe']"
SELECTOR_INPUT_DATE_NAISSANCE = "input[type='date'][formControlName='dateNaissance']"
SELECTOR_INPUT_LIEU_NAISSANCE = "input[formControlName='lieuNaissance']"
SELECTOR_INPUT_NATIONALITE = "input[formControlName='nationalite']"
SELECTOR_INPUT_TYPE_PIECE = "select[formControlName='typePieceIdentite']"
SELECTOR_INPUT_NUMERO_PIECE = "input[formControlName='numeroPiece']"
SELECTOR_INPUT_CONTACT = "input[formControlName='contact']"
SELECTOR_INPUT_EMAIL = "input[formControlName='email']"
SELECTOR_INPUT_ADRESSE = "input[formControlName='adresse']"
SELECTOR_BTN_VALIDER_INFOS = "//button[contains(., 'Valider et continuer')]"
SELECTOR_BTN_VALIDER_INFOS_XPATH = SELECTOR_BTN_VALIDER_INFOS
SELECTOR_FORM_ROW = ".form-row"

# Phase 4 — Récapitulatif
SELECTOR_RECAP_TABLE = ".recap-table"
SELECTOR_RECAP_ROW = ".recap-table tbody tr"
SELECTOR_BTN_SOUMETTRE_DEMANDE = "//button[contains(., 'Soumettre la demande')]"
SELECTOR_BTN_SOUMETTRE_DEMANDE_XPATH = SELECTOR_BTN_SOUMETTRE_DEMANDE
SELECTOR_BTN_SOUMETTRE_DEMANDE_CSS = "button.btn-primary[disabled='false']:has-text('Soumettre la demande')"

# Phase 5 — Statut
SELECTOR_TIMELINE = ".timeline"
SELECTOR_TIMELINE_STEP = ".timeline-step"
SELECTOR_STATUS_ALERT = ".alert-success, .alert-warning, .alert-info"
SELECTOR_STATUT_EFFECTUEE = ".alert-success:has-text('Inscription effectuée')"
SELECTOR_STATUT_CORRECTION = ".alert-warning:has-text('Correction demandée')"
SELECTOR_STATUT_EN_ATTENTE = ".alert-info:has-text('en attente')"
SELECTOR_BTN_NOUVELLE_DEMANDE = "button:has-text('Nouvelle demande')"
SELECTOR_BTN_REINSCRIPTION = "a:has-text('Réinscription')"

# Messages
SELECTOR_ERROR_MESSAGE = ".alert-danger"
SELECTOR_SUCCESS_MESSAGE = ".alert-success"
SELECTOR_LOADING = ".loading-wrap"
SELECTOR_SPINNER = ".spinner"

# OCR Modal
SELECTOR_OCR_MODAL = ".ocr-modal-backdrop"
SELECTOR_OCR_PROGRESS = ".ocr-progress__bar"
SELECTOR_OCR_POURCENTAGE = ".ocr-pourcentage__valeur"
SELECTOR_OCR_CONTINUER = "button:has-text('Continuer')"

# Boutons generiques du wizard
SELECTOR_BTN_PRIMARY = "button.btn-primary"
SELECTOR_BTN_BACK = "button.btn-back"
SELECTOR_BTN_SECONDAIRE = "button.btn-secondary"

# =============================================================================
# CLASSES
# =============================================================================

class InscriptionPage:
    """Page Object pour le wizard d'inscription (1ère inscription)."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # -------------------------------------------------------------------------
    # Navigation
    # -------------------------------------------------------------------------

    def navigate(self, base_url: str = "http://localhost:4200", demande_id: str = ""):
        """Navigue vers la page d'inscription."""
        url = f"{base_url}/inscription/demandes"
        if demande_id:
            url += f"/{demande_id}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_WIZARD_PAGE)))
        print(f"[INSCRIPTION] Page d'inscription chargée : {url}")

    # -------------------------------------------------------------------------
    # Phase 1 — Choix de la filière
    # -------------------------------------------------------------------------

    def select_filiere(self, filiere_value: str):
        """Sélectionne une filière dans le dropdown (Phase 1)."""
        select = Select(self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_FILIERE_SELECT))))
        select.select_by_value(filiere_value)
        print(f"[INSCRIPTION] Filière sélectionnée : {filiere_value}")

    def get_filiere_options(self) -> list:
        """Récupère les options de filière disponibles."""
        select = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_FILIERE_SELECT)))
        options = Select(select)
        return [opt.text for opt in options.options]

    def is_filiere_selected(self) -> bool:
        """Vérifie qu'une filière est sélectionnée (badge visible)."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_FILIERE_BADGE)))
            return True
        except Exception:
            return False

    def click_continuer_phase1(self):
        """Clique sur 'Continuer' pour passer à la phase 2."""
        btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BTN_PHASE1_XPATH)))
        btn.click()
        print("[INSCRIPTION] Phase 1 → Phase 2 : Continuer cliqué.")
        # Attendre que la phase 2 se charge
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h2:has-text('Demande d\\'autorisation')")))

    # -------------------------------------------------------------------------
    # Phase 2 — Session + documents
    # -------------------------------------------------------------------------

    def select_session(self, session_index: int = 0):
        """Sélectionne une session dans le dropdown (Phase 2)."""
        selects = self.driver.find_elements(By.CSS_SELECTOR, "select.form-control.native-select")
        session_select = None
        for s in selects:
            if "session" in s.get_attribute("id").lower() or "Session" in s.get_attribute("placeholder", ""):
                session_select = s
                break
        if session_select is None and selects:
            session_select = selects[-1]  # La dernière select est souvent la session
        if session_select:
            select = Select(session_select)
            if session_index < len(select.options):
                select.select_by_index(session_index)
                print(f"[INSCRIPTION] Session sélectionnée (index {session_index}).")
        else:
            raise Exception("Select de session non trouvé")

    def upload_document(self, file_path: str, document_index: int = 0):
        """
        Upload un document pour l'étape 2.
        :param file_path: Chemin du fichier
        :param document_index: Index du document dans la liste (0 = premier)
        """
        # Trouver le input file correspondant au document
        file_inputs = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_FILE_INPUT)
        if document_index < len(file_inputs):
            file_input = file_inputs[document_index]
            file_input.clear()
            file_input.send_keys(file_path)
            print(f"[INSCRIPTION] Document uploadé : {file_path}")
        else:
            raise Exception(f"Document index {document_index} introuvable")

    def get_documents_requis(self) -> list:
        """Récupère la liste des documents requis."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOCUMENTS_REQUIS)
        docs = []
        for el in elements:
            label = el.find_element(By.CSS_SELECTOR, SELECTOR_DOC_LABEL).text
            docs.append(label)
        return docs

    def get_uploaded_filename(self, document_index: int = 0) -> str:
        """Récupère le nom du fichier uploadé."""
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DOC_FILENAME)
            if document_index < len(elements):
                return elements[document_index].text.strip()
        except Exception:
            pass
        return ""

    def are_documents_complete(self) -> bool:
        """Vérifie que tous les documents requis sont uploadés."""
        try:
            btn = self.driver.find_element(By.XPATH, SELECTOR_BTN_SOUMETTRE_PIECES)
            return not btn.get_attribute("disabled")
        except Exception:
            return False

    def click_somettre_pieces(self):
        """Soumet les pièces (Phase 2 → Phase 3)."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BTN_SOUMETTRE_PIECES))).click()
        print("[INSCRIPTION] Pièces soumises → Phase 3.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h2:has-text('Informations personnelles')")))

    # -------------------------------------------------------------------------
    # Phase 3 — Informations personnelles
    # -------------------------------------------------------------------------

    def fill_personal_info(self, nom: str = None, prenoms: str = None,
                           sexe: str = None, date_naissance: str = None,
                           lieu_naissance: str = None, nationalite: str = None,
                           type_piece: str = None, numero_piece: str = None,
                           contact: str = None, email: str = None,
                           adresse: str = None):
        """
        Remplit les informations personnelles (Phase 3).
        Tous les paramètres sont optionnels — seuls ceux fournis sont remplis.
        """
        if nom:
            self._fill_input("infos.nom", nom)
        if prenoms:
            self._fill_input("infos.prenoms", prenoms)
        if sexe:
            self._select_dropdown("infos.sexe", sexe)
        if date_naissance:
            self._fill_input("infos.dateNaissance", date_naissance)
        if lieu_naissance:
            self._fill_input("infos.lieuNaissance", lieu_naissance)
        if nationalite:
            self._fill_input("infos.nationalite", nationalite)
        if type_piece:
            self._select_dropdown("infos.typePieceIdentite", type_piece)
        if numero_piece:
            self._fill_input("infos.numeroPiece", numero_piece)
        if contact:
            self._fill_input("infos.contact", contact)
        if email:
            self._fill_input("infos.email", email)
        if adresse:
            self._fill_input("infos.adresse", adresse)
        print("[INSCRIPTION] Informations personnelles remplies.")

    def _fill_input(self, name: str, value: str):
        """Remplit un champ input par son name ou ngModel."""
        try:
            # Tentative par formControlName
            input_el = self.driver.find_element(By.CSS_SELECTOR, f"input[formControlName='{name.split('.')[-1]}']")
            input_el.clear()
            input_el.send_keys(value)
        except Exception:
            # Tentative par ngModel
            try:
                input_el = self.driver.find_element(By.CSS_SELECTOR, f"input[ngModel*='{name}']")
                input_el.clear()
                input_el.send_keys(value)
            except Exception:
                # Fallback : chercher par label
                label = self.driver.find_element(By.XPATH, f"//label[contains(text(), '{name.split('.')[-1].capitalize()}')]")
                parent = label.find_element(By.XPATH, "./following-sibling::*//input")
                parent.clear()
                parent.send_keys(value)
        print(f"[INSCRIPTION] Champ '{name}' = '{value}'")

    def _select_dropdown(self, name: str, value: str):
        """Sélectionne une valeur dans un dropdown."""
        try:
            select = Select(self.driver.find_element(By.CSS_SELECTOR, f"select[formControlName='{name.split('.')[-1]}']"))
            select.select_by_value(value)
        except Exception:
            select = Select(self.driver.find_element(By.CSS_SELECTOR, f"select[ngModel*='{name}']"))
            select.select_by_value(value)
        print(f"[INSCRIPTION] Dropdown '{name}' = '{value}'")

    def click_valider_infos(self):
        """Valide les informations personnelles (Phase 3 → Phase 4)."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BTN_VALIDER_INFOS))).click()
        print("[INSCRIPTION] Infos validées → Phase 4.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".recap-table")))

    # -------------------------------------------------------------------------
    # Phase 4 — Récapitulatif + Soumission
    # -------------------------------------------------------------------------

    def get_recap_data(self) -> dict:
        """Récupère les données du récapitulatif."""
        data = {}
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_RECAP_ROW)
            for row in rows:
                th = row.find_element(By.CSS_SELECTOR, "th").text
                td = row.find_element(By.CSS_SELECTOR, "td").text
                data[th] = td
        except Exception:
            pass
        return data

    def click_soumettre_demande(self):
        """Soumet la demande d'autorisation provisoire (Phase 4)."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BTN_SOUMETTRE_DEMANDE))).click()
        print("[INSCRIPTION] Demande soumise → Phase 5.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".timeline")))

    # -------------------------------------------------------------------------
    # Phase 5 — Statut
    # -------------------------------------------------------------------------

    def get_inscription_status(self) -> str:
        """Récupère le statut de l'inscription."""
        try:
            alert = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_STATUS_ALERT)))
            return alert.text.strip()
        except Exception:
            return ""

    def is_inscription_effectuee(self) -> bool:
        """Vérifie que l'inscription est effectuée (statut 'effectuee')."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_STATUT_EFFECTUEE)))
            return True
        except Exception:
            return False

    def is_inscription_en_correction(self) -> bool:
        """Vérifie que l'inscription est en correction."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_STATUT_CORRECTION)))
            return True
        except Exception:
            return False

    def is_inscription_en_attente(self) -> bool:
        """Vérifie que l'inscription est en attente."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_STATUT_EN_ATTENTE)))
            return True
        except Exception:
            return False

    def click_nouvelle_demande(self):
        """Clique sur 'Nouvelle demande'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_NOUVELLE_DEMANDE))).click()
        print("[INSCRIPTION] Nouvelle demande lancée.")

    def click_reinscription(self):
        """Clique sur le lien 'Réinscription'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_REINSCRIPTION))).click()
        print("[INSCRIPTION] Navigation vers la réinscription.")

    # -------------------------------------------------------------------------
    # OCR
    # -------------------------------------------------------------------------

    def is_ocr_modal_visible(self) -> bool:
        """Vérifie si le modal OCR est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_OCR_MODAL)))
            return True
        except Exception:
            return False

    def wait_for_ocr_completion(self, timeout=60):
        """Attend la fin de l'analyse OCR."""
        self.long_wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, SELECTOR_OCR_MODAL)))
        print("[INSCRIPTION] OCR terminé.")

    def get_ocr_progress(self) -> str:
        """Récupère le pourcentage de progression OCR."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_OCR_POURCENTAGE)
            return el.text.strip()
        except Exception:
            return ""

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
        """Vérifie que le wizard d'inscription est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_WIZARD_PAGE)))
            return True
        except Exception:
            return False

    def wait_for_phase(self, phase_number: int, timeout=20):
        """Attend qu'une phase spécifique du wizard soit affichée."""
        phase_labels = {
            1: "Choix de la filière",
            2: "Demande d'autorisation",
            3: "Informations personnelles",
            4: "Récapitulatif",
            5: "Statut",
        }
        label = phase_labels.get(phase_number, f"Étape {phase_number}")
        self.wait.until(EC.presence_of_element_located((By.XPATH, f"//h2[contains(., '{label}')]")))
        print(f"[INSCRIPTION] Phase {phase_number} détectée.")

    def is_submitting_disabled(self) -> bool:
        """Vérifie que le bouton de soumission est désactivé (form incomplet)."""
        try:
            btn = self.driver.find_element(By.XPATH, SELECTOR_BTN_SOUMETTRE_DEMANDE)
            return "disabled" in btn.get_attribute("class").lower() or btn.get_attribute("disabled") is not None
        except Exception:
            return True  # Si on ne trouve pas, on suppose désactivé

    def get_current_phase(self) -> int:
        """Détecte la phase actuelle du wizard."""
        phases = {
            "Choix de la filière": 1,
            "Demande d'autorisation": 2,
            "Informations personnelles": 3,
            "Récapitulatif": 4,
            "Statut": 5,
        }
        for label, phase in phases.items():
            try:
                el = self.driver.find_element(By.XPATH, f"//h2[contains(., '{label}')]")
                if el.is_displayed():
                    return phase
            except Exception:
                continue
        return 0
