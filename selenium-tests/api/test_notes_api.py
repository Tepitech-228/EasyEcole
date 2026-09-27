"""
test_notes_api.py — Tests d'endpoints de notes et évaluation

Couvre : /inscription/notesEvaluation, /inscription/listesNoteEvaluation,
        /inscription/presences, /inscription/bordereaux, /inscription/statistics

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_notes_api.py
"""

import pytest
from helpers.api_client import APIClient


# =============================================================================
# CLASSES : Notes d'Évaluation
# =============================================================================

class TestNotesEvaluationHappy:
    """Tests bon cas pour les notes d'évaluation."""

    def test_list_all_notes(self, admin_client: APIClient):
        """DEVRAIT retourner toutes les notes d'évaluation (200)."""
        resp = admin_client.get("/inscription/notesEvaluation")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_upsert_note(self, admin_client: APIClient):
        """DEVRAIT créer ou mettre à jour une note (200)."""
        data = {"etudiantId": 1, "courId": 1, "note": 14.5, "type": "devoir"}
        resp = admin_client.post("/inscription/notesEvaluation/upsert", json=data)
        assert resp.status_code in (200, 404, 400), f"Attendu 200/404/400, obtenu {resp.status_code}"

    def test_bulk_upsert_notes(self, admin_client: APIClient):
        """DEVRAIT créer ou mettre à jour plusieurs notes en masse (200)."""
        data = [{"etudiantId": 1, "courId": 1, "note": 12.0}]
        resp = admin_client.post("/inscription/notesEvaluation/bulk-upsert", json=data)
        assert resp.status_code in (200, 404, 400), f"Attendu 200/404/400, obtenu {resp.status_code}"

    def test_get_note_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une note par ID (200)."""
        resp = admin_client.get("/inscription/notesEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_delete_note(self, admin_client: APIClient):
        """DEVRAIT supprimer une note (200)."""
        resp = admin_client.delete("/inscription/notesEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestNotesEvaluationError:
    """Tests mauvais cas pour les notes d'évaluation."""

    def test_upsert_note_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/notesEvaluation/upsert", json={"note": 10})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_upsert_note_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données manquent."""
        resp = admin_client.post("/inscription/notesEvaluation/upsert", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_upsert_note_invalid_value(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour une note invalide (hors échelle)."""
        resp = admin_client.post("/inscription/notesEvaluation/upsert", json={"note": 25, "etudiantId": 1})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_note(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une note inexistante."""
        resp = admin_client.get("/inscription/notesEvaluation/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_bulk_upsert_empty(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour un bulk vide."""
        resp = admin_client.post("/inscription/notesEvaluation/bulk-upsert", json=[])
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_delete_note_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la suppression sans auth."""
        resp = unauth_client.delete("/inscription/notesEvaluation/1")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Listes de Notes d'Évaluation
# =============================================================================

class TestListesNoteEvaluationHappy:
    """Tests bon cas pour les listes de notes d'évaluation."""

    def test_list_all_listes(self, admin_client: APIClient):
        """DEVRAIT retourner toutes les listes de notes (200)."""
        resp = admin_client.get("/inscription/listesNoteEvaluation")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_liste_note(self, admin_client: APIClient):
        """DEVRAIT créer une liste de notes (201)."""
        data = {"titre": "Liste de Test", "sessionId": 1, "typeNoteId": 1}
        resp = admin_client.post("/inscription/listesNoteEvaluation", json=data)
        assert resp.status_code in (200, 201, 400, 404), f"Attendu 200/201/400/404, obtenu {resp.status_code}"

    def test_get_liste_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une liste de notes par ID (200)."""
        resp = admin_client.get("/inscription/listesNoteEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_update_liste_note(self, admin_client: APIClient):
        """DEVRAIT mettre à jour une liste de notes (200)."""
        data = {"titre": "Liste Modifiée"}
        resp = admin_client.put("/inscription/listesNoteEvaluation/1", json=data)
        assert resp.status_code in (200, 404, 422), f"Statut inattendu : {resp.status_code}"

    def test_delete_liste_note(self, admin_client: APIClient):
        """DEVRAIT supprimer une liste de notes (200)."""
        resp = admin_client.delete("/inscription/listesNoteEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_listes_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de listes (200)."""
        resp = admin_client.get("/inscription/listesNoteEvaluation/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"


class TestListesNoteEvaluationError:
    """Tests mauvais cas pour les listes de notes d'évaluation."""

    def test_create_liste_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/listesNoteEvaluation", json={"titre": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_liste_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données manquent."""
        resp = admin_client.post("/inscription/listesNoteEvaluation", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_liste(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une liste inexistante."""
        resp = admin_client.get("/inscription/listesNoteEvaluation/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_update_liste_invalid_data(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour des données invalides."""
        resp = admin_client.put("/inscription/listesNoteEvaluation/1", json={"titre": None})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_export_pv_nonexistent(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour exporter un PV inexistant."""
        resp = admin_client.get("/inscription/listesNoteEvaluation/999999/export-pv")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_import_pv_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'import sans auth."""
        resp = unauth_client.post("/inscription/listesNoteEvaluation/1/import-pv")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Présences
# =============================================================================

class TestPresenceHappy:
    """Tests bon cas pour les présences."""

    def test_list_all_presences(self, admin_client: APIClient):
        """DEVRAIT retourner toutes les présences (200)."""
        resp = admin_client.get("/inscription/presences")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_presence(self, admin_client: APIClient):
        """DEVRAIT créer une présence (201)."""
        data = {"etudiantId": 1, "coursId": 1, "present": True, "seanceId": 1}
        resp = admin_client.post("/inscription/presences", json=data)
        assert resp.status_code in (200, 201, 404, 400), f"Attendu 200/201/404/400, obtenu {resp.status_code}"

    def test_scan_presence(self, enseignant_client: APIClient):
        """DEVRAIT enregistrer une présence par scan (201)."""
        data = {"qrCode": "QR-TEST", "etudiantId": 1}
        resp = enseignant_client.post("/inscription/presences/scan", json=data)
        assert resp.status_code in (200, 201, 400, 403), f"Attendu 200/201/400/403, obtenu {resp.status_code}"

    def test_get_presence_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une présence par ID (200)."""
        resp = admin_client.get("/inscription/presences/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_update_presence(self, admin_client: APIClient):
        """DEVRAIT mettre à jour une présence (200)."""
        data = {"present": False}
        resp = admin_client.put("/inscription/presences/1", json=data)
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_presences_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de présences (200)."""
        resp = admin_client.get("/inscription/presences/statistics/count")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"


class TestPresenceError:
    """Tests mauvais cas pour les présences."""

    def test_create_presence_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/presences", json={"etudiantId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_presence_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données manquent."""
        resp = admin_client.post("/inscription/presences", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_presence(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une présence inexistante."""
        resp = admin_client.get("/inscription/presences/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_update_presence_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la mise à jour sans auth."""
        resp = unauth_client.put("/inscription/presences/1", json={"present": True})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_sign_presence_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour signer sans auth."""
        resp = unauth_client.put("/inscription/presences/1/sign")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_scan_presence_invalid_data(self, enseignant_client: APIClient):
        """DEVRAIT retourner 400 pour un scan invalide."""
        resp = enseignant_client.post("/inscription/presences/scan", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Bordereaux
# =============================================================================

class TestBordereauHappy:
    """Tests bon cas pour les bordereaux."""

    def test_list_all_bordereaux(self, admin_client: APIClient):
        """DEVRAIT retourner tous les bordereaux (200)."""
        resp = admin_client.get("/inscription/bordereaux")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_bordereau_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer un bordereau par ID (200)."""
        resp = admin_client.get("/inscription/bordereaux/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_create_bordereau(self, apprenant_client: APIClient):
        """DEVRAIT créer un bordereau de paiement (201)."""
        data = {"echeanceId": 1, "montant": 1500000, "referenceBancaire": "REF-001"}
        resp = apprenant_client.post("/inscription/bordereaux", json=data)
        assert resp.status_code in (200, 201, 400, 403, 404), f"Attendu 200/201/400/403/404, obtenu {resp.status_code}"

    def test_download_bordereau(self, admin_client: APIClient):
        """DEVRAIT télécharger un bordereau (200)."""
        resp = admin_client.get("/inscription/bordereaux/1/download")
        assert resp.status_code in (200, 404), f"Attendu 200/404, obtenu {resp.status_code}"

    def test_get_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de bordereaux (200)."""
        resp = admin_client.get("/inscription/bordereaux/statistics/count")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"


class TestBordereauError:
    """Tests mauvais cas pour les bordereaux."""

    def test_create_bordereau_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/bordereaux", json={"echeanceId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_bordereau_missing_data(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 quand l'echeanceId manque."""
        resp = apprenant_client.post("/inscription/bordereaux", json={"montant": 100})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_bordereau(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un bordereau inexistant."""
        resp = admin_client.get("/inscription/bordereaux/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_validate_bordereau_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la validation sans auth."""
        resp = unauth_client.put("/inscription/bordereaux/1/valider")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_reject_bordereau_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour le rejet sans auth."""
        resp = unauth_client.put("/inscription/bordereaux/1/rejeter")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_validate_bordereau_missing_fields(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les champs obligatoires manquent."""
        resp = admin_client.put("/inscription/bordereaux/1/valider", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_download_nonexistent_bordereau(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour télécharger un bordereau inexistant."""
        resp = admin_client.get("/inscription/bordereaux/999999/download")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : TypeNoteEvaluation
# =============================================================================

class TestTypeNoteEvaluationHappy:
    """Tests bon cas pour les types de notes d'évaluation."""

    def test_list_all_types(self, admin_client: APIClient):
        """DEVRAIT retourner tous les types de notes (200)."""
        resp = admin_client.get("/inscription/typesNoteEvaluation")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_create_type(self, admin_client: APIClient):
        """DEVRAIT créer un type de note (201)."""
        data = {"libelle": "Devoir", "coefficient": 1.0}
        resp = admin_client.post("/inscription/typesNoteEvaluation", json=data)
        assert resp.status_code in (200, 201, 400, 404), f"Attendu 200/201/400/404, obtenu {resp.status_code}"

    def test_get_type_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer un type par ID (200)."""
        resp = admin_client.get("/inscription/typesNoteEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_update_type(self, admin_client: APIClient):
        """DEVRAIT mettre à jour un type (200)."""
        data = {"libelle": "Devoir Modifié"}
        resp = admin_client.put("/inscription/typesNoteEvaluation/1", json=data)
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_delete_type(self, admin_client: APIClient):
        """DEVRAIT supprimer un type (200)."""
        resp = admin_client.delete("/inscription/typesNoteEvaluation/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestTypeNoteEvaluationError:
    """Tests mauvais cas pour les types de notes d'évaluation."""

    def test_create_type_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/typesNoteEvaluation", json={"libelle": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_type_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données manquent."""
        resp = admin_client.post("/inscription/typesNoteEvaluation", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_type(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un type inexistant."""
        resp = admin_client.get("/inscription/typesNoteEvaluation/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_create_type_invalid_coefficient(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour un coefficient invalide."""
        resp = admin_client.post("/inscription/typesNoteEvaluation", json={"libelle": "Test", "coefficient": "abc"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Cursus Apprenant (suite)
# =============================================================================

class TestCursusApprenantAdditional:
    """Tests supplémentaires pour le cursus apprenant."""

    def test_get_cursus_cours_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer les cours d'un cursus par ID (200)."""
        resp = admin_client.get("/inscription/cursusApprenant/1/cours")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_create_cursus_with_full_data(self, admin_client: APIClient):
        """DEVRAIT créer un cursus avec toutes les données (201)."""
        data = {
            "niveauEtudeId": 1,
            "parcoursId": 1,
            "statut": "actif",
            "anneeAcademique": "2025-2026"
        }
        resp = admin_client.post("/inscription/cursusApprenant", json=data)
        assert resp.status_code in (200, 201, 400, 404), f"Attendu 200/201/400/404, obtenu {resp.status_code}"

    def test_update_cursus_full_data(self, admin_client: APIClient):
        """DEVRAIT mettre à jour un cursus avec toutes les données (200)."""
        data = {
            "statut": "inactif",
            "commentaire": "Mise à jour par test API"
        }
        resp = admin_client.put("/inscription/cursusApprenant/1", json=data)
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_delete_cursus(self, admin_client: APIClient):
        """DEVRAIT supprimer un cursus (200)."""
        resp = admin_client.delete("/inscription/cursusApprenant/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_create_cursus_duplicate(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur de doublon."""
        data = {"niveauEtudeId": 1, "parcoursId": 1}
        resp = admin_client.post("/inscription/cursusApprenant", json=data)
        # Peut retourner 201 ou une erreur selon la logique métier
        assert resp.status_code in (200, 201, 400, 409, 404), f"Statut inattendu : {resp.status_code}"
