# EasyEcole - Documentation des Fonctionnalités

## Vue d'ensemble

EasyEcole est une plateforme de gestion scolaire complète couvrant l'ensemble du cycle de vie académique et administratif d'un établissement d'enseignement supérieur.

---

## 1. AUTH - Authentification et Gestion des Utilisateurs

### Description
Module central d'authentification et de gestion des utilisateurs. Gère les profils, rôles et permissions avec un système RBAC (Role-Based Access Control).

### Fonctionnalités
- **Authentification JWT** : Login, logout, refresh token
- **Gestion des utilisateurs** : CRUD complet des utilisateurs
- **Gestion des rôles** : Création et attribution de rôles
- **Permissions** : Système granulaire de permissions par action
- **Profils spécifiques** :
  - Apprenants (étudiants)
  - Enseignants
  - Caissiers bancaires
  - Comité d'orientation
  - Personnel administratif
- **Gestion des institutions** : Configuration multi-établissements
- **Réinitialisation de mot de passe**

### Rôles disponibles
| Rôle | Description |
|------|-------------|
| `ADMIN` | Administrateur système |
| `APPRENANT` | Étudiant |
| `ENSEIGNANT` | Enseignant/Professeur |
| `SECRETAIRE` | Secrétariat |
| `CAISSIER_BANQUE` | Caissier bancaire |
| `CABINET_COMPTABLE` | Cabinet comptable (vérification bordereaux) |
| `ESA_COMPTA` | ESA Comptabilité (saisie comptable) |
| `COMITE_ORIENTATION` | Comité d'orientation |
| `SURVEILLANT` | Surveillant |
| `PARENT` | Parent d'élève |

---

## 2. INSCRIPTION - Inscription et Scolarité

### Description
Module principal de gestion des inscriptions et du parcours académique des étudiants. Couvre l'ensemble du cycle de vie : préinscription → inscription → paiement → scolarité → diplôme.

### Fonctionnalités

#### Gestion académique
- **Sessions académiques** : Création et gestion des sessions d'inscription
- **Parcours d'études** : Gestion des filières et parcours
- **Cours** : Catalogue des cours et programmes
- **Classes** : Gestion des classes et groupes
- **Salles de classe** : Inventaire des salles
- **Créneaux horaires** : Planification des emplois du temps
- **Semestres académiques** : Gestion des semestres

#### Processus d'inscription
- **Préinscription** : Formulaire de pré-candidature
- **Demandes d'inscription** : Traitement des demandes
- **Validation en comité** : Workflow de validation
- **Réinscription** : Processus de réinscription
- **Rattrattrapage** : Gestions des rattrapages

#### Paiements et finances
- **Échéanciers** : Plans de paiement
- **Bordereaux** : Justificatifs de paiement
- **Paiements** : Enregistrement des paiements
- **ESA-COMPTA** : Saisie comptable et imputation
- **Cabinet comptable** : Vérification des bordereaux

#### Vie académique
- **Présences** : Suivi des présences par cours
- **Absences** : Gestion des absences et retards
- **Notes et évaluations** : Saisie et consultation des notes
- **MCC** : Matières, Coefficients, Crédits
- **Cahier de texte** : Cahiers de texte numériques
- **Cartes d'étudiant** : Génération et vérification

### Workflow d'inscription
```
ÉTUDIANT
   │
   ├── Préinscription
   │
   ├── Dépôt bordereau de paiement
   │
   ▼
CABINET COMPTABLE
   │
   ├── Vérification authenticité
   │
   ├── Validation / Rejet
   │
   ▼
ESA-COMPTA
   │
   ├── Saisie informations bancaires
   │
   ├── Imputation comptable
   │
   ▼
COMITÉ ORIENTATION
   │
   ├── Validation finale
   │
   ├── Affectation parcours
   │
   ▼
INSCRIPTION FINALE
```

---

## 3. COMPTABILITÉ - Comptabilité Générale

### Description
Module de comptabilité complète selon les normes OHADA. Gère le plan comptable, les écritures, les états financiers et la trésorerie.

### Fonctionnalités

#### Plan comptable
- **Comptes** : Gestion du plan comptable OHADA (classes 1-9)
- **Journaux** : Journaux comptables (ACH, VEN, BA, CAI, PAI, OD)
- **Écritures comptables** : Saisie et validation des écritures
- **Grand livre** : Consultation du grand livre
- **Balance** : Balance comptable

