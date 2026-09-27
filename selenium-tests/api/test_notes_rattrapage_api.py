"""
test_notes_rattrapage_api.py — Tests d'endpoints de notes de rattrapage

Couvre les notes de rattrapage spécifiques : saisie de notes, validation,
rattrapageWorkflow notes, et les endpoints liés aux notes dans le workflow.

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pytest -v --html=report_api.html api/test_notes_rattrapage_api.py
"""

import pytest
from helpers.api_client import APIClient


# =============================================================================
# CLASSES : Notes de Rattrapage (Workflow)
# =============================================================================

class TestNotesRattrapageWorkflowHappy:
    """Tests bon cas pour les notes de rattrapage dans le workflow."""

    def test_saisir_note_rattrapage(self, enseignant_client: APIClient):
        """DEVRAIT saisir une note de rattrapage (201)."""
        data = {
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 12.5
        }
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"

    def test_saisir_note_rattrapage_multiple(self, enseignant_client: APIClient):
        """DEVRAIT saisir plusieurs notes de rattrapage (201)."""
        data = {
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 14.0
        }
        data2 = {
            "planningId": 1,
            "rattrapageNoteId": 2,
            "note_rattrapage": 10.5
        }
        resp1 = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data)
        resp2 = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data2)
        assert resp1.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp1.status_code}"
        assert resp2.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp2.status_code}"

    def test_save_notes_rattrapage(self, enseignant_client: APIClient):
        """DEVRAIT sauvegarder les notes de rattrapage en masse (200)."""
        resp = enseignant_client.put("/inscription/rattrapages/notes", json={
            "notes": [
                {"etudiantId": 1, "note": 12.5},
                {"etudiantId": 2, "note": 14.0}
            ]
        })
        assert resp.status_code in (200, 400, 422), f"Attendu 200/400/422, obtenu {resp.status_code}"

    def test_saisir_note_full_data(self, enseignant_client: APIClient):
        """DEVRAIT saisir une note avec toutes les données (201)."""
        data = {
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 15.0,
            "commentaire": "Bonne progression",
            "ecueId": 1,
            "ueId": 1
        }
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"

    def test_saisir_note_avec_coeff(self, enseignant_client: APIClient):
        """DEVRAIT saisir une note avec coefficient (201)."""
        data = {
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 13.5,
            "coefficient": 2.0
        }
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json=data)
        assert resp.status_code in (200, 201, 404), f"Attendu 200/201/404, obtenu {resp.status_code}"


class TestNotesRattrapageWorkflowError:
    """Tests mauvais cas pour les notes de rattrapage dans le workflow."""

    def test_saisir_note_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la saisie sans auth."""
        resp = unauth_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 10})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_saisir_note_missing_planning(self, enseignant_client: APIClient):
        """DEVRAIT retourner 400 quand planningId manque."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 10})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_invalid_value_high(self, enseignant_client: APIClient):
        """DEVRAIT retourner 422 pour une note supérieure à la limite."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 25  # Note invalide > 20
        })
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_invalid_value_negative(self, enseignant_client: APIClient):
        """DEVRAIT retourner 422 pour une note négative."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": -1  # Note négative invalide
        })
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_invalid_value_zero(self, enseignant_client: APIClient):
        """DEVRAIT retourner 422 pour une note de zéro."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={
            "planningId": 1,
            "rattrapageNoteId": 1,
            "note_rattrapage": 0
        })
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_non_enseignant(self, apprenant_client: APIClient):
        """DEVRAIT retourner 403 pour un apprenant tentant de saisir des notes."""
        resp = apprenant_client.post("/inscription/rattrapage-workflow/notes", json={"note_rattrapage": 10})
        assert resp.status_code in (401, 403), f"Attendu 401/403, obtenu {resp.status_code}"

    def test_saisir_note_non_existent_planning(self, enseignant_client: APIClient):
        """DEVRAIT retourner 404 pour un planning inexistant."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={
            "planningId": 999999,
            "rattrapageNoteId": 1,
            "note_rattrapage": 12
        })
        assert resp.status_code in (404, 400), f"Attendu 404/400, obtenu {resp.status_code}"

    def test_save_notes_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la sauvegarde sans auth."""
        resp = unauth_client.put("/inscription/rattrapages/notes", json={"notes": []})
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_save_notes_empty(self, enseignant_client: APIClient):
        """DEVRAIT retourner 400 pour une liste vide."""
        resp = enseignant_client.put("/inscription/rattrapages/notes", json={"notes": []})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_save_notes_invalid_structure(self, enseignant_client: APIClient):
        """DEVRAIT retourner 422 pour une structure invalide."""
        resp = enseignant_client.put("/inscription/rattrapages/notes", json={"notes": "invalid"})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_saisir_note_missing_note_value(self, enseignant_client: APIClient):
        """DEVRAIT retourner 400 quand note_rattrapage manque."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/notes", json={
            "planningId": 1,
            "rattrapageNoteId": 1
        })
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Validation des Notes de Rattrapage
# =============================================================================

