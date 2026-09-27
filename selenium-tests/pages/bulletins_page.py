"""
bulletins_page.py — Page Object pour les pages de bulletins EasyEcole V4.

Pages couvertes :
- /bulletins              (liste-bulletins-page) — Liste, filtres, recherche, détail
- /bulletins/generer      (generer-bulletins-page) — Génération de bulletins
- /bulletins/{id}         (detail-bulletin-page) — Détail d'un bulletin + notes
- /bulletins/rattrapages  (liste-rattrapages-page) — Gestion des rattrapages
- /bulletins/sessions-examen (session-examen-form-page) — Création sessions d'examen

Sélecteurs basés sur les templates HTML des composants

Usage :
    from pages.bulletins_page import BulletinsPage
    page = BulletinsPage(driver)
    page.navigate_to_list(base_url=BASE_URL)
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select

# =============================================================================
# SÉLECTEURS — Liste des bulletins (liste-bulletins-page)
# =============================================================================

SELECTOR_LISTE_BULLETINS = "app-liste-bulletins-page"
SELECTOR_HEADER = "app-header-title[title='Bulletins de notes']"
SELECTOR_BOUTON_GENERER = "a[routerlink*='/bulletins/generer']"
SELECTOR_SEMESTRE_SELECT = "select[ngModel='semestre']"
SELECTOR_STATUT_SELECT = "select[ngModel='statut']"
SELECTOR_TABLE_BULLETINS = "table"
SELECTOR_BULLETIN_ROW = "tbody tr"
SELECTOR_DOSSIER_TREE = "app-dossier-view"
SELECTOR_FILTRES_ANNEE_NIVEAU_PARCOURS = "app-filters-annee-niveau-parcours"
SELECTOR_RESULT_COUNT = "[class*='resultCount'], [class*='totalItems']"
SELECTOR_BULLETIN_STATUT_PUBLIE = "span:has-text('Publié')"
SELECTOR_BULLETIN_STATUT_BROUILLON = "span:has-text('Brouillon')"
SELECTOR_BULLETIN_MOYENNE = "td:has-text('Moy.')"

# =============================================================================
# SÉLECTEURS — Génération de bulletins (generer-bulletins-page)
# =============================================================================

SELECTOR_GENERATION = "app-generer-bulletins-page"
SELECTOR_HEADER_GENERATION = "h1:has-text('Générer les relevés')"
SELECTOR_INPUT_ANNEE = "select[ngModel='anneeAcademiqueId']"
SELECTOR_INPUT_NIVEAU = "select[ngModel='niveauId']"
SELECTOR_INPUT_PARCOURS = "select[ngModel='parcoursId']"
SELECTOR_INPUT_CLASSE = "select[ngModel='classeId']"
SELECTOR_INPUT_SALLE = "select[ngModel='salleId']"
SELECTOR_INPUT_SEMESTRE = "select[ngModel='semestre']"
SELECTOR_BOUTON_GENERER = "button:has-text('Générer les bulletins')"
SELECTOR_BOUTON_GENERER_DISABLED = "button:has-text('Générer les bulletins')[disabled]"
SELECTOR_RECAP_COMPLETE = "div[class*='bg-blue-50']"
SELECTOR_RESULTAT_SUCCESS = "div:has-text('Génération réussie')"
SELECTOR_RESULTAT_ERREUR = "div:has-text('Erreur de génération')"
SELECTOR_BULLETINS_GENERES = ".text-2xl.font-bold"
SELECTOR_CHARGEMENT_GENERATION = "div[class*='animate-spin']"
SELECTOR_INFO_CARD = "div[class*='bg-amber-50']"

# =============================================================================
# SÉLECTEURS — Détail bulletin (detail-bulletin-page)
# =============================================================================

SELECTOR_DETAIL_BULLETIN = "app-detail-bulletin-page"
SELECTOR_HEADER_DETAIL = "app-header-title[title='Détail bulletin']"
SELECTOR_STATUT_BULLETIN = "span:has-text('Publié'), span:has-text('Brouillon')"
SELECTOR_NOM_ETUDIANT = ".text-sm.font-semibold.text-gray-900"
SELECTOR_MOYENNE_GENERALE = ".font-bold"
SELECTOR_TABLE_NOTES = "table.grades-table"
SELECTOR_LIGNE_NOTE = "table.grades-table tbody tr"
SELECTOR_TABLE_RATTAPAGE = "table.grades-table:has(th:has-text('Note rattrapage'))"
SELECTOR_LIGNE_RATTAPAGE = "table.grades-table:has(th:has-text('Note rattrapage')) tbody tr"
SELECTOR_BILAN = "table.summary-box"
SELECTION_BTN_IMPRIMER = "button:has-text('Imprimer')"
SELECTION_BTN_PUBLIER = "button:has-text('Publier')"
SELECTION_BTN_SAUVERGARDER_APPRECIATION = "button:has-text('Sauvegarder')"
SELECTION_APPRECIATION = "textarea[ngModel='appreciation']"
SELECTION_DECISION = ".font-bold"

# =============================================================================
# SÉLECTEURS — Liste rattrapages (liste-rattrapages-page)
# =============================================================================

SELECTOR_LISTE_RATTAPAGES = "app-liste-rattrapages-page"
SELECTOR_HEADER_RATTAPAGES = "app-header-title[title='Rattrapages']"
SELECTOR_SELECT_SESSION_RATTAPAGE = "select"
SELECTOR_TABLE_RATTAPAGES = "table"
SELECTOR_RATTAPAGE_ROW = "tbody tr"
SELECTOR_STATUT_RATTAPAGE = "app-custom-badge"
SELECTOR_BOUTON_NOTIFIER = "button:has-text('Notifier')"
SELECTOR_BOUTON_SAISIR_NOTES = "button:has-text('Saisir les notes')"
SELECTOR_BOUTON_OUVRIR_DETAIL = "a:has-text('Détail')"
SELECTOR_STATS_TOTAL = ".text-2xl.font-bold"

# =============================================================================
# SÉLECTEURS — Session d'examen (session-examen-form-page)
# =============================================================================

SELECTOR_SESSION_FORM = "app-session-examen-form-page"
SELECTOR_INPUT_LIBELLE_SESSION = "input[formControlName='libelle']"
SELECTOR_SELECT_TYPE_SESSION = "select[formControlName='type']"
SELECTOR_SELECT_SEMESTRE_SESSION = "select[formControlName='semestre']"
SELECTOR_SELECT_CLASSE_SESSION = "select[formControlName='classeId']"
SELECTOR_SELECT_ANNEE_SESSION = "select[formControlName='anneeAcademiqueId']"
SELECTOR_INPUT_DATE_DEBUT = "input[formControlName='dateDebut']"
SELECTOR_INPUT_DATE_FIN = "input[formControlName='dateFin']"
SELECTOR_SELECT_STATUT_SESSION = "select[formControlName='statut']"
SELECTOR_BOUTON_ENREGISTRER_SESSION = "button[type='submit']"
SELECTOR_BOUTON_ANNULER_SESSION = "button:has-text('Annuler')"

# =============================================================================
# URLS
# =============================================================================

URL_LISTE = "/bulletins"
URL_GENERER = "/bulletins/generer"
URL_DETAIL = "/bulletins"
URL_RATTAPAGES = "/bulletins/rattrapages"
URL_SESSIONS_EXAMEN = "/bulletins/sessions-examen"


class BulletinsPage:
    """Page Object pour les pages de bulletins EasyEcole V4."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # =====================================================================
    # NAVIGATION — Liste des bulletins
    # =====================================================================

    def navigate_to_list(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la liste des bulletins (/bulletins)."""
        url = f"{base_url}{URL_LISTE}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_BULLETINS)))
        print(f"[BULLETINS] Page liste chargée : {url}")

    def navigate_to_generation(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de génération (/bulletins/generer)."""
        url = f"{base_url}{URL_GENERER}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_GENERATION)))
        print(f"[BULLETINS] Page génération chargée : {url}")

    def click_bouton_generer_bulletins(self):
        """Clique sur le bouton 'Générer' depuis la liste."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_GENERER))).click()
        print("[BULLETINS] Bouton 'Générer' cliqué.")

    # =====================================================================
    # LISTE — Filtres
    # =====================================================================

    def select_semestre(self, semestre: str):
        """Sélectionne un semestre dans le filtre (semestre1, semestre2, etc.)."""
        select = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_SEMESTRE_SELECT)))
        Select(select).select_by_value(semestre)
        print(f"[BULLETINS] Semestre sélectionné : {semestre}")

    def select_statut(self, statut: str):
        """Sélectionne un statut (brouillon, publie)."""
        select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_STATUT_SELECT)
        Select(select).select_by_value(statut)
        print(f"[BULLETINS] Statut sélectionné : {statut}")

    def get_bulletins_count(self) -> int:
        """Récupère le nombre de bulletins affichés."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_BULLETINS)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BULLETIN_ROW))

    def get_bulletin_rows(self) -> list:
        """Récupère les lignes de la table des bulletins."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_BULLETINS)))
        return self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BULLETIN_ROW)

    def get_bulletin_row_text(self, index: int = 0) -> str:
        """Récupère le texte d'une ligne de bulletin."""
        rows = self.get_bulletin_rows()
        if index < len(rows):
            return rows[index].text.strip()
        return ""

    def get_bulletin_statut(self, index: int = 0) -> str:
        """Récupère le statut d'un bulletin (Publié/Brouillon)."""
        try:
            rows = self.get_bulletin_rows()
            if index < len(rows):
                row = rows[index]
                if "Publie" in row.text:
                    return "publie"
                elif "Brouillon" in row.text:
                    return "brouillon"
        except Exception:
            pass
        return ""

    def is_bulletin_displayed(self, student_name_contains: str = "") -> bool:
        """Vérifie qu'un bulletin contenant le nom étudiant est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_BULLETIN_ROW)))
            if student_name_contains:
                rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_BULLETIN_ROW)
                for row in rows:
                    if student_name_contains in row.text:
                        return True
                return False
            return True
        except Exception:
            return False

    def get_moyenne_generale(self, index: int = 0) -> str:
        """Récupère la moyenne générale d'un bulletin."""
        try:
            rows = self.get_bulletin_rows()
            if index < len(rows):
                row = rows[index]
                # Chercher la cellule contenant la moyenne
                cells = row.find_elements(By.CSS_SELECTOR, "td")
                for cell in cells:
                    text = cell.text.strip()
                    if "/" in text and any(c.isdigit() for c in text):
                        return text
        except Exception:
            pass
        return ""

    def wait_for_list_loaded(self, timeout=20):
        """Attend que la liste des bulletins soit chargée."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_BULLETINS)))
        print("[BULLETINS] Liste des bulletins chargée.")

    # =====================================================================
    # GÉNÉRATION DE BULLETINS
    # =====================================================================

    def fill_generation_form(self, annee_id: str = "", niveau_id: str = "",
                              parcours_id: str = "", classe_id: str = "",
                              semestre: str = ""):
        """Remplit le formulaire de génération de bulletins."""
        if annee_id:
            select = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_INPUT_ANNEE)))
            Select(select).select_by_value(annee_id)
            print(f"[BULLETINS] Année sélectionnée : {annee_id}")
        if niveau_id:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_NIVEAU)
            Select(select).select_by_value(niveau_id)
            print(f"[BULLETINS] Niveau sélectionné : {niveau_id}")
        if parcours_id:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_PARCOURS)
            Select(select).select_by_value(parcours_id)
            print(f"[BULLETINS] Parcours sélectionné : {parcours_id}")
        if classe_id:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_CLASSE)
            Select(select).select_by_value(classe_id)
            print(f"[BULLETINS] Classe sélectionnée : {classe_id}")
        if semestre:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_SEMESTRE)
            Select(select).select_by_value(semestre)
            print(f"[BULLETINS] Semestre sélectionné pour génération : {semestre}")

    def click_generer(self):
        """Clique sur le bouton 'Générer les bulletins'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_GENERER))).click()
        print("[BULLETINS] Bouton 'Générer les bulletins' cliqué.")

    def wait_for_generation_result(self, timeout=60):
        """Attend le résultat de la génération (succès ou erreur)."""
        try:
            self.long_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RESULTAT_SUCCESS)))
            print("[BULLETINS] Génération réussie confirmée.")
        except Exception:
            # Vérifier aussi l'erreur
            try:
                self.long_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RESULTAT_ERREUR)))
                print("[BULLETINS] Erreur de génération détectée.")
            except Exception:
                print("[BULLETINS] Timeout — résultat de génération non détecté.")

    def get_generation_result_count(self) -> int:
        """Récupère le nombre de bulletins générés."""
        try:
            # Le texte du succès contient le nombre
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_RESULTAT_SUCCESS)
            import re
            match = re.search(r'(\d+)\s*bulletin', el.text)
            return int(match.group(1)) if match else 0
        except Exception:
            return 0

    def is_generation_successful(self) -> bool:
        """Vérifie que la génération a réussi."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RESULTAT_SUCCESS)))
            return True
        except Exception:
            return False

    def is_generation_error(self) -> bool:
        """Vérifie qu'une erreur de génération s'est produite."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_RESULTAT_ERREUR)))
            return True
        except Exception:
            return False

    def is_generation_loading(self) -> bool:
        """Vérifie si la génération est en cours."""
        try:
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_CHARGEMENT_GENERATION)) > 0
        except Exception:
            return False

    def get_recap_text(self) -> str:
        """Récupère le texte du récapitulatif de génération."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_RECAP_COMPLETE)
            return el.text.strip()
        except Exception:
            return ""

    def is_generate_button_disabled(self) -> bool:
        """Vérifie si le bouton 'Générer' est désactivé (form incomplet)."""
        try:
            btn = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_BOUTON_GENERER)
            return "disabled" in btn.get_attribute("class").lower() or btn.get_attribute("disabled") is not None
        except Exception:
            return True

    # =====================================================================
    # DÉTAIL DU BULLETIN
    # =====================================================================

    def navigate_to_detail(self, bulletin_id: str, base_url: str = "http://localhost:4200"):
        """Navigue vers le détail d'un bulletin (/bulletins/{id})."""
        url = f"{base_url}{URL_DETAIL}/{bulletin_id}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_DETAIL_BULLETIN)))
        print(f"[BULLETINS] Détail bulletin {bulletin_id} chargé.")

    def get_bulletin_statut_detail(self) -> str:
        """Récupère le statut du bulletin (Publié ou Brouillon)."""
        try:
            el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_STATUT_BULLETIN)))
            text = el.text.strip()
            if "Publie" in text:
                return "publie"
            elif "Brouillon" in text:
                return "brouillon"
            return text
        except Exception:
            return ""

    def get_student_name_from_bulletin(self) -> str:
        """Récupère le nom de l'étudiant depuis le détail du bulletin."""
        try:
            el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_NOM_ETUDIANT)))
            return el.text.strip()
        except Exception:
            return ""

    def get_notes_count(self) -> int:
        """Récupère le nombre de lignes de notes dans le bulletin."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_NOTES)))
            return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_NOTE))
        except Exception:
            return 0

    def has_rattrapage_section(self) -> bool:
        """Vérifie si la section de rattrapage est affichée dans le bulletin."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_RATTAPAGE)))
            return True
        except Exception:
            return False

    def get_rattrapage_notes(self) -> list:
        """Récupère les notes de rattrapage du bulletin."""
        notes = []
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_RATTAPAGE)))
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_RATTAPAGE)
            for row in rows:
                cells = row.find_elements(By.CSS_SELECTOR, "td")
                if len(cells) >= 2:
                    note = cells[1].text.strip()
                    notes.append({"matiere": cells[0].text.strip(), "note": note})
        except Exception:
            pass
        return notes

    def get_decision_text(self) -> str:
        """Récupère la décision (admis, ajourné, etc.) du bulletin."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTION_DECISION)
            return el.text.strip()
        except Exception:
            return ""

    def get_moyenne_generale_detail(self) -> str:
        """Récupère la moyenne générale depuis le détail du bulletin."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_MOYENNE_GENERALE)
            return el.text.strip()
        except Exception:
            return ""

    def click_imprimer(self):
        """Clique sur le bouton 'Imprimer'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTION_BTN_IMPRIMER))).click()
        print("[BULLETINS] Bouton 'Imprimer' cliqué.")

    def click_publier(self):
        """Clique sur le bouton 'Publier' (pour les bulletins en brouillon)."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTION_BTN_PUBLIER))).click()
        print("[BULLETINS] Bouton 'Publier' cliqué.")

    def is_published(self) -> bool:
        """Vérifie que le bulletin est publié."""
        return self.get_bulletin_statut_detail() == "publie"

    def is_brouillon(self) -> bool:
        """Vérifie que le bulletin est en brouillon."""
        return self.get_bulletin_statut_detail() == "brouillon"

    # =====================================================================
    # NOTE — Vérification des notes
    # =====================================================================

    def get_note_cc(self, index: int = 0) -> str:
        """Récupère la note CC (contrôle continu) d'une ligne."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_NOTE)
            if index < len(rows):
                cells = rows[index].find_elements(By.CSS_SELECTOR, "td")
                # CC est généralement la 4ème colonne
                if len(cells) > 3:
                    return cells[3].text.strip()
        except Exception:
            pass
        return ""

    def get_note_devoir(self, index: int = 0) -> str:
        """Récupère la note Devoir d'une ligne."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_NOTE)
            if index < len(rows):
                cells = rows[index].find_elements(By.CSS_SELECTOR, "td")
                if len(cells) > 4:
                    return cells[4].text.strip()
        except Exception:
            pass
        return ""

    def get_note_examen(self, index: int = 0) -> str:
        """Récupère la note Examen d'une ligne."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_NOTE)
            if index < len(rows):
                cells = rows[index].find_elements(By.CSS_SELECTOR, "td")
                if len(cells) > 5:
                    return cells[5].text.strip()
        except Exception:
            pass
        return ""

    def has_missing_notes(self) -> bool:
        """Vérifie si le bulletin contient des notes manquantes (valeurs '—' ou '-')."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_LIGNE_NOTE)
            for row in rows:
                text = row.text
                if "—" in text or "[—]" in text or "-" in text.split("Moy.")[0] if "Moy." in text else False:
                    return True
            return False
        except Exception:
            return False

    def wait_for_notes_loaded(self, timeout=20):
        """Attend que les notes soient chargées dans le bulletin."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_NOTES)))
        print("[BULLETINS] Notes chargées.")

    # =====================================================================
    # RATTAPAGES — Liste
    # =====================================================================

    def navigate_to_rattrapages(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page des rattrapages (/bulletins/rattrapages)."""
        url = f"{base_url}{URL_RATTAPAGES}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_RATTAPAGES)))
        print(f"[BULLETINS] Page rattrapages chargée : {url}")

    def get_rattrapages_count(self) -> int:
        """Récupère le nombre de rattrapages affichés."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_TABLE_RATTAPAGES)))
        return len(self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_RATTAPAGE_ROW))

    def get_rattrapage_row_text(self, index: int = 0) -> str:
        """Récupère le texte d'une ligne de rattrapage."""
        rows = self.get_rattrapages_count()
        if rows and index < rows:
            pass
        return ""

    def click_notifier_non_envoyes(self):
        """Clique sur le bouton 'Notifier' pour les non-notifiés."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_NOTIFIER))).click()
        print("[BULLETINS] Bouton 'Notifier' cliqué.")

    def click_saisir_notes(self):
        """Clique sur le bouton 'Saisir les notes'."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_SAISIR_NOTES))).click()
        print("[BULLETINS] Bouton 'Saisir les notes' cliqué.")

    def get_rattrapage_statut(self, index: int = 0) -> str:
        """Récupère le statut d'un rattrapage."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_RATTAPAGE_ROW)
            if index < len(rows):
                return rows[index].find_element(By.CSS_SELECTOR, SELECTOR_STATUT_RATTAPAGE).text.strip()
        except Exception:
            pass
        return ""

    def wait_for_rattrapages_loaded(self, timeout=20):
        """Attend que les rattrapages soient chargés."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_RATTAPAGES)))
        print("[BULLETINS] Rattrapages chargés.")

    # =====================================================================
    # SESSIONS D'EXAMEN
    # =====================================================================

    def navigate_to_sessions_examen(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de création de sessions d'examen."""
        url = f"{base_url}{URL_SESSIONS_EXAMEN}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSION_FORM)))
        print(f"[BULLETINS] Page sessions d'examen chargée : {url}")

    def fill_session_form(self, libelle: str = "", type_session: str = "",
                           semestre: str = "", classe_id: str = "",
                           annee_id: str = "", date_debut: str = "", date_fin: str = ""):
        """Remplit le formulaire de création de session d'examen."""
        if libelle:
            input_el = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_INPUT_LIBELLE_SESSION)))
            input_el.clear()
            input_el.send_keys(libelle)
        if type_session:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_TYPE_SESSION)
            Select(select).select_by_value(type_session)
        if semestre:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_SEMESTRE_SESSION)
            Select(select).select_by_value(semestre)
        if classe_id:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_CLASSE_SESSION)
            Select(select).select_by_value(classe_id)
        if annee_id:
            select = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_SELECT_ANNEE_SESSION)
            Select(select).select_by_value(annee_id)
        if date_debut:
            input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_DATE_DEBUT)
            input_el.clear()
            input_el.send_keys(date_debut)
        if date_fin:
            input_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_INPUT_DATE_FIN)
            input_el.clear()
            input_el.send_keys(date_fin)
        print("[BULLETINS] Formulaire de session rempli.")

    def click_enregistrer_session(self):
        """Enregistre la session d'examen."""
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOUTON_ENREGISTRER_SESSION))).click()
        print("[BULLETINS] Session d'examen enregistrée.")

    def is_session_form_displayed(self) -> bool:
        """Vérifie que le formulaire de session est affiché."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_SESSION_FORM)))
            return True
        except Exception:
            return False

    def get_error_message(self) -> str:
        """Récupère le message d'erreur."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_RESULTAT_ERREUR)
            return el.text.strip()
        except Exception:
            return ""

    # =====================================================================
    # EXPORT / PDF
    # =====================================================================

    def is_pdf_download_available(self) -> bool:
        """Vérifie si un bouton de téléchargement PDF est disponible."""
        try:
            # Chercher les boutons d'impression/export
            pdf_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button:has-text('Imprimer'), a:has-text('PDF'), [class*='export']")
            return len(pdf_buttons) > 0
        except Exception:
            return False

    def click_export_pdf(self):
        """Clique sur le bouton d'export PDF (Imprimer)."""
        self.click_imprimer()
        print("[BULLETINS] Export PDF initié.")

    # =====================================================================
    # Dashboard navigation
    # =====================================================================

    def navigate_from_dashboard(self, base_url: str = "http://localhost:4200"):
        """Navigue vers les bulletins depuis le dashboard."""
        self.driver.get(f"{base_url}/bulletins")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_BULLETINS)))
        print("[BULLETINS] Navigation depuis le dashboard vers les bulletins.")

    def is_page_displayed(self, page_type: str = "liste") -> bool:
        """Vérifie qu'une page de bulletins est affichée."""
        selectors = {
            "liste": SELECTOR_LISTE_BULLETINS,
            "generation": SELECTOR_GENERATION,
            "detail": SELECTOR_DETAIL_BULLETIN,
            "rattrapages": SELECTOR_LISTE_RATTAPAGES,
            "sessions": SELECTOR_SESSION_FORM,
        }
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selectors.get(page_type, SELECTOR_LISTE_BULLETINS))))
            return True
        except Exception:
            return False

    def wait_for_page_ready(self):
        """Attend que la page des bulletins soit complètement chargée."""
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_LISTE_BULLETINS)))
        print("[BULLETINS] Page prête.")
