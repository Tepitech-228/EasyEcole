"""
conftest.py — Fixture racine pour la suite de tests API EasyEcole V4

Configure le chemin Python pour que les modules helpers soient trouvés.
"""

import sys
import os

# Ajouter le répertoire api au chemin Python
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Ajouter le sous-répertoire helpers
helpers_dir = os.path.join(api_dir, "helpers")
if helpers_dir not in sys.path:
    sys.path.insert(0, helpers_dir)

# Importer les fixtures de conftest_api
from conftest_api import *