"""
conftest_api.py — Fixtures pytest pour la suite de tests API EasyEcole V4

Configure les fixtures d'authentification pour tous les rôles :
- ADMIN (tepitechbuild@gmail.com / Admin@2026!)
- SCOLARITE / INSTITUTION
- ENSEIGNANT (prof-maths)
- APPRENANT (etudiant-otp)

Usage :
    cd D:\\EasyEcole\\selenium-tests
    pip install -r requirements.txt
    pytest -v --html=report_api.html api/
"""

import sys
import os
import time
import pytest
import requests

try:
    import jwt
    HAS_JWT = True
except ImportError:
    jwt = None
    HAS_JWT = False

# Ajouter le répertoire courant au chemin Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def _load_jwt_secret():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "easy-ecole-backend", ".env")
    # fallback windows path
    if not os.path.exists(env_path):
        env_path = "D:/EasyEcole/easy-ecole-backend/.env"
    if os.path.exists(env_path):
        for line in open(env_path, encoding="utf-8", errors="ignore"):
            if line.strip().startswith("JWT_SECRET="):
                v = line.split("=",1)[1].strip().strip('"').strip("'")
                if v:
                    return v
    return os.environ.get("JWT_SECRET", "dev_secret_easyecole_2024_change_in_production")

JWT_SECRET = _load_jwt_secret()

def _gen_jwt(user_id, email, identifiant, role, token_version):
    if not HAS_JWT:
        raise RuntimeError("PyJWT non installé : pip install PyJWT")
    now = int(time.time())
    payload = {"id": user_id, "email": email, "identifiant": identifiant, "role": role, "tokenVersion": token_version, "etablissementId": None, "iat": now, "exp": now + 10*3600}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL = os.environ.get("API_BASE", "http://localhost:3000/api/v1")
"""URL du backend Express API v1."""

# Comptes de test issus de seed.ts et comptes.md
# Le seed crée tous les utilisateurs avec hash de 'password123'
# sauf l'admin dont le mot de passe est Admin@2026! (comptes.md)
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "tepitechbuild@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin@2026!")

INSTITUTION_EMAIL = os.environ.get("TEST_INST_EMAIL", "direction@easyecole.tg")
INSTITUTION_PASSWORD = os.environ.get("TEST_INST_PASSWORD", "password123")

ENSEIGNANT_EMAIL = os.environ.get("TEST_ENS_EMAIL", "prof.maths@easyecole.tg")
ENSEIGNANT_PASSWORD = os.environ.get("TEST_ENS_PASSWORD", "password123")

APPRENANT_EMAIL = os.environ.get("TEST_APP_EMAIL", "tepitechcorp@gmail.com")
APPRENANT_PASSWORD = os.environ.get("TEST_APP_PASSWORD", "password123")

CAISSIER_EMAIL = os.environ.get("TEST_CAI_EMAIL", "caissier.atsu@easyecole.tg")
CAISSIER_PASSWORD = os.environ.get("TEST_CAI_PASSWORD", "password123")

# =============================================================================
# FIXTURE : session requests avec session persistente
# =============================================================================

@pytest.fixture(scope="session")
def base_url():
    """Retourne l'URL de base du backend API."""
    return BASE_URL


@pytest.fixture(scope="session")
def auth_headers():
    """Retourne les headers d'authentification de base (Content-Type)."""
    return {"Content-Type": "application/json"}


# =============================================================================
# FIXTURE : Tokens d'authentification par rôle
# =============================================================================

@pytest.fixture(scope="session")
def admin_token():
    """JWT local admin (bypass OTP) — id 1, tepitechbuild@gmail.com"""
    return _gen_jwt(1, "tepitechbuild@gmail.com", "tepitechbuild", "admin", 45)


@pytest.fixture(scope="session")
def scolarite_token():
    """JWT local institution — id 2, direction@easyecole.tg"""
    return _gen_jwt(2, "direction@easyecole.tg", "direction", "institution", 2)


@pytest.fixture(scope="session")
def enseignant_token():
    """JWT local enseignant — id 3, prof.maths@easyecole.tg"""
    return _gen_jwt(3, "prof.maths@easyecole.tg", "prof-maths", "enseignant", 1)


