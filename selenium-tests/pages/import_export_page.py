"""
import_export_page.py — Page Object pour la page Import/Export Excel EasyEcole.

Localise les éléments de la page /inscription/import-export-excel :
- Onglet Import/Export
- Sélecteur type d'import (importType)
- Sélecteur format (importFormat)
- Sélecteur parcours (selectedImportParcoursId)
- Sélecteur semestre (selectedImportSemestre)
- Sélecteur rôle (selectedImportRole) pour utilisateurs
- Input file (id="fileInput")
- Bouton "Télécharger le template"
- Bouton "Importer la maquette"
- Bouton "Réinitialiser"
- Rapport d'import : importedCount, errorCount, tableau de détails
- Message de succès (successMessage)
- Message d'erreur (errorMessage)

Navigation URL : /inscription/import-export-excel?type=ue&tab=import

Usage :
    from pages.import_export_page import ImportExportPage
    page = ImportExportPage(driver)
    page.navigate_to_import("ue")
    page.upload_file("C:\\\\chemin\\\\vers\\\\file.docx")
    page.click_import()
"""

import time

# Délais d'attente
DEFAULT_TIMEOUT = 20  # secondes
LONG_TIMEOUT = 60    # secondes pour les imports lents
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import Select

# =============================================================================
# SÉLECTEURS — Basés sur import-export-excel-page.component.html
# =============================================================================

# Conteneur principal
SELECTOR_PAGE_CONTAINER = ".page-container"

# Onglet Import
SELECTOR_TAB_IMPORT = "button[class*='border-b-3']:contains('Import')"  # non fiable, utilise xpath
SELECTOR_TAB_IMPORT_XPATH = "//button[contains(text(), 'Import')]"
SELECTOR_TAB_EXPORT_XPATH = "//button[contains(text(), 'Export')]"

# Type d'import (select avec ngModel="importType")
SELECTOR_IMPORT_TYPE = "select[ngmodel='importType']"
SELECTOR_IMPORT_TYPE_XPATH = "//select[@ngModel='importType']"
SELECTOR_IMPORT_TYPE_OPTION = "//select[@ngModel='importType']/option"

# Format d'import (select avec ngModel="importFormat")
SELECTOR_IMPORT_FORMAT = "select[ngmodel='importFormat']"
SELECTOR_IMPORT_FORMAT_XPATH = "//select[@ngModel='importFormat']"

# Pour UE : sélection du parcours
SELECTOR_IMPORT_PARCOURS = "select[ngModel='selectedImportParcoursId']"
SELECTOR_IMPORT_PARCOURS_XPATH = "//select[@ngModel='selectedImportParcoursId']"
SELECTOR_IMPORT_PARCOURS_OPTION = "//select[@ngModel='selectedImportParcoursId']/option"

# Pour UE : sélection du semestre
SELECTOR_IMPORT_SEMESTRE = "select[ngModel='selectedImportSemestre']"
SELECTOR_IMPORT_SEMESTRE_XPATH = "//select[@ngModel='selectedImportSemestre']"

# Pour Utilisateurs : sélection du rôle
SELECTOR_IMPORT_ROLE = "select[ngModel='selectedImportRole']"
SELECTOR_IMPORT_ROLE_XPATH = "//select[@ngModel='selectedImportRole']"

# Zone de dépôt de fichier
SELECTOR_FILE_DROPZONE = ".border-dashed"
SELECTOR_FILE_INPUT = "#fileInput"
SELECTOR_FILE_INPUT_XPATH = "//input[@type='file']"
SELECTOR_FILE_NAME = ".font-medium.text-gray-700"  # affiche le nom du fichier sélectionné

# Boutons d'action
SELECTOR_BUTTON_TEMPLATE = "//button[contains(text(), 'Télécharger le template')]"
SELECTOR_BUTTON_IMPORT = "//button[contains(text(), 'Importer la maquette')]"
SELECTOR_BUTTON_RESET = "//button[contains(text(), 'Réinitialiser')]"

# Messages de statut
SELECTOR_SUCCESS_MESSAGE = ".alert-success, [class*='success'], [class*='bg-emerald']"
SELECTOR_ERROR_MESSAGE = ".alert-danger, [class*='danger']"

# Résultats du rapport d'import
SELECTOR_IMPORT_RESULT = "*[class*='bg-gray-50']:has(p:contains('Importés avec succès'))"
SELECTOR_IMPORTED_COUNT = ".text-2xl.font-bold.text-gray-900"  # premier compteur
SELECTOR_ERROR_COUNT = ".text-2xl.font-bold.text-red-600"      # deuxième compteur
SELECTOR_IMPORT_REPORT_TABLE = "*[class*='table']"
SELECTOR_REPORT_DETAIL_ROW = "*[class*='divide-y divide-gray-50'] tbody tr"
SELECTOR_REPORT_SUCCESS_CELL = "span.bg-green-50.text-green-700"
SELECTOR_REPORT_ERROR_CELL = "span.bg-red-50.text-red-700"


