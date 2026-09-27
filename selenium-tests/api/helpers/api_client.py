"""
helpers/api_client.py — Wrapper requests avec gestion d'authentification

Fournit une classe APIClient pour faire des requêtes HTTP authentifiées
vers le backend Express EasyEcole V4.

Usage :
    from helpers.api_client import APIClient
    client = APIClient(token="your_jwt_token")
    response = client.get("/inscription/parcours")
"""

import os
import time
import requests
from typing import Optional, Dict, Any, List, Tuple

BASE_URL = os.environ.get("API_BASE", "http://localhost:3000/api/v1")
"""URL de base du backend API."""


class APIClient:
    """
    Client API HTTP avec gestion automatique des tokens JWT.

    Attributes:
        token: Token JWT d'authentification
        base_url: URL de base du backend
        session: Session requests persistante
        last_response: Dernière réponse reçue
        response_time: Temps de la dernière requête
    """

    def __init__(self, token: Optional[str] = None, base_url: Optional[str] = None):
        self.token = token
        self.base_url = base_url or BASE_URL
        self.session = requests.Session()
        self.last_response: Optional[requests.Response] = None
        self.response_time: float = 0.0

        if self.token:
            self._set_auth_header()

    def _set_auth_header(self):
        """Configure l'en-tête d'authentification Bearer."""
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        })

    def set_token(self, token: str):
        """Met à jour le token d'authentification."""
        self.token = token
        self._set_auth_header()

    def _build_url(self, path: str) -> str:
        """Construit l'URL complète à partir du chemin relatif."""
        path = path.lstrip("/")
        return f"{self.base_url}/{path}"

    def close(self):
        """Ferme la session requests."""
        try:
            self.session.close()
        except Exception:
            pass

    def _measure_time(self, func, *args, **kwargs) -> Tuple[Any, float]:
        """Mesure le temps d'exécution d'une requête."""
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        self.response_time = elapsed
        return result, elapsed

    # ── Requêtes GET ──

    def get(self, path: str, params: Optional[Dict] = None, **kwargs) -> requests.Response:
        """
        Effectue une requête GET authentifiée.

        Args:
            path: Chemin relatif de l'API (ex: "/inscription/parcours")
            params: Paramètres de requête
            **kwargs: Arguments supplémentaires pour requests.get

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", self.session.headers)
        self.last_response, self.response_time = self._measure_time(
            self.session.get, url, params=params, headers=headers, **kwargs
        )
        return self.last_response

    # ── Requêtes POST ──

    def post(self, path: str, data: Optional[Dict] = None, json: Optional[Dict] = None, **kwargs) -> requests.Response:
        """
        Effectue une requête POST authentifiée.

        Args:
            path: Chemin relatif de l'API
            data: Données form (x-www-form-urlencoded)
            json: Données JSON
            **kwargs: Arguments supplémentaires pour requests.post

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", self.session.headers)
        self.last_response, self.response_time = self._measure_time(
            self.session.post, url, data=data, json=json, headers=headers, **kwargs
        )
        return self.last_response

    # ── Requêtes PUT ──

    def put(self, path: str, data: Optional[Dict] = None, json: Optional[Dict] = None, **kwargs) -> requests.Response:
        """
        Effectue une requête PUT authentifiée.

        Args:
            path: Chemin relatif de l'API
            data: Données form
            json: Données JSON
            **kwargs: Arguments supplémentaires

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", self.session.headers)
        self.last_response, self.response_time = self._measure_time(
            self.session.put, url, data=data, json=json, headers=headers, **kwargs
        )
        return self.last_response

    # ── Requêtes DELETE ──

    def delete(self, path: str, **kwargs) -> requests.Response:
        """
        Effectue une requête DELETE authentifiée.

        Args:
            path: Chemin relatif de l'API
            **kwargs: Arguments supplémentaires

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", self.session.headers)
        self.last_response, self.response_time = self._measure_time(
            self.session.delete, url, headers=headers, **kwargs
        )
        return self.last_response

    # ── Requêtes PATCH ──

    def patch(self, path: str, data: Optional[Dict] = None, json: Optional[Dict] = None, **kwargs) -> requests.Response:
        """
        Effectue une requête PATCH authentifiée.

        Args:
            path: Chemin relatif de l'API
            data: Données form
            json: Données JSON
            **kwargs: Arguments supplémentaires

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", self.session.headers)
        self.last_response, self.response_time = self._measure_time(
            self.session.patch, url, data=data, json=json, headers=headers, **kwargs
        )
        return self.last_response

    # ── Requêtes multipart (upload de fichiers) ──

    def upload(self, path: str, files: Dict[str, Any], data: Optional[Dict] = None, **kwargs) -> requests.Response:
        """
        Effectue une requête d'upload multipart/form-data.

        Args:
            path: Chemin relatif de l'API
            files: Dictionnaire {nom_champ: (nom_fichier, contenu, type)}
            data: Données supplémentaires
            **kwargs: Arguments supplémentaires

        Returns:
            Response HTTP
        """
        url = self._build_url(path)
        headers = kwargs.pop("headers", {k: v for k, v in self.session.headers.items() if k != "Content-Type"})
        self.last_response, self.response_time = self._measure_time(
            self.session.post, url, files=files, data=data, headers=headers, **kwargs
        )
        return self.last_response

    # ── Connexion / Auth ──

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Se connecte et stocke le token.

        Args:
            email: Email de l'utilisateur
            password: Mot de passe

        Returns:
            Dictionnaire contenant le token et les données utilisateur
        """
        resp = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "motDePasse": password}
        )
        self.last_response = resp
        data = resp.json()
        token = data.get("token") or data.get("accessToken") or data.get("data", {}).get("token")
        if token:
            self.token = token
            self._set_auth_header()
        return data

    def logout(self) -> requests.Response:
        """Déconnexion."""
        resp = self.session.post(f"{self.base_url}/auth/logout")
        self.last_response = resp
        self.token = None
        self.session.headers.pop("Authorization", None)
        return resp

    # ── Helpers ──

    def get_status_code(self) -> int:
        """Retourne le status code de la dernière réponse."""
        return self.last_response.status_code if self.last_response else 0

    def get_json(self) -> Dict:
        """Retourne le JSON de la dernière réponse."""
        if self.last_response:
            try:
                return self.last_response.json()
            except Exception:
                return {}
        return {}

    def get_text(self) -> str:
        """Retourne le texte de la dernière réponse."""
        return self.last_response.text if self.last_response else ""

    def assert_status(self, expected_status: int, msg: str = ""):
        """
        Assert que le status code correspond à la valeur attendue.
        """
        actual = self.get_status_code()
        assert actual == expected_status, (
            f"{msg} Status attendu: {expected_status}, obtenu: {actual} | {self.get_text()[:200]}"
        )

    def assert_success(self, msg: str = ""):
        """Assert que la réponse est un succès (200 ou 201)."""
        actual = self.get_status_code()
        assert actual in (200, 201), (
            f"{msg} Réponse attendue succès (200/201), obtenu: {actual} | {self.get_text()[:200]}"
        )

    def assert_error(self, expected_status: int, msg: str = ""):
        """Assert que la réponse est une erreur."""
        actual = self.get_status_code()
        assert actual == expected_status, (
            f"{msg} Erreur attendue: {expected_status}, obtenu: {actual}"
        )

    def assert_field(self, field: str, value: Any, msg: str = ""):
        """Assert qu'un champ du corps de réponse a la valeur attendue."""
        body = self.get_json()
        assert field in body, f"{msg} Champ '{field}' absent du corps de réponse"
        assert body[field] == value, f"{msg} Champ '{field}' attendu: {value}, obtenu: {body[field]}"


