# Règles de Gestion des Types de Bordereaux - EasyEcole

## 1. Vue d'ensemble des Types de Bordereaux

### 1.1 Types définis dans le modèle (`Bordereau.ts`)

```typescript
type?: 'inscription' | 'scolarite' | 'rattrapage' | 'mixte' | null
```

### 1.2 Types d'opérations (`ins_types_operations_bordereau`)

| ID | Code | Libellé | Description |
|----|------|---------|-------------|
| 1 | INSCRIPTION | Frais d'inscription | Paiement des frais d'inscription à une session |
| 2 | SCOLARITE | Frais de scolarité | Paiement des frais de scolarité (mensualités) |
| 3 | SOUTENANCE | Soutenance | Frais de soutenance de mémoire |
| 4 | DOCUMENT | Demande de document | Frais de documents administratifs |
| 5 | CERTIFICAT | Certificat | Frais de certificat |
| 6 | ATTESTATION | Attestation | Frais d'attestation |
| 7 | DIPLOME | Diplôme | Frais de diplôme |
| 8 | REINSCRIPTION | Réinscription | Frais de réinscription |
| 9 | AUTRE | Autre | Autres frais divers |
| 10 | MIXTE | Mixte | Paiement combiné (inscription + scolarité) |

---

## 2. Règles de Gestion par Type

### 2.1 Type: `inscription`

#### Description
Paiement des frais d'inscription pour une nouvelle session académique.

#### Règles de Gestion
| Règle | Description |
|-------|-------------|
| **Création dossier** | Déclenche la création complète du dossier étudiant (matricule, cursus, cours, échéanciers) |
| **Imputation** | FIFO sur l'échéance d'inscription uniquement |
| **Pipeline** | Fait passer le dossier en statut `authentifie` → transmission au comité |
| **Quitus** | Pas de quitus généré |
| **Écriture comptable** | Compte crédit `702` (inscription) |

#### Processus
```
Dépôt → Validation Cabinet → Saisie ESA → Création Dossier → Imputation → Transmission Comité
```

#### Données Requises
- `montant`: Montant de l'inscription
- `referenceBancaire`: Référence de la transaction bancaire
- `fichier`: Preuve de paiement (PDF/image)

#### Conditions
- Aucun dossier étudiant existant pour cet utilisateur
- Le montant doit couvrir les frais d'inscription de la session

---

### 2.2 Type: `scolarite`

#### Description
Paiement des frais de scolarité (mensualités ou paiement complet).

#### Règles de Gestion
| Règle | Description |
|-------|-------------|
| **Création dossier** | Aucun (le dossier doit déjà exister) |
| **Imputation** | FIFO sur les échéances de scolarité uniquement |
| **Pipeline** | Aucun changement de statut pipeline |
| **Quitus** | Génération d'un quitus de scolarité (PDF + GED + email) |
| **Écriture comptable** | Compte crédit `701` (scolarité) |

#### Processus
```
Dépôt → Validation Cabinet → Saisie ESA → Imputation → Génération Quitus
```

#### Données Requises
- `montant`: Montant de la mensualité ou du paiement
- `echeanceId`: **OBLIGATOIRE** - ID de l'échéance de scolarité concernée
- `referenceBancaire`: Référence de la transaction bancaire
- `fichier`: Preuve de paiement (PDF/image)

#### Conditions
- Un dossier étudiant DOIT déjà exister
- L'échéance spécifiée doit être en statut `impaye` ou `partiel`

---

### 2.3 Type: `mixte`

#### Description
Paiement combiné couvrant à la fois les frais d'inscription et de scolarité.

#### Règles de Gestion
| Règle | Description |
|-------|-------------|
| **Création dossier** | Déclenche la création du dossier si c'est le premier bordereau |
| **Imputation** | Par composition : inscription d'abord, puis scolarité |
| **Pipeline** | Fait passer le dossier en statut `authentifie` → transmission au comité |
| **Quitus** | Pas de quitus généré |
| **Écriture comptable** | Compte crédit `701` (scolarité) ou `702` (inscription) selon la composition |

#### Processus
```
Dépôt → Validation Cabinet → Saisie ESA → Composition → Création Dossier → Imputation → Transmission Comité
```

