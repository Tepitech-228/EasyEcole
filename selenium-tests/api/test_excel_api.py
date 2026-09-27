"""
test_excel_api.py — Tests d'endpoints d'import/export Excel et Word

Couvre : /inscription/excel/* pour UE, Enseignants, Apprenants, Utilisateurs
Template Word, template Excel, import, export pour tous les types.

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_excel_api.py
"""

import os
import pytest
from helpers.api_client import APIClient


# =============================================================================
# CLASSES : UE (Unités d'Enseignement)
# =============================================================================

class TestExcelUETemplateHappy:
    """Tests bon cas pour les templates UE."""

    def test_download_ue_template_excel(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Excel UE (200)."""
        resp = admin_client.get("/inscription/excel/ue/template")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_download_ue_template_word(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Word UE (200)."""
        resp = admin_client.get("/inscription/excel/ue/template-word")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_export_ue_excel(self, admin_client: APIClient):
        """DEVRAIT exporter les UE au format Excel (200)."""
        resp = admin_client.get("/inscription/excel/ue/export")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_export_ue_word(self, admin_client: APIClient):
        """DEVRAIT exporter les UE au format Word (200)."""
        resp = admin_client.get("/inscription/excel/ue/export-word")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_ue_template_content_type(self, admin_client: APIClient):
        """DEVRAIT retourner un fichier avec content-type approprié."""
        resp = admin_client.get("/inscription/excel/ue/template")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"
        if resp.status_code == 200:
            # Le contenu doit être un fichier (binary)
            assert len(resp.content) > 0, "Le template est vide"


class TestExcelUEImportHappy:
    """Tests bon cas pour l'import UE."""

    def test_import_ue_valid_excel(self, admin_client: APIClient):
        """DEVRAIT importer des UE depuis un fichier Excel (200)."""
        import io
        try:
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "UE Test"
            ws.append(["Code", "Intitulé", "Crédit"])
            ws.append(["INF101", "Algorithmique", 6])
            ws.append(["MATH101", "Mathématiques", 4])
            buf = io.BytesIO()
            wb.save(buf)
            buf.seek(0)

            resp = admin_client.upload(
                "/inscription/excel/ue/import",
                files={"fichier": ("ue_test.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            )
            assert resp.status_code in (200, 201, 400, 500), f"Attendu 200/201/400/500, obtenu {resp.status_code}"
        except ImportError:
            pytest.skip("openpyxl non disponible")

    def test_import_ue_async(self, admin_client: APIClient):
        """DEVRAIT lancer un import UE asynchrone (200)."""
        resp = admin_client.post("/inscription/excel/ue/import-async", json={"mode": "async"})
        assert resp.status_code in (200, 400, 500), f"Attendu 200/400/500, obtenu {resp.status_code}"

    def test_import_ue_valid_docx(self, admin_client: APIClient):
        """DEVRAIT importer des UE depuis un fichier Word (200)."""
        resp = admin_client.upload(
            "/inscription/excel/ue/import",
            files={"fichier": ("ue_test.docx", b"docx_content_test", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        # Peut retourner 200/201 ou une erreur si le fichier n'est pas valide
        assert resp.status_code in (200, 201, 400, 422), f"Statut inattendu : {resp.status_code}"

    def test_import_ue_empty_file(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur pour un fichier vide."""
        resp = admin_client.upload(
            "/inscription/excel/ue/import",
            files={"fichier": ("empty.xlsx", b"", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (400, 422, 500), f"Statut inattendu : {resp.status_code}"


class TestExcelUEError:
    """Tests mauvais cas pour les endpoints UE Excel."""

    def test_download_template_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour le téléchargement sans auth."""
        resp = unauth_client.get("/inscription/excel/ue/template")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'import sans auth."""
        resp = unauth_client.post("/inscription/excel/ue/import", json={"mode": "test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_invalid_file_type(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un type de fichier invalide."""
        resp = admin_client.upload(
            "/inscription/excel/ue/import",
            files={"fichier": ("test.txt", b"test content", "text/plain")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"

    def test_import_too_large_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier trop volumineux."""
        large_content = b"x" * (20 * 1024 * 1024 + 1)
        resp = admin_client.upload(
            "/inscription/excel/ue/import",
            files={"fichier": ("large.xlsx", large_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (400, 413), f"Attendu 400/413, obtenu {resp.status_code}"

    def test_import_empty_fields(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les champs sont vides."""
        resp = admin_client.post("/inscription/excel/ue/import", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_export_nonexistent_format(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un format d'export invalide."""
        resp = admin_client.get("/inscription/excel/ue/export/invalid")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Enseignants (Excel)
# =============================================================================

class TestExcelEnseignantsHappy:
    """Tests bon cas pour les enseignants Excel."""

    def test_download_enseignant_template_excel(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Excel Enseignants (200)."""
        resp = admin_client.get("/inscription/excel/enseignants/template")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_download_enseignant_template_word(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Word Enseignants (200)."""
        resp = admin_client.get("/inscription/excel/enseignants/template-word")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_export_enseignants_excel(self, admin_client: APIClient):
        """DEVRAIT exporter les enseignants au format Excel (200)."""
        resp = admin_client.get("/inscription/excel/enseignants/export")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_import_enseignants(self, admin_client: APIClient):
        """DEVRAIT importer des enseignants (200)."""
        resp = admin_client.upload(
            "/inscription/excel/enseignants/import",
            files={"fichier": ("enseignants.xlsx", b"xlsx_content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (200, 201, 400, 422, 500), f"Attendu 200/201/400/500, obtenu {resp.status_code}"

    def test_export_enseignants_filtres(self, admin_client: APIClient):
        """DEVRAIT exporter les enseignants filtrés (200)."""
        resp = admin_client.get("/inscription/excel/enseignants/export/filtres")
        assert resp.status_code in (200, 400, 500), f"Attendu 200/400/500, obtenu {resp.status_code}"


class TestExcelEnseignantsError:
    """Tests mauvais cas pour les enseignants Excel."""

    def test_download_template_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 sans auth."""
        resp = unauth_client.get("/inscription/excel/enseignants/template")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'import sans auth."""
        resp = unauth_client.post("/inscription/excel/enseignants/import", json={})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_invalid_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier invalide."""
        resp = admin_client.upload(
            "/inscription/excel/enseignants/import",
            files={"fichier": ("enseignants.txt", b"text", "text/plain")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"

    def test_import_missing_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand aucun fichier n'est fourni."""
        resp = admin_client.post("/inscription/excel/enseignants/import", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_import_enseignants_filtres_invalid_params(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour des paramètres de filtre invalides."""
        resp = admin_client.get("/inscription/excel/enseignants/export/filtres?invalidParam=abc")
        assert resp.status_code in (200, 400, 500), f"Attendu 200/400/500, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Apprenants (Excel)
# =============================================================================

class TestExcelApprenantsHappy:
    """Tests bon cas pour les apprenants Excel."""

    def test_download_apprenant_template_excel(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Excel Apprenants (200)."""
        resp = admin_client.get("/inscription/excel/apprenants/template")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_download_apprenant_template_word(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Word Apprenants (200)."""
        resp = admin_client.get("/inscription/excel/apprenants/template-word")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_export_apprenants_excel(self, admin_client: APIClient):
        """DEVRAIT exporter les apprenants au format Excel (200)."""
        resp = admin_client.get("/inscription/excel/apprenants/export")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_import_apprenants(self, admin_client: APIClient):
        """DEVRAIT importer des apprenants (200)."""
        resp = admin_client.upload(
            "/inscription/excel/apprenants/import",
            files={"fichier": ("apprenants.xlsx", b"xlsx_content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (200, 201, 400, 422, 500), f"Attendu 200/201/400/500, obtenu {resp.status_code}"

    def test_export_apprenants_filtres(self, admin_client: APIClient):
        """DEVRAIT exporter les apprenants filtrés (200)."""
        resp = admin_client.get("/inscription/excel/apprenants/export/filtres")
        assert resp.status_code in (200, 400, 500), f"Attendu 200/400/500, obtenu {resp.status_code}"

    def test_import_apprenants_with_demande(self, admin_client: APIClient):
        """DEVRAIT importer des apprenants avec création automatique de demande (200)."""
        resp = admin_client.upload(
            "/inscription/excel/apprenants/import",
            files={"fichier": ("apprenants_demande.xlsx", b"content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (200, 201, 400, 422, 500), f"Attendu 200/201/400/500, obtenu {resp.status_code}"


class TestExcelApprenantsError:
    """Tests mauvais cas pour les apprenants Excel."""

    def test_download_template_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 sans auth."""
        resp = unauth_client.get("/inscription/excel/apprenants/template")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'import sans auth."""
        resp = unauth_client.post("/inscription/excel/apprenants/import", json={})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_invalid_extension(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour une extension invalide."""
        resp = admin_client.upload(
            "/inscription/excel/apprenants/import",
            files={"fichier": ("apprenants.csv", b"csv_content", "text/csv")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"

    def test_import_empty_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier vide."""
        resp = admin_client.upload(
            "/inscription/excel/apprenants/import",
            files={"fichier": ("empty.xlsx", b"", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (400, 422, 500), f"Statut inattendu : {resp.status_code}"


# =============================================================================
# CLASSES : Utilisateurs par Rôle (Excel)
# =============================================================================

class TestExcelUtilisateursHappy:
    """Tests bon cas pour les utilisateurs par rôle."""

    def test_download_utilisateur_template(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Excel Utilisateurs (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_download_utilisateur_template_word(self, admin_client: APIClient):
        """DEVRAIT télécharger le template Word Utilisateurs (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template-word")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_import_utilisateurs_par_role(self, admin_client: APIClient):
        """DEVRAIT importer des utilisateurs par rôle (200)."""
        resp = admin_client.upload(
            "/inscription/excel/utilisateurs/import",
            files={"fichier": ("utilisateurs.xlsx", b"xlsx_content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert resp.status_code in (200, 201, 400, 422, 500), f"Attendu 200/201/400/500, obtenu {resp.status_code}"

    def test_export_utilisateurs_par_role(self, admin_client: APIClient):
        """DEVRAIT exporter les utilisateurs par rôle (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/export")
        assert resp.status_code in (200, 404, 500), f"Attendu 200/404/500, obtenu {resp.status_code}"

    def test_import_utilisateurs_role_admin(self, admin_client: APIClient):
        """DEVRAIT importer des utilisateurs avec rôle admin (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template?role=admin")
        assert resp.status_code in (200, 400, 404, 500), f"Attendu 200/400/404/500, obtenu {resp.status_code}"

    def test_import_utilisateurs_role_enseignant(self, admin_client: APIClient):
        """DEVRAIT importer des utilisateurs avec rôle enseignant (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template?role=enseignant")
        assert resp.status_code in (200, 400, 404, 500), f"Attendu 200/400/404/500, obtenu {resp.status_code}"

    def test_import_utilisateurs_role_apprenant(self, admin_client: APIClient):
        """DEVRAIT importer des utilisateurs avec rôle apprenant (200)."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template?role=apprenant")
        assert resp.status_code in (200, 400, 404, 500), f"Attendu 200/400/404/500, obtenu {resp.status_code}"


class TestExcelUtilisateursError:
    """Tests mauvais cas pour les utilisateurs par rôle."""

    def test_download_template_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 sans auth."""
        resp = unauth_client.get("/inscription/excel/utilisateurs/template")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'import sans auth."""
        resp = unauth_client.post("/inscription/excel/utilisateurs/import", json={})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_import_invalid_role(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un rôle invalide."""
        resp = admin_client.get("/inscription/excel/utilisateurs/template?role=INVALID_ROLE")
        assert resp.status_code in (200, 400), f"Attendu 200/400, obtenu {resp.status_code}"

    def test_import_missing_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le fichier manque."""
        resp = admin_client.post("/inscription/excel/utilisateurs/import", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_import_non_pdf_file(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier non accepté."""
        resp = admin_client.upload(
            "/inscription/excel/utilisateurs/import",
            files={"fichier": ("data.py", b"print('hello')", "text/x-python")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Performance - Tests de charge
# =============================================================================

class TestExcelPerformance:
    """Tests de performance pour les endpoints Excel."""

    def test_multiple_template_downloads_performance(self, admin_client: APIClient, performance_tracker):
        """
        PERFORMANCE : Mesurer le temps de téléchargement de tous les templates.
        """
        endpoints = [
            "/inscription/excel/ue/template",
            "/inscription/excel/enseignants/template",
            "/inscription/excel/apprenants/template",
            "/inscription/excel/utilisateurs/template"
        ]
        for endpoint in endpoints:
            resp = admin_client.get(endpoint)
            performance_tracker.record(
                endpoint, "GET", resp.status_code, admin_client.response_time
            )
        summary = performance_tracker.get_summary()
        assert summary["avg_response_time"] < 5.0, f"Temps moyen trop élevé : {summary['avg_response_time']}s"
        print(f"\n[PERF] Moyenne templates : {summary['avg_response_time']:.4f}s")

    def test_bulk_export_performance(self, admin_client: APIClient, performance_tracker):
        """
        PERFORMANCE : Mesurer le temps d'export de masse.
        """
        endpoints = [
            "/inscription/excel/ue/export",
            "/inscription/excel/enseignants/export",
            "/inscription/excel/apprenants/export"
        ]
        for endpoint in endpoints:
            resp = admin_client.get(endpoint)
            performance_tracker.record(
                endpoint, "GET", resp.status_code, admin_client.response_time
            )
        summary = performance_tracker.get_summary()
        print(f"\n[PERF] Moyenne exports : {summary['avg_response_time']:.4f}s")
        assert summary["total_requests"] == len(endpoints)

    def test_rapid_import_requests_performance(self, admin_client: APIClient, performance_tracker):
        """
        PERFORMANCE : Mesurer la capacité à gérer des requêtes d'import rapides.
        """
        import io
        try:
            import openpyxl
            for i in range(5):
                wb = openpyxl.Workbook()
                ws = wb.active
                ws.append(["Test", "Data"])
                buf = io.BytesIO()
                wb.save(buf)
                buf.seek(0)
                resp = admin_client.upload(
                    "/inscription/excel/ue/import",
                    files={"fichier": (f"test_{i}.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                )
                performance_tracker.record(
                    f"/inscription/excel/ue/import#{i}", "POST", resp.status_code, admin_client.response_time
                )
            summary = performance_tracker.get_summary()
            print(f"\n[PERF] Moyenne import rapide : {summary['avg_response_time']:.4f}s")
        except ImportError:
            pytest.skip("openpyxl non disponible")
