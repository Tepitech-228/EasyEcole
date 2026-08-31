# Conception — Comptes, Rôles, Permissions & Dashboards KPI

> **Projet** : EasyEcole — application de gestion scolaire (backend Express/Sequelize/TS + frontend Angular 12)
> **Type** : Document de conception (aucun code produit)
> **Statut** : `PROPOSITION — à valider avant implémentation`
> **Date** : 30 août 2026
> **Auteur** : Chef de projet technique / Architecte
> **Demande clé utilisateur** : refonte des **graphiques et du design des pages d'entrée de chaque profil** — y compris **CABINET_COMPTABLE** et **ESA_COMPTA** (graphiques « type finance »), et des **graphiques dynamiques et propres** pour les **étudiants**. Livrer la conception AVANT tout code.

---

## 0. Résumé exécutif

La solution actuelle concentre les dashboards dans un **fichier unique** (`dashboard-page.component.ts`, ~27 Ko) avec des graphiques chart.js **statiques** codés en dur par rôle, et **aucune matrice de permissions formelle** ni **scope de données** contrôlé au backend.

Cette conception propose une refonte en deux volets complémentaires :

1. **Violet A — Socle RBAC + scopes + KPI (architecture rigoureuse)** : rôle → permission → ressource → action → scope, vérifié au **backend**, avec un contrat API KPI unifié `/dashboard/kpi`, calculé en **SQL agrégé** (jamais de `findAll` + comptage JS côté client), index adaptés, et journal d'audit.
2. **Violet B — Refonte UX des pages d'entrée de chaque profil** : briques modernes (`modern-ui` : `kpi-card`, `chart-panel`, `dashboard-header`), **typologie de graphiques par métier** — finance (courbe de solde, barres budgétaires, doughnut de répartition) pour CABINET_COMPTABLE/ESA_COMPTA, graphiques **dynamiques** et épurés pour l'étudiant — le tout alimenté par des endpoints KPI dédiés (data dynamique côté serveur, jamais de chiffres figés).

Le tout reste **léger, rapide, sécurisé, 24/7, évolutif**, conformément au brief.

---

## 1. Inventaire des rôles (livrable 1)

### 1.1 Rôles existants (déjà codés — `RolesUtilisateur.ts`)

| Rôle (code) | Label métier |
|---|---|
| `ADMIN` | Administrateur |
| `INSTITUTION` | Direction / DG |
| `SECRETAIRE` | Scolarité / Secrétariat |
| `ESA_COMPTA` | Comptabilité ESA (validation bordereaux, suivi financier) |
| `CABINET_COMPTABLE` | Comptabilité cabinet (écritures, bilan, plan comptable) |
| `CAISSIER_BANQUE` | Caissier (encaissements, reçus) |
| `ENSEIGNANT` | Enseignant |
| `RESSOURCES_HUMAINES` | RH |
| `COMITE_ORIENTATION` | Comité d'orientation / jury partiel |
| `APPRENANT` | Étudiant |
| `PARENT` | Parent / Tuteur |
| `PERSONNEL_ADMINISTRATIF` | Personnel administratif |

### 1.2 Rôles du brief à créer ou à mappér

| Rôle du brief | Cible proposée | Action |
|---|---|---|
| Direction / DG | `INSTITUTION` (existe) | Conserver + étendre dashboard |
| Administrateur | `ADMIN` (existe) | Conserver + dashboard santé système |
| Scolarité / Secrétariat | `SECRETAIRE` (existe) | Conserver |
| ESA-COMPTA / Comptabilité | `ESA_COMPTA` + `CABINET_COMPTABLE` (existent) | Distinguer clairement les 2 (voir §9) |
| Caissier | `CAISSIER_BANQUE` (existe) | Conserver |
| Enseignant | `ENSEIGNANT` (existe) | Conserver |
| Responsable pédagogique | `PERSONNEL_ADMINISTRATIF` (existe) **ou** nouveau `RESPONSABLE_PEDAGOGIQUE` | **À arbitrer** — cf. §18.1 |
| Responsable de filière / parcours | **Nouveau** `RESPONSABLE_FILIERE` | **À créer** (+ scope filière) |
| Responsable des examens | **Nouveau** `RESPONSABLE_EXAMENS` | **À créer** |
| Jury / Commission | `COMITE_ORIENTATION` (existe) **ou** **nouveau** `JURY` | **À arbitrer** — cf. §18.1 |
| RH | `RESSOURCES_HUMAINES` (existe) | Conserver |
| Bibliothécaire | **Nouveau** `BIBLIOTHECAIRE` | **À créer** |
| Auditeur | **Nouveau** `AUDITEUR` (lecture seule) | **À créer** |
| Étudiant | `APPRENANT` (existe) | Conserver + nouveau dashboard |
| Parent / Tuteur | `PARENT` (existe) | Conserver |