@pytest.fixture(scope="session")
def apprenant_token():
    """JWT local apprenant — id 13, mensah.komlan@etu.ust.ci"""
    return _gen_jwt(13, "mensah.komlan@etu.ust.ci", "etudiant1", "apprenant", 3)


@pytest.fixture(scope="session")
def caissier_token():
    """JWT local caissier — id 7, caissier.atsu@easyecole.tg"""
    return _gen_jwt(7, "caissier.atsu@easyecole.tg", "caissier1", "caissier_banque", 1)


# =============================================================================
# FIXTURE : Headers auth complets
# =============================================================================

@pytest.fixture
def admin_headers(admin_token):
    """Headers avec token admin pour les requêtes authentifiées."""
    return {"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def scolarite_headers(scolarite_token):
    """Headers avec token scolarité/institution."""
    return {"Content-Type": "application/json", "Authorization": f"Bearer {scolarite_token}"}


@pytest.fixture
def enseignant_headers(enseignant_token):
    """Headers avec token enseignant."""
    return {"Content-Type": "application/json", "Authorization": f"Bearer {enseignant_token}"}


@pytest.fixture
def apprenant_headers(apprenant_token):
    """Headers avec token apprenant."""
    return {"Content-Type": "application/json", "Authorization": f"Bearer {apprenant_token}"}


@pytest.fixture
def caissier_headers(caissier_token):
    """Headers avec token caissier."""
    return {"Content-Type": "application/json", "Authorization": f"Bearer {caissier_token}"}


# =============================================================================
# FIXTURE : Headers sans auth (pour tester 401)
# =============================================================================

@pytest.fixture
def unauth_headers():
    """Headers sans token d'authentification."""
    return {"Content-Type": "application/json"}


# =============================================================================
# FIXTURE : Données de test (parcours, session, etc.)
# =============================================================================

@pytest.fixture
def test_parcours_data():
    """Données de parcours valides pour les tests."""
    return {
        "titre": "Parcours Test API",
        "description": "Parcours créé par les tests API",
        "niveauEtudeId": 1,
        "type": "LICENCE"
    }


@pytest.fixture
def test_session_data():
    """Données de session valides pour les tests."""
    return {
        "libelle": "Session Test API 2026",
        "dateDebut": "2026-01-01",
        "dateFin": "2026-07-31",
        "anneeAcademiqueId": 1
    }


@pytest.fixture
def test_demande_inscription_data():
    """Données de demande d'inscription valides."""
    return {
        "matricule": "MAT-API-TEST-001",
        "sessionId": 1,
        "utilisateurId": 1
    }


@pytest.fixture
def test_reinscription_data():
    """Données de réinscription valides."""
    return {
        "sessionId": 1,
        "classeId": 1,
        "niveauEtudeId": 1,
        "montant": 1500000
    }


# =============================================================================
# FIXTURE : Nettoyage des données de test
# =============================================================================

@pytest.fixture(scope="function")
def cleanup_test_data(admin_headers):
    """
    Fixture qui nettoie les données de test créées pendant les tests.
    Chaque test utilisant cette fixture aura ses données supprimées après exécution.
    """
    created_ids = []

    def _track_id(resource_type, item_id):
        """Enregistre un ID créé pour nettoyage ultérieur."""
        created_ids.append((resource_type, item_id))

    yield _track_id

    # Nettoyage post-test
    for resource_type, item_id in created_ids:
        try:
            url = f"{BASE_URL}/{resource_type}/{item_id}"
            requests.delete(url, headers=admin_headers)
        except Exception:
            pass


@pytest.fixture(scope="function")
def clean_test_records(admin_headers):
    """
    Fixture qui supprime les enregistrements de test à la fin du test.
    """
    yield
    # Tentative de nettoyage des enregistrements créés
    try:
        # Nettoyer les demande d'inscription de test
        requests.delete(
            f"{BASE_URL}/inscription/demandesInscription/MAT-API-TEST-001",
            headers=admin_headers
        )
    except Exception:
        pass


# =============================================================================
# FIXTURE : Performance testing
# =============================================================================

@pytest.fixture(scope="session")
def performance_results():
    """Dictionnaire pour collecter les métriques de performance."""
    return {
        "total_requests": 0,
        "total_errors": 0,
        "response_times": [],
        "errors_by_status": {}
    }


@pytest.fixture
def measure_performance(performance_results):
    """
    Fixture pour mesurer le temps de réponse d'une requête API.
    Usage : with measure_performance as perf: perf['endpoint'] = 'demandesInscription'
    """
    import time

    class _PerfContext:
        def __init__(self, perf_dict, endpoint_name):
            self._perf = perf_dict
            self._endpoint = endpoint_name
            self._start = None

        def __enter__(self):
            self._start = time.time()
            return self

        def __exit__(self, *args):
            elapsed = time.time() - self._start
            self._perf["total_requests"] += 1
            self._perf["response_times"].append(elapsed)
            if elapsed > 5:
                self._perf["slow_requests"] = self._perf.get("slow_requests", []) + [self._endpoint]
            return False

    return _PerfContext


# =============================================================================
# FIXTURE : Performance benchmark
# =============================================================================

@pytest.fixture
def performance_benchmark(performance_results):
    """
    Fixture pour générer un rapport de performance à la fin de la session.
    """
    yield
    # Générer le rapport de performance
    if performance_results["response_times"]:
        avg_time = sum(performance_results["response_times"]) / len(performance_results["response_times"])
        max_time = max(performance_results["response_times"])
        min_time = min(performance_results["response_times"])
        p95_time = sorted(performance_results["response_times"])[int(len(performance_results["response_times"]) * 0.95)]
        print(f"\n{'='*60}")
        print(f"  RAPPORT DE PERFORMANCE API")
        print(f"{'='*60}")
        print(f"  Total requêtes : {performance_results['total_requests']}")
        print(f"  Moyenne réponse : {avg_time:.3f}s")
        print(f"  Min : {min_time:.3f}s | Max : {max_time:.3f}s")
        print(f"  P95 : {p95_time:.3f}s")
        if performance_results.get("slow_requests"):
            print(f"  Requêtes lentes (>5s) : {performance_results['slow_requests']}")
        print(f"{'='*60}\n")


# =============================================================================
# FIXTURE : APIClient instances par rôle
# =============================================================================

@pytest.fixture
def admin_client(admin_token):
    """Retourne un APIClient authentifié admin."""
    from helpers.api_client import APIClient
    client = APIClient(token=admin_token)
    yield client
    client.close()


@pytest.fixture
def scolarite_client(scolarite_token):
    """Retourne un APIClient authentifié scolarité/institution."""
    from helpers.api_client import APIClient
    client = APIClient(token=scolarite_token)
    yield client
    client.close()


@pytest.fixture
def enseignant_client(enseignant_token):
    """Retourne un APIClient authentifié enseignant."""
    from helpers.api_client import APIClient
    client = APIClient(token=enseignant_token)
    yield client
    client.close()


@pytest.fixture
def apprenant_client(apprenant_token):
    """Retourne un APIClient authentifié apprenant."""
    from helpers.api_client import APIClient
    client = APIClient(token=apprenant_token)
    yield client
    client.close()


@pytest.fixture
def caissier_client(caissier_token):
    """Retourne un APIClient authentifié caissier."""
    from helpers.api_client import APIClient
    client = APIClient(token=caissier_token)
    yield client
    client.close()


@pytest.fixture
def unauth_client():
    """Retourne un APIClient sans authentification (pour tester 401)."""
    from helpers.api_client import APIClient
    client = APIClient(base_url=BASE_URL)
    # Assurer que pas de token est défini
    client.session.headers.pop("Authorization", None)
    yield client
    client.close()


@pytest.fixture
def performance_tracker():
    """Retourne un PerformanceTracker pour les tests de performance."""
    from helpers.api_client import PerformanceTracker
    tracker = PerformanceTracker()
    yield tracker
    # Afficher le rapport à la fin
    tracker.print_report()


# =============================================================================
# FIXTURE : Factory de clients
# =============================================================================

@pytest.fixture(scope="session")
def client_factory():
    """Retourne un APIClientFactory pour créer des clients par rôle."""
    from helpers.api_client import APIClientFactory
    return APIClientFactory()
