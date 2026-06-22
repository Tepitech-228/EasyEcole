# Module RH — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Nouveau rôle

| Élément | Valeur |
|---------|--------|
| Identifiant | `ressources_humaines` |
| Middleware backend | `AuthRessourcesHumaines.ts` |
| Enum | `RolesUtilisateur.RESSOURCES_HUMAINES` |

## 2. Tables (préfixe `rh_`)

### Structures
- `rh_departements` — id, nom, description
- `rh_employes` — id, utilisateurId (FK → Utilisateur), posteId, departementId, dateEmbauche, typeContratId, salaireBase, statut (actif/suspendu/quitté)
- `rh_types_contrat` — id, code (CDI/CDD/STAGE/PRESTATION), libelle
- `rh_postes` — id, titre, description, departementId

### Recrutement
- `rh_offres_emploi` — id, posteId, description, datePublication, dateCloture, statut (publiée/fermée)
- `rh_candidatures` — id, offreId, nom, email, telephone, cv, lettreMotivation, statut (soumise/étudiée/retenue/rejetée)
- `rh_entretiens` — id, candidatureId, date, heure, lieu, commentaire, statut

### Formation
- `rh_formations` — id, titre, description, dateDebut, dateFin, formateur, type (interne/externe)
- `rh_participations_formation` — id, formationId, employeId, statut (inscrit/terminé/abandon)

### Évaluation
- `rh_criteres_evaluation` — id, nom, description, poids (0-100)
- `rh_fiches_evaluation` — id, employeId, evaluateurId, dateEvaluation, noteGlobale, commentaire
- `rh_evaluations_criteres` — id, ficheId, critereId, note

### Paie paramétrable
- `rh_rubriques_paie` — id, code (SALAIRE_BASE/CNPS/IRPP/PRIME/HSUP/AVANTAGE...), libelle, type (gain/retenue/cotisation), modeCalcul (fixe/pourcentage/formule), valeur, imposable (bool)
- `rh_periodes_paie` — id, mois, annee, dateDebut, dateFin, statut (ouverte/verrouillée)
- `rh_bulletins_paie` — id, employeId, periodeId, totalGains, totalRetenues, netAPayer, statut (brouillon/validé/versé)
- `rh_lignes_bulletin` — id, bulletinId, rubriqueId, libelle, base, taux, montant

### Prestations enseignants
- `rh_prestations_enseignant` — id, enseignantId, coursId, mois, annee, nombreHeures, tauxHoraire, montant, statut (saisie/validée/payée)

## 3. Backend

```
modules/rh/
├── RhModule.ts          → préfixe rh_, modèle prefix Rh
├── RhRoutes.ts          → .use('/employes', ...) etc.
├── models/
│   ├── _associations.ts
│   ├── RhEmploye.ts
│   ├── RhDepartement.ts
│   ├── RhTypeContrat.ts
│   ├── RhPoste.ts
│   ├── RhOffreEmploi.ts
│   ├── RhCandidature.ts
│   ├── RhEntretien.ts
│   ├── RhFormation.ts
│   ├── RhParticipationFormation.ts
│   ├── RhCritereEvaluation.ts
│   ├── RhFicheEvaluation.ts
│   ├── RhEvaluationCritere.ts
│   ├── RhRubriquePaie.ts
│   ├── RhPeriodePaie.ts
│   ├── RhBulletinPaie.ts
│   ├── RhLigneBulletin.ts
│   └── RhPrestationEnseignant.ts
├── controllers/         → CRUD + logique paie
└── routers/             → Routes + middlewares + Swagger
```

Ajout dans `src/routes.ts` : `.use('/rh', RhRoutes)`

### Logique paie
- Calcul automatique à partir de la grille `rh_rubriques_paie`
- ModeCalcul = `pourcentage` → montant = base × taux / 100
- ModeCalcul = `fixe` → montant = valeur
- Génération des lignes bulletin à l'ouverture d'une période

## 4. Frontend

```
features/modules/rh/
├── rh.module.ts
├── rh-routing.module.ts
├── pages/
│   ├── dashboard-rh-page
│   ├── liste-employes-page
│   ├── employe-details-page
│   ├── liste-offres-page
│   ├── offre-details-page
│   ├── liste-candidatures-page
│   ├── candidature-details-page
│   ├── liste-formations-page
│   ├── formation-details-page
│   ├── liste-evaluations-page
│   ├── evaluation-page
│   ├── paie-page
│   ├── bulletin-details-page
│   ├── parametres-paie-page
│   └── prestations-page
```

Intégration dans `app-routing.module.ts` avec lazy loading :
```
path: 'rh',
loadChildren: () => import('./features/modules/rh/rh.module').then(m => m.RhModule),
canLoad: [AuthGuard]
```

## 5. Patterns à suivre

- Modèle Sequelize : hériter de `Model<InferAttributes<T>, InferCreationAttributes<T>>`
- Associations : fichier `_associations.ts` séparé
- Controllers : méthodes statiques, `Request`/`Response` Express
- Routers : Swagger JSDoc, multer si upload
- Middleware : vérifier `(req as any).utilisateurRole == RolesUtilisateur.RESSOURCES_HUMAINES`
- Frontend : composants standalone avec OnPush, Tailwind CSS, SharedModule