# =============================================================================
# Factory de clients par rôle
# =============================================================================

class APIClientFactory:
    """
    Factory pour créer des APIClient authentifiés par rôle.

    Usage :
        factory = APIClientFactory()
        admin = factory.create_admin()
        apprenant = factory.create_apprenant()
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or BASE_URL
        self._clients: Dict[str, APIClient] = {}

    def _create_with_login(self, email: str, password: str, role: str) -> APIClient:
        """Crée un client et se connecte."""
        client = APIClient(base_url=self.base_url)
        data = client.login(email, password)
        if data:
            self._clients[role] = client
        return client

    def create_admin(self) -> APIClient:
        """Crée un client authentifié admin."""
        return self._create_with_login(
            os.environ.get("TEST_ADMIN_EMAIL", "tepitechbuild@gmail.com"),
            os.environ.get("TEST_ADMIN_PASSWORD", "Admin@2026!"),
            "admin"
        )

    def create_scolarite(self) -> APIClient:
        """Crée un client authentifié scolarité/institution."""
        return self._create_with_login(
            os.environ.get("TEST_INST_EMAIL", "direction@easyecole.tg"),
            os.environ.get("TEST_INST_PASSWORD", "password123"),
            "scolarite"
        )

    def create_enseignant(self) -> APIClient:
        """Crée un client authentifié enseignant."""
        return self._create_with_login(
            os.environ.get("TEST_ENS_EMAIL", "prof.maths@easyecole.tg"),
            os.environ.get("TEST_ENS_PASSWORD", "password123"),
            "enseignant"
        )

    def create_apprenant(self) -> APIClient:
        """Crée un client authentifié apprenant."""
        return self._create_with_login(
            os.environ.get("TEST_APP_EMAIL", "tepitechcorp@gmail.com"),
            os.environ.get("TEST_APP_PASSWORD", "password123"),
            "apprenant"
        )

    def create_caissier(self) -> APIClient:
        """Crée un client authentifié caissier."""
        return self._create_with_login(
            os.environ.get("TEST_CAI_EMAIL", "caissier.atsu@easyecole.tg"),
            os.environ.get("TEST_CAI_PASSWORD", "password123"),
            "caissier"
        )

    def get_client(self, role: str) -> Optional[APIClient]:
        """Retourne un client par rôle."""
        return self._clients.get(role)

    def create_unauthenticated(self) -> APIClient:
        """Crée un client sans authentification."""
        return APIClient(base_url=self.base_url)


# =============================================================================
# Helper de performance
# =============================================================================

class PerformanceTracker:
    """
    Tracker de performance pour mesurer les temps de réponse API.
    """

    def __init__(self):
        self.records: List[Dict[str, Any]] = []
        self.start_time: float = 0.0

    def record(self, endpoint: str, method: str, status_code: int, response_time: float, **kwargs):
        """Enregistre une mesure de performance."""
        self.records.append({
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time": response_time,
            **kwargs
        })

    def get_summary(self) -> Dict[str, Any]:
        """Retourne un résumé des performances."""
        if not self.records:
            return {"total": 0}

        times = [r["response_time"] for r in self.records]
        errors = [r for r in self.records if r["status_code"] >= 400]

        return {
            "total_requests": len(self.records),
            "total_errors": len(errors),
            "error_rate": len(errors) / len(self.records) * 100,
            "avg_response_time": sum(times) / len(times),
            "max_response_time": max(times),
            "min_response_time": min(times),
            "p95_response_time": sorted(times)[int(len(times) * 0.95)] if len(times) > 1 else times[0],
            "requests_per_second": len(self.records) / max(max(times), 0.001)
        }

    def print_report(self):
        """Affiche un rapport de performance formaté."""
        summary = self.get_summary()
        print("\n" + "=" * 70)
        print("  RAPPORT DE PERFORMANCE API — EasyEcole V4")
        print("=" * 70)
        print(f"  Total requêtes     : {summary['total_requests']}")
        print(f"  Total erreurs      : {summary['total_errors']}")
        print(f"  Taux d'erreur      : {summary['error_rate']:.1f}%")
        print(f"  Temps moyen        : {summary['avg_response_time']:.4f}s")
        print(f"  Temps min          : {summary['min_response_time']:.4f}s")
        print(f"  Temps max          : {summary['max_response_time']:.4f}s")
        print(f"  Temps P95          : {summary['p95_response_time']:.4f}s")
        print(f"  Requêtes/sec       : {summary['requests_per_second']:.1f}")
        print("=" * 70 + "\n")

    def generate_markdown_report(self) -> str:
        """Génère un rapport en format Markdown."""
        summary = self.get_summary()
        md = []
        md.append("# Rapport de Performance API — EasyEcole V4")
        md.append("")
        md.append("## Résumé")
        md.append("")
        md.append(f"| Métrique | Valeur |")
        md.append(f"|----------|--------|")
        md.append(f"| Total requêtes | {summary['total_requests']} |")
        md.append(f"| Total erreurs | {summary['total_errors']} |")
        md.append(f"| Taux d'erreur | {summary['error_rate']:.1f}% |")
        md.append(f"| Temps moyen | {summary['avg_response_time']:.4f}s |")
        md.append(f"| Temps min | {summary['min_response_time']:.4f}s |")
        md.append(f"| Temps max | {summary['max_response_time']:.4f}s |")
        md.append(f"| Temps P95 | {summary['p95_response_time']:.4f}s |")
        md.append(f"| Requêtes/sec | {summary['requests_per_second']:.1f} |")
        md.append("")
        md.append("## Détail par endpoint")
        md.append("")
        md.append("| Endpoint | Méthode | Status | Temps (s) |")
        md.append("|----------|---------|--------|-----------|")
        for r in self.records:
            md.append(f"| {r['endpoint']} | {r['method']} | {r['status_code']} | {r['response_time']:.4f} |")
        md.append("")
        return "\n".join(md)
