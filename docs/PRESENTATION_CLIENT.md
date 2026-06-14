# EasyEcole — Présentation Client

---

## 1. Vision Globale

**EasyEcole** est un **Système d'Information Scolaire (SIS)** complet, conçu pour digitaliser l'intégralité de la gestion d'un établissement d'enseignement.

**Problème résolu :**  
Les écoles africaines gèrent encore l'orientation, les inscriptions et les cours sur papier ou via des outils disparates. EasyEcole centralise tout sur une plateforme unique.

**Cible :** Établissements privés et publics (secondaire, supérieur, formation professionnelle).

---

## 2. Fonctionnalités par type d'utilisateur

### 👨‍🎓 Apprenant (Étudiant)

| Module | Fonctionnalités |
|--------|----------------|
| **Auth** | S'inscrire, se connecter, modifier son profil, uploader sa photo, confirmer son email |
| **Orientation** | Parcourir les parcours de formation, voir les débouchés et vidéos, ajouter au panier, soumettre une demande d'orientation |
| **Inscription** | Choisir une session, créer une demande d'inscription, sélectionner ses cours, uploader ses documents (dossier), payer ses frais (Mobile Money CinetPay), consulter son cursus |
| **Cours** | Consulter les cours, voir les chapitres et ressources, télécharger les fichiers, regarder les vidéos, voir son emploi du temps, consulter ses notes et présences |
| **Paramètres** | Modifier son profil et son compte |

### 🏫 Institution (Direction)

| Module | Fonctionnalités |
|--------|----------------|
| **Auth** | Gérer les utilisateurs (créer/modifier/supprimer), gérer les enseignants, statistiques (utilisateurs, apprenants, etc.) |
| **Orientation** | CRUD complet des parcours (avec image/vidéo), catégories, niveaux d'étude, matières prérequis, débouchés, traiter les demandes d'orientation |
| **Inscription** | Créer des sessions, gérer les parcours et cours, créer les classes et salles, gérer les frais, valider les inscriptions, suivre les paiements, créer les cursus, gérer les années académiques |
| **Cours** | Affecter les enseignants aux cours, consulter tous les cours, voir les statistiques |
| **Paramètres** | Modifier le profil de l'institution |

### 👨‍🏫 Enseignant

| Module | Fonctionnalités |
|--------|----------------|
| **Auth** | Se connecter, modifier son profil, uploader sa photo |
| **Cours** | Créer et gérer les chapitres (avec image), créer et gérer les ressources, uploader des fichiers, prendre les présences, remplir le cahier de texte, saisir les notes, voir son emploi du temps |
| **Paramètres** | Modifier son profil |

### 💰 CaissierBanque

| Module | Fonctionnalités |
|--------|----------------|
| **Auth** | Se connecter, modifier son profil |
| **Inscription** | Encaisser les paiements en espèces, enregistrer les transactions, consulter l'historique |
| **Paramètres** | Modifier son profil |

### ⚙️ Admin

| Module | Fonctionnalités |
|--------|----------------|
| **Auth** | Super-administration, gestion complète de tous les utilisateurs |
| **Tous les modules** | Accès en lecture/écriture à toutes les données |

---

## 3. Modules Fonctionnels

### Module Authentification (Auth)
- Inscription et connexion sécurisées (email ou identifiant)
- Confirmation d'email par lien sécurisé
- Réinitialisation de mot de passe
- Upload de photo de profil
- Rôles et permissions

### Module Orientation
- **Parcours de formation** : création, modification, suppression
- Catégories et niveaux d'étude hiérarchiques
- **Débouchés professionnels** par parcours (avec vidéo explicative)
- **Prérequis** par matière
- **Panier de parcours** : l'apprenant sélectionne ses parcours comme dans un panier d'achat
- **Demande d'orientation** : soumission et traitement par l'institution
- Notifications email automatiques

### Module Inscription
- **Sessions d'inscription** : périodes d'ouverture des inscriptions
- **Parcours et cours** : catalogue complet
- **Demande d'inscription** : workflow complet
  - Choix des parcours et cours
  - Upload de documents (dossier)
  - Suivi des frais d'inscription
  - Validation par l'institution
- **Paiements** : 3 modes
  - Espèces (caisse)
  - En ligne
  - Mobile Money **(CinetPay)** — paiement par téléphone mobile
- **Génération automatique** de matricule étudiant
- **Cursus** : curriculum complet de l'apprenant
- **Programmeur de salles de classe**

### Module Cours
- **Gestion complète des cours** : création, chapitres, ressources
- **Ressources pédagogiques** : fichiers, vidéos, documents
- **Séances de cours** : planification et suivi
- **Emploi du temps**
- **Présences** : feuilles de présence, suivi par participant
- **Cahier de texte** : suivi pédagogique enseignant
- **Notes d'évaluation** : relevés de notes
- **Gestion des enseignants** : affectation aux cours

### Module Paramètres
- Profil utilisateur
- Paramètres du compte

---

## 4. Technologies

