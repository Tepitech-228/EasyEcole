# Workflow Complet de Rattrapage - Guide d'Utilisation

## Vue d'ensemble
Le système de rattrapage EasyEcole suit un processus en 4 étapes avec validation, documents requis et paiement.

---

## 📋 Étape 1 : Configuration de la Session (Administrateur)

### Créer une session de rattrapage
**Route :** `POST /api/v1/inscription/rattrapages/sessions`

**Rôles autorisés :** `ADMIN`, `INSTITUTION`

**Body :**
```json
{
  "libelle": "Session rattrapage S1 2025",
  "dateDebut": "2025-02-01",
  "dateFin": "2025-02-15",
  "description": "Rattrapage pour étudiants en échec",
  "classes": [1, 2, 3],
  "documentsRequis": [
    {
      "libelle": "Certificat médical",
      "obligatoire": true,
      "type": "medical"
    },
    {
      "libelle": "Justificatif d'absence",
      "obligatoire": true,
      "type": "justificatif"
    }
  ]
}
```

**Réponse :** Session créée avec ses documents requis

---

## 👤 Étape 2 : Inscription & Soumission du Dossier (Étudiant)

### 2a. Créer une demande de rattrapage
**Route :** `POST /api/v1/inscription/rattrapages/demandes`

**Rôles autorisés :** `APPRENANT`

**Body :**
```json
{
  "coursId": 5,
  "coursParticipantId": 10,
  "motifEtudiant": "Raison de mon absence",
  "creneauSouhaite": "Lundi 15h-17h"
}
```

**Réponse :** Demande créée avec statut `inscrit` et `demandePar = utilisateurId`

### 2b. Téléverser les documents requis
**Route :** `POST /api/v1/inscription/rattrapages/demandes/:id/documents`

**Rôles autorisés :** `APPRENANT`

**FormData :**
- `documentRequisId` : ID du document requis
- `fichier` : Fichier à téléverser

**Réponse :** Document enregistré dans `RattrapageDocumentDepose`

### 2c. Consulter ses demandes
**Route :** `GET /api/v1/inscription/rattrapages/mes-demandes`

**Rôles autorisés :** `APPRENANT`

**Réponse :**
```json
[
  {
    "id": 1,
    "statut": "inscrit",
    "source": "demande_etudiant",
    "demandePar": 42,
    "statutDemande": null,
    "montant": 5000,
    "statutPaiement": "impaye",
    "motifEtudiant": "...",
    "cours": {...},
    "coursParticipant": {...}
  }
]
```

---

## ✅ Étape 3 : Instruction & Validation des Documents (Comité)

### 3a. Vérifier la complétude du dossier
**Route :** `GET /api/v1/inscription/rattrapages/demandes/:id/verifier-completude`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`

**Réponse :**
```json
{
  "ok": true,
  "missing": [],
  "documentsDeposes": [...]
}
```

### 3b. Valider ou rejeter la demande
**Route :** `PUT /api/v1/inscription/rattrapages/demandes/:id/valider`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`

**Body :**
```json
{
  "etatValidation": "valide",
  "messageValidation": "Dossier conforme"
}
// OU pour rejet
{
  "etatValidation": "rejete",
  "messageValidation": "Certificat médical non valide",
  "motifRejet": "Document expiré"
}
```

**Mise à jour :** `statutDemande` passe à `valide` ou `rejete`, `dateValidationComite` enregistrée

**Notification étudiant :** Si validé, l'étudiant reçoit une notification lui donnant accès à l'étape paiement

---

## 💰 Étape 4 : Règlement des Frais & Validation Finale (Étudiant)

### 4a. Programmer la date d'examen (Institution/Admin)
**Route :** `PUT /api/v1/inscription/rattrapages/demandes/:id/programmer`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`

**Body :**
```json
{
  "dateRattrapage": "2025-02-10",
  "heureDebut": "14:00",
  "heureFin": "16:00",
  "salle": "Salle 101",
  "enseignantId": 15
}
```

**Mise à jour :** Statut change à `convoque`, enseignant assigné

### 4b. Créer/Consulter le bordereau de paiement
**Route :** `POST /api/v1/inscription/rattrapages/demandes/:id/bordereau`

**Rôles autorisés :** `APPRENANT`, `INSTITUTION`, `ADMIN`

**Réponse :** Bordereau généré avec montant du rattrapage

### 4c. Confirmer le paiement (Auto)
**Route :** `POST /api/v1/inscription/rattrapages/demandes/:id/confirmer-paiement-auto`

**Rôles autorisés :** `APPRENANT`, `INSTITUTION`, `ADMIN`

**Réponse :**
```json
{
  "id": 1,
  "statutPaiement": "paye",
  "statut": "valide"
}
```

**Écritures comptables :** Crédite automatiquement le compte produit rattrapage

### 4d. Confirmer le paiement (Manuel - Admin)
**Route :** `PUT /api/v1/inscription/rattrapages/demandes/:id/confirmer-paiement`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`, `CAISSIER_BANQUE`

**Body :**
```json
{
  "paiementId": 42
}
```

**Mise à jour :** `statutPaiement` → `paye`, lien établi avec bordereau

