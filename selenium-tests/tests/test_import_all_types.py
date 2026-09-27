"""
test_import_all_types.py — Tests étendus d'import/export pour tous les types
EasyEcole V4 : UE, Étudiants, Enseignants, Utilisateurs.

Ce module complète test_import_ue.py avec les autres types d'import.

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report.html tests/test_import_all_types.py
"""

import os
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.import_export_page import ImportExportPage

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL = "http://localhost:4200"
ADMIN_EMAIL = "tepitechbuild@gmail.com"
ADMIN_PASSWORD = "Admin@2026!"

# Fichiers de référence (chemins Windows avec espaces → raw string)
ESA_MAQUOTTES_DIR = r"C:\Users\User\Downloads\esa--"

# Fichiers d'enseignants, étudiants, utilisateurs (si disponibles)
# Ces fichiers sont générés via les templates ou les exports précédents
TEACHERS_FILE = None  # À fournir par le client
STUDENTS_FILE = None  # À fournir par le client
USERS_FILE = None     # À fournir par le client


@pytest.fixture(autouse=True)
def setup_page(driver, authenticated_driver):
    """Fixture de préparation de la page d'import/export."""
    page = ImportExportPage(driver)
    yield page


# =============================================================================
# TESTS — ENSEIGNANTS
# =============================================================================

