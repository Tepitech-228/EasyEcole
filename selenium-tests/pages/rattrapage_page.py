"""
rattrapage_page.py — Page Object pour les pages de rattrapage.

Pages couvertes :
- /inscription/rattrapage/sessions  (rattrapage-sessions-page)
  - Création de sessions
  - Ouverture / clôture
  - Planning
  - Désignation de professeur
- /inscription/rattrapage/comite  (rattrapage-comite-page)
  - Examen des demandes
  - Vote collégial (valider / rejeter / correction)
  - Quorum
- /inscription/rattrapage/mes-demandes  (rattrapage-mes-demandes-page)
  - Soumission de demandes
  - Suivi des demandes
  - Sans session

Sélecteurs basés sur les templates HTML des composants

Usage :
    from pages.rattrapage_page import RattrapagePage
    page = RattrapagePage(driver)
    page.navigate_to_sessions()
    page.create_session()
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select

# =============================================================================
# SÉLECTEURS — Rattrapage Sessions
# =============================================================================

# --- rattrapage-sessions-page ---
SELECTOR_RATTAPAGE_SESSIONS = "app-rattrapage-sessions-page"
SELECTOR_HEADER = "app-header-title[title='Sessions de rattrapage']"
SELECTOR_SUCCESS_MSG = ".bg-green-100"
SELECTOR_ERROR_MSG = ".bg-red-100"
SELECTOR_LOADING_SPINNER = "app-loading-spinner"
SELECTOR_EMPTY_STATE = ".text-gray-400:has-text('Aucune session')"
SELECTOR_SESSIONS_TABLE = "table"
SELECTOR_SESSION_ROW = "tbody tr"
SELECTOR_SESSION_LIBELLE = ".text-sm.font-semibold.text-gray-900"
SELECTOR_SESSION_STATUT = "app-custom-badge"
SELECTOR_SESSION_ACTIONS = ".flex.items-center.justify-end.gap-2"

# Boutons actions sur les sessions
SELECTOR_BTN_NOUVELLE_SESSION = "app-custom-button[text='Nouvelle session']"
SELECTOR_BTN_MODIFIER = "button:has-text('Modifier')"
SELECTOR_BTN_OUVRIR = "button:has-text('Ouvrir')"
SELECTOR_BTN_CLOTURER = "button:has-text('Clôturer')"
SELECTOR_BTN_DESIGNER_PROF = "button:has-text('Désigner')"
SELECTOR_BTN_OUVRIR_SESSION = "button:has-text('Ouvrir'):not([disabled])"
SELECTOR_BTN_CLOTURER_SESSION = "button:has-text('Clôturer'):not([disabled])"

# Planning
SELECTOR_PLANNING_ROW = "tr[colspan='7']"
SELECTOR_PLANNING_SATTIS = "p.text-xs.text-gray-500:has-text('Samedis')"
SELECTOR_PLANNING_TABLE = ".table.min-w-full"
SELECTOR_PLANNING_DATE = "td:has-text('Samedis') ~ td"
SELECTOR_DESIGN_PROF_RADIO = "input[type='radio']"

# Modal création / édition de session
SELECTOR_SESSION_MODAL = "app-custom-modal[title*='session']"
SELECTOR_SESSION_FORM = "form[formgroup='sessionForm']"
SELECTOR_INPUT_LIBELLE = "input[formcontrolname='libelle']"
SELECTOR_SELECT_ANNEE = "select[formcontrolname='anneeAcademiqueId']"
SELECTOR_INPUT_DATE_DEBUT = "input[formcontrolname='dateDebut']"
SELECTOR_INPUT_DATE_FIN = "input[formcontrolname='dateFin']"
SELECTOR_NGSELECT_CLASSES = "ng-select"
SELECTOR_TEXTAREA_DESCRIPTION = "textarea[formcontrolname='description']"
SELECTOR_BTN_AJOUTER_DOCUMENT = "button:has-text('Ajouter une pièce')"
SELECTOR_BTN_ENREGISTRER_SESSION = "app-custom-button[text*='Enregistrer']"
SELECTOR_BTN_ANNULE_MODAL = "app-custom-button[text='Annuler']"
SELECTOR_BTN_ENREGISTRER_LOADING = "app-custom-button[text*='Enregistrement...']"

# =============================================================================
# SÉLECTEURS — Rattrapage Comité
# =============================================================================

# --- rattrapage-comite-page ---
SELECTOR_RATTAPAGE_COMITE = "app-rattrapage-comite-page"
SELECTOR_HEADER_COMITE = "app-header-title[title='Comité — Rattrapage']"

# Onglets
SELECTOR_TAB_EN_ATTENTE = "button:has-text('En attente')"
SELECTOR_TAB_CORRECTION = "button:has-text('Correction demandée')"
SELECTOR_TAB_VALIDEE = "button:has-text('Validées')"
SELECTOR_TAB_REJETEE = "button:has-text('Rejetées')"
SELECTOR_TAB_COUNTS = "[class*='border-b-2']"
SELECTOR_TAB_NB = "button span:has-text('En attente'), button span:has-text('Validées'), button span:has-text('Rejetées')"

# Table des demandes
SELECTOR_DEMANDES_TABLE = "table"
SELECTOR_DEMANDE_ROW = "tbody tr"
SELECTOR_ETUDIANT_NOM = ".text-sm.font-semibold.text-gray-900"
SELECTOR_SESSION_LABEL = ".text-sm.text-gray-800"
SELECTOR_MOTIF = ".line-clamp-2"
SELECTOR_CRENEAU = ".text-xs.text-indigo-600"
SELECTOR_MOTIF_REJET = ".text-xs.text-red-600"
SELECTOR_DOCUMENTS_COUNT = ".text-sm.text-gray-600"
SELECTOR_QUORUM_BADGE = "[class*='inline-flex']"
SELECTOR_DEMANDE_STATUT = "app-custom-badge"
SELECTOR_QUORUM_LABEL = ".font-bold.text-gray-900"
SELECTOR_QUORUM_PROGRESS = ".w-full.bg-gray-200.rounded-full.h-3 > div"
SELECTOR_QUORUM_VALIDES = ".text-sm.font-bold.text-gray-900"
SELECTOR_VOTE_INFO = ".bg-indigo-50.text-indigo-700"

# Actions sur les demandes
SELECTOR_BTN_VALIDER = "button:has-text('Valider')"
SELECTOR_BTN_REJETER = "button:has-text('Rejeter')"
SELECTOR_BTN_DETAIL = "button:has-text('Détail')"
SELECTOR_BTN_OUVRIR_DETAIL = "button:has-text('Voir')"

# Modal détail avec vote collégial
SELECTOR_DETAIL_MODAL = "app-custom-modal[title='Examen de la demande']"
SELECTOR_IDENTITE_SECTION = "div.bg-gray-50"
SELECTOR_QUORUM_SECTION = ".border-t.pt-4"
SELECTOR_MEMBRE_LIST = ".space-y-3"
SELECTOR_MEMBRE_ITEM = ".flex.items-center.gap-x-3"
SELECTOR_BOUTON_DECISION = "button[class*='rounded-lg']:has-text('Valider'), button[class*='rounded-lg']:has-text('Rejeter'), button[class*='rounded-lg']:has-text('Demander correction')"
SELECTOR_BOUTON_CONFIRMER_DECISION = "button[class*='bg-green-600'], button[class*='bg-red-600'], button[class*='bg-orange-500']"
SELECTOR_AREA_MOTIF = "textarea[formcontrolname='motifDecision']"
SELECTOR_BOUTON_ANNULER_DECISION = "button:has-text('Annuler')"
SELECTOR_PROCESSING_DECISION = ".animate-spin"

# =============================================================================
# SÉLECTEURS — Rattrapage Mes Demandes
# =============================================================================

# --- rattrapage-mes-demandes-page ---
SELECTOR_RATTAPAGE_MES_DEMANDES = "app-rattrapage-mes-demandes-page"
SELECTOR_HEADER_MES_DEMANDES = "app-header-title[title='Rattrapage — Mes demandes']"
SELECTOR_SUCCESS_MSG = ".bg-green-100"
SELECTOR_ERROR_MSG = ".bg-red-100"
SELECTOR_UPLOADING_INDICATOR = ".bg-indigo-50"
SELECTOR_SESSIONS_OUVVERTES_SECTION = "h2:has-text('Sessions de rattrapage ouvertes')"
SELECTOR_SESSION_CARD = ".bg-white.border.border-gray-200.rounded-xl"
SELECTOR_SESSION_CARD_LIBELLE = ".text-base.font-semibold.text-gray-900"
SELECTOR_SOUMETTRE_BTN = "button:has-text('Soumettre une demande')"
SELECTOR_DEJA_SOUMISE_BTN = "button:has-text('Demande déjà soumise')"
SELECTOR_SANS_SESSION_SECTION = ".bg-indigo-50"
SELECTOR_SANS_SESSION_BTN = "button:has-text('Déposer une demande sans session')"
SELECTOR_MES_DEMANDES_SECTION = "h2:has-text('Suivi de mes demandes')"
SELECTOR_DEMANDE_CARDS = "div.border.rounded-lg"

# =============================================================================
# CLASSES
# =============================================================================

class RattrapagePage:
    """Page Object pour les pages de rattrapage."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # =====================================================================
    # RATTAPAGE SESSIONS
    # =====================================================================

    def navigate_to_sessions(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des sessions de rattrapage."""
        url = f"{base_url}/inscription/rattrapage/sessions"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_SESSIONS)))
        print(f"[RATTAPAGE] Page sessions chargée : {url}")

    def click_nouvelle_session(self):
        """Clique sur le bouton 'Nouvelle session'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_NOUVELLE_SESSION))).click()
        print("[RATTAPAGE] Bouton 'Nouvelle session' cliqué.")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSION_MODAL)))

    def is_session_modal_visible(self) -> bool:
        """Vérifie que le modal de session est ouvert."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSION_MODAL)))
            return True
        except Exception:
            return False

    def fill_session_form(self, libelle: str = "", annee_id: str = "",
                           date_debut: str = "", date_fin: str = "",
                           description: str = ""):
        """Remplit le formulaire de création de session."""
        if libelle:
            input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_LIBELLE)
            input_el.clear()
            input_el.send_keys(libelle)
        if annee_id:
            select = Select(self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_ANNEE))
            select.select_by_value(annee_id)
        if date_debut:
            input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_DATE_DEBUT)
            input_el.clear()
            input_el.send_keys(date_debut)
        if date_fin:
            input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_DATE_FIN)
            input_el.clear()
            input_el.send_keys(date_fin)
        if description:
            textarea = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_TEXTAREA_DESCRIPTION)
            textarea.clear()
            textarea.send_keys(description)
        print("[RATTAPAGE] Formulaire de session rempli.")

    def click_enregistrer_session(self):
        """Enregistre la session."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_ENREGISTRER_SESSION))).click()
        print("[RATTAPAGE] Session enregistrée.")

    def close_session_modal(self):
        """Ferme le modal de session."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BTN_ANNULE_MODAL))).click()
        print("[RATTAPAGE] Modal de session fermé.")

    def get_sessions_count(self) -> int:
        """Récupère le nombre de sessions affichées."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSIONS_TABLE)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_ROW))

    def get_session_libelles(self) -> list:
        """Récupère les libellés des sessions."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_LIBELLE)
        return [el.text.strip() for el in elements]

    def get_session_row(self, index: int = 0) -> dict:
        """Récupère les informations d'une ligne de session."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_ROW)
        if index < len(rows):
            row = rows[index]
            try:
                libelle = row.find_element(By.CSS_SELECTOR, SELECTOR_SESSION_LIBELLE).text
            except Exception:
                libelle = ""
            try:
                statut = row.find_element(By.CSS_SELECTOR, SELECTOR_SESSION_STATUT).text
            except Exception:
                statut = ""
            return {"libelle": libelle, "statut": statut}
        return {}

    def click_ouvrir_session(self, row_index: int = 0):
        """Ouvre une session."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_OUVRIR)
        if row_index < len(buttons):
            buttons[row_index].click()
            print("[RATTAPAGE] Session ouverte.")
        else:
            raise Exception("Bouton 'Ouvrir' introuvable")

    def click_cloturer_session(self, row_index: int = 0):
        """Clôture une session."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_CLOTURER)
        if row_index < len(buttons):
            buttons[row_index].click()
            print("[RATTAPAGE] Session clôturée.")
        else:
            raise Exception("Bouton 'Clôturer' introuvable")

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
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ERROR_MSG)
            return el.text.strip()
        except Exception:
            return ""

    def is_session_row_displayed(self, libelle_contains: str = "") -> bool:
        """Vérifie qu'une ligne de session avec le libellé donné est affichée."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSION_ROW)))
            if libelle_contains:
                rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_ROW)
                for row in rows:
                    if libelle_contains in row.text:
                        return True
                return False
            return True
        except Exception:
            return False

    def is_empty_state(self) -> bool:
        """Vérifie qu'aucune session n'existe."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_EMPTY_STATE)))
            return True
        except Exception:
            return False

    def click_designer_prof(self, row_index: int = 0):
        """Clique sur le bouton 'Désigner' pour un planning."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_DESIGNER_PROF)
        if row_index < len(buttons):
            buttons[row_index].click()
            print("[RATTAPAGE] Désignation de professeur ouverte.")
        else:
            raise Exception("Bouton 'Désigner' introuvable")

    # =====================================================================
    # RATTAPAGE COMITÉ
    # =====================================================================

    def navigate_to_comite(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page du comité de rattrapage."""
        url = f"{base_url}/inscription/rattrapage/comite"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_COMITE)))
        print(f"[RATTAPAGE] Page comité chargée : {url}")

    def click_tab_en_attente(self):
        """Clique sur l'onglet 'En attente'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_TAB_EN_ATTENTE))).click()
        print("[RATTAPAGE] Onglet 'En attente' sélectionné.")

    def click_tab_correction(self):
        """Clique sur l'onglet 'Correction demandée'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_TAB_CORRECTION))).click()
        print("[RATTAPAGE] Onglet 'Correction demandée' sélectionné.")

    def click_tab_validee(self):
        """Clique sur l'onglet 'Validées'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_TAB_VALIDEE))).click()
        print("[RATTAPAGE] Onglet 'Validées' sélectionné.")

    def click_tab_rejete(self):
        """Clique sur l'onglet 'Rejetées'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_TAB_REJETEE))).click()
        print("[RATTAPAGE] Onglet 'Rejetées' sélectionné.")

    def get_active_tab(self) -> str:
        """Récupère l'onglet actif."""
        try:
            tabs = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_TAB_COUNTS)
            for tab in tabs:
                if "border-indigo-600" in tab.get_attribute("class"):
                    return tab.text.strip()
        except Exception:
            pass
        return ""

    def get_demandes_count(self) -> int:
        """Récupère le nombre de demandes dans le tableau."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DEMANDES_TABLE)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DEMANDE_ROW))

    def get_demande_etudiant(self, index: int = 0) -> str:
        """Récupère le nom de l'étudiant d'une demande."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DEMANDE_ROW)
        if index < len(rows):
            return rows[index].find_element(By.CSS_SELECTOR, SELECTOR_ETUDIANT_NOM).text.strip()
        return ""

    def get_demande_statut(self, index: int = 0) -> str:
        """Récupère le statut d'une demande."""
        rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DEMANDE_ROW)
        if index < len(rows):
            return rows[index].find_element(By.CSS_SELECTOR, SELECTOR_DEMANDE_STATUT).text.strip()
        return ""

    def click_valider_demande(self, index: int = 0):
        """Clique sur 'Valider' pour une demande."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_VALIDER)
        if index < len(buttons):
            buttons[index].click()
            print("[RATTAPAGE] Bouton 'Valider' cliqué.")
        else:
            raise Exception("Bouton 'Valider' introuvable")

    def click_rejeter_demande(self, index: int = 0):
        """Clique sur 'Rejeter' pour une demande."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_REJETER)
        if index < len(buttons):
            buttons[index].click()
            print("[RATTAPAGE] Bouton 'Rejeter' cliqué.")
        else:
            raise Exception("Bouton 'Rejeter' introuvable")

    def click_detail_demande(self, index: int = 0):
        """Clique sur 'Détail' pour une demande."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BTN_DETAIL)
        if index < len(buttons):
            buttons[index].click()
            print("[RATTAPAGE] Bouton 'Détail' cliqué.")
        else:
            raise Exception("Bouton 'Détail' introuvable")

    # --- Modal détail / vote ---

    def is_detail_modal_visible(self) -> bool:
        """Vérifie que le modal de détail est ouvert."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DETAIL_MODAL)))
            return True
        except Exception:
            return False

    def get_quorum_text(self) -> str:
        """Récupère le texte du quorum."""
        try:
            el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_QUORUM_LABEL)))
            return el.text.strip()
        except Exception:
            return ""

    def get_quorum_progress(self) -> int:
        """Récupère le pourcentage de progression du quorum."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_QUORUM_PROGRESS)
            style = el.get_attribute("style")
            import re
            match = re.search(r'width:\s*([\d.]+)%', style)
            return int(match.group(1)) if match else 0
        except Exception:
            return 0

    def click_valider_decision(self):
        """Clique sur 'Valider' dans le modal de décision."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has-text('Valider')")))
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BOUTON_CONFIRMER_DECISION)
        if buttons:
            buttons[0].click()
            print("[RATTAPAGE] Décision 'Valider' confirmée.")

    def click_rejeter_decision(self):
        """Clique sur 'Rejeter' dans le modal de décision."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, "button:has-text('Rejeter')")
        if buttons:
            buttons[0].click()
            print("[RATTAPAGE] Décision 'Rejeter' confirmée.")

    def click_correction_decision(self):
        """Clique sur 'Demander correction' dans le modal de décision."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, "button:has-text('Demander correction')")
        if buttons:
            buttons[0].click()
            print("[RATTAPAGE] Décision 'Correction' confirmée.")

    def set_motif_decision(self, motif: str):
        """Saisit le motif de décision."""
        textarea = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_AREA_MOTIF)
        textarea.clear()
        textarea.send_keys(motif)
        print(f"[RATTAPAGE] Motif de décision : {motif}")

    def click_annuler_decision(self):
        """Annule la décision en cours."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_ANNULER_DECISION))).click()
        print("[RATTAPAGE] Décision annulée.")

    def is_voted(self, member_name: str = "") -> bool:
        """Vérifie si un membre a déjà voté."""
        try:
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_VOTE_INFO)) > 0
        except Exception:
            return False

    # =====================================================================
    # RATTAPAGE MES DEMANDES
    # =====================================================================

    def navigate_to_mes_demandes(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page mes demandes de rattrapage."""
        url = f"{base_url}/inscription/rattrapage/mes-demandes"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_MES_DEMANDES)))
        print(f"[RATTAPAGE] Page mes demandes chargée : {url}")

    def get_sessions_ouvertes_count(self) -> int:
        """Récupère le nombre de sessions ouvertes."""
        try:
            cards = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_CARD)
            return len(cards)
        except Exception:
            return 0

    def get_sessions_ouvertes_libelles(self) -> list:
        """Récupère les libellés des sessions ouvertes."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SESSION_CARD_LIBELLE)
        return [el.text.strip() for el in elements]

    def is_soumettre_visible(self) -> bool:
        """Vérifie que le bouton 'Soumettre une demande' est visible."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SOUMETTRE_BTN)))
            return True
        except Exception:
            return False

    def click_soumettre_demande(self, card_index: int = 0):
        """Clique sur 'Soumettre une demande'."""
        buttons = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_SOUMETTRE_BTN)
        if card_index < len(buttons):
            buttons[card_index].click()
            print("[RATTAPAGE] Soumission de demande cliquée.")

    def click_de_sans_session(self):
        """Clique sur 'Déposer une demande sans session'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_SANS_SESSION_BTN))).click()
        print("[RATTAPAGE] Demande sans session ouverte.")

    def get_demandes_suivi_count(self) -> int:
        """Récupère le nombre de demandes dans le suivi."""
        try:
            cards = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_DEMANDE_CARDS)
            return len(cards)
        except Exception:
            return 0

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
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ERROR_MSG)
            return el.text.strip()
        except Exception:
            return ""

    def is_uploading(self) -> bool:
        """Vérifie si un upload est en cours."""
        try:
            return self.driver.find_element(By.CSS_SELECTOR, SELECTOR_UPLOADING_INDICATOR).is_displayed()
        except Exception:
            return False

    # =====================================================================
    # Helpers génériques
    # =====================================================================

    def wait_for_sessions_loaded(self, timeout=20):
        """Attend que les sessions soient chargées."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSIONS_TABLE)))
        print("[RATTAPAGE] Sessions chargées.")

    def wait_for_comite_loaded(self, timeout=20):
        """Attend que le comité soit chargé."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_COMITE)))
        print("[RATTAPAGE] Comité chargé.")

    def is_sessions_page_displayed(self) -> bool:
        """Vérifie que la page des sessions est affichée."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_SESSIONS)))
            return True
        except Exception:
            return False

    def is_comite_page_displayed(self) -> bool:
        """Vérifie que la page du comité est affichée."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_COMITE)))
            return True
        except Exception:
            return False

    def is_mes_demandes_page_displayed(self) -> bool:
        """Vérifie que la page mes demandes est affichée."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RATTAPAGE_MES_DEMANDES)))
            return True
        except Exception:
            return False
