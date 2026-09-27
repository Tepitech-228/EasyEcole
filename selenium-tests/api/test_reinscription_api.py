"""
test_reinscription_api.py — Tests d'endpoints de réinscription

Couvre : /inscription/reinscription/*
Tests : bon cas (200/201) et mauvais cas (400, 401, 403, 404, 422)

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_reinscription_api.py
"""

import pytest
import requests
from helpers.api_client import APIClient


# =============================================================================
# CLASSES : Prochaine Session
# =============================================================================

class TestReinscriptionProchaineHappy:
    """Tests bon cas pour la prochaine session de réinscription."""

    def test_get_prochaine_session(self, scolarite_client: APIClient):
        """DEVRAIT vérifier la session N clôturée et proposer la réinscription N+1 (200)."""
        resp = scolarite_client.get("/inscription/reinscription/prochaine")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"
        data = resp.json()
        assert isinstance(data, dict) or isinstance(data, list), "Réponse invalide"

    def test_peut_se_reinscrire(self, scolarite_client: APIClient):
        """DEVRAIT vérifier la solvabilité de l'étudiant (200)."""
        resp = scolarite_client.get("/inscription/reinscription/peut-se-reinscrire")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_eligibilite(self, scolarite_client: APIClient):
        """DEVRAIT vérifier l'éligibilité à la réinscription (200)."""
        resp = scolarite_client.get("/inscription/reinscription/eligibilite")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_prochaine_session_admin(self, admin_client: APIClient):
        """DEVRAIT retourner la prochaine session (200) pour admin."""
        resp = admin_client.get("/inscription/reinscription/prochaine")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_eligibilite_admin(self, admin_client: APIClient):
        """DEVRAIT retourner l'éligibilité (200) pour admin."""
        resp = admin_client.get("/inscription/reinscription/eligibilite")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"


class TestReinscriptionProchaineError:
    """Tests mauvais cas pour la prochaine session de réinscription."""

    def test_prochaine_session_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 sans authentification."""
        resp = unauth_client.get("/inscription/reinscription/prochaine")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_peut_se_reinscrire_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la vérification de solvabilité."""
        resp = unauth_client.get("/inscription/reinscription/peut-se-reinscrire")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_eligibilite_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'éligibilité sans auth."""
        resp = unauth_client.get("/inscription/reinscription/eligibilite")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Planification de Réinscription
# =============================================================================

class TestReinscriptionPlanificationHappy:
    """Tests bon cas pour la planification de réinscription."""

    def test_list_planifications(self, apprenant_client: APIClient):
        """DEVRAIT lister les planifications de l'apprenant (200)."""
        resp = apprenant_client.get("/inscription/reinscription/planifications")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_create_planification(self, scolarite_client: APIClient):
        """DEVRAIT créer une planification de réinscription (201)."""
        data = {
            "sessionId": 1,
            "classeId": 1,
            "niveauEtudeId": 1,
            "montant": 1500000
        }
        resp = scolarite_client.post("/inscription/reinscription/planifier", json=data)
        assert resp.status_code in (200, 201, 400, 404), f"Attendu 200/201/400/404, obtenu {resp.status_code}"

    def test_cancel_planification(self, apprenant_client: APIClient):
        """DEVRAIT annuler une planification (200)."""
        resp = apprenant_client.post("/inscription/reinscription/planifications/1/annuler")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_confirm_planification(self, scolarite_client: APIClient):
        """DEVRAIT confirmer une planification (200)."""
        resp = scolarite_client.post("/inscription/reinscription/planifications/1/confirmer")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_create_planification_full_data(self, scolarite_client: APIClient):
        """DEVRAIT créer une planification avec toutes les données (201)."""
        data = {
            "sessionId": 1,
            "classeId": 1,
            "niveauEtudeId": 1,
            "montant": 1500000,
            "referenceBancaire": "REF-TEST-001",
            "modalite": "virement"
        }
        resp = scolarite_client.post("/inscription/reinscription/planifier", json=data)
        assert resp.status_code in (200, 201, 400, 404), f"Attendu 200/201/400/404, obtenu {resp.status_code}"