---

## 📊 Dashboards et Statistiques

### Consulter toutes les demandes (Institution)
**Route :** `GET /api/v1/inscription/rattrapages/demandes`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`, `CAISSIER_BANQUE`

**Filtres optionnels :**
- `?statut=inscrit|convoque|present|absent|valide`
- `?coursId=5`

**Réponse :** Liste de toutes les demandes de rattrapage

### Obtenir les statistiques
**Route :** `GET /api/v1/inscription/rattrapages/stats`

**Réponse :**
```json
{
  "total": 50,
  "inscrits": 20,
  "convoques": 15,
  "presents": 10,
  "absents": 3,
  "valides": 2,
  "avecNote": 2
}
```

---

## 🎓 Gestion des Résultats (Enseignant/Correcteur)

### Saisir les notes de rattrapage
**Route :** `PUT /api/v1/inscription/rattrapages/notes`

**Rôles autorisés :** `ENSEIGNANT`, `ADMIN`

**Body :**
```json
[
  {
    "id": 1,
    "noteRattrapage": 15.5
  },
  {
    "id": 2,
    "noteRattrapage": 12
  }
]
```

**Mise à jour :** Note enregistrée, statut → `valide` si complète

### Marquer présence/absence
**Route :** `PUT /api/v1/inscription/rattrapages/:id`

**Rôles autorisés :** `ENSEIGNANT`, `ADMIN`

**Body :**
```json
{
  "statut": "present"  // ou "absent"
}
```

---

## 📅 Sessions de Rattrapage Officielles

### Lister les sessions
**Route :** `GET /api/v1/inscription/rattrapages/sessions`

**Réponse :** Sessions programmées avec classes concernées

### Voir les documents requis d'une session
**Route :** `GET /api/v1/inscription/rattrapages/sessions/:id/documents-requis`

**Réponse :** Listes documents obligatoires/optionnels

---

## 👨‍💼 Ressources Disponibles

### Lister les enseignants disponibles
**Route :** `GET /api/v1/inscription/rattrapages/demandes/enseignants-disponibles`

**Rôles autorisés :** `INSTITUTION`, `ADMIN`

**Réponse :** Tous les enseignants avec leurs contacts

---

## 🔄 Modèles de Données Clés

### RattrapageInscription
| Champ | Type | Description |
|-------|------|-------------|
| `id` | INT | Identifiant unique |
| `coursParticipantId` | INT | Participant au cours |
| `coursId` | INT | Cours concerné |
| `demandePar` | INT | ID étudiant demandeur |
| `source` | ENUM | `demande_etudiant` ou `auto` |
| `statut` | ENUM | `inscrit`, `convoque`, `present`, `absent`, `valide` |
| `statutDemande` | ENUM | `en_attente`, `valide`, `rejete` |
| `montant` | FLOAT | Frais de rattrapage |
| `statutPaiement` | ENUM | `impaye` ou `paye` |
| `dateRattrapage` | DATE | Date de l'examen |
| `enseignantId` | INT | Correcteur assigné |
| `noteRattrapage` | FLOAT | Note obtenue |
| `dateValidationComite` | DATE | Date validation comité |
| `motifRejet` | TEXT | Raison du rejet (si applicable) |

### RattrapageDocumentDepose
| Champ | Type | Description |
|-------|------|-------------|
| `id` | INT | Identifiant unique |
| `rattrapageInscriptionId` | INT | Demande de rattrapage |
| `documentRequisId` | INT | Modèle document obligatoire |
| `fichier` | VARCHAR | Chemin du fichier téléversé |

---

## ⚙️ Configuration Paramètres (Admin)

### Définir les frais de rattrapage
**Paramètre clé :** `frais_rattrapage`
**Valeur par défaut :** 5000

### Définir le compte produit comptable
**Paramètre clé :** `compte_produit_rattrapage`
**Valeur par défaut :** `704`

---

## 📝 Notes Importantes

1. **Complétude obligatoire :** Tous les documents requis doivent être téléversés avant validation du comité
2. **Notification automatique :** Après validation comité, l'étudiant reçoit une notification
3. **Écritures comptables :** Automatiquement créées lors du paiement auto-confirmé
4. **Période de rattrapage :** Définie lors de la création de la session
5. **Enseignant correcteur :** Choisi par l'institution au moment de la programmation
6. **Transparence :** L'étudiant peut consulter ses demandes et leur statut à tout moment

---

## 🚀 Flux de Statuts

```
INSCRIPTION → [COMITÉ VALIDE/REJETTE] 
   ↓
Valide : → PROGRAMMÉ → CONVOQUÉ → PRÉSENT/ABSENT → NOTÉ → VALIDE
   ↓
Rejeté : → REJETE (Notification étudiant, possibilité résoumission)
```

---

## ✨ Avantages du Système

✅ Documents centralisés et tracés  
✅ Workflow transparent pour l'étudiant  
✅ Contrôle comité avant paiement  
✅ Intégration comptable automatique  
✅ Notification à chaque étape  
✅ Statistiques et reporting  
✅ Flexibilité : demandes manuelles ou automatiques  