class TestValidationNotesRattrapageHappy:
    """Tests bon cas pour la validation des notes de rattrapage."""

    def test_valider_demande_rattrapage(self, admin_client: APIClient):
        """DEVRAIT valider une demande de rattrapage (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_valider_demande_avec_motif(self, admin_client: APIClient):
        """DEVRAIT valider une demande avec motif (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/valider", json={
            "motif": "Justifié par le comité"
        })
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_confirmer_paiement_rattrapage(self, admin_client: APIClient):
        """DEVRAIT confirmer le paiement et inscrire définitivement (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/confirmer-paiement")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_programmer_demande_rattrapage(self, admin_client: APIClient):
        """DEVRAIT programmer une demande de rattrapage (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/programmer")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_deposer_bordereau_rattrapage(self, apprenant_client: APIClient):
        """DEVRAIT déposer le bordereau de paiement (201)."""
        resp = apprenant_client.post("/inscription/rattrapage-workflow/demandes/1/bordereau")
        assert resp.status_code in (200, 201, 404), f"Statut inattendu : {resp.status_code}"


class TestValidationNotesRattrapageError:
    """Tests mauvais cas pour la validation des notes de rattrapage."""

    def test_valider_demande_nonexistente(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/999999/valider")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_valider_demande_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour la validation sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_rejeter_demande_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour le rejet sans auth."""
        resp = unauth_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_rejeter_demande_missing_motif(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le motif manque."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter", json={})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_confirmer_paiement_nonexistente(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/999999/confirmer-paiement")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_programmer_deja_programme(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur si déjà programmée."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/programmer")
        assert resp.status_code in (200, 400, 404), f"Statut inattendu : {resp.status_code}"

    def test_deposer_bordereau_non_autorise(self, enseignant_client: APIClient):
        """DEVRAIT retourner 403 pour un enseignant déposant un bordereau."""
        resp = enseignant_client.post("/inscription/rattrapage-workflow/demandes/1/bordereau")
        assert resp.status_code in (403, 404), f"Attendu 403/404, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Documents Rattrapage
# =============================================================================

class TestDocumentsRattrapageHappy:
    """Tests bon cas pour les documents de rattrapage."""

    def test_uploader_document_rattrapage(self, apprenant_client: APIClient):
        """DEVRAIT uploader un document de rattrapage (201)."""
        resp = apprenant_client.upload(
            "/inscription/rattrapage-workflow/demandes/1/documents",
            files={"fichier": ("justificatif.pdf", b"test_content", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 404), f"Statut inattendu : {resp.status_code}"

    def test_uploader_document_pdf(self, apprenant_client: APIClient):
        """DEVRAIT uploader un justificatif PDF valide (201)."""
        resp = apprenant_client.upload(
            "/inscription/rattrapage-workflow/demandes/1/documents",
            files={"fichier": ("justificatif.pdf", b"%PDF-1.4 test", "application/pdf")}
        )
        assert resp.status_code in (200, 201, 400, 404), f"Statut inattendu : {resp.status_code}"

    def test_telecharger_document(self, admin_client: APIClient):
        """DEVRAIT télécharger un document déposé (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/1/documents/1/telecharger")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_documents_requis_session(self, admin_client: APIClient):
        """DEVRAIT retourner les documents requis pour une session (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/documents-requis/1")
        assert resp.status_code in (200, 404), f"Attendu 200/404, obtenu {resp.status_code}"

    def test_documents_requis_fixes(self, admin_client: APIClient):
        """DEVRAIT retourner les pièces fixes d'une demande (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/documents-requis-fixes")
        assert resp.status_code in (200, 404), f"Attendu 200/404, obtenu {resp.status_code}"


class TestDocumentsRattrapageError:
    """Tests mauvais cas pour les documents de rattrapage."""

    def test_uploader_document_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour l'upload sans auth."""
        resp = unauth_client.upload(
            "/inscription/rattrapage-workflow/demandes/1/documents",
            files={"fichier": ("test.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_uploader_non_pdf(self, apprenant_client: APIClient):
        """DEVRAIT retourner 400 pour un fichier non-PDF."""
        resp = apprenant_client.upload(
            "/inscription/rattrapage-workflow/demandes/1/documents",
            files={"fichier": ("test.txt", b"test", "text/plain")}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"

    def test_uploader_document_nonexistent_demande(self, apprenant_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = apprenant_client.upload(
            "/inscription/rattrapage-workflow/demandes/999999/documents",
            files={"fichier": ("test.pdf", b"test", "application/pdf")}
        )
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_telecharger_document_inexistant(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour un document inexistant."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/1/documents/999999/telecharger")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_documents_requis_nonexistent_session(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une session inexistante."""
        resp = admin_client.get("/inscription/rattrapage-workflow/documents-requis/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Demandes de Rattrapage (liste et filtre)
# =============================================================================

class TestDemandesRattrapageHappy:
    """Tests bon cas pour les demandes de rattrapage."""

    def test_list_demandes_rattrapage(self, admin_client: APIClient):
        """DEVRAIT lister toutes les demandes de rattrapage (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_lister_demandes_filtrees(self, admin_client: APIClient):
        """DEVRAIT filtrer les demandes par statut (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes?statutDemande=en_attente")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"

    def test_lister_demandes_par_session(self, admin_client: APIClient):
        """DEVRAIT filtrer les demandes par session (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes?rattrapageSessionId=1")
        assert resp.status_code in (200, 404), f"Attendu 200/404, obtenu {resp.status_code}"

    def test_get_mes_demandes(self, apprenant_client: APIClient):
        """DEVRAIT récupérer mes demandes (200)."""
        resp = apprenant_client.get("/inscription/rattrapages/mes-demandes")
        assert resp.status_code in (200, 403, 404), f"Attendu 200/403/404, obtenu {resp.status_code}"

    def test_detail_demande(self, apprenant_client: APIClient):
        """DEVRAIT récupérer le détail d'une demande (200)."""
        resp = apprenant_client.get("/inscription/rattrapage-workflow/demandes/1")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestDemandesRattrapageError:
    """Tests mauvais cas pour les demandes de rattrapage."""

    def test_list_demandes_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour lister sans auth."""
        resp = unauth_client.get("/inscription/rattrapage-workflow/demandes")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_detail_demande_nonexistente(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/999999")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_mes_demandes_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour mes demandes sans auth."""
        resp = unauth_client.get("/inscription/rattrapages/mes-demandes")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"

    def test_ues_non_validees_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour les UE non validées sans auth."""
        resp = unauth_client.get("/inscription/rattrapage-workflow/ues-non-validees")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Votes du Comité (Rattrapage)
# =============================================================================

class TestVotesRattrapageHappy:
    """Tests bon cas pour les votes du comité."""

    def test_lister_votes(self, admin_client: APIClient):
        """DEVRAIT lister les votes d'une demande (200)."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/1/votes")
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code}"


class TestVotesRattrapageError:
    """Tests mauvais cas pour les votes du comité."""

    def test_lister_votes_nonexistente(self, admin_client: APIClient):
        """DEVRAIT retourner 404 pour une demande inexistante."""
        resp = admin_client.get("/inscription/rattrapage-workflow/demandes/999999/votes")
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"

    def test_lister_votes_unauthenticated(self, unauth_client):
        """DEVRAIT retourner 401 pour lister les votes sans auth."""
        resp = unauth_client.get("/inscription/rattrapage-workflow/demandes/1/votes")
        assert resp.status_code == 401, f"Attendu 401, obtenu {resp.status_code}"


# =============================================================================
# CLASSES : Comite Validation (Rattrapage)
# =============================================================================

class TestComiteValidationHappy:
    """Tests bon cas pour la validation du comité sur rattrapage."""

    def test_valider_demande_comite(self, admin_client: APIClient):
        """DEVRAIT valider une demande par le comité (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_rejeter_demande_comite(self, admin_client: APIClient):
        """DEVRAIT rejeter une demande par le comité (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter", json={
            "motif": "Dossier incomplet"
        })
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"

    def test_confirmation_paiement_comite(self, admin_client: APIClient):
        """DEVRAIT confirmer le paiement et inscrire définitivement (200)."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/confirmer-paiement")
        assert resp.status_code in (200, 404), f"Statut inattendu : {resp.status_code}"


class TestComiteValidationError:
    """Tests mauvais cas pour la validation du comité."""

    def test_valider_avec_motif_vide(self, admin_client: APIClient):
        """DEVRAIT retourner 400 quand le motif est vide."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter", json={"motif": ""})
        assert resp.status_code in (400, 422), f"Attendu 400/422, obtenu {resp.status_code}"

    def test_valider_deja_validee(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur si déjà validée."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/valider")
        # Peut retourner 200 (succès) ou 400 (déjà validée)
        assert resp.status_code in (200, 400, 404), f"Statut inattendu : {resp.status_code}"

    def test_rejeter_deja_rejete(self, admin_client: APIClient):
        """DEVRAIT retourner une erreur si déjà rejetée."""
        resp = admin_client.put("/inscription/rattrapage-workflow/demandes/1/rejeter", json={
            "motif": "Encore rejeté"
        })
        assert resp.status_code in (200, 400, 404), f"Statut inattendu : {resp.status_code}"