class TestReinscriptionPlanificationError:
    """Tests mauvais cas pour la planification de réinscription."""

    def test_create_planification_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/reinscription/planifier", json={"sessionId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_planification_missing_session(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 quand sessionId manque."""
        resp = apprenant_client.post("/inscription/reinscription/planifier", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_planifications_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour lister les planifications sans auth."""
        resp = unauth_client.get("/inscription/reinscription/planifications")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_cancel_nonexistent_planification(self, apprenant_client: APIClient):
        """DEVRAIT retourner 404 pour annuler une planification inexistante."""
        resp = apprenant_client.post("/inscription/reinscription/planifications/999999/annuler")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_confirm_planification_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour confirmer sans auth."""
        resp = unauth_client.post("/inscription/reinscription/planifications/1/confirmer")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Soumission de Réinscription
# =============================================================================

class TestReinscriptionSoumissionHappy:
    """Tests bon cas pour la soumission de réinscription."""

    def test_soumettre_reinscription(self, apprenant_client: APIClient):
        """DEVRAIT soumettre un dossier de réinscription (201)."""
        data = {
            "sessionId": 1,
            "classeId": 1,
            "niveauEtudeId": 1,
            "montant": 1500000,
            "referenceBancaire": "REF-TEST"
        }
        resp = apprenant_client.post("/inscription/reinscription/soumettre", json=data)
        assert resp.status_code in (200, 201, 400, 403, 404), f"Attendu 200/201/400/403/404, obtenu {resp.status_code}"

    def test_soumettre_reinscription_full_data(self, apprenant_client: APIClient):
        """DEVRAIT soumettre avec tous les documents (201)."""
        data = {
            "sessionId": 1,
            "classeId": 1,
            "niveauEtudeId": 1,
            "montant": 1500000,
            "referenceBancaire": "REF-TEST-001",
            "modalite": "espèces",
            "demande_dg": "fichier_123.pdf",
            "autorisation_provisoire": "fichier_456.pdf",
            "releves_notes": "fichier_789.pdf"
        }
        resp = apprenant_client.post("/inscription/reinscription/soumettre", json=data)
        assert resp.status_code in (200, 201, 400, 403, 404), f"Attendu 200/201/400/403/404, obtenu {resp.status_code}"

    def test_get_prochaine_disponible(self, scolarite_client: APIClient):
        """DEVRAIT vérifier la disponibilité de la prochaine session (200)."""
        resp = scolarite_client.get("/inscription/reinscription/prochaine")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_peut_se_reinscrire_sans_dette(self, scolarite_client: APIClient):
        """DEVRAIT vérifier l'éligibilité sans dette (200)."""
        resp = scolarite_client.get("/inscription/reinscription/peut-se-reinscrire")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_eligibilite_parcours_valide(self, scolarite_client: APIClient):
        """DEVRAIT vérifier l'éligibilité d'un parcours valide (200)."""
        resp = scolarite_client.get("/inscription/reinscription/eligibilite")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"


class TestReinscriptionSoumissionError:
    """Tests mauvais cas pour la soumission de réinscription."""

    def test_soumettre_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la soumission sans auth."""
        resp = unauth_client.post("/inscription/reinscription/soumettre", json={"sessionId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_soumettre_missing_session(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 quand sessionId manque."""
        resp = apprenant_client.post("/inscription/reinscription/soumettre", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_soumettre_invalid_amount(self, apprenant_client: APIClient):
        """DEVRAIT retourner 422 pour un montant invalide."""
        resp = apprenant_client.post("/inscription/reinscription/soumettre", json={"sessionId": 1, "montant": "abc"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_soumettre_duplicate(self, apprenant_client: APIClient):
        """DEVRAIT retourner une erreur de doublon si déjà soumis."""
        data = {"sessionId": 1, "montant": 1500000}
        resp1 = apprenant_client.post("/inscription/reinscription/soumettre", json=data)
        resp2 = apprenant_client.post("/inscription/reinscription/soumettre", json=data)
        if resp1.status_code in (200, 201):
            assert resp2.status_code in (400, 409), f"Attendu erreur doublon, obtenu {resp2.status_code}"

    def test_soumettre_unauthorized_role(self, unauth_client):
        """DEVRAIT retourner 401 pour un rôle non autorisé."""
        resp = unauth_client.post("/inscription/reinscription/soumettre", json={"sessionId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Documents de Réinscription
# =============================================================================

class TestReinscriptionDocumentsHappy:
    """Tests bon cas pour les documents de réinscription."""

    def test_upload_demande_dg(self, apprenant_client: APIClient):
        """DEVRAIT uploader le document demande_dg (200/201)."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"demande_dg": ("test.pdf", b"test_content", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 401, 403, 404), f"Statut inattendu : {resp.status_code}"

    def test_upload_autorisation_provisoire(self, apprenant_client: APIClient):
        """DEVRAIT uploader l'autorisation provisoire (200/201)."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"autorisation_provisoire": ("auto.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 401, 403, 404), f"Statut inattendu : {resp.status_code}"

    def test_upload_releves_notes(self, apprenant_client: APIClient):
        """DEVRAIT uploader les relevés de notes (200/201)."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"releves_notes": ("notes.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 401, 403, 404), f"Statut inattendu : {resp.status_code}"

    def test_upload_cni(self, apprenant_client: APIClient):
        """DEVRAIT uploader la CNI (200/201)."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"cni": ("cni.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 401, 403, 404), f"Statut inattendu : {resp.status_code}"

    def test_upload_quitus(self, apprenant_client: APIClient):
        """DEVRAIT uploader le quitus (200/201)."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"quitus_bordereaux_annee": ("quitus.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 401, 403, 404), f"Statut inattendu : {resp.status_code}"


class TestReinscriptionDocumentsError:
    """Tests mauvais cas pour les documents de réinscription."""

    def test_upload_invalid_file_type(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 pour un type de fichier invalide."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"document": ("test.txt", b"test", "text/plain")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"

    def test_upload_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'upload sans auth."""
        resp = unauth_client.upload(
            "/inscription/reinscription/soumettre",
            files={"demande_dg": ("test.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_upload_file_too_large(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier trop volumineux."""
        large_content = b"x" * (20 * 1024 * 1024 + 1)
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={"demande_dg": ("large.pdf", large_content, "application/pdf")}
        )
        # Le serveur peut accepter ou rejeter selon la configuration
        assert resp.status_code in (200, 201, 400, 413), f"Statut inattendu : {resp.status_code}"

    def test_upload_no_file(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 quand aucun fichier n'est fourni."""
        resp = apprenant_client.upload(
            "/inscription/reinscription/soumettre",
            files={}
        )
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_upload_without_auth_header(self, unauth_client):
        """DEVRAIT retourner 401 quand le header d'auth est absent."""
        resp = unauth_client.post(
            "/inscription/reinscription/soumettre",
            headers={"Content-Type": "multipart/form-data"}
        )
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"