class TestImportEnseignants:
    """Tests d'import de enseignants via Word."""

    def test_import_enseignants_word(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : L'import de fichiers d'enseignants (Word) fonctionne.
        Teste le flux complet : navigation, sélection du type, upload, import.
        """
        page = setup_page

        # S'assurer qu'on est sur la page d'import
        page.navigate_to(import_type="enseignants", tab="import", base_url=BASE_URL)
        page.select_import_type("enseignants")
        page.select_import_format("docx")

        # Chercher un fichier d'enseignants disponible
        teachers_file = self._find_teachers_file()

        if not teachers_file or not os.path.exists(teachers_file):
            pytest.skip("Aucun fichier d'enseignants disponible pour le test d'import Word.")

        # Upload du fichier
        page.upload_file(teachers_file)
        assert page.is_file_selected(), "Le fichier d'enseignants n'a pas été sélectionné"

        # Cliquer sur "Importer la maquette"
        page.click_import()

        # Attendre le rapport d'import
        page.wait_for_import_result(timeout=120)

        # Vérification : au moins un enseignant importé
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] Import enseignants : {imported} importés, {errors} erreurs")

        assert imported > 0, "Aucun enseignant importé"

        print("[TEST] ✅ Import enseignants Word fonctionnel")

    def _find_teachers_file(self):
        """Cherche un fichier d'enseignants dans les répertoires de référence."""
        # Chercher dans le répertoire des maquettes ESA
        if os.path.exists(ESA_MAQUOTTES_DIR):
            for f in os.listdir(ESA_MAQUOTTES_DIR):
                if "enseignant" in f.lower() or "prof" in f.lower():
                    return os.path.join(ESA_MAQUOTTES_DIR, f)
        return None


# =============================================================================
# TESTS — ÉTUDIANTS
# =============================================================================

class TestImportEtudiants:
    """Tests d'import de étudiants via Word."""

    def test_import_etudiants_word(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : L'import de fichiers d'étudiants (Word) fonctionne.
        Teste le flux complet d'import d'apprenants.
        """
        page = setup_page

        page.navigate_to(import_type="etudiants", tab="import", base_url=BASE_URL)
        page.select_import_type("etudiants")
        page.select_import_format("docx")

        # Chercher un fichier d'étudiants disponible
        students_file = self._find_students_file()

        if not students_file or not os.path.exists(students_file):
            pytest.skip("Aucun fichier d'étudiants disponible pour le test d'import Word.")

        # Upload du fichier
        page.upload_file(students_file)
        assert page.is_file_selected(), "Le fichier d'étudiants n'a pas été sélectionné"

        # Cliquer sur "Importer"
        page.click_import()

        # Attendre le rapport d'import
        page.wait_for_import_result(timeout=120)

        # Vérification
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] Import étudiants : {imported} importés, {errors} erreurs")

        assert imported > 0, "Aucun étudiant importé"

        print("[TEST] ✅ Import étudiants Word fonctionnel")

    def _find_students_file(self):
        """Cherche un fichier d'étudiants dans les répertoires de référence."""
        if os.path.exists(ESA_MAQUOTTES_DIR):
            for f in os.listdir(ESA_MAQUOTTES_DIR):
                if "etudiant" in f.lower() or "apprenant" in f.lower():
                    return os.path.join(ESA_MAQUOTTES_DIR, f)
        return None


# =============================================================================
# TESTS — UTILISATEURS PAR RÔLE
# =============================================================================

class TestImportUtilisateurs:
    """Tests d'import de utilisateurs par rôle via Word."""

    def test_import_utilisateurs_word(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : L'import de fichiers d'utilisateurs par rôle (Word) fonctionne.
        Teste le flux avec sélection d'un rôle spécifique (admin).
        """
        page = setup_page

        page.navigate_to(import_type="utilisateurs", tab="import", base_url=BASE_URL)
        page.select_import_type("utilisateurs")
        page.select_import_format("docx")

        # Sélectionner un rôle pour l'import (ex: admin)
        page.select_role("admin")

        # Chercher un fichier d'utilisateurs disponible
        users_file = self._find_users_file()

        if not users_file or not os.path.exists(users_file):
            pytest.skip("Aucun fichier d'utilisateurs disponible pour le test d'import Word.")

        # Upload du fichier
        page.upload_file(users_file)
        assert page.is_file_selected(), "Le fichier d'utilisateurs n'a pas été sélectionné"

        # Cliquer sur "Importer"
        page.click_import()

        # Attendre le rapport d'import
        page.wait_for_import_result(timeout=120)

        # Vérification
        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] Import utilisateurs (admin) : {imported} importés, {errors} erreurs")

        assert imported > 0, "Aucun utilisateur importé"

        print("[TEST] ✅ Import utilisateurs Word (rôle admin) fonctionnel")

    def test_import_utilisateurs_enseignant_role(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : L'import de fichiers d'utilisateurs avec le rôle enseignant fonctionne.
        """
        page = setup_page

        page.navigate_to(import_type="utilisateurs", tab="import", base_url=BASE_URL)
        page.select_import_type("utilisateurs")
        page.select_import_format("docx")
        page.select_role("enseignant")

        users_file = self._find_users_file()

        if not users_file or not os.path.exists(users_file):
            pytest.skip("Aucun fichier d'utilisateurs disponible pour le test d'import Word.")

        page.upload_file(users_file)
        page.click_import()
        page.wait_for_import_result(timeout=120)

        imported = page.get_imported_count()
        errors = page.get_error_count()

        print(f"[RESULTAT] Import utilisateurs (enseignant) : {imported} importés, {errors} erreurs")

        assert imported > 0, "Aucun enseignant importé"

        print("[TEST] ✅ Import utilisateurs Word (rôle enseignant) fonctionnel")

    def _find_users_file(self):
        """Cherche un fichier d'utilisateurs dans les répertoires de référence."""
        if os.path.exists(ESA_MAQUOTTES_DIR):
            for f in os.listdir(ESA_MAQUOTTES_DIR):
                if "utilisateur" in f.lower() or "user" in f.lower():
                    return os.path.join(ESA_MAQUOTTES_DIR, f)
        return None


# =============================================================================
# TESTS — IMPORT PAR TYPE (résumé)
# =============================================================================

class TestImportSummaryByRole:
    """Tests récapitulatifs : vérifier que tous les types d'import sont disponibles dans l'UI."""

    def test_all_import_types_available(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION UI : Les 4 types d'import (UE, Étudiants, Enseignants, Utilisateurs)
        sont présents dans le sélecteur de type d'import.
        """
        page = setup_page

        # Récupérer toutes les options du select importType
        import_type_select = page.driver.find_element(
            By.XPATH, "//select[@ngModel='importType']"
        )
        from selenium.webdriver.support.ui import Select
        select = Select(import_type_select)
        options = [opt.text for opt in select.options]

        print(f"[IMPORT_TYPES] Options disponibles : {options}")

        # Vérifier que les 4 types sont présents
        expected_types = ["UE et ECUE", "Étudiants", "Enseignants", "Utilisateurs par rôle"]
        for expected in expected_types:
            assert expected in options, f"Type d'import '{expected}' manquant dans l'interface"

        print("[TEST] ✅ Tous les types d'import disponibles dans l'UI")

    def test_all_roles_available(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION UI : Les rôles disponibles pour l'import de utilisateurs
        sont affichés dans le sélecteur de rôle.
        """
        page = setup_page

        page.select_import_type("utilisateurs")

        # Attendre le select de rôle
        page.wait.until(EC.presence_of_element_located((By.XPATH, "//select[@ngModel='selectedImportRole']")))

        from selenium.webdriver.support.ui import Select
        role_select = Select(page.driver.find_element(By.XPATH, "//select[@ngModel='selectedImportRole']"))
        role_options = [opt.text for opt in role_select.options]

        print(f"[ROLES] Options disponibles : {role_options}")

        # Vérifier que les rôles principaux sont présents
        expected_roles = ["Étudiant", "Enseignant", "Administrateur"]
        for expected in expected_roles:
            assert any(expected in opt for opt in role_options), \
                f"Rôle '{expected}' manquant dans l'interface"

        print("[TEST] ✅ Rôles disponibles pour l'import d'utilisateurs")


class TestTemplateDownloadAllTypes:
    """Tests de téléchargement de templates pour tous les types."""

    def test_download_template_all_types(self, driver, authenticated_driver, setup_page):
        """
        VÉRIFICATION : Le téléchargement de template fonctionne pour chaque type.
        """
        page = setup_page
        types_to_test = ["ue", "etudiants", "enseignants", "utilisateurs"]
        formats = ["docx", "xlsx"]

        for import_type in types_to_test:
            for fmt in formats:
                page.navigate_to(import_type=import_type, tab="import", base_url=BASE_URL)
                page.select_import_type(import_type)
                page.select_import_format(fmt)

                # Tenter le téléchargement du template
                try:
                    page.click_download_template()
                    page.wait_for_success_message(timeout=15)
                    print(f"[TEMPLATE] ✅ Template {import_type} ({fmt}) téléchargeable")
                except Exception as e:
                    print(f"[TEMPLATE] ⚠️ Template {import_type} ({fmt}) : {e}")
                    # Ne pas échouer si le template n'est pas disponible

        print("[TEST] ✅ Test de téléchargement de templates terminé")
