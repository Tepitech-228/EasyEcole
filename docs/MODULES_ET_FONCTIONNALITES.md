# Modules et fonctionnalités — EasyEcole

> Généré le 14/06/2026

---

## Authentification (Auth)

### Backend (6 contrôleurs)
| # | Contrôleur | Rôle |
|---|-----------|------|
| 1 | AuthController | Connexion, inscription, confirmation email, reset password |
| 2 | UtilisateurController | CRUD utilisateurs, liste, stats |
| 3 | ApprenantController | Gestion des apprenants |
| 4 | EnseignantController | Gestion des enseignants |
| 5 | InstitutionController | Gestion des institutions |
| 6 | CaissierBanqueController | Gestion des caissiers |

### Frontend (2 pages)
| Page | Description |
|------|-------------|
| `connexion-page` | Login |
| `inscription-page` | Création de compte |

### Fonctionnalités
- Inscription et connexion sécurisées (email ou identifiant)
- Confirmation d'email par lien sécurisé
- Réinitialisation de mot de passe (token 15 min)
- Upload de photo de profil
- 5 rôles : Admin, Institution, Enseignant, Apprenant, CaissierBanque
- Middlewares d'autorisation par rôle (6 middlewares)

---

## Orientation

### Backend (11 contrôleurs)
| # | Contrôleur | Rôle |
|---|-----------|------|
| 1 | ParcoursController | CRUD parcours de formation |
| 2 | CategorieController | CRUD catégories |
| 3 | NiveauEtudeController | CRUD niveaux d'étude |
| 4 | MatierePrerequisController | CRUD matières prérequis |
| 5 | DeboucheParcoursController | CRUD débouchés |
| 6 | PrerequisParcoursController | CRUD prérequis par parcours |
| 7 | PrerequisParcoursChoisiController | Gestion prérequis choisis |
| 8 | DemandeOrientationController | CRUD demandes d'orientation |
| 9 | PanierParcoursChoisiController | Gestion du panier |
| 10 | ParcoursChoisiController | Suivi des parcours choisis |
| 11 | ReponseOrientationController | Traitement des demandes |

### Frontend (5 pages + 3 composants)
| Page / Composant | Description |
|-----------------|-------------|
| `liste-parcours-page` | Catalogue des formations |
| `details-parcours-page` | Fiche détaillée d'un parcours |
| `nouveau-parcours-page` | Création d'un parcours |
| `liste-demandes-page` | Liste des demandes d'orientation |
| `details-demande-page` | Détail d'une demande |
| `parcours-card` | Carte de présentation d'un parcours |
| `ajout-debouche` | Ajout de débouché à un parcours |
| `traitement-demande` | Validation/rejet d'une demande |

### Fonctionnalités
- Catalogue des parcours de formation avec image/vidéo
- Catégories et niveaux d'étude hiérarchiques
- Débouchés professionnels par parcours (avec vidéo)
- Matières prérequis
- Panier de parcours (métaphore e-commerce)
- Demande d'orientation avec réponse institution
- Notifications email automatiques

---

## Inscription

