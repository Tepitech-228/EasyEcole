# 📋 TODO — Refonte Processus d'Inscription EasyEcole

> Suivi d'avancement du flux définitif : Étudiant → Cabinet comptable → ESA-COMPTA → Comité → Système.
> Cocher au fur et à mesure. Date de mise à jour : 21/08/2026.

---

## ✅ JOUR 1 — MATIN (Phase 0 : Stabilisation)

- [x] Corriger le crash backend `BordereauDossierService.ts` (imports `Request`/`ArchiveGedService`, dépendance circulaire)
- [x] Corriger le warning startup : nom de table `ins_rattrapage_documents_deposes` dans `DatabaseConnection.ts`
- [x] Corriger la liste déroulante vide des parcours sur `/inscription/frais-parcours` (label `p.titre`)
- [x] Créer le rôle **ESA_COMPTA** (backend `RolesUtilisateur.ts`)
- [x] Ajouter le rôle côté frontend (`RolesUtilisateur.ts`, `RolesValueType.ts`, `BaseComponentClass.isEsacompta`)
- [x] Menu backend : entrées « Bordereaux à traiter » + « Types de bordereau » pour esa_compta
- [x] Créer le compte **esa-compta@easyecole.tg** / `Compta@2026!` (id 28)
- [x] Étendre l'ENUM MySQL `role` avec `esa_compta`
- [x] Table + seed des 9 types d'opérations bordereau
- [x] Colonnes BDD bordereau : `datePaiement`, `typeOperationId`, statuts étendus (`en_saisie_comptable`, `traite`)
- [x] **Formulaire étudiant : upload seul** (retrait modalité mensualités + référence bancaire)
- [x] **Interface cabinet : Voir / Valider / Rejeter uniquement** (retrait bouton Traiter, modales Traitement/Lettrage, batch Valider)
- [x] **Aperçu imputation = simulation pure** (`ImputationService.simulerPourUtilisateur`, plus aucune écriture en base)
- [x] Compilation backend + frontend OK

---

## 🔄 JOUR 1 — APRÈS-MIDI (Phase 1 : ESA-COMPTA complet)

### Champs de saisie manquants
- [x] Modèle `Bordereau.ts` : ajouter `numeroBordereau` (string) + `moyenPaiement` (enum virement/especes/mobile_money/cheque)
- [x] Modèle frontend `Bordereau.model.ts` : mêmes champs
- [x] Migration SQL `migrations/006_bordereaux_saisie_comptable.sql` (colonnes + table types opérations) — **appliquée en dev, idempotente**
- [x] `FinanceRouter.saisir` : persister les 2 nouveaux champs
- [x] Page esacompta : ajouter les champs au formulaire de saisie (+ liste moyens de paiement)

### Règle du premier bordereau (session)
- [x] Détection « premier bordereau » : aucun `DossierEtudiant` existant pour l'utilisateur
- [x] Forcer type `INSCRIPTION` → appeler `BordereauDossierService.creerDossierEtudiantDepuisBordereau` depuis `saisir`
- [x] Option `ignorerVerifFrais` dans le service (le comptable constate le montant réel, ancien garde-fou désactivé)
- [x] Créer une échéance `inscription` (montant grille tarifaire) quand la modalité `1x` n'en génère pas → imputable en priorité par la FIFO
- [x] Résoudre la grille tarifaire via `TarifService.resoudre` dans tous les cas + poser le snapshot comptable
- [x] Réordonnancement `saisir` : création dossier AVANT imputation FIFO (sinon tout partait en portefeuille pour un nouvel étudiant)

### Validation Phase 1
- [ ] Test scénario : étudiant paie 200 000 → inscription 50 000 SOLDÉE, échéances 1-2 soldées, échéance 3 partielle (30 k restant), email récapitulatif envoyé

---

## ⬜ JOUR 2 — MATIN (Phase 2 : Comité = validation finale)

### Pipeline du dossier
- [x] Colonne `statutPipeline` sur `DemandeInscription` : `soumis → authentifie → saisie_validee → transmis_comite → valide / correction_demandee / rejete` (+ `motifPipeline`) — migration `007_pipeline_inscription.sql` appliquée en dev
- [x] Cabinet valide → `statutPipeline='authentifie'` — **`validerBordereau` simplifié en authentification seule** (plus aucun effet financier/pédagogique côté cabinet)
- [x] ESA-COMPTA saisit → `statutPipeline='transmis_comite'` + quitus/reçu docgen/écriture comptable **déplacés de la validation cabinet vers la saisie** (parité fonctionnelle conservée)

### Interface comité
- [x] Backend `ComiteValidationController` + router (`/inscription/comite-validations`) :
  - GET `/dossiers` (file d'attente, `?tous=true` pour l'historique)
  - GET `/dossiers/:id` (détail 4 volets : identité / parcours / documents / finances + échéances)
  - POST `/dossiers/:id/decider` (valide / correction_demandee / rejete — motif obligatoire sauf validation)
- [x] Validation comité = déclencheur UNIQUE de la finalisation pédagogique via `BordereauDossierService.finaliserAffectationPedagogique()` : matricule définitif, cursus, cours participants (obligatoires auto), carte étudiante, GED, email officiel
- [x] Architecture « pédagogie différée » : à la saisie ESA-COMPTA du 1er bordereau, seul le socle financier est créé (`pedagogieDifferee: true`) — l'étudiant n'existe OFFICIELLEMENT qu'après validation du comité
- [x] Frontend page comité `/inscription/comite-validation` : liste, examen détaillé 4 volets, 3 décisions avec confirmation
- [x] Menu « Validation comité » pour COMITE_ORIENTATION + ADMIN
- [x] Emails décision : validation (matricule + consigne secrétariat) / correction / rejet

---

## ⬜ JOUR 2 — APRÈS-MIDI (Emails + Recette)

### Emails séquencés
- [ ] Email N°2 « Votre dossier est transmis au comité » (après saisie ESA-COMPTA)
- [ ] Email décision comité (validé / correction demandée / rejeté)
- [ ] Email final officiel : matricule + parcours + session + consigne secrétariat (autorisation provisoire)

### Recette
- [ ] Parcours E2E complet à 4 acteurs (comptes de démo)
- [ ] Cas : rejet cabinet avec motif, correction comité, double-clic validation (idempotence)
- [ ] Vérifier réinscription (dossier existant) non cassée
- [ ] Commit + push GitHub + redéploiement Dokploy

---

## 📦 DÉPLOYMENT (en parallèle)

- [x] Code poussé sur GitHub (`9f620b2` → master)
- [x] Bloc `.env` production fourni (CORS_ORIGIN, JWT_SECRET, DB, secrets générés)
- [ ] Renseigner les variables dans Dokploy (Environment du service backend)
- [ ] Créer/relever l'URL publique du frontend (Domains) → `CORS_ORIGIN`
- [ ] Redeploy stack compose (build images sur serveur) — vérifier RAM serveur ≥ 4 Go pour build Angular
- [ ] Vérifier login esa-compta + accès pages finance
- [ ] Rotation du mot de passe BDD (identifiants passés en clair dans la conversation)

---

## 🕐 DÉCALÉ (après les 2 jours)

- [ ] Email N°1 « Votre dossier d'inscription est en cours de traitement » (à la soumission)
- [ ] Timeline visuelle des étapes dans l'espace étudiant (13 étapes)
- [ ] Page d'administration des moyens de paiement (si liste extensible souhaitée)
- [ ] Documentation des responsabilités (tableau §26 de la spécification)
- [ ] Nettoyage scripts temporaires (`scripts/_final-check.cjs`, `temp-opencode/`)