#### Données Requises
- `montant`: Montant total du paiement
- `composition`: Tableau de répartition `[{type: 'inscription', montant: X}, {type: 'scolarite', montant: Y}]`
- `referenceBancaire`: Référence de la transaction bancaire
- `fichier`: Preuve de paiement (PDF/image)

#### Conditions
- La somme de la composition doit être égale au montant total
- Si pas de composition fournie, auto-calcul: inscription d'abord, puis scolarité

---

### 2.4 Type: `rattrapage`

#### Description
Paiement des frais de rattrapage (sessions de rattrapage).

#### Règles de Gestion
| Règle | Description |
|-------|-------------|
| **Création dossier** | Aucun |
| **Imputation** | Spécifique au workflow de rattrapage |
| **Pipeline** | Géré par `RattrapageWorkflowController` |
| **Quitus** | Pas de quitus généré |
| **Écriture comptable** | Non applicable |

#### Processus
```
Demande Rattrapage → Validation Comité → Dépôt Bordereau → Confirmation Paiement
```

#### Données Requises
- `montant`: Montant des frais de rattrapage
- `fichier`: Preuve de paiement (PDF/image)

#### Conditions
- Exclusivement traité par `RattrapageWorkflowController`
- La validation classique (`BordereauController.validerBordereau`) refuse ce type

---

### 2.5 Types spéciaux (SOUTENANCE, DOCUMENT, CERTIFICAT, ATTESTATION, DIPLOME, REINSCRIPTION, AUTRE)

#### Description
Frais spécifiques pour des services ponctuels.

#### Règles de Gestion
| Règle | Description |
|-------|-------------|
| **Création dossier** | Aucun |
| **Imputation** | FIFO standard sur les échéances appropriées |
| **Pipeline** | Aucun changement |
| **Quitus** | Pas de quitus généré |
| **Écriture comptable** | Compte crédit selon le type de service |

#### Données Requises
- `montant`: Montant des frais
- `referenceBancaire`: Référence de la transaction bancaire
- `fichier`: Preuve de paiement (PDF/image)

---

## 3. Catégories de Données

### 3.1 Données du Bordereau (`ins_bordereaux`)

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | INTEGER | Identifiant unique | Auto |
| `type` | ENUM | Type de bordereau | Non (défaut: null) |
| `typeOperationId` | INTEGER | Référence vers `ins_types_operations_bordereau` | Non |
| `montant` | FLOAT | Montant du paiement | Oui |
| `referenceBancaire` | STRING | Référence de la transaction | Non |
| `numeroBordereau` | STRING | Numéro du bordereau | Non |
| `moyenPaiement` | ENUM | Moyen de paiement (espece, en_ligne, mobile_money) | Non |
| `statut` | ENUM | Statut du bordereau | Auto |
| `fichier` | STRING | Chemin vers le fichier preuve | Oui |
| `utilisateurId` | INTEGER | Référence vers l'utilisateur | Auto |
| `echeanceId` | INTEGER | Référence vers l'échéance (obligatoire pour scolarite) | Conditionnel |
| `composition` | JSON | Répartition pour les bordereaux mixtes | Non |
| `dateSoumission` | DATE | Date de soumission | Auto |
| `dateValidation` | DATE | Date de validation | Auto |
| `valideParId` | INTEGER | Utilisateur qui a validé | Auto |

### 3.2 Statuts du Bordereau

| Statut | Description | Transitions possibles |
|--------|-------------|----------------------|
| `en_attente` | En attente de validation | → `valide`, `rejete` |
| `valide` | Validé par le cabinet | → `traite` |
| `rejete` | Rejeté | Aucune |
| `en_saisie_comptable` | En cours de saisie comptable | → `traite` |
| `traite` | Traité (saisie comptable terminée) | Aucune |

---

## 4. Processus de Traitement

### 4.1 Flux Général

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   DÉPÔT         │────▶│  VALIDATION      │────▶│  SAISIE ESA     │
│  (Apprenant)    │     │  (Cabinet)       │     │  (Comptable)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  TRANSMISSION   │◀────│  IMPUTATION      │◀────│  CRÉATION       │
│  COMITÉ         │     │  (FIFO)          │     │  DOSSIER        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  VALIDATION     │
│  FINALE COMITÉ  │
└─────────────────┘
```

### 4.2 Rôles Impliqués

| Rôle | Actions |
|------|---------|
| **APPRENANT** | Déposer un bordereau |
| **CABINET_COMPTABLE** | Valider/Rejeter un bordereau |
| **ESA_COMPTA** | Saisie comptable et imputation |
| **COMITE_ORIENTATION** | Validation finale du dossier |
| **ADMIN** | Toutes les actions |

---

## 5. Règles de Validation

### 5.1 Validation à la Création

```typescript
// Types autorisés à la création
const typesAutorises = ['inscription', 'scolarite', 'rattrapage'];

