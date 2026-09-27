"""
test_inscription_api.py — Tests d'endpoints d'inscription

Couvre : /inscription/demandesInscription, /inscription/reponsesInscription, /inscription/parcours
Tests : bon cas (200/201) et mauvais cas (400, 401, 403, 404, 422)

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_inscription_api.py
"""

import pytest
import requests
from helpers.api_client import APIClient, APIClientFactory


# =============================================================================
# CLASSES : Demande d'Inscription
# =============================================================================

class TestDemandeInscriptionHappy:
    """Tests bon cas pour les demandes d'inscription."""

    def test_list_demandes_inscription(self, admin_client: APIClient):
        """DEVRAIT retourner la liste des demandes d'inscription (200)."""
        resp = admin_client.get("/inscription/demandesInscription")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_demande_inscription(self, admin_client: APIClient):
        """DEVRAIT créer une demande d'inscription (201)."""
        data = {
            "matricule": f"MAT-API-{hash('test') % 100000:05d}",
            "sessionId": 1,
            "utilisateurId": 1
        }
        resp = admin_client.post("/inscription/demandesInscription", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_get_demande_inscription_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une demande d'inscription par ID (200)."""
        resp = admin_client.get("/inscription/demandesInscription/1")
        # Peut être 200 ou 404 selon l'existence de l'ID
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_demande_inscription_paiement(self, admin_client: APIClient):
        """DEVRAIT récupérer une demande depuis un paiement (200)."""
        resp = admin_client.get("/inscription/demandesInscription/paiement/MAT-TEST-001")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_demandes_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de demandes (200)."""
        resp = admin_client.get("/inscription/demandesInscription/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"
        data = resp.json()
        assert "count" in data or "success" in data, "Réponse invalide"


class TestDemandeInscriptionError:
    """Tests mauvais cas pour les demandes d'inscription."""

    def test_create_demande_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données sont manquantes."""
        resp = admin_client.post("/inscription/demandesInscription", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_create_demande_duplicate(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur de doublon (400 ou 409)."""
        data = {"matricule": "MAT-API-00001", "sessionId": 1, "utilisateurId": 1}
        resp1 = admin_client.post("/inscription/demandesInscription", json=data)
        resp2 = admin_client.post("/inscription/demandesInscription", json=data)
        # La deuxième tentative devrait échouer
        if resp1.status_code in (200, 201):
            assert resp2.status_code in (400, 409, 422), f"Attendu erreur doublon, obtenu {resp2.status_code}"

    def test_create_demande_unauthenticated(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 quand non authentifié."""
        data = {"matricule": "MAT-UNAUTH", "sessionId": 1, "utilisateurId": 1}
        resp = unauth_client.post("/inscription/demandesInscription", json=data)
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_get_nonexistent_demande(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.get("/inscription/demandesInscription/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_validate_demande_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la validation sans auth."""
        resp = unauth_client.put("/inscription/demandesInscription/1")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Réponse d'Inscription
# =============================================================================

class TestReponseInscriptionHappy:
    """Tests bon cas pour les réponses d'inscription."""

    def test_list_reponses_inscription(self, admin_client: APIClient):
        """DEVRAIT retourner la liste des réponses (200)."""
        resp = admin_client.get("/inscription/reponsesInscription")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_reponse_inscription(self, admin_client: APIClient):
        """DEVRAIT créer une réponse d'inscription (201)."""
        data = {
            "message": "Réponse de test API",
            "demandeInscriptionId": 1,
            "utilisateurId": 1
        }
        resp = admin_client.post("/inscription/reponsesInscription", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_get_reponse_inscription_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une réponse par ID (200)."""
        resp = admin_client.get("/inscription/reponsesInscription/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_reponses_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de réponses (200)."""
        resp = admin_client.get("/inscription/reponsesInscription/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_reponse_with_valid_data(self, admin_client: APIClient):
        """DEVRAIT créer une réponse avec toutes les données requises (201)."""
        data = {
            "message": "Parcours validé avec succès",
            "dateReponse": "2026-01-15",
            "demandeInscriptionId": 1,
            "utilisateurId": 1
        }
        resp = admin_client.post("/inscription/reponsesInscription", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"


class TestReponseInscriptionError:
    """Tests mauvais cas pour les réponses d'inscription."""

    def test_create_reponse_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le message est manquant."""
        resp = admin_client.post("/inscription/reponsesInscription", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_reponse(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une réponse inexistante."""
        resp = admin_client.get("/inscription/reponsesInscription/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_delete_reponse_unauthenticated(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la suppression sans auth."""
        resp = unauth_client.delete("/inscription/reponsesInscription/1")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_reponse_invalid_type(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour un type de données invalide."""
        data = {"message": 12345, "demandeInscriptionId": "abc"}
        resp = admin_client.post("/inscription/reponsesInscription", json=data)
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_update_nonexistent_reponse(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour la mise à jour d'une réponse inexistante."""
        resp = admin_client.put("/inscription/reponsesInscription/999999", json={"message": "test"})
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Parcours
# =============================================================================

class TestParcoursHappy:
    """Tests bon cas pour les parcours."""

    def test_list_all_parcours(self, admin_client: APIClient):
        """DEVRAIT retourner tous les parcours (200)."""
        resp = admin_client.get("/inscription/parcours")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"
        data = resp.json()
        assert isinstance(data, list) or "data" in data or "success" in data, "Réponse invalide"

    def test_get_parcours_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer un parcours par ID (200)."""
        resp = admin_client.get("/inscription/parcours/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_parcours_arborescence(self, admin_client: APIClient):
        """DEVRAIT retourner l'arborescence des parcours (200)."""
        resp = admin_client.get("/inscription/parcours/arborescence")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_parcours(self, admin_client: APIClient):
        """DEVRAIT créer un parcours (201)."""
        data = {
            "titre": "Parcours Test API",
            "description": "Créé par les tests API",
            "niveauEtudeId": 1,
            "type": "LICENCE"
        }
        resp = admin_client.post("/inscription/parcours", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_get_parcours_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de parcours (200)."""
        resp = admin_client.get("/inscription/parcours/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"


class TestParcoursError:
    """Tests mauvais cas pour les parcours."""

    def test_create_parcours_missing_fields(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les champs requis manquent."""
        resp = admin_client.post("/inscription/parcours", json={"description": "sans titre"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_create_parcours_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/parcours", json={"titre": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_get_nonexistent_parcours(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un parcours inexistant."""
        resp = admin_client.get("/inscription/parcours/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_create_parcours_invalid_type(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour un type de parcours invalide."""
        data = {"titre": "Test", "type": "INVALID_TYPE", "niveauEtudeId": 1}
        resp = admin_client.post("/inscription/parcours", json=data)
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_update_parcours_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la mise à jour sans auth."""
        resp = unauth_client.put("/inscription/parcours/1", json={"titre": "Modifié"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Cursus Apprenant
# =============================================================================

class TestCursusApprenantHappy:
    """Tests bon cas pour le cursus apprenant."""

    def test_list_cursus_apprenant(self, admin_client: APIClient):
        """DEVRAIT retourner la liste des cursus (200)."""
        resp = admin_client.get("/inscription/cursusApprenant")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_cursus_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer un cursus par ID (200)."""
        resp = admin_client.get("/inscription/cursusApprenant/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_cours_choisis(self, apprenant_client: APIClient):
        """DEVRAIT retourner les cours choisis (200)."""
        resp = apprenant_client.get("/inscription/cursusApprenant/cours")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_cursus_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de cursus (200)."""
        resp = admin_client.get("/inscription/cursusApprenant/statistics/count")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_mon_suivi(self, apprenant_client: APIClient):
        """DEVRAIT retourner le suivi des statuts de cours (200)."""
        resp = apprenant_client.get("/inscription/cursusApprenant/mon-suivi/statuts-cours")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"


class TestCursusApprenantError:
    """Tests mauvais cas pour le cursus apprenant."""

    def test_create_cursus_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/cursusApprenant", json={"niveauEtudeId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_get_nonexistent_cursus(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un cursus inexistant."""
        resp = admin_client.get("/inscription/cursusApprenant/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_create_cursus_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données sont manquantes."""
        resp = admin_client.post("/inscription/cursusApprenant", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_update_cursus_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la mise à jour sans auth."""
        resp = unauth_client.put("/inscription/cursusApprenant/1", json={"titre": "Modifié"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_cursus_invalid_data(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour des données invalides."""
        resp = admin_client.post("/inscription/cursusApprenant", json={"titre": 123, "type": None})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Pre-Inscription
# =============================================================================

class TestPreInscriptionHappy:
    """Tests bon cas pour les pré-inscriptions."""

    def test_list_pre_inscriptions(self, admin_client: APIClient):
        """DEVRAIT retourner la liste des pré-inscriptions (200)."""
        resp = admin_client.get("/inscription/pre-inscriptions")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_pre_inscription_by_id(self, admin_client: APIClient):
        """DEVRAIT récupérer une pré-inscription par ID (200)."""
        resp = admin_client.get("/inscription/pre-inscriptions/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_pre_inscriptions_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de pré-inscriptions (200)."""
        resp = admin_client.get("/inscription/pre-inscriptions/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_pre_inscription(self, admin_client: APIClient):
        """DEVRAIT créer une pré-inscription (201)."""
        data = {"demandeInscriptionId": 1, "statut": "valide", "commentaire": "Test"}
        resp = admin_client.post("/inscription/pre-inscriptions", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_get_pre_inscription_from_demande(self, admin_client: APIClient):
        """DEVRAIT récupérer une pré-inscription depuis une demande (200)."""
        resp = admin_client.get("/inscription/pre-inscriptions/demande/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestPreInscriptionError:
    """Tests mauvais cas pour les pré-inscriptions."""

    def test_create_pre_inscription_unauthenticated(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/pre-inscriptions", json={"statut": "valide"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_get_nonexistent_pre_inscription(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une pré-inscription inexistante."""
        resp = admin_client.get("/inscription/pre-inscriptions/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_create_pre_inscription_missing_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand les données sont manquantes."""
        resp = admin_client.post("/inscription/pre-inscriptions", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_delete_pre_inscription_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la suppression sans auth."""
        resp = unauth_client.delete("/inscription/pre-inscriptions/1")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_update_pre_inscription_invalid_status(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour un statut invalide."""
        resp = admin_client.put("/inscription/pre-inscriptions/1", json={"statut": "statut_inexistant"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Frais d'Inscription
# =============================================================================

class TestFraisInscriptionHappy:
    """Tests bon cas pour les frais d'inscription."""

    def test_list_frais_inscription(self, admin_client: APIClient):
        """DEVRAIT retourner la liste des frais (200)."""
        resp = admin_client.get("/inscription/fraisInscription")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_frais_inscription(self, admin_client: APIClient):
        """DEVRAIT récupérer les frais (200)."""
        resp = admin_client.get("/inscription/fraisInscription/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_frais_count(self, admin_client: APIClient):
        """DEVRAIT retourner le nombre de frais (200)."""
        resp = admin_client.get("/inscription/fraisInscription/statistics/count")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_create_frais_inscription(self, admin_client: APIClient):
        """DEVRAIT créer des frais d'inscription (201)."""
        data = {"titre": "Frais de test", "montant": 500000, "sessionId": 1}
        resp = admin_client.post("/inscription/fraisInscription", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_get_frais_by_session(self, admin_client: APIClient):
        """DEVRAIT récupérer les frais par session (200)."""
        resp = admin_client.get("/inscription/fraisInscription/session/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestFraisInscriptionError:
    """Tests mauvais cas pour les frais d'inscription."""

    def test_create_frais_missing_amount(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le montant manque."""
        resp = admin_client.post("/inscription/fraisInscription", json={"titre": "Test"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_frais(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un frais inexistant."""
        resp = admin_client.get("/inscription/fraisInscription/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_create_frais_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/fraisInscription", json={"montant": 100})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_frais_invalid_amount(self, admin_client: APIClient):
        """DEVRAIT retourner 422 pour un montant invalide."""
        resp = admin_client.post("/inscription/fraisInscription", json={"titre": "Test", "montant": "abc"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_update_frais_unauthorized(self, unauth_client: APIClient):
        """DEVRAIT retourner 401 pour la mise à jour sans auth."""
        resp = unauth_client.put("/inscription/fraisInscription/1", json={"montant": 999})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"