class ImportExportPage:
    """Page Object pour la page Import/Export Excel."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.long_wait = WebDriverWait(driver, 60)

    # -------------------------------------------------------------------------
    # Navigation
    # -------------------------------------------------------------------------

    def navigate_to(self, import_type: str = "ue", tab: str = "import", base_url: str = "http://localhost:4200"):
        """
        Navigue vers la page d'import/export avec les paramètres de requête.
        Exemple : navigate_to("ue", "import") → /inscription/import-export-excel?type=ue&tab=import
        """
        url = f"{base_url}/inscription/import-export-excel?type={import_type}&tab={tab}"
        self.driver.get(url)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_PAGE_CONTAINER)))
        print(f"[IMPORT_EXPORT] Page chargée : {url}")

    def switch_to_import_tab(self):
        """Bascule sur l'onglet 'Import'."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_TAB_IMPORT_XPATH))).click()
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_IMPORT_TYPE)))
        print("[IMPORT_EXPORT] Onglet 'Import' sélectionné.")

    def switch_to_export_tab(self):
        """Bascule sur l'onglet 'Export'."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_TAB_EXPORT_XPATH))).click()
        print("[IMPORT_EXPORT] Onglet 'Export' sélectionné.")

    # -------------------------------------------------------------------------
    # Sélecteurs de type/format
    # -------------------------------------------------------------------------

    def select_import_type(self, import_type: str):
        """
        Sélectionne le type d'import (ue, etudiants, enseignants, utilisateurs).
        :param import_type: Valeur du select = "ue", "etudiants", "enseignants", "utilisateurs"
        """
        select = Select(self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_IMPORT_TYPE_XPATH))))
        select.select_by_value(import_type)
        print(f"[IMPORT_EXPORT] Type d'import : {import_type}")

    def select_import_format(self, import_format: str):
        """
        Sélectionne le format d'import.
        :param import_format: "xlsx" ou "docx"
        """
        select = Select(self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_IMPORT_FORMAT_XPATH))))
        select.select_by_value(import_format)
        print(f"[IMPORT_EXPORT] Format d'import : {import_format}")

    # -------------------------------------------------------------------------
    # Sélecteurs spécifiques UE
    # -------------------------------------------------------------------------

    def select_parcours(self, parcours_value: str):
        """
        Sélectionne un parcours dans le dropdown (pour UE).
        :param parcours_value: La valeur de l'option (id du parcours)
        """
        select = Select(self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_IMPORT_PARCOURS_XPATH))))
        select.select_by_value(parcours_value)
        print(f"[IMPORT_EXPORT] Parcours sélectionné : {parcours_value}")

    def select_semester(self, semester: str):
        """
        Sélectionne un semestre.
        :param semester: "semestre1", "semestre2", ... ou "" pour auto-détecte
        """
        select = Select(self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_IMPORT_SEMESTRE_XPATH))))
        if semester:
            select.select_by_value(semester)
        else:
            select.select_by_index(0)  # "Détecter ou choisir"
        print(f"[IMPORT_EXPORT] Sélectionné : {semester or 'auto-détecte'}")

    # -------------------------------------------------------------------------
    # Sélecteur de rôle (pour import utilisateurs)
    # -------------------------------------------------------------------------

    def select_role(self, role_value: str):
        """
        Sélectionne un rôle ciblé pour l'import de utilisateurs.
        :param role_value: Ex: "apprenant", "enseignant", "admin", "institution"
        """
        select = Select(self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_IMPORT_ROLE_XPATH))))
        select.select_by_value(role_value)
        print(f"[IMPORT_EXPORT] Rôle sélectionné : {role_value}")

    # -------------------------------------------------------------------------
    # Upload de fichier
    # -------------------------------------------------------------------------

    def upload_file(self, file_path: str):
        """
        Upload un fichier via l'input[type=file] (id="fileInput").
        Utilise send_keys directement sur le fichier input pour contourner la zone de drop.
        Gère les chemins Windows avec espaces.
        :param file_path: Chemin absolu du fichier (ex: C:\\Users\\...\\file.docx)
        """
        file_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_FILE_INPUT)))
        # Clicker sur la zone de drop pour rendre l'input accessible si nécessaire
        try:
            self.driver.execute_script("arguments[0].style.display='block'; arguments[0].click();", file_input)
        except Exception:
            pass
        file_input.clear()
        file_input.send_keys(file_path)
        # Attendre que le nom du fichier s'affiche
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_FILE_NAME)))
        except Exception:
            pass
        print(f"[IMPORT_EXPORT] Fichier uploadé : {file_path}")

    def upload_file_by_clicking_dropzone(self, file_path: str):
        """
        Alternative : clique sur la zone de drop puis utilise send_keys sur le file input.
        Utile si le file input est caché (display:none).
        """
        # Cliquer sur la zone de dépôt
        dropzone = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_FILE_DROPZONE)))
        dropzone.click()

        # Le file input est maintenant interactif
        file_input = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_FILE_INPUT)
        file_input.send_keys(file_path)

        # Attendre le nom du fichier
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_FILE_NAME)))
        except Exception:
            pass
        print(f"[IMPORT_EXPORT] Fichier uploadé via dropzone : {file_path}")

    # -------------------------------------------------------------------------
    # Boutons d'action
    # -------------------------------------------------------------------------

    def click_download_template(self):
        """Clique sur le bouton 'Télécharger le template'."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BUTTON_TEMPLATE))).click()
        print("[IMPORT_EXPORT] Bouton 'Télécharger le template' cliqué.")

    def click_import(self):
        """Clique sur le bouton 'Importer la maquette'."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BUTTON_IMPORT))).click()
        print("[IMPORT_EXPORT] Bouton 'Importer la maquette' cliqué.")

    def click_reset(self):
        """Clique sur le bouton 'Réinitialiser'."""
        self.wait.until(EC.element_to_be_clickable((By.XPATH, SELECTOR_BUTTON_RESET))).click()
        print("[IMPORT_EXPORT] Bouton 'Réinitialiser' cliqué.")

    # -------------------------------------------------------------------------
    # Vérification du rapport d'import
    # -------------------------------------------------------------------------

    def wait_for_import_result(self, timeout=LONG_TIMEOUT):
        """Attend l'affichage du rapport d'import."""
        self.long_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "*[class*='bg-gray-50']")))
        print("[IMPORT_EXPORT] Rapport d'import affiché.")

    def get_imported_count(self) -> int:
        """Récupère le nombre d'éléments importés avec succès."""
        try:
            # Le compteur est dans un div avec text-2xl.font-bold.text-gray-900
            elements = self.driver.find_elements(By.CSS_SELECTOR, ".text-2xl.font-bold.text-gray-900")
            if elements:
                return int(elements[0].text.strip())
        except Exception:
            pass
        return 0

    def get_error_count(self) -> int:
        """Récupère le nombre d'erreurs."""
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, ".text-2xl.font-bold.text-red-600")
            if elements:
                return int(elements[0].text.strip())
        except Exception:
            pass
        return 0

    def get_import_details_count(self) -> int:
        """Récupère le nombre de lignes dans le détail du rapport."""
        try:
            rows = self.driver.find_elements(By.CSS_SELECTOR, "*[class*='divide-y divide-gray-50'] tbody tr")
            return len(rows)
        except Exception:
            return 0

    def get_success_details(self) -> list:
        """Récupère les lignes de succès du rapport."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_REPORT_SUCCESS_CELL)
        return [el.text for el in elements]

    def get_error_details(self) -> list:
        """Récupère les lignes d'erreur du rapport."""
        elements = self.driver.find_elements(By.CSS_SELECTOR, SELECTOR_REPORT_ERROR_CELL)
        return [el.text for el in elements]

    def is_import_successful(self) -> bool:
        """Vérifie que l'import a réussi (errorCount = 0 et importedCount > 0)."""
        self.wait_for_import_result()
        imported = self.get_imported_count()
        errors = self.get_error_count()
        print(f"[IMPORT_EXPORT] Résultat : {imported} importés, {errors} erreurs")
        return imported > 0 and errors == 0

    def wait_for_success_message(self, timeout=LONG_TIMEOUT):
        """Attend l'apparition d'un message de succès."""
        self.long_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='success'], [class*='emerald'], [class*='bg-emerald']")))
        print("[IMPORT_EXPORT] Message de succès détecté.")

    def wait_for_error_message(self, timeout=LONG_TIMEOUT):
        """Attend l'apparition d'un message d'erreur."""
        self.long_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='danger'], [class*='red'], [class*='bg-red']")))
        print("[IMPORT_EXPORT] Message d'erreur détecté.")

    # -------------------------------------------------------------------------
    # Helpers génériques
    # -------------------------------------------------------------------------

    def get_page_title(self) -> str:
        """Récupère le titre de la page."""
        return self.driver.title

    def get_selected_file_name(self) -> str:
        """Récupère le nom du fichier sélectionné dans la zone de drop."""
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_FILE_NAME)
            return el.text.strip()
        except Exception:
            return ""

    def is_file_selected(self) -> bool:
        """Vérifie si un fichier est sélectionné."""
        return len(self.get_selected_file_name()) > 0

    def reset_import(self):
        """Réinitialise l'import (vide le fichier sélectionné et le rapport)."""
        self.click_reset()
        time.sleep(1)
        print("[IMPORT_EXPORT] Import réinitialisé.")

    def is_import_form_ready(self) -> bool:
        """Vérifie que le formulaire d'import est prêt (type et format sélectionnés)."""
        try:
            import_type = self.driver.find_element(By.XPATH, SELECTOR_IMPORT_TYPE_XPATH).get_attribute("value")
            import_format = self.driver.find_element(By.XPATH, SELECTOR_IMPORT_FORMAT_XPATH).get_attribute("value")
            return import_type is not None and import_format is not None
        except Exception:
            return False