### Backend (28 contrôleurs)
| # | Contrôleur | Rôle |
|---|-----------|------|
| 1 | SessionController | CRUD sessions d'inscription |
| 2 | ParcoursController | CRUD parcours (inscription) |
| 3 | ParcoursChoisiController | Parcours sélectionnés |
| 4 | ClasseController | CRUD classes |
| 5 | CoursController | CRUD cours |
| 6 | MatierePrerequisController | CRUD matières (inscription) |
| 7 | NiveauEtudeController | CRUD niveaux (inscription) |
| 8 | SalleDeClasseController | CRUD salles |
| 9 | AnneeAcademiqueController | CRUD années académiques |
| 10 | DemandeInscriptionController | CRUD demandes d'inscription |
| 11 | DossierInscriptionController | Upload pièces du dossier |
| 12 | ReponseInscriptionController | Validation des demandes |
| 13 | FraisInscriptionController | Gestion des frais |
| 14 | PaiementInscriptionController | Gestion des paiements |
| 15 | CursusApprenantController | CRUD cursus |
| 16 | TypeNoteEvaluationController | Types de notes |
| 17 | ChapitreCoursController | CRUD chapitres de cours |
| 18 | RessourceController | CRUD ressources |
| 19 | FichierRessourceController | Upload fichiers ressources |
| 20 | SeanceController | CRUD séances de cours |
| 21 | ProgrammeSeanceController | Programmation des séances |
| 22 | PresenceController | CRUD présences |
| 23 | ListePresenceController | Feuilles de présence |
| 24 | PresenceCoursParticipantController | Présence par participant |
| 25 | CahierDeTexteController | CRUD cahier de texte |
| 26 | BlocCahierDeTexteController | Blocs du cahier de texte |
| 27 | ListeNoteEvaluationController | Relevés de notes |
| 28 | PrerequisParcoursChoisiController | Prérequis (inscription) |

### Frontend (11 pages)
| Page | Description |
|------|-------------|
| `liste-sessions-page` | Sessions d'inscription |
| `details-session-page` | Détail d'une session |
| `liste-parcours-page` | Parcours disponibles |
| `details-parcours-page` | Détail d'un parcours |
| `nouveau-parcours-page` | Ajout d'un parcours |
| `choix-parcours-page` | Sélection de parcours |
| `liste-demandes-page` | Demandes d'inscription |
| `details-demande-page` | Détail d'une demande |
| `liste-cours-page` | Liste des cours |
| `mon-cursus-page` | Curriculum de l'apprenant |
| `paiements-page` | Paiements (CinetPay Mobile Money) |

### Fonctionnalités
- Sessions d'inscription avec dates d'ouverture/fermeture
- Catalogue parcours + cours
- Workflow complet : demande → dossier → paiement → validation
- Upload de documents (dossier)
- 3 modes de paiement : espèces, en ligne, Mobile Money (CinetPay)
- Génération automatique de matricule étudiant
- Cursus complet de l'apprenant
- Gestion des salles de classe et années académiques

---

## Cours

### Backend (inclus dans Inscription — 28 contrôleurs, voir ci-dessus)

Les fonctionnalités "Cours" partagent les mêmes contrôleurs backend que le module Inscription
(ChapitreCours, Ressource, FichierRessource, Seance, Presence, CahierDeTexte, NoteEvaluation, etc.)

### Frontend (16 pages + 3 composants)
| Page / Composant | Description |
|-----------------|-------------|
| `liste-cours-page` | Liste des cours |
| `details-cours-page` | Détail d'un cours |
| `details-chapitre-page` | Contenu d'un chapitre |
| `nouveau-chapitre-page` | Création d'un chapitre |
| `modification-chapitre-page` | Édition d'un chapitre |
| `liste-ressources-page` | Ressources du cours |
| `nouvelle-ressource-page` | Ajout d'une ressource |
| `modification-ressource-page` | Édition d'une ressource |
| `liste-enseignants-page` | Enseignants du cours |
| `details-enseignant-page` | Profil enseignant |
| `liste-presences-page` | Liste des présences |
| `details-presence-page` | Détail d'une présence |
| `liste-notes-page` | Relevés de notes |
| `liste-emplois-du-temps-page` | Emploi du temps (FullCalendar) |
| `liste-cahiers-de-texte-page` | Cahiers de texte |
| `details-cahier-de-texte-page` | Détail d'un cahier de texte |
| `chapitre-card` | Carte de chapitre |
| `ressource-card` | Carte de ressource |
| `ajout-fichier-ressource` | Upload de fichier |

### Fonctionnalités
- Gestion complète des cours : chapitres (avec image), ressources (fichiers/vidéos)
- Affectation des enseignants aux cours
- Séances de cours planifiées
- Emploi du temps avec FullCalendar
- Présences : feuilles de présence, suivi par participant
- Cahier de texte : suivi pédagogique enseignant
- Notes d'évaluation : relevés et types de notes
- Upload fichiers et vidéos (Multer)

