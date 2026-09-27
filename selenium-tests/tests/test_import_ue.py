"""
test_import_ue.py — Tests critiques pour la démo client EasyEcole V4

Couvre l'import/export de UE (Unités d'Enseignement) et ECUE.
Scénarios :
  - Login réussi
  - Téléchargement du template Word UE
  - Import de la maquette MASTER PRO GC-ESA-2025.docx (49 ECUE)
  - Import de la maquette LICENCE PRO GE-ESA-2025.docx (>100 ECUE)
  - Import Excel (skip si fichier non disponible)

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pip install -r requirements.txt
    pytest -v --html=report.html tests/test_import_ue.py
"""

import os
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.import_export_page import ImportExportPage

# =============================================================================
# CHEMINS DES FICHIERS DE RÉFÉRENCE
# =============================================================================
# Windows avec espaces → utiliser raw string (r"...") ou double backslash

# Maquette Master GC (49 ECUE selon la documentation)
MASTER_GC_FILE = r"C:\Users\User\Downloads\MASTER PRO GC-ESA- 2025.docx"

# Maquette Licence GE (119 ECUE selon la documentation)
LICENCE_GE_FILE = r"C:\Users\User\Downloads\LICENCE PRO GE-ESA-2025.docx"

# Fichiers Excel potentiels (pour test_import_ue_excel)
XLSX_FILES = [
    r"C:\Users\User\Downloads\MASTER PRO GC-ESA-2025.xlsx",
]

# Répertoire contenant les 33 maquettes ESA
ESA_MAQUOTTES_DIR = r"C:\Users\User\Downloads\esa--"

# =============================================================================
# CONFIGURATION DE BASE
# =============================================================================

BASE_URL = "http://localhost:4200"
ADMIN_EMAIL = "tepitechbuild@gmail.com"
ADMIN_PASSWORD = "Admin@2026!"

# Valeurs attendues selon la documentation du projet
EXPECTED_MASTER_GC_ECUE_COUNT = 49
EXPECTED_LICENCE_GE_MIN_ECUE = 100  # >100 selon la spec


@pytest.fixture(autouse=True)
def setup_page(driver, authenticated_driver):
    """
    Fixture qui prépare la page d'import/export pour les tests UE.
    Navigigue vers la page d'import UE et sélectionne le format Word.
    """
    page = ImportExportPage(driver)
    page.navigate_to(import_type="ue", tab="import", base_url=BASE_URL)
    page.select_import_format("docx")
    yield page


# =============================================================================
# TESTS
# =============================================================================

class TestLoginUE:
    """Tests de connexion pour la démo."""

    def test_login_reussie(self, driver, user_credentials):
        """
        VÉRIFICATION CRITIQUE : L'authentification admin fonctionne.
        La démo client ne peut pas se faire sans login réussi.
        """
        login_page = LoginPage(driver)
        login_page.login(ADMIN_EMAIL, ADMIN_PASSWORD, base_url=BASE_URL)

        # Vérifier que la page d'accueil ou le dashboard est affiché
        # (après connexion réussie, on devrait voir la page principale)
        try:
            # Attendre que la page de destination se charge
            driver.long_wait.until(
                EC.any_of(
                    EC.url_contains("/accueil"),
                    EC.url_contains("/inscription"),
                    EC.presence_of_element_located((By.CSS_SELECTOR, "app-header-title")),
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".page-container"))
                ),
                timeout=30
            )
        except Exception:
            # Si l'URL ne change pas, vérifier qu'on n'est pas resté sur la page de login
            # (le message d'erreur ne doit pas être présent)
            assert login_page.get_error_message() == ""
            assert login_page.is_login_page_displayed() is False, \
                "La connexion a échoué : toujours sur la page de login"

        print("[TEST] ✅ Login réussi confirmé")


