# Pôle Administration & Système

## Processus métier

### Implémentés
| Fonctionnalité | Pages | Statut |
|---------------|-------|--------|
| Gestion des utilisateurs | `/administration/utilisateurs` | ✅ CRUD |
| Gestion des rôles | `/administration/roles` | ✅ CRUD |
| Codes QR étudiants | `/administration/qr-codes` | ✅ Génération |
| Codes QR enseignants | `/administration/qr-codes-enseignants` | ✅ Génération |
| Cartes étudiantes | `/administration/cartes` | ✅ Consultation (PDF généré auto) |
| Audit logs | `/administration/audit-logs` | ✅ Consultation |
| Configuration générale | `/administration/configuration` | ✅ Paramètres système |
| Mon profil | `/parametres/profil` | ✅ |
| Mon compte | `/parametres/compte` | ✅ |
| École / Institution | `/parametres/ecole` | ✅ |
| Années scolaires | `/parametres/annees-scolaires` | ✅ CRUD |
| Barèmes | `/parametres/baremes` | ✅ CRUD |
| Frais | `/parametres/frais` | ✅ CRUD |
| Notifications | `/parametres/notifications` | ✅ Configuration |
| Rôles (paramètres) | `/parametres/roles` | ✅ DUPLICATE avec `/administration/roles` |
| Système | `/parametres/systeme` | ✅ |
| Audit | `/parametres/audit` | ✅ Configuration |
| Sauvegardes | `/parametres/sauvegardes` | ⚠️ Basique |
| Modèles documents | `/parametres/modeles` | ✅ |
| Permissions | `/parametres/permissions` | ✅ |

### Pages redondantes
| Pages | Suggestion |
|-------|------------|
| `/administration/roles` + `/parametres/roles` | **Fusionner** → une seule page sous `/administration/roles` |
| `/parametres/profil` + `/parametres/compte` | **Fusionner** → une seule page "Mon compte" avec sections |
| `/scolarite/mon-compte` | **Supprimer** → rediriger vers `/parametres/compte` |

## Carte Étudiante (nouvelle fonctionnalité)

Générée automatiquement après validation du bordereau d'inscription.

### Données encodées dans le QR code
```json
{
  "matricule": "ESA-2024-00042",
  "utilisateurId": 123,
  "nom": "Doe John",
  "ecole": "ESA"
}
```

### Format
- **Dimensions**: 85.6 mm × 54 mm (format carte de crédit ISO/IEC 7810 ID-1)
- **Recto**: Photo, nom, prénom, matricule, classe, filière, QR code
- **Génération**: Puppeteer → PDF
- **Stockage**: `public/inscription/cartes/carte_{matricule}_{timestamp}.pdf`
- **Déclencheur**: Automatique dans `DemandeInscriptionController.validerDemandeInscription`
- **Régénération**: `POST /inscription/dossiers/:id/regenerer-carte`
- **Téléchargement**: `GET /inscription/dossiers/:id/carte`

### Endpoints API
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/inscription/dossiers/:id/carte` | Télécharger la carte PDF |
| `POST` | `/inscription/dossiers/:id/regenerer-carte` | Régénérer la carte |
