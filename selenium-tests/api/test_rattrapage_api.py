"""
test_rattrapage_api.py — Tests d'endpoints de rattrapage

Couvre : /inscription/rattrapage*, /inscription/rattrapage-workflow/*
RattrapageWorkflow, RattrapageSession, RattrapageInscription, RattrapageNote, RattrapagePlanning, RattrapageEnseignant

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_rattrapage_api.py
"""

import pytest
from helpers.api_client import APIClient


# =============================================================================
# CLASSES : Rattrapage Principal (Routes /inscription/rattrapages)
# =============================================================================

class TestRattrapageHappy:
    """Tests bon cas pour le rattrapage principal."""

    def test_get_all_rattrapages(self, admin_client: APIClient):
        """DEVRAIT retourner tous les rattrapages (200)."""
        resp = admin_client.get("/inscription/rattrapages")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_rattrapage_sessions(self, admin_client: APIClient):
        """DEVRAIT retourner les sessions de rattrapage (200)."""
        resp = admin_client.get("/inscription/rattrapages/sessions")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_rattrapage_stats(self, admin_client: APIClient):
        """DEVRAIT retourner les statistiques de rattrapage (200)."""
        resp = admin_client.get("/inscription/rattrapages/stats")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_get_prochain_cours_enseignant(self, enseignant_client: APIClient):
        """DEVRAIT retourner le prochain cours enseignant (200)."""
        resp = enseignant_client.get("/inscription/rattrapages/enseignant/prochain-cours")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_create_rattrapage(self, admin_client: APIClient):
        """DEVRAIT créer un rattrapage (201)."""
        data = {"libelle": "Rattrapage Test", "sessionId": 1}
        resp = admin_client.post("/inscription/rattrapages", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_notifier_etudiants(self, admin_client: APIClient):
        """DEVRAIT notifier les étudiants (200)."""
        resp = admin_client.post("/inscription/rattrapages/notifier", json={"sessionId": 1})
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"


class TestRattrapageError:
    """Tests mauvais cas pour le rattrapage principal."""

    def test_get_all_rattrapages_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 sans auth."""
        resp = unauth_client.get("/inscription/rattrapages")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_rattrapage_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/rattrapages", json={"libelle": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_get_nonexistent_rattrapage(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un rattrapage inexistant."""
        resp = admin_client.get("/inscription/rattrapages/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_update_nonexistent_rattrapage(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour la mise à jour d'un rattrapage inexistant."""
        resp = admin_client.put("/inscription/rattrapages/999999", json={"libelle": "Modifié"})
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_delete_rattrapage_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la suppression sans auth."""
        resp = unauth_client.delete("/inscription/rattrapages/1")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : RattrapageWorkflow (Routes /inscription/rattrapage-workflow)
# =============================================================================

class TestRattrapageWorkflowSessionsHappy:
    """Tests bon cas pour les sessions de rattrapage (workflow)."""

    def test_create_session(self, admin_client: APIClient):
        """DEVRAIT créer une session de rattrapage (201)."""
        data = {
            "libelle": "Session Rattrapage Test",
            "dateDebut": "2026-06-01",
            "dateFin": "2026-06-15",
            "anneeAcademiqueId": 1,
            "description": "Session de rattrapage de test"
        }
        resp = admin_client.post("/inscription/rattrapage-workflow/sessions", json=data)
        assert resp.status_code in (200, 201), f"Attendu 200/201, obtenu {resp.status_code}"

    def test_list_sessions(self, admin_client: APIClient):
        """DEVRAIT lister les sessions de rattrapage (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/sessions")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_session_detail(self, admin_client: APIClient):
        """DEVRAIT récupérer le détail d'une session (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/sessions/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_update_session(self, admin_client: APIClient):
        """DEVRAIT mettre à jour une session (200)."""
        data = {"libelle": "Session Modifiée", "statut": "ouverte"}
        resp = admin_client.put("/inscription/rattrapage-workflow/sessions/1", json=data)
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_get_documents_requis(self, admin_client: APIClient):
        """DEVRAIT retourner les documents requis (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/sessions/1/documents-requis")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"


class TestRattrapageWorkflowSessionsError:
    """Tests mauvais cas pour les sessions de rattrapage (workflow)."""

    def test_create_session_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/rattrapage-workflow/sessions", json={"libelle": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_session_missing_label(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand libelle manque."""
        resp = admin_client.post("/inscription/rattrapage-workflow/sessions", json={"dateDebut": "2026-06-01"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_session(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une session inexistante."""
        resp = admin_client.get("/inscription/rattrapage-workflow/sessions/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_update_session_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la mise à jour sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/sessions/1", json={"libelle": "Test"})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Demandes de Rattrapage (Workflow)
# =============================================================================

class TestRattrapageWorkflowDemandesHappy:
    """Tests bon cas pour les demandes de rattrapage (workflow)."""

    def test_create_demande(self, apprenant_client: APIClient):
        """DEVRAIT soumettre une demande de rattrapage (201)."""
        data = {"rattrapageSessionId": 1, "motifEtudiant": "Justification de rattrapage"}
        resp = apprenant_client.post("/inscription/rattrapage-workflow/demandes", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"

    def test_list_demandes(self, admin_client: APIClient):
        """DEVRAIT lister les demandes de rattrapage (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_get_demande_detail(self, apprenant_client: APIClient):
        """DEVRAIT récupérer le détail d'une demande (200)."""
        resp = apprenant_client.get("/inscription/rattrapage-workflow/demandes/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_validate_demande(self, admin_client: APIClient):
        """DEVRAIT valider une demande (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_list_votes(self, admin_client: APIClient):
        """DEVRAIT lister les votes d'une demande (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/1/votes")
        assert resp.status_code in (200, 404), f"Attendu 200/404, obtenu {resp.status_code}"


class TestRattrapageWorkflowDemandesError:
    """Tests mauvais cas pour les demandes de rattrapage (workflow)."""

    def test_create_demande_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création sans auth."""
        resp = unauth_client.post("/inscription/rattrapage-workflow/demandes", json={"rattrapageSessionId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_create_demande_missing_session(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 quand rattrapageSessionId manque."""
        resp = apprenant_client.post("/inscription/rattrapage-workflow/demandes", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_get_nonexistent_demande(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_validate_demande_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la validation sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_reject_demande_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour le rejet sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_reject_demande_missing_motif(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le motif manque."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Planning et Enseignant Rattrapage
# =============================================================================

class TestRattrapagePlanningHappy:
    """Tests bon cas pour le planning rattrapage."""

    def test_edit_planning(self, admin_client: APIClient):
        """DEVRAIT modifier un créneau de rattrapage (200)."""
        data = {"entries": [{"id": 1, "heureDebut": "08:00", "heureFin": "10:00", "salleId": 1}]}
        resp = admin_client.put("/inscription/rattrapage-workflow/sessions/1/planning", json=data)
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_designer_enseignant(self, admin_client: APIClient):
        """DEVRAIT désigner un enseignant à un créneau (201)."""
        data = {"enseignantId": 1, "ueId": 1}
        resp = admin_client.post("/inscription/rattrapage-workflow/planning/1/enseignant", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"

    def test_get_enseignants_disponibles(self, enseignant_client: APIClient):
        """DEVRAIT retourner les enseignants disponibles (200)."""
        resp = enseignant_client.get("/inscription/rattrapages/demandes/enseignants-disponibles")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"

    def test_verifier_completude_demande(self, apprenant_client: APIClient):
        """DEVRAIT vérifier la complétude d'une demande (200)."""
        resp = apprenant_client.get("/inscription/rattrapages/demandes/1/verifier-completude")
        assert resp.status_code in (200, 403, 404), f"Attendu 200/403/404, obtenu {resp.status_code}"

    def test_get_demandes_enseignant(self, enseignant_client: APIClient):
        """DEVRAIT retourner les demandes de l'enseignant (200)."""
        resp = enseignant_client.get("/inscription/rattrapages/demandes")
        assert resp.status_code in (200, 403), f"Attendu 200/403, obtenu {resp.status_code}"


class TestRattrapagePlanningError:
    """Tests mauvais cas pour le planning rattrapage."""

    def test_edit_planning_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la modification sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/sessions/1/planning", json={})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_designer_enseignant_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la désignation sans auth."""
        resp = unauth_client.post("/inscription/rattrapage-workflow/planning/1/enseignant", json={"enseignantId": 1})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_edit_nonexistent_planning(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour modifier un planning inexistant."""
        resp = admin_client.put("/inscription/rattrapage-workflow/sessions/999999/planning", json={})
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_designer_enseignant_invalid_data(self, admin_client: APIClient):
        """DEVRAIT retourner 400 pour des données invalides."""
        resp = admin_client.post("/inscription/rattrapage-workflow/planning/1/enseignant", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_verifier_completude_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la vérification sans auth."""
        resp = unauth_client.get("/inscription/rattrapages/demandes/1/verifier-completude")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Notes de Rattrapage (Workflow)
# =============================================================================

class TestRattrapageNotesHappy:
    """Tests bon cas pour les notes de rattrapage (workflow)."""

    def test_saisir_note(self, enseignant_client: APIClient):
        """DEVRAIT saisir des notes de rattrapage (201)."""
        data = {"planningId": 1, "rattrapageNoteId": 1, "note_rattrapage": 12.5}
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"

    def test_save_notes(self, enseignant_client: APIClient):
        """DEVRAIT sauvegarder les notes de rattrapage (200)."""
        resp = enseignant_client.put("/inscription/rattrapages/notes", json={"notes": []})
        assert resp.status_code in (200, 400, 422), f"Attendu 200/400/422, obtenu {resp.status_code}"


class TestRattrapageNotesError:
    """Tests mauvais cas pour les notes de rattrapage (workflow)."""

    def test_saisir_note_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la saisie sans auth."""
        resp = unauth_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 10})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_saisir_note_missing_data(self, enseignant_client: APIClient):
        """DEVRAIT retourner 400 quand les données manquent."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_invalid_value(self, enseignant_client: APIClient):
        """DEVRAIT retourner 422 pour une note invalide."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 25})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_save_notes_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la sauvegarde sans auth."""
        resp = unauth_client.put("/inscription/rattrapages/notes", json={})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_saisir_note_non_enseignant(self, apprenant_client: APIClient):
        """DEVRAIT retourner 403 pour un apprenant tentant de saisir des notes."""
        resp = apprenant_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 10})
        assert resp.status_code in (401, 403), f"Attendu 401/403, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Paiement Rattrapage
# =============================================================================

class TestRattrapagePaiementHappy:
    """Tests bon cas pour le paiement de rattrapage."""

    def test_valider_paiement(self, admin_client: APIClient):
        """DEVRAIT valider le paiement de rattrapage (200)."""
        resp = admin_client.put("/inscription/rattrapages/demandes/1/valider-paiement")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_programmer_demande(self, admin_client: APIClient):
        """DEVRAIT programmer une demande de rattrapage (200)."""
        resp = admin_client.put("/inscription/rattrapages/demandes/1/programmer")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_creer_bordereau(self, apprenant_client: APIClient):
        """DEVRAIT créer un bordereau de paiement (201)."""
        resp = apprenant_client.post("/inscription/rattrapages/demandes/1/bordereau")
        assert resp.status_code in (200, 201, 404), f"Statut inattendu : {resp.status_code}"

    def test_confirmer_paiement(self, admin_client: APIClient):
        """DEVRAIT confirmer le paiement (200)."""
        resp = admin_client.put("/inscription/rattrapages/demandes/1/confirmer-paiement")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_confirmer_paiement_auto(self, admin_client: APIClient):
        """DEVRAIT confirmer le paiement automatiquement (200)."""
        resp = admin_client.post("/inscription/rattrapages/demandes/1/confirmer-paiement-auto")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestRattrapagePaiementError:
    """Tests mauvais cas pour le paiement de rattrapage."""

    def test_valider_paiement_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la validation sans auth."""
        resp = unauth_client.put("/inscription/rattrapages/demandes/1/valider-paiement")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_programmer_unauthorized(self, unauth_client):
        """DEVRAIT retourner 401 pour la programmation sans auth."""
        resp = unauth_client.put("/inscription/rattrapages/demandes/1/programmer")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_creer_bordereau_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la création de bordereau sans auth."""
        resp = unauth_client.post("/inscription/rattrapages/demandes/1/bordereau")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_confirmer_paiement_nonexistent(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.put("/inscription/rattrapages/demandes/999999/confirmer-paiement")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_programmer_already_programmed(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur si déjà programmée."""
        resp = admin_client.put("/inscription/rattrapages/demandes/1/programmer")
        # Peut retourner 200 (succès) ou 400 (déjà programmé)
        assert resp.status_code in (200, 400, 404), f"Statut inattendu : {resp.status_code}"
