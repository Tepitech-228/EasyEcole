# Pôle Pédagogique

## 1. Inscription

### Processus métier
1. **Création de session** → L'institution ouvre une session d'inscription (liée à une année académique, niveau d'étude)
2. **Demande d'inscription** → L'apprenant soumet une demande avec choix de session
3. **Choix de parcours** → L'apprenant sélectionne un ou plusieurs parcours
4. **Upload des documents** → Téléversement des pièces justificatives requises
5. **Soumission pré-inscription** → Vérification que tous les documents sont fournis
6. **Validation comité d'orientation** → Le comité valide ou rejette la pré-inscription
7. **Choix des cours** → L'apprenant choisit ses cours (obligatoires + optionnels)
8. **Paiement** → Paiement des frais d'inscription (espèce ou en ligne)
9. **Validation finale** → L'institution valide l'inscription complète
10. **Création du dossier étudiant** → Génération matricule, QR code, dossier étudiant
11. **Génération carte étudiant** → PDF avec QR code (matricule + données personnelles)
12. **Création compte parent** → Compte créé automatiquement si email parent fourni

### Pages (26)
| Page | Route | Rôle |
|------|-------|------|
| Onboarding | `/inscription/onboarding` | Apprenant |
| Liste sessions | `/inscription/sessions` | Apprenant/Institution |
| Détails session | `/inscription/sessions/:id` | Apprenant/Institution |
| Liste parcours | `/inscription/parcours` | Apprenant/Institution |
| Nouveau parcours | `/inscription/parcours/nouveau` | Institution |
| Détails parcours | `/inscription/parcours/:id` | Apprenant/Institution |
| Frais parcours | `/inscription/frais-parcours` | Institution |
| Liste cours | `/inscription/cours` | Institution |
| Demandes | `/inscription/demandes` | Apprenant/Institution |
| Détails demande | `/inscription/demandes/:id` | Apprenant/Institution |
| Choix parcours | `/inscription/demandes/:id/choix-parcours` | Apprenant |
| Choix cours | `/inscription/demandes/:id/choix-cours` | Apprenant |
| Paiements | `/inscription/paiements` | Institution/Caissier |
| Mon cursus | `/inscription/cursus` | Apprenant |
| Suivi UE | `/inscription/suivi-ue` | Apprenant |
| Bordereaux | `/inscription/bordereaux` | Apprenant |
| Validation bordereaux | `/inscription/validation-bordereaux` | Institution |
| Mon dossier | `/inscription/mon-dossier` | Apprenant |
| Dossiers | `/inscription/dossiers` | Institution |
| Effectifs | `/inscription/effectifs` | Institution |
| Hiérarchie | `/inscription/hierarchy` | Institution |
| Échéances | `/inscription/echeances` | Institution |
| Salles de classe | `/inscription/salles-de-classe` | Institution |
| Classes | `/inscription/classes` | Institution |
| Comité orientation | `/inscription/comite-orientation` | Comité |
| Détails comité | `/inscription/comite-orientation/:id` | Comité |

## 2. Cours

### Processus métier
1. Planification des cours par l'institution
2. Affectation des enseignants aux cours
3. Création des chapitres et ressources pédagogiques
4. Planification des séances (créneaux horaires + salles)
5. Signature des feuilles de présence (QR code étudiant)
6. Saisie des notes d'évaluation
7. Remplissage du cahier de texte
8. Suivi des présences/absences

### Pages (22)
Tableau de bord enseignant, Cours, Chapitres, Ressources, Présences, Cahiers de texte, Emplois du temps, Notes, Enseignants

## 3. Bulletins / Évaluation

### Processus métier
1. Configuration des MCC (Modalités de Contrôle des Connaissances)
2. Configuration des échelles de notation
3. Saisie des notes par les enseignants
4. Calcul des moyennes (UE, semestre, générale)
5. Délibérations du jury
6. Génération des bulletins et relevés de notes
7. Gestion des rattrapages
8. Équivalences et dispenses
9. Dettes académiques

### Pages (30)
Bulletins, Relevés, Paramètres notation, MCC, Sessions examen, Délibérations, Jurys, Rattrapages, Équivalences, Dispenses, Absences, Dettes

## 4. Stages

### Processus métier
1. Dépôt d'offres de stage par les entreprises
2. Candidature des étudiants
3. Convention de stage
4. Suivi et rapport
5. Évaluation du stage

### Pages (8)
Offres, Demandes, Entreprises

## 5. Scolarité

### Processus métier
1. Demandes de documents (diplômes, attestations)
2. Réclamations étudiantes
3. Registres académiques
4. Discipline et sanctions
5. Conseils de classe et décisions de passage
6. Réorientation
7. VAE (Validation des Acquis de l'Expérience)

### Pages (17)
Demandes documents, Traiter demandes, Réclamations, Registres, Calendrier, Discipline, Conseils, Décisions passage, Bibliothèque, Réorientation, Diplômes, VAE