#### Trésorerie
- **Comptes bancaires** : Gestion des comptes bancaires
- **Relevés bancaires** : Import et gestion des relevés
- **Rapprochement bancaire** : Rapprochement automatique
- **Caisse** : Gestion de caisse

#### Exercices et états financiers
- **Exercices comptables** : Gestion des exercices
- **Bilan** : Bilan comptable
- **Compte de résultat** : Compte de résultat
- **Export** : Export PDF/Excel des états financiers

#### Paramétrage
- **Frais de parcours** : Tarification par parcours
- **Lignes frais étudiant** : Frais individuels
- **Réductions** : Gestion des réductions/bourses
- **Pénalités de retard** : Calcul des pénalités

---

## 4. BULLETINS - Bulletins et Notes

### Description
Module de gestion des évaluations, des notes et de génération des bulletins de notes.

### Fonctionnalités

#### Gestion des notes
- **Évaluations** : Création des évaluations (devoirs, examens, TP)
- **Saisie des notes** : Saisie par classe/cours
- **MCC** : Configuration Matières-Coefficients-Crédits
- **Échelles de notes** : Barèmes et mentions
- **Audit des notes** : Traçabilité des modifications

#### Bulletins
- **Génération** : Génération automatique des bulletins
- **Consultation** : Consultation par étudiant/classe
- **Relevés de notes** : Relevés semestriels/annuels
- **Publication** : Publication aux étudiants

#### Délibérations
- **Sessions de jury** : Organisation des jurys
- **Décisions** : Passage, redoublement, exclusion
- **Dettes académiques** : Gestion des dettes

#### Rattrapages
- **Sessions de rattrapage** : Planification
- **Inscriptions** : Inscription aux rattrapages
- **Notes de rattrapage** : Saisie et calcul

---

## 5. E-LEARNING - Formation en Ligne

### Description
Module de formation à distance avec gestion des cours, ressources, quiz et suivi de progression.

### Fonctionnalités

#### Cours en ligne
- **Création de cours** : Cours vidéo et PDF
- **Modules** : Organisation en modules
- **Supports** : Vidéos, PDF, documents
- **Arborescence** : Structure arborescente des cours

#### Interaction
- **Chat** : Messagerie étudiant-enseignant
- **Notifications** : Notifications en temps réel
- **Devoirs** : Dépôt et correction de devoirs

#### Évaluation
- **Quiz** : Création de quiz (QCM, vrai/faux, etc.)
- **Passage de quiz** : Interface de passage
- **Scores** : Suivi des scores

#### Suivi
- **Progression** : Avancement par cours/module
- **Certificats** : Génération de certificats
- **Statistiques** : Tableaux de bord de progression

---

## 6. SCOLARITÉ - Gestion Scolaire

### Description
Module du secrétariat et de la gestion scolaire quotidienne.

### Fonctionnalités

#### Documents
- **Demandes de documents** : Attestations, certificats, relevés
- **Traitement** : Validation et émission
- **Suivi** : Suivi des demandes

#### Vie scolaire
- **Registres académiques** : Registres des étudiants
- **Calendrier** : Événements et calendrier scolaire
- **Réclamations** : Traitement des réclamations

#### Discipline
- **Sanctions disciplinaires** : Gestion des sanctions
- **Conseils de classe** : Conseils de classe
- **Sanctions académiques** : Sanctions académiques

#### Décisions
- **Décisions de passage** : Passage en classe supérieure
- **Réorientations** : Demandes de réorientation
- **Diplômes** : Gestion des diplômes

#### Bibliothèque
- **Catalogue** : Catalogue des livres
- **Prêts** : Gestion des prêts
- **Retours** : Gestion des retours

#### Caisse
- **Encaissements** : Encaissements
- **Décaissements** : Décaissements
- **Clôture** : Clôture de caisse

---

## 7. RH - Ressources Humaines

### Description
Module complet de gestion des ressources humaines.

### Fonctionnalités

#### Gestion du personnel
- **Employés** : Fiches employés
- **Départements** : Organisation en départements
- **Postes** : Fiches de poste
- **Contrats** : Gestion des contrats

#### Recrutement
- **Offres d'emploi** : Publication d'offres
- **Candidatures** : Réception des candidatures
- **Entretiens** : Planification des entretiens

#### Formation
- **Plan de formation** : Planification
- **Sessions** : Sessions de formation
- **Participations** : Suivi des participations