### Frontend (Angular)
- **Framework :** Angular 12.2 avec TypeScript strict
- **UI :** Tailwind CSS 2.2
- **Bibliothèques :**
  - FullCalendar — emploi du temps et planning
  - ngx-quill / Quill — éditeur de texte riche
  - ngx-videogular — lecteur vidéo
  - ng-select — sélecteurs avancés
  - jwt-decode — décodage JWT

### Backend (Node.js)
- **Runtime :** Node.js Express 4
- **Langage :** TypeScript avec Babel
- **ORM :** Sequelize 6 (MySQL)
- **Base de données :** MySQL 5.6+
- **Sécurité :**
  - JWT (JSON Web Tokens) pour l'authentification
  - bcrypt pour le hash des mots de passe
  - Middleware de rôles (Institution, Apprenant, Enseignant, etc.)
- **Paiement mobile :** API CinetPay (Mobile Money)
- **Email :** Nodemailer (SMTP Hostinger)
- **Fichiers :** Multer (upload de fichiers/ images / vidéos)

### Architecture
```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Angular 12    │ ──►  │  Express API    │ ──►  │    MySQL     │
│   (Port 4200)   │      │  (Port 3000)    │      │   (3306)     │
└─────────────────┘      └─────────────────┘      └──────────────┘
                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
               CinetPay      Nodemailer    Stockage
             (Paiements)     (Emails)      (Fichiers)
```

---

## 5. Workflow Clé : Parcours Apprenant

```
1. Connexion / Inscription
          │
2. Orientation : Parcourir les formations
          │
3. Panier : Sélectionner ses parcours
          │
4. Demande d'orientation (soumise à l'institution)
          │
5. Réponse de l'institution
          │
6. Inscription : Choisir une session
          │
7. Demande d'inscription avec choix des cours
          │
8. Upload des documents (dossier)
          │
9. Paiement des frais (espèces/en ligne/Mobile Money)
          │
10. Validation par l'institution
          │
11. Cursus créé → Accès aux cours
          │
12. Suivi des cours, présences, notes, cahier de texte
```

---

## 6. Points Forts (Argumentaire Client)

### ✅ Pour les directions d'établissement
- **Gain de temps :** fini la paperasse, tout est digitalisé
- **Visibilité totale :** tableau de bord avec statistiques en temps réel
- **Contrôle :** workflow de validation à chaque étape
- **Traçabilité :** historique complet des inscriptions et paiements

### ✅ Pour les étudiants
- **Parcours fluide :** de l'orientation à l'inscription en ligne
- **Paiement mobile :** payer ses frais depuis son téléphone (Mobile Money)
- **Accès aux cours :** ressources, vidéos, cahier de texte en ligne
- **Suivi :** notes, présences, emploi du temps

### ✅ Pour les enseignants
- **Gestion des cours :** chapitres, ressources, fichiers
- **Présences :** prise et suivi digitalisés
- **Cahier de texte :** suivi pédagogique structuré
- **Notes :** saisie et consultation des évaluations

---

## 7. Démonstration (Slides Recommandées)

| Slide | Contenu |
|-------|---------|
| 1 | **Page d'accueil / Dashboard** — Vue d'ensemble des statistiques |
| 2 | **Orientation → Parcours** — Catalogue des formations disponibles |
| 3 | **Orientation → Détails Parcours** — infos, débouchés, vidéo |
| 4 | **Inscription → Sessions** — Sessions d'inscription ouvertes |
| 5 | **Inscription → Demande** — Workflow de candidature |
| 6 | **Inscription → Paiement** — Mobile Money CinetPay |
| 7 | **Cours → Cours** — Liste des cours et détails |
| 8 | **Cours → Chapitre** — Contenu pédagogique et ressources |
| 9 | **Cours → Présences** — Feuille de présence |
| 10 | **Cours → Emploi du temps** — Planning des séances |

---

## 8. Prochaines étapes / Roadmap

- [x] Architecture backend et base de données
- [x] Module Auth (authentification multi-rôles)
- [x] Module Orientation (parcours, débouchés, demandes)
- [x] Module Inscription (sessions, demandes, paiements, cursus)
- [x] Module Cours (chapitres, ressources, présences, notes)
- [ ] Déploiement production
- [ ] Module de communication (messages/appels)
- [ ] Application mobile
- [ ] Intégration autres moyens de paiement (OM, Wave, Orange Money)
- [ ] Modules complémentaires (bibliothèque, transports, restauration)

---

## 9. Informations Techniques (Déploiement)

| Élément | Valeur |
|---------|--------|
| Frontend | Angular 12.2 → port 4200 |
| Backend | Node.js Express → port 3000 |
| Base de données | MySQL 5.6 → port 3306 |
| API Base URL | `/api/v1` |
| Paiement mobile | CinetPay (Mobile Money, XAF) |
| Email SMTP | Hostinger (easy.ecole@technologybusiness-tb.com) |
| Authentification | JWT + bcrypt |

---

## 10. Statistiques (Base de données)

| Module | Nombre de tables |
|--------|-----------------|
| Auth (Utilisateurs) | 14 tables |
| Orientation | 11 tables |
| Inscription | 29 tables |
| **Total** | **54 tables** |

---

> Document préparé pour présentation client — EasyEcole 2026