> **Recommandation** : dans la V1 de la refonte, **ne créer les 3 nouveaux rôles réellement indispensables** (`RESPONSABLE_FILIERE`, `RESPONSABLE_EXAMENS`, `AUDITEUR`, `BIBLIOTHECAIRE`) que si le périmètre métier le justifie déjà. Pour le reste, mapper le brief sur l'existant afin de rester léger (règle §21 du brief : ne pas surcharger).

---

## 2. Matrice Rôles → Permissions (livrable 2)

### 2.1 Modèle de permission

```
<ressource>.<action>[:<scope>]
```

- **Ressources** : `student`, `dossier`, `inscription`, `reinscription`, `bordereau`, `paiement`, `classe`, `cours`, `note`, `absence`, `examen`, `resultat`, `deliberation`, `personnel`, `utilisateur`, `role`, `permission`, `document`, `audit`, `notification`, `caisse`, `comptabilite`, `ouvrage`, `statistique`.
- **Actions** : `read`, `create`, `update`, `delete`, `validate`, `reject`, `confirm`, `export`, `sign`, `approve`.
- **Scopes** : `all`, `own`, `filiere:{id}`, `classe:{id}`, `etablissement:{id}`, `annee:{id}`.

### 2.2 Matrice condensée (permissions "cœur" par rôle)

| Rôle | read (étendue) | write | validate / décision | exclusif |
|---|---|---|---|---|
| `ADMIN` | `*:read:all` | `*:create/update/delete` | `*:approve` | `utilisateur`, `role`, `permission`, `parametre`, `annee`, `session`, `etablissement`, `niveau`, `filiere`, `classe` |
| `INSTITUTION` | `statistique:read:all`, dashboards, `student:read:all` | `student:update` | — | dashboard DG (§5) |
| `SECRETAIRE` | `dossier/inscription/reinscription/student/document:read` | `dossier`, `student`, `inscription`, `reinscription`, `matricule`, `attestation`, `certificat`, `classe` | `dossier:validate`, `reinscription:confirm` | inscrip./réinscription |
| `ESA_COMPTA` | `bordereau/paiement/banque/reference:read` | `bordereau:update` (statut) | `bordereau:validate/reject` | doublon de références bancaires, suivi financier |
| `CABINET_COMPTABLE` | `comptabilite:read:all` (plan, écritures, rapprochements, exercices) | `comptabilite:create/update` | `comptabilite:validate` | bilan, compte de résultat, grand-livre |
| `CAISSIER_BANQUE` | `caisse/paiement:read` | `caisse:create` (encaissement), `recu:create`, `caisse:cloture` | — | clôture & historique de caisse |
| `ENSEIGNANT` | `classe/cours/note/absence:read` (ses classes/matières) | `note:create/update` (ses matières), `absence:create`, `appreciation` | — | scopes `classe:{id}` enseignant |
| `PERSONNEL_ADMINISTRATIF` (resp. pédagogique) | `note/absence/resultat/statistique:read` | `enseignant:update` | — | supervision pédagogique |
| `RESPONSABLE_FILIERE` *(nouveau)* | `student/classe/enseignant/resultat/statistique:read` — **scope `filiere:{id}`** | — | — | scope filière strict |
| `RESPONSABLE_EXAMENS` *(nouveau)* | `examen/convocation/salle/surveillant/note/resultat:read` | `examen:create/update`, `convocation`, `pv` | `resultat:validate` | examens & PV |
| `COMITE_ORIENTATION` / `JURY` | `resultat:read` (session délibération) | — | `deliberation:approve`, décision jury | délibérations |
| `RESSOURCES_HUMAINES` | `personnel:read` | `personnel:create/update`, `contrat`, `absenceRH`, `conge` | — | RH |
| `BIBLIOTHECAIRE` *(nouveau)* | `ouvrage/emprunt:read` | `ouvrage:create/update`, `emprunt:create/retour`, `penalite` | — | bibliothèque |
| `AUDITEUR` *(nouveau)* | `audit:read:all` — **lecture seule** | **aucune** | — | journal d'audit |
| `APPRENANT` | `student:read:own` (profil, notes, absences, résultats, paiements) | `profil:update`, `demande:create`, `reinscription:planifier` | — | **scope `own` strict** |
| `PARENT` | `student:read` (uniquement **enfants rattachés**) | — | — | scope `enfant` |