#### Évaluation
- **Fiches d'évaluation** : Évaluations périodiques
- **Critères** : Critères d'évaluation

#### Paie
- **Bulletins de paie** : Génération des bulletins
- **Rubriques** : Rubriques de paie
- **Périodes** : Périodes de paie
- **Heures supplémentaires** : Gestion des HS

#### Congés
- **Demandes de congé** : Soumission et validation
- **Soldes** : Suivi des soldes
- **Planning** : Planning du personnel

#### Prêts
- **Prêts employés** : Gestion des prêts
- **Remboursements** : Suivi des remboursements

---

## 8. GED - Gestion Électronique de Documents

### Description
Module de gestion documentaire électronique (GED) pour l'archivage et la gestion du cycle de vie des documents.

### Fonctionnalités

#### Documents
- **Upload** : Téléversement de documents
- **Types** : Typologie des documents
- **Domaines** : Domaines documentaires
- **Cycle de vie** : Courant → Intermédiaire → Définitif → Destruction

#### Classement
- **Dossiers** : Arborescence de dossiers
- **Dossiers virtuels** : Dossiers virtuels
- **Tags** : Étiquetage
- **Recherche** : Recherche full-text

#### Courrier
- **Courrier entrant** : Réception
- **Courrier sortant** : Émission
- **Suivi** : Suivi du courrier

#### Conservation
- **DUA** : Durée d'Utilité Administrative
- **Archivage** : Archivage
- **Destruction** : Gestion de la destruction

#### Configuration
- **Stockage** : Local, S3, etc.
- **Permissions** : Droits d'accès
- **Processus** : Workflows de validation

---

## 9. DOCGEN - Génération de Documents

### Description
Module de génération automatique de documents officiels à partir de templates.

### Fonctionnalités

#### Templates
- **Création** : Éditeur de templates
- **Types** : Types de documents
- **Variables** : Gestion des variables

#### Génération
- **Documents** : Génération depuis template
- **PDF** : Export PDF
- **Numérotation** : Numérotation automatique

#### Signature
- **Cachets** : Gestion des cachets/sceaux
- **Signatures** : Workflow de signature
- **Circuit** : Circuit de validation

#### Documents étudiants
- **Attestations** : Attestations de scolarité
- **Certificats** : Certificats
- **Relevés** : Relevés de notes

---

## 10. SURVEILLANCE - Surveillance et Discipline

### Description
Module de surveillance et de gestion de la discipline quotidienne.

### Fonctionnalités

#### Tableau de bord
- **KPIs** : Indicateurs clés
- **Présences du jour** : Suivi quotidien
- **Incidents** : Nombre d'incidents

#### Suivi
- **Présences** : Suivi des présences
- **Absences** : Suivi des absences
- **Retards** : Suivi des retards

#### Incidents
- **Signalement** : Signalement d'incidents
- **Suivi** : Suivi des incidents
- **Statistiques** : Statistiques disciplinaires

---

## 11. PARENT - Portail Parent

### Description
Portail dédié aux parents pour suivre la scolarité de leurs enfants.

### Fonctionnalités

#### Tableau de bord
- **Enfants** : Liste des enfants liés
- **Vue par enfant** : Dashboard par enfant

#### Consultation
- **Notes** : Consultation des notes
- **Absences** : Suivi des absences
- **Emploi du temps** : Planning des cours
- **Paiements** : Statut des paiements
- **Documents** : Documents publiés

---

## 12. ADMINISTRATION - Administration Système

### Description
Module d'administration système pour les super-administrateurs.

### Fonctionnalités

#### Tableau de bord
- **Métriques** : Métriques système
- **Statistiques** : Statistiques globales

#### Gestion
- **Utilisateurs** : Gestion des utilisateurs
- **Rôles** : Gestion des rôles
- **QR Codes** : Génération de QR codes
- **Logs** : Logs d'audit

#### Configuration
- **Système** : Configuration système
- **Permissions** : Configuration des permissions

---

## 13. REPORTING - Rapports et Statistiques

### Description
Module de reporting global avec tableaux de bord et exports.

### Fonctionnalités

#### Rapports
- **RH** : Rapports ressources humaines
- **Paiements** : Rapports de paiement
- **Notes** : Rapports de notes
- **Effectifs** : Statistiques d'effectifs
- **Budget** : Rapports budgétaires
- **Achats** : Rapports d'achats
- **Stocks** : Rapports de stocks
- **Consolidé** : Rapports consolidés

---

## 14. STOCK - Gestion des Stocks

