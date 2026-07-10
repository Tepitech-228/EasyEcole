# Processus de Planification — EasyEcole

> Document décrivant le processus complet de planification de l'emploi du temps,
> de la création par l'administration jusqu'à la notification des utilisateurs.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Création de l'emploi du temps (Admin)](#2-création-de-lemploi-du-temps-admin)
3. [Publication avec notifications](#3-publication-avec-notifications)
4. [Réception par les utilisateurs](#4-réception-par-les-utilisateurs)
5. [Rappel salle automatique](#5-rappel-salle-automatique)
6. [Architecture technique](#6-architecture-technique)
7. [Planning du personnel](#7-planning-du-personnel)
8. [Dépendances et prérequis](#8-dépendances-et-prérequis)

---

## 1. Vue d'ensemble

Le système de planification couvre **trois catégories d'utilisateurs** :

| Catégorie | Données | Mode de réception |
|---|---|---|
| **Enseignants** | Séances de cours liées à leur enseignement | Notifications in-app + Toast rappel salle |
| **Étudiants** | Séances de cours liées à leur filière et niveau | Notifications in-app + Toast rappel salle |
| **Personnel** | Tâches et horaires administratifs | Planning dédié (RH) |

**Acteurs** :
- **Administration / Institution** : crée, modifie, publie l'emploi du temps
- **RH** : gère le planning du personnel
- **Enseignants / Étudiants / Personnel** : consultent et reçoivent les notifications

---

## 2. Création de l'emploi du temps (Admin)

### 2.1 Interface

**Accès** : `[Menu] Cours → Emplois du temps` → `/cours/emplois-du-temps`

**Technologie** : FullCalendar v6 en vue `timeGridWeek` (semaine, créneaux de 15min)

### 2.2 Création d'une séance

1. Clic sur un créneau horaire dans le calendrier
2. Remplir le formulaire modal :

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| Titre | Texte | Oui | Auto-rempli si cours sélectionné |
| Jour semaine | Select (LUN-SAM) | Oui | Déduit du clic |
| Salle | Texte | Oui | Nom ou référence de la salle |
| Date début | Date | Oui | Début de validité de la séance |
| Date fin | Date | Oui | Fin de validité |
| Heure début | Time | Oui | |
| Heure fin | Time | Oui | |
| Cours | Select (ng-select) | Non | Lie automatiquement la classe |
| Enseignant | Select (ng-select) | Non | |
| Description | Textarea | Non | |

3. Soumission → **vérification automatique des conflits** :
   - **Conflit enseignant** : même créneau, même jour
   - **Conflit salle** : même salle, même créneau
   - **Conflit classe** : même classe, même créneau
4. Si conflits → affichés avec option "Forcer l'enregistrement"
5. Si OK ou forcé → séance créée dans `ins_seances`

### 2.3 Modification / Suppression

- Clic sur un événement existant → modal de modification
- Bouton suppression avec confirmation
- Réservé aux rôles `institution` et `admin`

### 2.4 Données stockées

**Table** : `ins_seances`

```
ins_seances
├── id                    INT PK
├── titre                 VARCHAR
├── jourSemaine           ENUM('LUNDI','MARDI',...,'SAMEDI')
├── salle                 VARCHAR
├── dateDebut             DATE          (début période validité)
├── dateFin               DATE          (fin période validité)
├── heureDebut            TIME
├── heureFin              TIME
├── description           TEXT
├── coursId               FK → ins_cours
├── enseignantId          FK → auth_enseignants
├── salleDeClasseId       FK → ins_salles_de_classe (nullable)
├── createdAt             DATETIME
├── updatedAt             DATETIME
├── deletedAt             DATETIME (paranoid)
```

---

## 3. Publication avec notifications

### 3.1 Déclencheur

Bouton **"Publier l'EDT"** visible uniquement pour les rôles `institution` et `admin` sur la page `/cours/emplois-du-temps`.

### 3.2 Endpoint

```
POST /api/v1/inscription/seances/publier
Authentification : REQUISE
Rôle requis : institution | admin
```

### 3.3 Algorithme

```
1. Récupérer TOUTES les séances (sans filtre)
2. Pour CHAQUE séance :
   │
   ├── ENSEIGNANT :
   │   └── enseignant.utilisateur.id → collection des IDs enseignants
   │
   └── ÉTUDIANTS :
       └── cours.classeId → CursusApprenant.where(classeId)
           └── cursus.utilisateur.id → collection des IDs étudiants
3. Notification groupée :
   │
   ├── Enseignants → "Emploi du temps publié. Vous avez X séance(s)."
   │   → type = 'edt_publie'
   │
   └── Étudiants → "Emploi du temps publié. Consultez-le dans la rubrique Cours."
       → type = 'edt_publie'
4. Réponse :
   {
     success: true,
     message: "Emploi du temps publié avec succès",
     enseignantsNotifies: number,
     etudiantsNotifies: number
   }
```

### 3.4 NotificationHelper

**Classe utilitaire** : `src/core/helpers/NotificationHelper.ts`

| Méthode | Description |
|---|---|
| `envoyerNotification(userId, type, message, email?)` | Notification individuelle |
| `envoyerNotificationMultiples(userIds, type, titre, message, email?)` | Notification groupée (bulkCreate) |

Chaque notification est stockée dans `ELearning_notifications` :
```
ELearning_notifications
├── id                    INT PK
├── utilisateurId         INT → auth_utilisateurs
├── type                  VARCHAR ('edt_publie', 'note_publiee', ...)
├── message               TEXT
├── lu                    BOOLEAN (default false)
├── date                  DATETIME (default NOW)
├── createdAt             DATETIME
├── updatedAt             DATETIME
```

---

## 4. Réception par les utilisateurs

### 4.1 Filtrage automatique des données

Quand un utilisateur consulte l'emploi du temps, le backend filtre selon son rôle :

```
GET /api/v1/inscription/seances
```

| Rôle | Filtre appliqué |
|---|---|
| `ENSEIGNANT` | `enseignantId` = enseignant lié à l'utilisateur connecté |
| `APPRENANT` | `coursId IN (cours du demandeInscription → cursusApprenant)` |
| `INSTITUTION` | Aucun filtre (voit tout) |
| `ADMIN` | Aucun filtre (voit tout) |

### 4.2 Notifications in-app

**Dropdowndans le header** (visible pour tous les rôles) :
- Polling toutes les **2 minutes** : `GET /api/v1/elearning/notifications`
- **Badge rouge** avec compteur de notifications non lues
- Affiche les **10 dernières notifications**
- Clic → marque comme lu

**Page complète** : `[Menu] Communication → Notifications` → `/communication/notifications`
- Liste complète avec date, type, message
- Bouton "Tout marquer comme lu"
- Marque automatiquement comme lu au clic

### 4.3 Flux complet enseignant

```
Admin publie EDT (clic bouton)
    ↓
Backend : NotificationHelper.envoyerNotificationMultiples()
    ↓
ELearning_notifications créée pour chaque enseignant
    ↓
Prochain polling frontend (2min) → badge rouge s'affiche
    ↓
Enseignant ouvre dropdown ou page notifications
    ↓
"Votre emploi du temps a été mis à jour. Vous avez 3 séance(s)."
    ↓
Enseignant va dans Cours → Emplois du temps
    ↓
Ne voit QUE ses séances (filtrées par enseignantId)
```

### 4.4 Flux complet étudiant

```
Admin publie EDT (clic bouton)
    ↓
Backend : cours → classeId → CursusApprenant → utilisateurId
    ↓
ELearning_notifications créée pour chaque étudiant concerné
    ↓
Prochain polling frontend (2min) → badge rouge
    ↓
Étudiant ouvre notifications
    ↓
"Votre emploi du temps a été mis à jour."
    ↓
Étudiant va dans Cours → Emplois du temps
    ↓
Ne voit QUE les séances liées à ses cours inscrits
```

---

## 5. Rappel salle automatique

### 5.1 Principe

**Déclencheur** : Frontend polling toutes les **60 secondes**

**Endpoint** : `GET /api/v1/inscription/seances/rappel-salle`

**Fonctionnement** : Détecte si l'utilisateur a un cours en cours qui se termine dans ≤ 10 minutes et cherche le prochain cours de la journée.

### 5.2 Algorithme détaillé

```
GET /seances/rappel-salle
─────────────

1. Déterminer le jour actuel (LUNDI, MARDI, ...)
2. Déterminer l'heure actuelle (HH:MM)

3. Filtrer les séances selon le rôle :
   │
   ├── ENSEIGNANT :
   │   → Enseignant.where({utilisateurId}).id
   │   → Seance.where({enseignantId, jourSemaine, dateDebut ≤ now, dateFin ≥ now})
   │
   ├── APPRENANT :
   │   → CursusApprenant.where({utilisateurId}) → coursIds
   │   → Seance.where({coursId IN coursIds, jourSemaine, dateDebut ≤ now, dateFin ≥ now})
   │
   └── INSTITUTION/ADMIN :
       → Toutes les séances du jour

4. Trier par heureDebut ASC

5. Trouver la séance EN COURS :
   → heureDebut ≤ now ≤ heureFin

6. Si séance en cours trouvée :
   │
   ├── Calculer minutesRestantes = (heureFin - now) en minutes
   │
   ├── Si 0 < minutesRestantes ≤ 10 :
   │   │
   │   ├── nextSeance = séance suivante dans la liste triée
   │   │
   │   └── Retourner :
   │       {
   │         rappel: {
   │           currentCours: "Mathématiques",
   │           currentSalle: "101",
   │           currentFin: "10:00",
   │           nextCours: "Physique",
   │           nextSalle: "202",
   │           nextHeureDebut: "10:00",
   │           minutesRestantes: 8
   │         }
   │       }
   │
   └── Sinon → { rappel: null }

7. Si pas de séance en cours → { rappel: null }
```

### 5.3 Affichage frontend

**Toast notification** (coin inférieur droit) :

```
┌──────────────────────────────────────┐
│ 🔔 Changement de salle imminent !   │
│                                      │
│ Mathématiques se termine dans 8min   │
│ Salle actuelle : 101                 │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Prochain cours : Physique        │ │
│ │ → Salle 202                     │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Durée d'affichage : **35 secondes**, puis disparaît automatiquement.

---

## 6. Architecture technique

### 6.1 Stack

| Couche | Technologie |
|---|---|
| Frontend | Angular 12 + FullCalendar v6 + Tailwind CSS |
| Backend | Express + Sequelize + MySQL |
| Temps réel | Polling HTTP (setInterval) |
| Notifications | Table `ELearning_notifications` |

### 6.2 Dépendances entre les composants

```
┌─────────────────────┐         ┌──────────────────────┐
│  Frontend Angular   │         │   Backend Express    │
│                     │  HTTP   │                      │
│  BaseLayout         │◄───────►│  SeanceController    │
│  │                  │         │  │                   │
│  ├─ Calendar page   │         │  ├─ getAllSeances    │
│  ├─ Planning page   │         │  ├─ getPlanning      │
│  ├─ Notif page      │         │  ├─ publierEDT       │
│  ├─ RH planning     │         │  ├─ getRappelSalle   │
│  └─ Toast rappel    │         │  └─ checkConflits    │
│                     │         │                      │
│  Services :         │         │  NotificationHelper  │
│  ├─ Notification    │◄───────►│  │                   │
│  ├─ PlanningPersonnel│◄──────►│  ├─ envoyerNotif     │
│  └─ Seance          │◄───────►│  └─ envoyerMultiples │
└─────────────────────┘         └──────────────────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │     MySQL DB     │
                                │                  │
                                │ ├─ ins_seances   │
                                │ ├─ ins_cours     │
                                │ ├─ ins_classes   │
                                │ ├─ ins_cursus    │
                                │ ├─ auth_enseignants│
                                │ ├─ auth_utilisateurs│
                                │ ├─ rh_employes   │
                                │ ├─ rh_planning_personnel│
                                │ └─ ELearning_notifications│
                                └──────────────────┘
```

### 6.3 Endpoints API

#### Emploi du temps

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| `GET` | `/api/v1/inscription/seances` | Tous | Liste filtrée selon le rôle |
| `POST` | `/api/v1/inscription/seances` | Institution | Créer une séance |
| `PUT` | `/api/v1/inscription/seances/:id` | Institution | Modifier une séance |
| `DELETE` | `/api/v1/inscription/seances/:id` | Institution | Supprimer une séance |
| `GET` | `/api/v1/inscription/seances/planning` | Tous | Événements pour FullCalendar |
| `POST` | `/api/v1/inscription/seances/check-conflits` | Institution | Vérifier les conflits |
| **`POST`** | **`/api/v1/inscription/seances/publier`** | **Institution** | **Publier + notifier** |
| **`GET`** | **`/api/v1/inscription/seances/rappel-salle`** | **Tous** | **Rappel 10min** |

#### Notifications

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/elearning/notifications` | Notifications de l'utilisateur connecté |
| `PUT` | `/api/v1/elearning/notifications/:id/lu` | Marquer comme lue |

#### Planning personnel

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/rh/planning-personnel` | Liste (filtrable par employeId) |
| `POST` | `/api/v1/rh/planning-personnel` | Créer une entrée |
| `PUT` | `/api/v1/rh/planning-personnel/:id` | Modifier |
| `DELETE` | `/api/v1/rh/planning-personnel/:id` | Supprimer |
| `GET` | `/api/v1/rh/planning-personnel/personnel` | Planning du personnel connecté |

---

## 7. Planning du personnel

### 7.1 Gestion (RH / Admin)

**Page** : `[Menu] RH → Planning personnel` → `/rh/planning-personnel`

**Fonctionnalités** :
- Tableau listant toutes les entrées de planning
- Création : employé + jour + horaire + tâche + période de validité
- Édition / Suppression
- Code couleur par tâche

### 7.2 Modèle de données

**Table** : `rh_planning_personnel`

```
rh_planning_personnel
├── id                    INT PK
├── employeId             FK → rh_employes
├── jourSemaine           ENUM('LUNDI',...,'SAMEDI')
├── heureDebut            TIME
├── heureFin              TIME
├── tache                 VARCHAR
├── couleur               VARCHAR (#hex)
├── dateDebut             DATE
├── dateFin               DATE
├── description           TEXT
├── createdAt             DATETIME
├── updatedAt             DATETIME
```

### 7.3 Consultation

**Vue hebdomadaire** : `[Menu] Pointage → Planning` → `/pointage/planning`
- Grille 7 colonnes (Lun → Dim)
- Cartes par tâche avec code couleur
- chargement depuis l'API (plus de mock)

---

## 8. Dépendances et prérequis

### 8.1 Modèles requis (existants)

| Modèle | Table | Rôle dans le processus |
|---|---|---|
| `Seance` | `ins_seances` | Stocke les séances de cours |
| `Cours` | `ins_cours` | Lie matière → classe |
| `Classe` | `ins_classes` | Groupe d'étudiants |
| `CursusApprenant` | `ins_cursus_apprenants` | Lie étudiant → classe |
| `Enseignant` | `auth_enseignants` | Lie enseignant → utilisateur |
| `Utilisateur` | `auth_utilisateurs` | Compte utilisateur (tous rôles) |
| `Notification` | `ELearning_notifications` | Stocke les notifications |
| `RhEmploye` | `rh_employes` | Employés (personnel) |

### 8.2 Nouveau modèle

| Modèle | Table | Créé le |
|---|---|---|
| `RhPlanningPersonnel` | `rh_planning_personnel` | 10/07/2026 |

### 8.3 Synchronisation BDD

La table `rh_planning_personnel` est créée automatiquement au prochain démarrage de l'API grâce à `sequelize.sync()`.

```bash
npm run db:sync    # Synchroniser le schéma uniquement
npm run db:reset   # Réinitialiser complètement la BDD
```

---

## Annexe : Arbre de décision (Rappel salle)

```
Début (toutes les 60s)
    │
    ▼
Quel est le rôle ?
    │
    ├── ENSEIGNANT → chercher par enseignantId
    ├── APPRENANT  → chercher par cursus → classe → cours
    └── AUTRE      → { rappel: null }
    │
    ▼
Séance en cours aujourd'hui ?
    │
    ├── NON → { rappel: null }
    │
    └── OUI → Calculer temps restant
        │
        ├── ≤ 10min ?
        │   │
        │   ├── OUI → Prochaine séance existe ?
        │   │   │
        │   │   ├── OUI → { rappel: current + next }
        │   │   │
        │   │   └── NON → { rappel: current only }
        │   │
        │   └── NON → { rappel: null }
        │
        └── FIN
```

---

> Document généré le 10/07/2026 — EasyEcole Project
> Voir aussi : [AMÉLIORATIONS.md](../AMÉLIORATIONS.md) (Phase 9)