### 2.3 Règles de la matrice

- **Defaut-refus (fail-closed)** : toute permission absente de la matrice → `403` (déjà en place pour `CheckPermission` depuis l'audit C1-3, à généraliser à toutes les routes).
- **Le backend est la seule autorité** : masquer un bouton côté Angular n'est qu'un confort UX, jamais une sécurité (§2 du brief).
- Chaque permission écrite doit être **cartographiée** dans `PermissionRouter.ts` (vérification via `CheckPermission` + `ScopeResolver`).

---

## 3. Scopes d'accès (livrable 3)

| Scope | Règle | Exemple |
|---|---|---|
| `own` | L'utilisateur ne voit/touche que **ses propres** entités. | Étudiant : `where utilisateurId = req.utilisateurId` |
| `enfants` | Parent : `where etudiantId IN (enfants du parent)` | tableau de bord parent |
| `filiere:{id}` | Limitée à la filière attribuée au compte. | Responsable filière : `where filiereId = compte.filiereId` |
| `classe:{id}` | Limitée aux classes octroyées (table de liaison). | Enseignant : classes qui lui sont affectées |
| `etablissement:{id}` | Limitée à un établissement. | Institution multi-site |
| `annee:{id}` | Limitée à une année académique / session. | Filtres KPI |
| `all` | Accès global (ADMIN, AUDITEUR). | — |

**Implémentation** : un middleware `ScopeResolver` (après `Authenticate` + `CheckPermission`) résout le `where` effective ; **jamais** paramétré par le client (interdiction de passer `filiereId`/`schoolId`/`classId` dans la requête pour ouvrir un périmètre — §19 du brief).

---

## 4. KPI par rôle (livrable 4)

> Règle d'or (§21) : **5 à 10 KPI max par écran**, calculés côté serveur.

### 4.1 Direction / DG (`INSTITUTION`)
`totalStudents`, `activeStudents`, `newStudents`, `reEnrollments`, `pendingDossiers`, `collectedAmount`, `remainingToCollect`, `successRate`. Grilles : effectifs, par filière, par niveau, inscriptions, paiements, taux de réussite.

### 4.2 Administrateur (`ADMIN`) — santé système
`activeUsers`, `blockedUsers`, `apiErrors`, `systemErrors`, `failedJobs`, `pendingDocuments`, `pendingNotifications`, `serviceStatus`. Monitoring : CPU, RAM, stockage, états backend/API/DB.

### 4.3 Scolarité (`SECRETAIRE`)
`dossiersRecus`, `dossiersComplets`, `dossiersIncomplets`, `dossiersEnCours`, `dossiersValides`, `dossiersRejetes`, `inscriptionsTerminees`, `reinscriptions`. Grilles : inscriptions par jour/mois, étudiants par filière/niveau, état des dossiers.

### 4.4 ESA-COMPTA (`ESA_COMPTA`) — suivi finance
`bordereauxRecus`, `bordereauxATraiter`, `bordereauxLus`, `bordereauxEnAttente`, `bordereauxValides`, `bordereauxRejetes`, `montantTotal`, `montantValide`, `montantEnAttente`, `doublonsReferences`.
Statistiques : paiements par banque, montant par banque, nombre de paiements par banque, évolution, taux de traitement. **Graphiques type finance** (§9).

### 4.5 Cabinet comptable (`CABINET_COMPTABLE`) — comptabilité générale
KPI : `totalActif`, `totalPassif`, `totalProduits`, `totalCharges`, `resultatExercice`, `nbEcritures`, `nbComptes`, `soldeTresorerie`, `rapprochementsEnAttente`. **Graphiques type finance** : solde évolutif, budget vs réel, répartition produits/charges (§9).

### 4.6 Caissier (`CAISSIER_BANQUE`)
`encaisseJour`, `encaisseSemaine`, `encaisseMois`, `nbPaiements`, `montantMoyen`, `soldeCaisse`, `paiementsEnAttente`, `recusGeneres`. Grilles : par jour, par mode de paiement, évolution de caisse.

### 4.7 Enseignant (`ENSEIGNANT`)
`nbClasses`, `nbEtudiants`, `coursDuJour`, `notesASaisir`, `notesSaisies`, `absencesARenseigner`, `tauxPresence`, `moyenneClasse` — **scopés à ses classes/matières**.

### 4.8 Responsable pédagogique (`PERSONNEL_ADMINISTRATIF`)
`nbEtudiants`, `nbEnseignants`, `nbClasses`, `nbMatieres`, `notesNonSaisies`, `nbAbsences`, `moyenneGenerale`, `tauxReussite`, `tauxEchec`. Stats : résultats par classe/matière/filière, évolution des moyennes, taux de réussite.

### 4.9 Responsable de filière (`RESPONSABLE_FILIERE` — nouveau)
`effectif`, `nouveaux`, `reinscriptions`, `abandons`, `moyenneGenerale`, `tauxReussite`, `tauxEchec`, `absences` — **scope `filiere:{id}`**. Stats : par niveau, par classe, résultats par classe/matière, évolution des effectifs.

### 4.10 Examens (`RESPONSABLE_EXAMENS` — nouveau)
`examensProgrammes`, `examensTermines`, `examensAVenir`, `convoques`, `presentes`, `absents`, `notesNonSaisies`, `resultatsAValider`, `resultatsValides`. Stats : présence, réussite, échec, moyenne, répartition des notes.

### 4.11 Jury / Commission (`COMITE_ORIENTATION` / `JURY`)
`etudiantsADeliberer`, `resultatsValides`, `admis`, `ajournes`, `moyenneGenerale`, `tauxReussite`. **Interface minimale** (§12 du brief).

### 4.12 RH (`RESSOURCES_HUMAINES`)
`personnelTotal`, `enseignants`, `personnelAdmin`, `absences`, `conges`, `contratsEcheance`.

### 4.13 Auditeur (`AUDITEUR` — nouveau)
`connexions`, `actions`, `modifications`, `suppressions`, `validations`, `rejets`, `accesRefuses`, `erreurs`, `evenementsSuspects`. **Lecture seule** (§14 du brief).

### 4.14 Étudiant (`APPRENANT`) — personnel & léger
**Pédagogiques** : `statutInscription`, `moyenneGenerale`, `rang`, `tauxPresence`, `nbAbsences`, `matieresValidees`, `matieresARattraper`, `creditsObtenus`.
**Financiers** : `totalFrais`, `montantPaye`, `resteAPayer`, `statutFinancier`.
**Administratifs** : `documentsValides`, `documentsManquants`, `bordereauxValides`, `etapeInscription`.
**Informations** : matricule, classe, niveau, parcours, année académique.
Graphiques : **dynamiques et propres** (§10).

### 4.15 Parent (`PARENT`)
`moyenne`, `tauxPresence`, `absences`, `resultats`, `totalPaye`, `resteAPayer`, `prochaineEcheance` — **limités aux enfants rattachés**.

---

## 5. Endpoints nécessaires aux KPI (livrable 5)

### 5.1 Contrat API unifié

```
GET /dashboard/kpi
    ?roleScope=auto                     # résolu par le backend, JAMAIS par le client
    &anneeAcademiqueId=2026
    &sessionId=12
    &etablissementId=3
    &filiereId=7
    &niveauEtudeId=2
    &classeId=45
```
Le backend applique le **scope minimum** entre les filtres demandés et le scope du compte. Retour :

```json
{
  "kpi": { "totalStudents": 1250, "activeStudents": 1180, "...": 0 },
  "charts": {
    "effectifsEvolution": { "labels": ["Juil","Août","Sep"], "series": [...] },
    "parFiliere": { "labels": ["Informatique","Compta"], "data": [120, 80] },
    "...": {}
  },
  "alerts": [ ] ,
  "generatedAt": "2026-08-30T08:00:00Z"
}
```

### 5.2 Endpoints existants à réutiliser / compléter

| Endpoint | Statut | Commentaire |
|---|---|---|
| `GET /inscription/dashboard` (`DashboardController`) | ✅ existe | À faire évoluer vers `/dashboard/kpi` scopen |
| `GET /comptabilite/dashboard` | ✅ existe | **Filtre par exercice NON supporté** (limite documentée dans `dashboard-comptable-page`) → à ajouter |
| `GET /reporting/dashboard` | ✅ existe | Graphiques effectifs/paiements par mois |
| `GET /inscription/reinscription/eligibilite` | ✅ existe (chantier réinscription) | réutilisé par le dashboard étudiant |
| `GET /dashboard/kpi` | 🔵 nouveau | contrat unifié §5.1 |
| `GET /admin/health` (monitoring) | 🔵 à créer | CPU, RAM, stockage, états services |

### 5.3 Endpoints à créer (par métier)

| Ressource | Endpoint proposé |
|---|---|
| Étudiant (own) | `GET /dashboard/kpi/apprenant` |
| Parent (enfants) | `GET /dashboard/kpi/parent` |
| Enseignant (classes) | `GET /dashboard/kpi/enseignant` |
| Scolarité | `GET /dashboard/kpi/scolarite` |
| ESA-COMPTA | `GET /dashboard/kpi/esa-compta` |
| Cabinet comptable | `GET /dashboard/kpi/comptabilite` |
| Caissier | `GET /dashboard/kpi/caissier` |
| ADMIN (santé) | `GET /admin/health` + `GET /admin/kpi/systeme` |
| Auditeur | `GET /audit/kpi` |
| RH | `GET /dashboard/kpi/rh` |
| Examens / Jury / Filière | `GET /dashboard/kpi/examens` · `/jury` · `/filiere` |

---

## 6. Requêtes SQL nécessaires aux KPI (livrable 6)

> Principe (§18) : **toujours agréger côté serveur**, jamais `findAll` + comptage client.

### 6.1 Étudiants / effectifs (exemples)

```sql
-- Total & actifs
SELECT
  COUNT(*) AS totalStudents,
  SUM(CASE WHEN a.statut = 'actif' THEN 1 ELSE 0 END) AS activeStudents
FROM "Apprenants" a
JOIN "DossierEtudiant" d ON d."utilisateurId" = a."utilisateurId";

-- Nouveaux inscrits sur une période
SELECT COUNT(*) AS newStudents
FROM "DemandeInscription"
WHERE "createdAt" >= :debut AND "etape" = 'terminee';

-- Réinscriptions
SELECT COUNT(*) AS reEnrollments
FROM "CursusApprenant"
WHERE "statutReinscription" IN ('confirme','en_attente');
```

### 6.2 Finance ESA-COMPTA (type finance)

```sql
-- Montant total / validé / en attente (bordereaux)
SELECT
  SUM(montant) AS montantTotal,
  SUM(CASE WHEN statut='valide'   THEN montant ELSE 0 END) AS montantValide,
  SUM(CASE WHEN statut='attente'  THEN montant ELSE 0 END) AS montantEnAttente
FROM "Bordereaux";

-- Paiements par banque / par mode
SELECT banque, modePaiement, COUNT(*) AS nbPaiements, SUM(montant) AS total
FROM "Bordereaux"
GROUP BY banque, modePaiement;

-- Doublons de références bancaires
SELECT "referenceBancaire", COUNT(*) AS c
FROM "Bordereaux"
GROUP BY "referenceBancaire" HAVING COUNT(*) > 1;
```

### 6.3 Récap des grandes agrégations par KPI

| KPI | Table(s) | Agrégat clé |
|---|---|---|
| `collectedAmount` | PaiementInscription | `SUM(montant)` (statut validé) |
| `remainingToCollect` | Echeance | `SUM(montant - montantPaye)` |
| `successRate` | ListeNoteEvaluation / Bulletin | `AVG` de moyenne, seuils |
| `totalActif/Passif` | Ecriture | `SUM` par nature |
| `soldeTresorerie` | Ecriture | `SUM(debit-credit)` sur comptes caisse/banque |

> Déjà optimisé à l'audit C2-10 : `calculerSoldeCompte` utilise `SUM(CASE…)` au lieu du chargement RAM. **À réutiliser partout.**

---

## 7. Index nécessaires (livrable 7)

Fichier `ensurePerformanceIndexes` (déjà idempotent, audit M3) à compléter :

| Table | Colonnes indexées | Pourquoi |
|---|---|---|
| `DemandeInscription` | `createdAt`, `etape`, `etablissementId`, `filiereId` | effectifs, état dossiers |
| `CursusApprenant` | `utilisateurId`, `statutReinscription`, `anneeAcademiqueId`, `filiereId` | réinscriptions, effectifs par filière |
| `Bordereaux` | `statut`, `banque`, `modePaiement`, `referenceBancaire`, `createdAt` | dashboard ESA-COMPTA + doublons |
| `PaiementInscription` | `statut`, `datePaiement`, `etudiantId` | encaissé, finance |
| `Echeance` | `dossierEtudiantId`, `statut`, `dateLimite` | solde à recouvrer (index partiel sur `statut IN (...)`) |
| `Ecriture` | `compteDebitId`, `compteCreditId`, `exerciceId`, `dateEcriture` | comptabilité finance |
| `AuditLog` | `utilisateurId`, `action`, `createdAt`, `resourceId` | journal auditeur + questions « qui/quoi/quand » |
| `NoteEvaluation` | `cursusId`, `ecueId`, `sessionExamenId` | notes, moyennes, réussite |
| `Presence` | `cursusId`, `seanceId`, `statut` | taux de présence |

Index partiels ou composites selon les requêtes réelles (vérifier au `EXPLAIN`).

---

## 8. Règles de sécurité (livrable 8)

1. **Auth + RBAC + scope** systématiques sur chaque route (middlewares `Authenticate` → `CheckPermission` → `ScopeResolver`). Le périmètre des statistiques est **toujours résolu par le backend**.
2. **Fail-closed** sur permission inconnue (déjà en place C1-3) et sur ressource absente (C1-4).
3. **Jamais de comptage côté client** sur des listes potentiellement volumineuses (§18).
4. **`own` strict pour l'étudiant**, `enfants` pour le parent, `filiere:{id}` pour le responsable filière (**aucun paramètre de périmètre ouvert**).
5. **Auditeurs & dashboards `read` uniquement** ; aucune route d'écriture ouverte à un rôle non prévu.
6. **Journal d'audit** sur les actions sensibles (§11) : `catch{}` jamais silencieux (log `console.error`), conformément à l'audit M2.
7. Cache mémoire `shareReplay` côté front **uniquement sur des référentiels**, jamais sur des KPI horodatés (KPI = données « vivantes » → toujours récupérées fraîches, ou cache court type `cache(30)` existant).

---

## 9. Refonte des charts — finance (CABINET_COMPTABLE & ESA-COMPTA) (partie « type finance »)

Violet B — répond à la demande explicite : **graphiques de type finance** pour le cabinet comptable et ESA-COMPTA.

### 9.1 Bibliothèque recommandée

Actuellement chart.js (`ng2-charts`). Pour un rendu « finance » moderne, deux options :
- **(a) Sobre & compatible** : conserver chart.js, ajouter les plugins `chartjs-plugin-datalabels` + arrondis, gradients, et un axe économique.
- **(b) Premium (recommandé pour « type finance »)** : **ApexCharts** (`ng-apexcharts`) — très utilisé pour les tableaux de bord financiers : sparklines, area brut/lissé, barres empilées, heatmaps, tooltips FCFA, animation fluide.

> Recommandation : **adopter `ng-apexcharts`** pour les dashboards « finance » (CABINET_COMPTABLE, ESA_COMPTA, CAISSIER, DG) et garder chart.js pour les vues simples (étudiant, enseignant). Cela couvre le need « graphiques finance dynamiques » sans tout réécrire. **À valider (§18.2)**.

### 9.2 Tuiles de graphiques proposées — CABINET_COMPTABLE
| Graphique | Type | Usage |
|---|---|---|
| Évolution du **solde de trésorerie** | **Area/Line gratté** (courbe lissée + zone) | tendance de trésorerie sur 12 mois |
| **Résultat vs Budget** (produits/charges) | **Barres groupées** | budget vs réel |
| Répartition **Produits / Charges / Résultat** | **Doughnut** (2-3 parts) | lecture rapide du P&L |
| Écritures par mois | **Barres empilées** | volume comptable |
| État du rapprochement | **Sparkline/Jauge** | complétude des rapprochements |

Data : `GET /dashboard/kpi/comptabilite` (+ filtre exercice).

### 9.3 Tuiles de graphiques proposées — ESA-COMPTA
| Graphique | Type | Usage |
|---|---|---|
| **Montants validés / en attente / rejetés** sur le temps | **Area multi-séries** | évolution financière |
| Paiements **par banque** | **Barres horizontales** | répartition par banque |
| Répartition **par mode de paiement** | **Doughnut** | mobile / espèce / banque |
| **Doublons de références bancaires** | **Barres** (comptage) | alerte fraude/saisie |
| Taux de traitement des bordereaux | **Jauge / doughnut** | file de traitement |

Data : `GET /dashboard/kpi/esa-compta`.

> Tous ces graphiques sont **dynamiques** : les séries/labels viennent du backend à chaque appel (aucune donnée en dur), et se rafraîchissent (bouton « Actualiser » + `reload`).

---

## 10. Refonte des charts — Étudiant (partie « graphiques propres et dynamiques »)

Le dashboard étudiant doit être **personnel, léger et propre** (§15 du brief). Proposition de tuiles :

| Graphique | Type | Usage |
|---|---|---|
| **Évolution de la moyenne** par évaluation/semestre | **Line épuré** (points arrondis, 1 série) | progression pédagogique |
| **Répartition des moyennes / notes** par matière | **Barres** (moyennes par ECUE) | forces/faiblesses |
| **Matières validées / à rattraper / en cours** | **Doughnut** (3 parts) | vue d'ensemble UE |
| **Crédits obtenus / restants** | **Jauge** | progression du LMD |
| **Solde financier** (payé / reste) | **Barre de progression / doughnut** | suivi des frais |
| **Présence** (présence / absences) | **Micro-doughnut ou sparkline** | assiduité |

Règles :
- **Contrat graphique 1 getter unique** : le composant appelle `GET /dashboard/kpi/apprenant` (scope `own`) et alimente les tuiles ; **aucun chiffre en dur**.
- Style sobre : palette douce, légende discrète, tooltip FCFA/points.
- Réutiliser `kpi-card` + `chart-panel` de `modern-ui` pour l'homogénéité du design d'entrée.

---

## 11. Audit et traçabilité (livrable 9 — transversal)

Table `AuditLog` (à créer ou compléter) :

| Colonne | Type |
|---|---|
| `id` | PK |
| `utilisateurId` | FK |
| `action` | enum (login, create, update, delete, validate, reject, payment, note_change, role_change, permission_change, access_denied…) |
| `resourceType` / `resourceId` | cible |
| `avant` / `apres` | JSON (avant/après valeur) |
| `ip` / `userAgent` / `depuis` | contexte |
| `createdAt` | horodatage |

Le journal permet de répondre : **Qui ? A fait quoi ? Sur quelle donnée ? Quand ? Avant/Après ? Depuis où ?** (exigence §20). Index décrit en §7. Endpoint `GET /audit/kpi` + export.

---

## 12. Règles de visibilité Frontend (livrable 10a)

- **Angular ne gère QUE le confort UX** : masquer menus/boutons non autorisés (via `permissionKey` existante + `ApprenantGuard`/`AuthGuard` par rôle).
- **La sécurité reste au backend** : chaque page appelle des endpoints scopenés ; un appel direct non autorisé reçoit `403`, quoi qu'affiche l'UI.
- **Structure de pages d'entrée homogène** : `dashboard-header` (salutation + filtre année-session-étab-filière-niveau-classe) + rangée `kpi-card` + grille de `chart-panel` dynamique. Filtres légers côté serveur (jamais de chargement massif au front — §17).
- Réutiliser `modern-ui` (`kpi-card`, `chart-panel`, `dashboard-header`) plutôt que recoder des tuiles par rôle.

---

## 13. Tests unitaires et fonctionnels nécessaires (livrable 10b)

### Backend (Jest / Supertest)
1. **RBAC** : pour chaque rôle, `GET /dashboard/kpi/*` → vérifier `200` (scénario autorisé) et `403` (interdit + fail-closed).
2. **Scopes** :
   - Étudiant tente `filiereId` d'une autre filière → résultats restreints à `own`.
   - Parent → uniquement ses enfants.
   - Responsable filière → uniquement sa filière (`filiere:{id}`).
3. **KPI vs SQL** : comparer un agrégat renvoyé par l'API avec une requête SQL de référence sur un jeu de seed connu.
4. **Doublons de références bancaires ESA-COMPTA** : seed 2 bordereaux même référence → KPI `doublonsReferences = 1`.
5. **Audit** : après une action sensible (paiement, changement de rôle), vérifier la ligne `AuditLog` (qui/quoi/quand/avant/après).
6. **Fail-closed** : permission inconnue → `403` ; ressource absente → `404` neutre.

### Frontend (Jasmine/Karma)
1. La **page étudiante** n'affiche jamais un autre périmètre que `own` (test d'intégration sur le service).
2. Les composants `kpi-card`/`chart-panel` affichent les données **dynamiques** (mock service) et gèrent l'état vide/erreur.
3. Visibilité : bouton/route masqués selon `permissionKey` (règle UX), sans jamais prétendre bloquer.