### Description
Module de gestion des stocks et inventaires.

### Fonctionnalités

#### Articles
- **Catalogue** : Catalogue des articles
- **Catégories** : Catégorisation

#### Mouvements
- **Entrées** : Entrées de stock
- **Sorties** : Sorties de stock
- **Transferts** : Transferts

#### Inventaires
- **Inventaires** : Inventaires physiques
- **Écarts** : Gestion des écarts

#### Fournisseurs
- **Fournisseurs** : Annuaire
- **Commandes** : Bons de commande

---

## 15. IMMOBILISATIONS - Gestion des Immobilisations

### Description
Module de gestion des immobilisations et du patrimoine.

### Fonctionnalités

#### Immobilisations
- **Inventaire** : Inventaire des immobilisations
- **Amortissements** : Calcul des amortissements
- **Cessions** : Cessions et sorties

#### Catégories
- **Typologie** : Typologie des biens
- **Localisation** : Localisation

---

## 16. STAGES - Gestion des Stages

### Description
Module de gestion des stages étudiants.

### Fonctionnalités

#### Offres
- **Publication** : Publication d'offres
- **Candidatures** : Réception des candidatures

#### Suivi
- **Conventions** : Conventions de stage
- **Suivi** : Suivi des stages
- **Évaluation** : Évaluation des stages

---

## 17. ORIENTATION - Orientation Scolaire

### Description
Module d'orientation scolaire et professionnelle.

### Fonctionnalités

#### Parcours
- **Prérequis** : Gestion des prérequis
- **Débouchés** : Débouchés professionnels

#### Orientation
- **Tests** : Tests d'orientation
- **Conseil** : Conseil en orientation

---

## 18. BOURSE - Gestion des Bourses

### Description
Module de gestion des bourses et aides financières.

### Fonctionnalités

#### Bourses
- **Types** : Types de bourses
- **Attribution** : Attribution des bourses
- **Suivi** : Suivi des bourses

---

## 19. QUALITÉ - Management Qualité

### Description
Module de management qualité (ISO 9001).

### Fonctionnalités

#### Audits
- **Planification** : Planification des audits
- **Rapports** : Rapports d'audit

#### Non-conformités
- **Signalement** : Signalement
- **Actions correctives** : Actions correctives
- **Suivi** : Suivi

---

## 20. COMMUNICATION - Communication Interne

### Description
Module de communication interne.

### Fonctionnalités

#### Annonces
- **Publication** : Publication d'annonces
- **Consultation** : Consultation

#### Messages
- **Messagerie** : Messagerie interne
- **Notifications** : Notifications

---

## 21. MARCHÉS - Marchés Publics

### Description
Module de gestion des marchés publics.

### Fonctionnalités

#### Appels d'offres
- **Publication** : Publication
- **Soumissions** : Réception des soumissions

#### Contrats
- **Contrats** : Gestion des contrats
- **Avenants** : Avenants

---

## Infrastructure Technique

### Backend (Node.js/Express/TypeScript)
- **Base de données** : MySQL avec Sequelize ORM
- **Authentification** : JWT
- **Cache** : Redis
- **Temps réel** : SSE (Server-Sent Events)
- **Emails** : Nodemailer
- **Stockage** : Local / S3

### Frontend (Angular)
- **Framework** : Angular 17+
- **UI** : Material Design + Tailwind CSS
- **State Management** : Services RxJS
- **Graphiques** : Chart.js

### Sécurité
- **RBAC** : Role-Based Access Control
- **Middleware** : Authentification par rôle
- **Validation** : Validation des données
- **Audit** : Logs d'audit

---

## Résumé par Acteur

| Acteur | Modules Principaux |
|--------|-------------------|
| **Admin** | Auth, Administration, Tous modules |
| **Étudiant** | Inscription, E-learning, Bulletins, Scolarité |
| **Enseignant** | E-learning, Bulletins, Scolarité |
| **Secrétaire** | Scolarité, Inscription |
| **Caissier** | Scolarité (Caisse) |
| **Cabinet Comptable** | Inscription (Vérification bordereaux) |
| **ESA Compta** | Inscription (Saisie comptable), Comptabilité |
| **Comité Orientation** | Inscription (Validation) |
| **Surveillant** | Surveillance |
| **Parent** | Portail Parent |
| **RH** | Ressources Humaines |
| **Direction** | Reporting, Comptabilité |

---

*Documentation générée le 31 août 2026*