---

## Paramètres

### Frontend (2 pages + 1 composant)
| Page / Composant | Description |
|-----------------|-------------|
| `mon-profil-page` | Édition du profil (photo, infos) |
| `mon-compte-page` | Paramètres du compte |
| `parametres-section` | Sections de paramètres |

### Fonctionnalités
- Modification du profil utilisateur
- Upload de photo
- Paramètres du compte

---

## Layout & Shared

### Composants d'infrastructure (layout)
| Composant | Rôle |
|-----------|------|
| BaseLayout | Structure principale avec sidebar + header |
| NavMenu | Navigation latérale avec icônes SVG |
| Panier | Mini panier orientation |
| Divers SVG | Icônes du menu |

### Composants réutilisables (shared — 18)
| Composant | Utilisation |
|-----------|-------------|
| `form-input` | Champ de formulaire générique |
| `custom-alert` | Alertes et notifications |
| `custom-badge` | Badges de statut |
| `custom-button` | Boutons réutilisables |
| `custom-file-picker` | Sélecteur de fichiers |
| `custom-modal` | Boîtes de dialogue modales |
| `custom-pdf-viewer` | Visualisation PDF |
| `custom-wizard` | Assistant multi-étapes |
| `custom-wizard` | Étapes wizard |
| `video-player` | Lecteur vidéo (Videogular) |
| `header-title` | Titre de page |
| `details-section` | Section de détails |
| `return-back` | Bouton retour |
| `cours-card` | Carte de cours |
| `cahier-de-texte-card` | Carte cahier de texte |
| `presence-card` | Carte de présence |
| `liste-presence-card` | Carte liste de présence |
| `ajout-prerequis` | Ajout de prérequis |

---

## Rôles et middlewares

| Rôle | Middleware backend | Pages accessibles |
|------|-------------------|-------------------|
| Admin | `AuthAdmin` (défini, inutilisé) | Aucune interface |
| Institution | `AuthInstitution` | Toutes (CRUD complet) |
| Enseignant | `AuthEnseignant` | Cours, Cahier de texte, Présences, Notes |
| Apprenant | `AuthApprenant` | Orientation, Inscription, Cours, Paiements |
| CaissierBanque | `AuthCaissierBanque` | Paiements uniquement |

---

## Middlewares backend (6)

| Middleware | Protection |
|-----------|-----------|
| `Authenticate` | Tout utilisateur connecté (JWT) |
| `AuthInstitution` | Institution uniquement |
| `AuthEnseignant` | Enseignant uniquement |
| `AuthApprenant` | Apprenant uniquement |
| `AuthCaissierBanque` | Caissier banque uniquement |
| `AuthAdmin` | Admin uniquement (non utilisé) |

---

## Services intégrés

| Service | Technologie | Usage |
|---------|-------------|-------|
| Paiement mobile | CinetPay API | Mobile Money (Orange Money, MTN MoMo, etc.) |
| Email | Nodemailer + Hostinger SMTP | Notifications, confirmation email |
| Stockage fichiers | Multer | Upload images, vidéos, documents |
| Base de données | MySQL 5.6+ | 54 tables (14 auth + 11 orientation + 29 inscription) |
| ORM | Sequelize 6 | Abstraction DB |
| Auth | JWT + bcrypt | Authentification et hash |

---

## Roadmap

- [x] Architecture backend et base de données
- [x] Module Auth (authentification multi-rôles)
- [] Module Orientation (parcours, débouchés, demandes)
- [] Module Inscription (sessions, demandes, paiements, cursus)
- [] Module Cours (chapitres, ressources, présences, notes)
- [ ] Déploiement production
- [ ] Interface administrateur
- [ ] Module de communication (messages/appels)
- [ ] Application mobile
- [ ] Intégration autres moyens de paiement (Wave, Orange Money direct)
- [ ] Modules complémentaires (bibliothèque, transports, restauration)
