# EasyEcole Selenium Test Suite — V4

Suite de tests fonctionnels Selenium pour la démo client EasyEcole V4.
Couvre : import/export UE, inscription, réinscription, rattrapage, notes/bordereaux, paiements.

## Prérequis

- **Python 3.9+** installé
- **Chrome** installé (la version la plus récente)
- **Backend EasyEcole** démarré sur `http://localhost:3000`
- **Frontend Angular** démarré sur `http://localhost:4200`

## Installation

```powershell
cd D:\EasyEcole\selenium-tests
pip install -r requirements.txt
```

## Lancement des tests

### Tests d'inscription
```powershell
pytest -v --html=report.html tests/test_inscription_selenium.py
```

### Tests de réinscription
```powershell
pytest -v --html=report.html tests/test_reinscription_selenium.py
```

### Tests de rattrapage
```powershell
pytest -v --html=report.html tests/test_rattrapage_selenium.py
```

### Tests de notes et bordereaux
```powershell
pytest -v --html=report.html tests/test_notes_selenium.py
```

### Tests de notes de rattrapage
```powershell
pytest -v --html=report.html tests/test_notes_rattrapage_selenium.py
```

### Tous les tests combinés
```powershell
pytest -v --html=report.html tests/
```

### Avec headless (pour CI)
```powershell
set HEADLESS=1
pytest -v --html=report.html tests/
```

### Tests spécifiques
```powershell
# Tests d'inscription
pytest -v tests/test_inscription_selenium.py::TestInscriptionHappy::test_inscription_soumission_complete
pytest -v tests/test_inscription_selenium.py::TestInscriptionError::test_inscription_donnees_manquantes

# Tests de réinscription
pytest -v tests/test_reinscription_selenium.py::TestReinscriptionHappy::test_reinscription_soumission_complete
pytest -v tests/test_reinscription_selenium.py::TestReinscriptionError::test_reinscription_non_eligible

# Tests de rattrapage
pytest -v tests/test_rattrapage_selenium.py::TestRattrapageComite::test_comite_validation_decision

# Tests de notes
pytest -v tests/test_notes_selenium.py::TestBordereaux::test_bordereaux_page_chargement
pytest -v tests/test_notes_selenium.py::TestTypesBordereaux::test_types_creation

# Tests de notes rattrapage
pytest -v tests/test_notes_rattrapage_selenium.py::TestNotesRattrapageSaisie::test_notes_rattrapage_import_pv
```

## Structure des fichiers

```
selenium-tests/
├── requirements.txt              # Dépendances Python
├── conftest.py                   # Fixtures pytest (driver, login, waits)
├── pages/
│   ├── login_page.py            # Page Object : page de connexion
│   ├── import_export_page.py    # Page Object : page import/export
│   ├── dashboard_page.py        # Page Object : dashboard / accueil
│   ├── inscription_page.py      # Page Object : wizard d'inscription
│   ├── reinscription_page.py    # Page Object : wizard de réinscription
│   ├── rattrapage_page.py       # Page Object : pages de rattrapage
│   └── notes_page.py            # Page Object : notes, bordereaux, paiements
├── tests/
│   ├── test_import_ue.py        # Tests critiques UE (14 tests)
│   ├── test_import_all_types.py # Tests étendus tous types
│   ├── test_inscription_selenium.py      # Tests inscription (15 tests)
│   ├── test_reinscription_selenium.py    # Tests réinscription (14 tests)
│   ├── test_rattrapage_selenium.py       # Tests rattrapage (20 tests)
│   ├── test_notes_selenium.py            # Tests notes/bordereaux (22 tests)
│   └── test_notes_rattrapage_selenium.py # Tests notes rattrapage (19 tests)
├── downloads/                   # Téléchargements de fichiers (non commités)
├── screenshots/                 # Captures d'écran d'échec (non commitées)
├── report.html                  # Rapport HTML pytest (généré)
├── .gitignore                   # Fichiers à ne pas committer
└── README.md                    # Ce fichier
```

## Compte de test

- **Email** : `tepitechbuild@gmail.com`
- **Mot de passe** : `Admin@2026!`
- **Rôle** : admin

## Sorties

- `report.html` — Rapport HTML des tests (ouvrir dans un navigateur)
- `screenshots/` — Captures d'écran en cas d'échec
- Console — Résultats détaillés de chaque test

## Notes

- Les chemins Windows avec espaces sont gérés via des raw strings (`r"..."`)
- Les tests indépendants les uns des autres (pas de dépendance d'ordre)
- Chaque test démarre avec une session navigateur fraîche
- Les tests qui nécessitent des fichiers de référence non présents sont automatiquement skipes
- Le rapport HTML est généré automatiquement par `pytest-html`
- 104 tests au total (14 import UE + 90 nouveaux tests)