---

## 14. Filtres des KPI (rappel consolidé §17)

Hiérarchie de filtres légers, résolus côté backend :

```
Année académique → Session → Établissement → Filière → Niveau → Classe
```

Le backend réduit l'ensemble **à l'intersection** avec le scope du compte. Filtrer n'ouvre jamais un périmètre interdit.

---

## 15. Architecture cible (§22 consolidé)

```
                    APPLICATION
                         │
              ┌──────────┴──────────┐
              │                     │
            USERS                  RBAC
              │                     │
              └──────────┬──────────┘
                         │
                     DASHBOARD
                         │
        ┌────────────────┼────────────────┐
        │                │                │
       KPI             GRAPHIQUES       ALERTES
        │                │                │
        └────────────────┼────────────────┘
                         │
                       API  (/dashboard/kpi scopené)
                         │
                 SQL optimisé / INDEX / AuditLog
```

Contraintes transverses : **léger, rapide, sécurisé, 24/7, évolutif** ; KPI pertinents, calculés efficacement, protégés par le backend.

---

## 16. Périmètre d'implémentation recommandé (une fois validé)

> **Conformément au brief, la conception est présentée avant tout code.** Un plan d'implémentation « planificateur » sera produit après validation des arbitrages ci-dessous.

### Backend
- `DashboardKpiController` + montage `GET /dashboard/kpi` (et variantes par métier) dans les routeurs existants.
- `ScopeResolver` middleware + brancher `CheckPermission` partout manquant.
- Requêtes SQL agrégées (§6) + complétion des index (§7, via `ensurePerformanceIndexes`).
- Table `AuditLog` + écriture sur actions sensibles + endpoints auditeur (lecture seule).
- Filtre **exercice** sur `GET /comptabilite/dashboard`.
- Nouveaux rôles (§1.2) + permissions en seed + matrice.