// Pour type = 'scolarite', echeanceId est obligatoire
if (type === 'scolarite' && !echeanceId) {
  return erreur("echeanceId requis pour un bordereau de scolarité");
}

// Le fichier est toujours obligatoire
if (!fichier) {
  return erreur("Fichier bordereau requis");
}
```

### 5.2 Validation par le Cabinet

- Vérification de l'identité de l'étudiant
- Vérification du montant payé
- Vérification de la référence bancaire
- Changement de statut: `en_attente` → `valide`

### 5.3 Saisie ESA-COMPTA

- Vérification du type d'opération
- Imputation FIFO ou par composition
- Création du dossier si premier bordereau
- Génération du quitus (scolarité uniquement)
- Transmission au comité si tous les bordereaux sont traités

---

## 6. Écritures Comptables

### 6.1 Comptes Utilisés

| Type | Compte Débit | Compte Crédit | Libellé |
|------|--------------|---------------|---------|
| `inscription` | 512 (Banque) | 702 (Inscription) | Paiement inscription |
| `scolarite` | 512 (Banque) | 701 (Scolarité) | Paiement scolarité |
| `mixte` | 512 (Banque) | 701/702 | Paiement mixte |
| `rattrapage` | 512 (Banque) | 701 (Scolarité) | Paiement rattrapage |

### 6.2 Journal

Toutes les écritures sont enregistrées dans le journal `VEN` (Ventes).

---

## 7. Notifications

### 7.1 Emails Automatiques

| Événement | Destinataire | Contenu |
|-----------|--------------|---------|
| Bordereau validé | Étudiant | Confirmation de validation |
| Dossier transmis au comité | Étudiant | Information sur la transmission |
| Quitus généré | Étudiant | Quitus de scolarité en PJ |

### 7.2 Notifications In-App

- Notification à l'étudiant lors de la validation
- Notification au comité lors de la transmission d'un dossier

---

## 8. Quitus

### 8.1 Types de Quitus

| Type | Déclencheur | Contenu |
|------|-------------|---------|
| `scolarite` | Bordereau de scolarité traité | Reçu de paiement de scolarité |

### 8.2 Génération

- PDF généré via `DocGenGeneratorService`
- Archivé dans GED
- Envoyé par email à l'étudiant

---

## 9. Sécurité et Permissions

### 9.1 Permissions Requises

| Action | Permission |
|--------|------------|
| Déposer un bordereau | `action.inscription.bordereau.creer` |
| Valider un bordereau | `action.inscription.bordereau.valider` |
| Saisie comptable | `action.finance.bordereau.saisir` |
| Voir bordereaux à traiter | `action.finance.bordereau.voir` |

### 9.2 Contrôles d'Accès

- Seul l'apprenant peut déposer un bordereau
- Seuls CABINET_COMPTABLE et ADMIN peuvent valider
- Seuls ESA_COMPTA et ADMIN peuvent faire la saisie comptable

---

## 10. Exceptions et Cas Particuliers

### 10.1 Double Soumission

Verrouillage au niveau de la base de données (`SELECT ... FOR UPDATE`) pour éviter les validations multiples.

### 10.2 Bordereau Sans Type

Si `type` est null:
- Le système utilise `typeOperationId` pour déterminer le type
- Si c'est le premier bordereau → `inscription`
- Sinon → `scolarite` (par défaut)

### 10.3 Paiement Partiel

Si le montant payé est inférieur aux frais dus:
- L'échéance reste en statut `partiel`
- Le solde est reporté sur l'échéance suivante (FIFO)

### 10.4 Paiement Excessif

Si le montant payé est supérieur aux frais dus:
- Le surplus est crédité dans le portefeuille de crédit
- Le crédit est automatiquement consommé sur les échéances suivantes

---

*Document généré le 2026-08-27*
*Version: 1.0*
*Auteur: EasyEcole System*
