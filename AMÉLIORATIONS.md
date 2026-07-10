# Plan d'Amélioration — EasyEcole

> Document regroupant l'ensemble des améliorations à apporter au projet EasyEcole,
> couvrant la gestion des notes, la communication, l'archivage, la planification,
> le suivi enseignant, les processus universitaires et la refonte comptable.

---

## Table des matières

1. [Phase 1 — Publication des notes & Notification](#phase-1--publication-des-notes--notification)
2. [Phase 2 — Dashboard étudiant & Archivage](#phase-2--dashboard-étudiant--archivage)
3. [Phase 3 — Calendrier unifié & Planification](#phase-3--calendrier-unifié--planification)
4. [Phase 4 — Suivi enseignant & Pointage](#phase-4--suivi-enseignant--pointage)
5. [Phase 5 — Processus universitaires](#phase-5--processus-universitaires)
6. [Phase 6 — Refonte comptable](#phase-6--refonte-comptable)
7. [Phase 7 — Paiements étudiants](#phase-7--paiements-étudiants)
8. [Phase 8 — Prestations enseignants & Paie](#phase-8--prestations-enseignants--paie)
9. [Calendrier d'exécution](#calendrier-dexécution)

---

## Phase 1 — Publication des notes & Notification

### Objectif
Permettre aux enseignants de publier les notes d'une évaluation, avec notification
email aux étudiants concernés et affichage sur leur interface.

### Backend

#### Modèle `NoteEvaluation` — Ajouter un statut
- Ajouter `statut: enum('brouillon','publie')` avec défaut `brouillon`
- Une fois `publie`, les notes ne peuvent plus être modifiées

#### Nouveau modèle `PublicationNote` (`ins_publications_notes`)
| Champ | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment |
| `listeNoteEvaluationId` | FK | → ListeNoteEvaluation |
| `datePublication` | DATETIME | Date de publication |
| `publiePar` | FK | → Utilisateur (enseignant) |
| `message` | TEXT | Message facultatif accompagnant la publication |
| `nbEtudiantsNotifies` | INT | Nombre d'étudiants notifiés par email |
| `createdAt` | DATETIME | |

#### Controller `PublicationNoteController`
| Endpoint | Méthode | Description |
|---|---|---|
| `POST /listesNoteEvaluation/:id/publier` | `publier` | Publie les notes + envoie emails |
| `GET /publications` | `getAll` | Liste toutes les publications (filtrée) |
| `GET /publications/etudiant/:cursusId` | `getForStudent` | Notes publiées pour un étudiant |

#### EmailSender — Nouvelle méthode
```typescript
async sendNotePubliee(
  email: string,
  etudiantNom: string,
  coursIntitule: string,
  evaluationLibelle: string,
  note: number | null,
  lienConsultation: string
): Promise<void>
```

#### Notification in-app
- Créer une notification (modèle `Notification` dans communication/) avec :
  - `type: "note_publiee"`
  - `destinataireId` → Utilisateur
  - `titre`: "Nouvelle note disponible"
  - `message`: "Votre note de {matiere} est disponible"
  - `lien`: `/cours/notes/{id}/consultation`
  - `lue`: boolean

### Frontend

#### Bouton "Publier" sur `SaisieNotesPage`
- Ajouter un bouton "Publier les notes" visible si utilisateur = enseignant du cours
- Confirmation : "Êtes-vous sûr de vouloir publier ces notes ? Les étudiants seront notifiés."
- Après publication : notes en lecture seule

#### Dashboard étudiant — Widget "Mes dernières notes"
- Liste des 5 dernières notes publiées
- Badge de notification ("Nouveau")
- Lien vers la page de détail

#### Page "Mes notes" (étudiant)
- Route : `/cours/mes-notes`
- Tableau : Matière, Évaluation, Note/20, Date, Appréciation
- Filtres : par matière, par date

#### Service `PublicationNoteService`
- `publier(listeNoteEvaluationId, message?)`
- `getForStudent(cursusApprenantId)`

---

## Phase 2 — Dashboard étudiant & Archivage

### Objectif
Centraliser les informations étudiantes et permettre la consultation historique des notes.

### Dashboard étudiant unifié
- Route : `/tableau-de-bord`
- Widgets :
  - **Mes notes** : dernières notes publiées + moyenne générale
  - **Prochains cours** : emploi du temps de la semaine
  - **Échéances** : prochains paiements, délais
  - **Documents récents** : bulletins, attestations
  - **Notifications** : dernières alertes

### Archivage des notes
- **Page de consultation** : `/bulletins/archives`
- Filtres : Année académique, Filière (Parcours), Niveau, Classe, Semestre
- Vue : tableau avec moyenne générale, rang, mention, crédits validés
- Export CSV/PDF du relevé archivé

### Job de clôture d'année
- Script `src/core/scripts/cloture-annee.ts`
- Gèle les notes de l'année terminée
- Génère les bulletins définitifs si non générés
- Archive les cursus (statut: archive)
- Prépare la réinscription (nouvelle session)

---

## Phase 3 — Calendrier unifié & Planification

### Objectif
Intégrer tous les événements (cours, examens, vacances, activités) dans un calendrier unique.

### Modèle `Evenement` enrichi (`scol_evenements`)
| Champ | Actuel | Cible |
|---|---|---|
| `type` | simple string | `enum('cours','examen','vacance','sportif','culturel','reunion','administratif','ferie')` |
| `recurrence` | ❌ | `enum('aucune','quotidien','hebdomadaire','bimensuel','mensuel','annuel')` |
| `dateFinRecurrence` | ❌ | DATE (si récurrent) |
| `couleur` | ❌ | STRING (code hexa pour affichage) |
| `classeId` | ❌ | FK → Classe (si concerné) |
| `parcoursId` | ❌ | FK → Parcours (si filière spécifique) |
| `visibilite` | ❌ | `enum('public','enseignant','etudiant','prive')` |
| `statut` | ❌ | `enum('proposition','approuve','publie','annule')` |

### Workflow validation
1. Enseignant/Admin propose un événement → statut `proposition`
2. Institution approuve → `approuve`
3. Publication → visible dans le calendrier (`publie`)
4. Annulation possible → `annule`

### Calendrier unifié (Frontend)
- Route : `/calendrier`
- Vue FullCalendar intégrable : cours + examens + événements + vacances
- Filtres : par type, par classe, par mois/semaine
- Export iCal / Google Calendar

### Progression pédagogique
- Nouveau modèle `ProgressionPedagogique` :
  - `coursId`, `semaine`, `chapitreId`, `volumeHoraire`, `statut` (planifie/effectue)
- Vue : planning annuel des cours par semaines
- Suivi : % du programme couvert vs planifié

---

## Phase 4 — Suivi enseignant & Pointage

### Objectif
Donner aux enseignants un tableau de bord de leurs activités et assurer le suivi
des cours dispensés et des notes saisies.

### Tableau de bord enseignant
- Route : `/enseignant/tableau-de-bord`
- Widgets :
  - **Mes cours** : liste des cours assignés avec horaires
  - **Séances à venir** : prochaines séances de la semaine
  - **Notes à saisir** : évaluations créées mais notes non saisies (avec compteur)
  - **Dernières notes saisies** : récapitulatif
  - **Taux d'absentéisme** : par cours, par séance

### Workflow pointage des séances
- QR code généré pour chaque séance
- Étudiants scannent pour marquer leur présence
- Enseignant valide la feuille de présence en fin de séance
- Statistiques de présence par étudiant/cours

### Indicateurs de performance
- % de séances effectuées vs planifiées
- % de notes saisies avant la clôture
- Taux de réussite par cours/matière
- Répartition des notes (histogramme)

---

## Phase 5 — Processus universitaires

### Objectif
Ajouter les processus académiques manquants pour couvrir l'ensemble du cycle
universitaire.

### Passage en année supérieure (Butoir)
- Modèle `DecisionPassage` :
  - `cursusApprenantId`, `anneeAcademiqueId`, `moyenneGenerale`, `creditsAcquis`, `credisRequis`
  - `decision`: `enum('admis','rattrapage','redoublement','exclusion')`
  - `dateDecision`, `validePar`
- Workflow :
  1. Fin d'année → calcul automatique des résultats
  2. Proposition de décision basée sur les crédits
  3. Conseil de classe valide ou ajuste
  4. Passage effectif : création du nouveau `CursusApprenant`

### Réorientation
- Modèle `DemandeReorientation` :
  - `cursusApprenantId`, `parcoursActuelId`, `parcoursCibleId`, `motif`
  - `statut`: `enum('soumise','etude','approuvee','rejetee')`
  - `dateTraitement`, `traitePar`
- Workflow : Étudiant soumet → Commission étudie → Décision

### Suspension / Exclusion
- Modèle `SanctionAcademique` :
  - `cursusApprenantId`, `type`: `enum('avertissement','suspension','exclusion')`
  - `dateDebut`, `dateFin`, `motif`, `decidePar`
- Impact : blocage de l'accès aux cours, notes, plateforme

### Génération de diplômes
- Modèle `Diplome` :
  - `cursusApprenantId`, `parcoursId`, `niveauEtudeId`, `anneeObtention`
  - `mention`: `enum('passable','assez_bien','bien','tres_bien')`
  - `numeroDiplome` (unique), `dateDelivrance`
  - `fichierPDF` (généré automatiquement)
- Registre des diplômes : numéro séquentiel + année

### Validation des Acquis (VAE)
- Modèle `DemandeVAE` :
  - `utilisateurId`, `type`: `enum('vae','vap','equivalence')`
  - `parcoursCibleId`, `justificatifs` (JSON fichiers)
  - `statut`: `enum('soumise','instruction','acceptee','rejetee')`

### Bilan de compétences
- Module optionnel
- Grille d'évaluation par UE/EC
- Génération de rapport PDF

---

## Phase 6 — Refonte comptable

### Objectif
Restructurer le module comptabilité pour répondre aux besoins spécifiques d'une
institution universitaire (OHADA adapté).

### Plan comptable universitaire
Vérifier et compléter le plan comptable OHADA avec les comptes spécifiques :

| Compte | Libellé | Usage |
|---|---|---|
| 702100 | Frais d'inscription | Paiements inscription |
| 702200 | Frais de scolarité | Paiements mensuels |
| 702300 | Frais de dossier | Dossiers administratifs |
| 702400 | Frais de document | Relevés, diplômes, cartes |
| 641100 | Salaires personnel | Paie administrative |
| 641200 | Prestations enseignants | Paiement à l'heure |
| 646000 | Cotisations sociales | CNPS, IPM |
| 447100 | IRPP | Impôt à déclarer |

### Journal de paie (`PAI`)
- Créer le journal `PAI` (Paie) dans `JournalComptable`
- Toutes les écritures de paie et prestations passent par ce journal

### Journal de vente (`VEN`)
- Créer le journal `VEN` (Ventes/Prestations) si inexistant
- Toutes les écritures de frais scolaires passent par ce journal

### Écritures comptables automatiques
- **Paiement étudiant** : `débit 512` / `crédit 702xxx` ✓ (existant à vérifier)
- **Paiement document** : `débit 512` / `crédit 702400` (à créer)
- **Bulletin de paie** : `débit 641100` / `crédit 512` (à corriger/vérifier)
- **Prestation enseignant** : `débit 641200` / `crédit 512` (à créer)
- **Reduction/Bourse** : `débit 702xxx` / `crédit 702900` (nouveau)

### Clôture comptable annuelle
- Script de clôture : vérification équilibre, report à nouveau
- Génération : Grand livre annuel, Balance annuelle, Compte de résultat

---

## Phase 7 — Paiements étudiants

### Objectif
Refondre complètement le système de paiement étudiant pour le rendre flexible,
traçable et intégré à la comptabilité.

### Modèle `FraisParcours` (remplace `FraisInscription`)
| Champ | Type | Description |
|---|---|---|
| `parcoursId` | FK | → Parcours |
| `niveauEtudeId` | FK | → NiveauEtude |
| `anneeAcademiqueId` | FK | → AnneeAcademique |
| `montantInscription` | DECIMAL | Frais d'inscription unique |
| `montantScolarite` | DECIMAL | Frais de scolarité annuel |
| `nbMensualites` | INT | Nombre de mensualités (défaut 10) |
| `fraisBibliotheque` | DECIMAL | Optionnel |
| `fraisAssurance` | DECIMAL | Optionnel |
| `fraisLogement` | DECIMAL | Optionnel |
| `autresFrais` | JSON | Liste de frais supplémentaires |

### Lignes de frais (`LigneFraisEtudiant`)
- Lié à `DossierEtudiant`
- `type`: `enum('inscription','scolarite','bibliotheque','assurance','logement','document','penalite')`
- `montant`, `reductionId?`, `paye`: boolean, `solde`: decimal

### Modèle `ReductionFrais`
| Champ | Type | Description |
|---|---|---|
| `dossierEtudiantId` | FK | → DossierEtudiant |
| `type` | ENUM | `bourse_externe`, `bourse_interne`, `exoneration`, `remise`, `fratrie` |
| `montant` | DECIMAL | Montant de la réduction |
| `pourcentage` | DECIMAL | Ou pourcentage (alternatif) |
| `validePar` | FK | → Utilisateur |
| `dateValidation` | DATETIME | |
| `motif` | TEXT | Justification |
| `dateDebut`, `dateFin` | DATE | Période de validité |

### Modèle `PenaliteRetard`
| Champ | Type | Description |
|---|---|---|
| `echeanceId` | FK | → Echeance |
| `montant` | DECIMAL | Montant de la pénalité |
| `calcul` | STRING | Formule utilisée (ex: "2% × montant × mois") |
| `dateApplication` | DATE | |
| `payee` | BOOLEAN | |

### Paiement — Allocation automatique
- Quand un étudiant paie, le système alloue automatiquement :
  1. D'abord aux pénalités de retard
  2. Puis aux échéances impayées les plus anciennes
  3. Puis au frais d'inscription si non payé

### Compte étudiant (Frontend)
- Route : `/scolarite/mon-compte`
- Vue : solde actuel, historique des transactions
- Téléchargement : factures, quitus, relevé de compte
- Bouton : "Payer en ligne" (Cinetpay)

### Cinetpay — Intégration complète
- Webhook endpoint : `POST /api/v1/comptabilite/cinetpay/callback`
- Sauvegarde du paiement dans `PaiementInscription`
- Allocation automatique aux lignes de frais
- Création de l'écriture comptable
- Envoi de l'email de confirmation
- Mise à jour du statut du dossier étudiant

### Relances automatiques
- Job cron (via node-cron ou script) :
  - **J-7** : email + notification "Échéance dans 7 jours"
  - **J-3** : email + notification "Échéance dans 3 jours"
  - **J+1** : email + notification "Paiement en retard"
  - **J+30** : email + notification "Suspension imminente" + copie à l'institution
- Statut dossier passe à `suspendu` si impayé > 60 jours

### Rapports financiers étudiants
- **États des impayés** (Aging AR) : par classe, par filière, par niveau
- **Revenus par filière** : total encaissé par parcours + année
- **Taux de recouvrement** : % payé / dû, par promotion
- **Prévisions de trésorerie** : échéances à venir
- Export Excel/PDF pour chaque rapport

---

## Phase 8 — Prestations enseignants & Paie

### Objectif
Finaliser la gestion des prestations des enseignants contractuels (payés à l'heure)
et automatiser la paie du personnel administratif.

### Contrat enseignant (`ContratEnseignant`)
| Champ | Type | Description |
|---|---|---|
| `enseignantId` | FK | → Enseignant |
| `dateDebut` | DATE | Début du contrat |
| `dateFin` | DATE | Fin du contrat (ouverte si CDI) |
| `tauxHoraire` | DECIMAL | Taux par défaut |
| `typeContrat` | ENUM | `annuel`, `semestriel`, `vacataire` |
| `statut` | ENUM | `actif`, `suspendu`, `termine` |
| `plafondHeuresMois` | INT | Maximum d'heures par mois |
| `numeroContrat` | STRING | Référence unique |

### Prestation — Écriture comptable
- Ajouter dans `RhPrestationEnseignant.payer()` :
  ```typescript
  await ComptabiliteHelper.creerEcritureComptable({
    journalCode: 'PAI',
    compteDebit: '641200',
    compteCredit: '512',
    montant,
    libelle: `Prestation ${enseignant.nom} - ${cours.intitule} - ${mois}/${annee}`,
    moduleSource: 'rh',
    referenceModuleId: prestation.id
  });
  ```

### Prestation — Attestation PDF
- Générer automatiquement une attestation de prestation lors du paiement
- Modèle : DocumentPDFGenerator.generateAttestationPrestation()

### Paie administrative — Automatisation

#### Calcul automatique du bulletin
Algorithme de génération :

```
gainBase = employe.salaireBase
primes = somme des rubriques de type 'gain' selon modeCalcul
totalGains = gainBase + primes

retenuesSociales = totalGains × tauxCNPS
retenuesFiscales = calculIRPP(totalGains - retenuesSociales)
autresRetenues = somme des rubriques de type 'retenue'
totalRetenues = retenuesSociales + retenuesFiscales + autresRetenues

netAPayer = totalGains - totalRetenues
```

#### Cotisations sociales (CNPS)
- Modèle `TauxCotisation` :
  - `code`, `libelle`, `tauxSalarial`, `tauxPatronal`, `plafond`
  - Types : CNPS prestations familiales, CNPS accidents travail, CNPS retraite, IPM, etc.

#### Impôt sur le revenu (IRPP)
- Barème progressif par tranche (paramétrable dans `ParametresBulletins`)
- Calcul automatique intégré au bulletin

#### Comptabilisation
- À la validation du bulletin (`valide` → `verse`) :
  ```typescript
  // Salaire brut (charge employeur)
  await creerEcriture(debit: '641100', credit: '421000', montant: totalGains)
  
  // Cotisations salariales (retenues)
  await creerEcriture(debit: '421000', credit: '646000', montant: totalRetenues)
  
  // Net à payer
  await creerEcriture(debit: '421000', credit: '512000', montant: netAPayer)
  ```

### Export virement bancaire
- Génération fichier SEPA XML pour virements masse
- Ou format CSV personnalisé selon la banque

---

## Calendrier d'exécution

```
Mois 1    Mois 2    Mois 3    Mois 4    Mois 5    Mois 6
══════════════════════════════════════════════════════════════
█████████  P1 — Publication notes & Notification
          █████████  P2 — Dashboard étudiant & Archivage
                    █████████  P3 — Calendrier & Planification
                              █████████  P4 — Suivi enseignant
                                        █████████  P5 — Processus univ.
████████████████████████████████████████████████████████  P6 — Refonte comptable
  ████████████████████████████████████████████████████████  P7 — Paiements étudiants
                    ████████████████████  P8 — Prestations & Paie
```

### Dépendances entre phases

```
P1 ──→ P2 ──→ P3 ──→ P4 ──→ P5
  \                           /
   └── P6 ──→ P7 ──→ P8 ────┘
```

- **P1, P2, P6** peuvent démarrer en parallèle (pas de conflit de fichiers)
- **P7** dépend de **P6** (modèles comptables)
- **P3** dépend de **P2** (dashboard)
- **P4** dépend de **P3** (planification)
- **P8** dépend de **P6** + **P7** (écritures comptables + modèles)
- **P5** peut démarrer après **P2** (peut être parallélisé)

### Priorités

| Priorité | Phase | Justification |
|---|---|---|
| 🔴 Critique | P1 | Les enseignants doivent pouvoir publier les notes |
| 🔴 Critique | P6 | La compta doit être fiable avant toute évolution |
| 🔴 Critique | P7 | Flux financier principal de l'école |
| 🟠 Haute | P2 | Visibilité étudiant + archivage |
| 🟠 Haute | P8 | Paiement correct des enseignants |
| 🟡 Moyenne | P4 | Suivi et qualité pédagogique |
| 🟡 Moyenne | P3 | Organisation et planification |
| 🟢 Basse | P5 | Processus avancés (VAE, diplômes) |

---

## Phase 9 — Planification & Notification EDT (Ajoutée le 10/07/2026)

### Objectif
Permettre à l'administration de publier l'emploi du temps et de notifier automatiquement
les enseignants, étudiants et personnel.

### Fonctionnalités implémentées

#### 1. Publication de l'emploi du temps avec notifications
- **Bouton "Publier l'EDT"** sur la page `/cours/emplois-du-temps` (visible pour admin/institution)
- Envoie une notification in-app à :
  - **Enseignants** : notification listant leurs séances
  - **Étudiants** : notification basée sur leur filière/niveau via `CursusApprenant` → `Classe` → `Cours` → `Seance`
- Endpoint : `POST /api/v1/inscription/seances/publier`

#### 2. Relance salle 10min avant la fin du cours
- **Système de rappel automatique** pour tous les rôles (enseignants ET étudiants)
- Détecte le cours en cours et calcule s'il reste ≤10min avant la fin
- Si oui, cherche le prochain cours de la journée pour la même personne
- Affiche une notification toast : "Changement de salle imminent ! {cours} se termine dans Xmin → Salle XXX"
- Endpoint : `GET /api/v1/inscription/seances/rappel-salle`
- Polling côté frontend toutes les 60 secondes

#### 3. Planning du personnel (non enseignant)
- **Modèle `RhPlanningPersonnel`** (table `rh_planning_personnel`) avec :
  - `employeId` (FK → `RhEmploye`), `jourSemaine`, `heureDebut`, `heureFin`, `tache`, `couleur`, `dateDebut`, `dateFin`
- CRUD complet : controller + router sous `/api/v1/rh/planning-personnel`
- **Page frontend** `/rh/planning-personnel` avec tableau + formulaire de création/édition/suppression
- **Planning hebdomadaire** `/pointage/planning` connecté à la BDD (vue d'ensemble)

#### 4. Distribution des notifications
- **NotificationService** frontend connecté au backend
- **Badge de notifications non lues** dans le header (mise à jour toutes les 2min)
- **Dropdown notifications** dans le header avec les 10 dernières
- **Page notifications** `/communication/notifications` connectée à l'API (plus de mock)

### Backend

#### Nouveau modèle `RhPlanningPersonnel`
| Champ | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment |
| `employeId` | FK | → RhEmploye |
| `jourSemaine` | ENUM | LUNDI-SAMEDI |
| `heureDebut` | TIME | Début de la tâche |
| `heureFin` | TIME | Fin de la tâche |
| `tache` | STRING | Description de la tâche |
| `couleur` | STRING | Code hexa pour affichage |
| `dateDebut` | DATE | Début de validité |
| `dateFin` | DATE | Fin de validité |

#### Helper `NotificationHelper`
- `envoyerNotification(utilisateurId, type, message, envoyerEmail?)` — notification individuelle
- `envoyerNotificationMultiples(utilisateurIds, type, titre, message, envoyerEmail?)` — notification groupée

#### Nouveaux endpoints
| Endpoint | Méthode | Description |
|---|---|---|
| `POST /inscription/seances/publier` | POST | Publie l'EDT et notifie enseignants + étudiants |
| `GET /inscription/seances/rappel-salle` | GET | Rappel salle 10min avant fin du cours |
| `GET/POST/PUT/DELETE /rh/planning-personnel` | CRUD | Gestion planning personnel |
| `GET /rh/planning-personnel/personnel` | GET | Planning du personnel connecté |

### Frontend

| Page | Route | Description |
|---|---|---|
| Emplois du temps | `/cours/emplois-du-temps` | Bouton "Publier l'EDT" ajouté |
| Notifications | `/communication/notifications` | Connectée à l'API backend |
| Planning personnel | `/rh/planning-personnel` | CRUD planning du personnel |
| Planning hebdo | `/pointage/planning` | Vue d'ensemble connectée BDD |

### Architecture des notifications

```
Admin publie EDT
  ↓
POST /seances/publier
  ↓
NotificationHelper.envoyerNotificationMultiples()
  ├── Enseignants (par enseignantId → utilisateurId)
  └── Étudiants (par cours → classe → cursusApprenant → utilisateurId)
  ↓
Frontend polling GET /notifications (toutes les 2min)
  ↓
Badge non lues + Dropdown + Page notifications
```

```
Polling GET /seances/rappel-salle (toutes les 60s)
  ↓
Détection cours en cours + ≤10min restantes
  ↓
Recherche prochain cours dans la journée
  ↓
Toast notification : "Changement de salle imminent !"
```

---

> Document créé le 06/07/2026 — EasyEcole Project
> Dernière mise à jour : 10/07/2026 — Ajout Phase 9 : Planification & Notification EDT