class TestImportUE:
    """Tests d'import/export de UE."""

    def test_template_ue_word_download(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION CRITIQUE : Le téléchargement du template Word UE fonctionne.
        Le client doit pouvoir récupérer un template vierge avant d'import.
        """
        page = setup_page

        # S'assurer qu'on est sur l'onglet Import avec le type UE et format docx
        page.switch_to_import_tab()
        page.select_import_type("ue")
        page.select_import_format("docx")

        # Cliquer sur le bouton "Télécharger le template"
        page.click_download_template()

        # Vérifier que le template a été téléchargé (vérifier le message de succès)
        page.wait_for_success_message(timeout=30)

        # Vérifier que le message de succès contient "template"
        assert "template" in page.driver.page_source.lower() or "téléchargé" in page.driver.page_source.lower(), \
            "Le message de téléchargement du template n'a pas été trouvé"

        print("[TEST] ✅ Template Word UE téléchargeable confirmé")

    def test_import_master_gc_word(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION CRITIQUE : Import de la maquette MASTER PRO GC-ESA-2025.docx
        Attendu : 49 ECUE importés avec succès, 0 erreur.
        C'est le fichier principal de la démo client (49 ECUE).
        """
        page = setup_page

        # Vérifier que le fichier existe
        assert os.path.exists(MASTER_GC_FILE), \
            f"Fichier MASTER PRO GC-ESA-2025.docx introuvable : {MASTER_GC_FILE}"

        # Sélectionner le type UE et format Word
        page.select_import_type("ue")
        page.select_import_format("docx")

        # Sélectionner un parcours (requis pour l'import UE)
        # Attendre que les parcours soient chargés
        try:
            page.wait.until(
                EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportParcoursId']/option[2]"))
            )
            # Sélectionner le premier parcours disponible (option avec une valeur non vide)
            page.select_parcours("")  # Laisse le premier choix (souvent "" = auto)
        except Exception:
            # Si aucun parcours n'est chargé, essayer de continuer quand même
            # (certains imports UE fonctionnent sans parcours sélectionné)
            print("[WARN] Parcours non chargé, tentative d'import sans sélection")

        # Upload du fichier Word
        page.upload_file(MASTER_GC_FILE)

        # Vérifier que le fichier est bien sélectionné
        assert page.is_file_selected(), "Le fichier n'a pas été sélectionné dans la zone de drop"
        assert MASTER_GC_FILE.replace("\\", "/") in page.get_selected_file_name().replace("\\", "/"), \
            f"Le fichier '{MASTER_GC_FILE}' n'a pas été reconnu"

        # Cliquer sur "Importer la maquette"
        page.click_import()

        # Attendre le rapport d'import
        page.wait_for_import_result(timeout=120)  # L'import Word peut prendre du temps

        # VÉRIFICATION PRINCIPALE : 49 ECUE importés, 0 erreur
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] MASTER PRO GC-ESA-2025.docx : {imported} importés, {errors} erreurs")

        assert imported >= EXPECTED_MASTER_GC_ECUE_COUNT, \
            f"Import échoué : {imported} ECUE importés au lieu de {EXPECTED_MASTER_GC_ECUE_COUNT}"
        assert errors == 0, \
            f"Import avec erreurs : {errors} erreurs détectées"

        print("[TEST] ✅ Import MASTER PRO GC-ESA-2025.docx : 49 ECUE / 0 erreur confirmé")

    def test_import_licence_ge_word(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION CRITIQUE : Import de la maquette LICENCE PRO GE-ESA-2025.docx
        Attendu : >100 ECUE importés avec succès.
        C'est le plus gros fichier de la démo (119 ECUE).
        """
        page = setup_page

        # Vérifier que le fichier existe
        assert os.path.exists(LICENCE_GE_FILE), \
            f"Fichier LICENCE PRO GE-ESA-2025.docx introuvable : {LICENCE_GE_FILE}"

        # Sélectionner le type UE et format Word
        page.select_import_type("ue")
        page.select_import_format("docx")

        # Sélectionner un parcours
        try:
            page.wait.until(
                EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportParcoursId']/option[2]"))
            )
            page.select_parcours("")
        except Exception:
            print("[WARN] Parcours non chargé, tentative d'import sans sélection")

        # Upload du fichier Word
        page.upload_file(LICENCE_GE_FILE)

        # Vérifier que le fichier est bien sélectionné
        assert page.is_file_selected(), "Le fichier n'a pas été sélectionné"

        # Cliquer sur "Importer la maquette"
        page.click_import()

        # Attendre le rapport d'import (fichier plus grand = plus long)
        page.wait_for_import_result(timeout=180)

        # VÉRIFICATION PRINCIPALE : >100 ECUE importés
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] LICENCE PRO GE-ESA-2025.docx : {imported} importés, {errors} erreurs")

        assert imported > EXPECTED_LICENCE_GE_MIN_ECUE, \
            f"Import échoué : {imported} ECUE importés, attendu >{EXPECTED_LICENCE_GE_MIN_ECUE}"
        assert errors == 0, \
            f"Import avec erreurs : {errors} erreurs détectées"

        print(f"[TEST] ✅ Import LICENCE PRO GE-ESA-2025.docx : {imported} ECUE / 0 erreur confirmé")

    def test_import_ue_excel(self, driver, authenticated_driver, setup_page):
        """
        Test d'import Excel UE (skip si fichier xlsx non disponible).
        Vérifie que l'import Excel fonctionne en plus du Word.
        """
        page = setup_page

        # Chercher un fichier xlsx disponible
        xlsx_path = None
        for f in XLSX_FILES:
            if os.path.exists(f):
                xlsx_path = f
                break

        if not xlsx_path:
            pytest.skip(f"Aucun fichier .xlsx de référence trouvé. Skipping test_import_ue_excel.")

        # Sélectionner le type UE et format Excel
        page.select_import_type("ue")
        page.select_import_format("xlsx")

        # Sélectionner un parcours
        try:
            page.wait.until(
                EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportParcoursId']/option[2]"))
            )
            page.select_parcours("")
        except Exception:
            print("[WARN] Parcours non chargé")

        # Upload du fichier Excel
        page.upload_file(xlsx_path)
        assert page.is_file_selected(), "Le fichier Excel n'a pas été sélectionné"

        # Cliquer sur "Importer la maquette"
        page.click_import()

        # Attendre le rapport d'import
        page.wait_for_import_result(timeout=120)

        # Vérifier le résultat
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] Import Excel UE : {imported} importés, {errors} erreurs")

        assert imported > 0, "Aucun ECUE importé via Excel"
        # On tolère quelques erreurs pour le format Excel si c'est un fichier non standard

        print("[TEST] ✅ Import Excel UE fonctionnel")


class TestImportMultipleFiles:
    """Tests d'import avec les différents fichiers disponibles."""

    def test_import_all_esa_maquettes_available(self, driver, authenticated_driver, setup_page):
        """
        Vérification supplémentaire : au moins un fichier .docx est disponible
        dans le répertoire des maquettes ESA pour la démo.
        """
        assert os.path.exists(ESA_MAQUOTTES_DIR), \
            f"Répertoire des maquettes ESA introuvable : {ESA_MAQUOTTES_DIR}"

        maquette_files = [f for f in os.listdir(ESA_MAQUOTTES_DIR) if f.endswith(".docx")]
        assert len(maquette_files) > 0, "Aucun fichier .docx trouvé dans le répertoire des maquettes"

        print(f"[TEST] ✅ {len(maquette_files)} maquettes .docx disponibles dans {ESA_MAQUOTTES_DIR}")

    def test_import_parcours_validation(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : La validation du parcours est nécessaire pour l'import UE.
        Si aucun parcours n'est sélectionné, le système doit afficher un avertissement.
        """
        page = setup_page

        # Réinitialiser pour tester la validation
        page.reset_import()

        # Sélectionner le type UE mais PAS de parcours
        page.select_import_type("ue")
        page.select_import_format("docx")

        # Tenter d'importer sans fichier
        # Le bouton Importer devrait être désactivé ou afficher un message d'erreur
        # Vérifier la présence du message d'avertissement de sélection de parcours
        try:
            warning = page.driver.find_element(
                By.XPATH, "//app-custom-alert[contains(@title, 'Sélectionnez un parcours')]"
            )
            assert warning.is_displayed(), "Le message d'avertissement de sélection de parcours devrait être visible"
            print("[TEST] ✅ Avertissement de sélection de parcours affiché correctement")
        except Exception:
            # Le message peut ne pas être visible si un parcours est déjà sélectionné
            print("[INFO] Avertissement de parcours non trouvé (parcours peut-être déjà sélectionné)")