### Frontend
- Briques `modern-ui` généralisées (`dashboard-header`, `kpi-card`, `chart-panel`).
- **Refonte des pages d'entrée de chaque profil** avec la typologie de §9 (finance pour CABINET_COMPTABLE/ESA_COMPTA) et §10 (étudiant), données **dynamiques** via services.
- Ajout `ng-apexcharts` (si validé) pour les dashboards finance.
- Filtres légers année/session/étab/filière/niveau/classe résolus côté API.

### Vérification (avant GO)
- Backend `tsc --noEmit` → exit 0.
- Frontend `ng build --configuration=production` → exit 0.
- Tests §13 (RBAC, scopes, KPI vs SQL, doublons, audit) verts.
- Non-régression : les 12 suites en échec connues = préexistantes (même méthode git que l'audit C1/C2).

---

## 17. Suites / points de vigilance

- **Ne pas toucher** aux 12 suites de tests obsolètes en échec dans ce chantier (dette déjà documentée `REGISTRE-COUVERTURE-TESTS.md`).
- **Performance** : réutiliser `calculerSoldeCompte` (SUM SQL, audit C2-10) pour tous les soldes.
- **Cache** : KPI = données vivantes → cache court (`cache(30)`) ou aucune ; jamais de `shareReplay` sur les KPI.
- **Sécurité** : scope toujours côté backend ; auditeur en lecture seule stricte.

---

## 18. Décisions à arbitrer avant implémentation

1. **Nouveaux rôles** : créer `RESPONSABLE_FILIERE`, `RESPONSABLE_EXAMENS`, `AUDITEUR`, `BIBLIOTHECAIRE` tous ensemble, ou uniquement ceux réellement utilisés ? **Recommandé** : `AUDITEUR` + `RESPONSABLE_FILIERE` en priorité ; `RESPONSABLE_EXAMENS`/`BIBLIOTHECAIRE` si périmètre confirmé.
2. **Bibliothèque de graphiques « finance »** : **ApexCharts (recommandé)** vs chart.js enrichi ? Impact : dépendance nouvelle + réécriture des tuiles finance. **Recommandé** : ApexCharts pour dashboard finance, chart.js conservé pour vues simples.
3. **Responsable pédagogique / Jury** : mapper sur `PERSONNEL_ADMINISTRATIF` / `COMITE_ORIENTATION` existants ou créer des rôles dédiés ?
4. **Filtre exercice comptable** : faut-il immédiatement supporter le filtre exercice sur `GET /comptabilite/dashboard` (limite connue) ou reporter ?
5. **Périmètre de la refonte V1** : fallait-il refondre **toutes** les pages d'entrée ou commencer par les 3 prioritaires demandées (CABINET_COMPTABLE, ESA_COMPTA, ÉTUDIANT) puis généraliser ? **Recommandé** : prioriser ces 3 + DG (finance), puis étendre.
6. **Audit rétroactif** : doit-on écrire `AuditLog` sur les actions passées (migration) ou seulement dès maintenant (à partir de GO) ?

---

*Fin de la conception — à valider avant tout développement.*
