# Plan de fusion des pages frontend

## Pages redondantes ou trop proches

### 1. `/administration/roles` + `/parametres/roles`
**Problème** : Deux pages exactement identiques pour la gestion des rôles.
**Solution** : Supprimer `/parametres/roles`, garder uniquement `/administration/roles`.

### 2. `/parametres/profil` + `/parametres/compte`
**Problème** : Profil = infos personnelles, Compte = email/mot de passe. Trop proches.
**Solution** : Fusionner en une seule page `/parametres/mon-compte` avec deux sections (Profil + Sécurité).

### 3. `/scolarite/mon-compte`
**Problème** : Redondant avec `/parametres/compte`.
**Solution** : Supprimer, rediriger vers `/parametres/mon-compte`.

### 4. `/inscription/parcours` + `/orientation/parcours`
**Problème** : Mêmes données (parcours), juste des vues différentes.
**Solution** : Garder sous `/orientation/parcours` pour le catalogue public, fusionner la partie back-office sous `/inscription/parcours`. Les composants peuvent être partagés.

### 5. `/inscription/demandes` + `/orientation/demandes`
**Problème** : Les demandes d'orientation sont un sous-ensemble des inscriptions.
**Solution** : Intégrer les demandes d'orientation comme filtre dans la page des demandes d'inscription.

### 6. Paramètres bulletins (pages éparpillées)
Pages concernées :
- `/bulletins/parametres-notation`
- `/bulletins/parametres`
- `/bulletins/echelles`
- `/bulletins/mcc`
- `/bulletins/sessions`
- `/bulletins/jury`

**Solution** : Fusionner en une seule page `/bulletins/parametres` avec des sous-sections par onglet :
- Notation (échelles, MCC, sessions, jury)

### 7. Gestion frais (pages éparpillées)
Pages concernées :
- `/parametres/frais`
- `/inscription/frais-parcours`

**Solution** : Fusionner : la page frais sous `/parametres` gère les types de frais, `/inscription/frais-parcours` reste pour l'affectation par parcours.

### 8. Administration pages de configuration
Pages concernées :
- `/administration/configuration`
- `/parametres/ecole`
- `/parametres/annees-scolaires`
- `/parametres/systeme`

**Solution** : Fusionner en une page `/administration/configuration` avec onglets.

## Pages candidates à la suppression pure

| Page | Raison | Redirection |
|------|--------|-------------|
| `/scolarite/mon-compte` | Redondant | `/parametres/mon-compte` |
| `/parametres/roles` | Redondant | `/administration/roles` |
| `/parametres/profil` | Redondant | `/parametres/mon-compte` |

## Pages candidates à la fusion par onglets

| Page principale | Pages à intégrer |
|-----------------|------------------|
| `/bulletins/parametres` | échelles, mcc, sessions, jury, notation |
| `/administration/configuration` | ecole, annees-scolaires, systeme |
| `/parametres/mon-compte` | profil + securite |
| `/inscription/paiements` | bordereaux + validation-bordereaux + paiements |

## Bilan des économies

| Type | Nombre |
|------|--------|
| Suppressions pures | 3 pages |
| Fusions par onglets | 12 pages → 4 pages |
| **Économie nette** | **~11 pages** (de ~180 à ~169) |
