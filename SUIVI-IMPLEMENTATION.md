# SUIVI D'IMPLEMENTATION — Parcours / Filières / Sessions (EasyEcole)

> Registre de suivi du chantier en cours. Mis à jour au fil de l'avancement.
> Dernière mise à jour : septembre 2026

---

## 1. CONTEXTE MÉTIER (VALIDÉ)

Le projet suit un modèle de **parcours (cycle) → grade (année) → filière**, où **les filières ne changent pas par grade** : chaque parcours a un nombre d'années (sessions), et une filière est la même quelle que soit l'année.

### Parcours et grades

| Parcours (type) | Grades (années / réinscription) | Filières |
|---|---|---|
| **LICENCE** | LICENCE 1, LICENCE 2, LICENCE 3 | les 37 (version Licence) |
| **MASTER** | MASTER 1, MASTER 2 | les 37 (version Master) |
| **MBA** | MBA 1, MBA 2 | 2 filières |
| **BTS** | BTS 1, BTS 2 | 29 filières |
| **DOCTORAT** | DOCTORAT 1, DOCTORAT 2, DOCTORAT 3 | *(aucune pour l'instant)* |

### Règles métier clés
- **MBA ≠ MASTER** (deux parcours distincts).
- **BTS** doit être ajouté comme parcours actif.
- **Pas encore de filières DOCTORAT** (niveaux à créer éventuellement).
- **Les filières existent en DOUBLE** : une version Licence ET une version Master (37 + 37).
- **La session détermine le PARCOURS, pas le grade pour les filières** :
  - choisir session « LICENCE 1 » → voir toutes les filières LICENCE (idem LICENCE 2, LICENCE 3)
  - choisir session « MASTER 1/2 » → voir toutes les filières MASTER
- **LICENCE 1 = première année** (2 semestres). Pour passer en année supérieure, l'étudiant fait une **réinscription** (LICENCE 1 → 2 → 3) et change éventuellement de parcours (Licence → Master).

---

## 2. ÉTAT ACTUEL DE LA BASE (diagnostic réalisé)

Base : **MariaDB locale** `localhost:3307`, base `easyecole`, user `root` (sans mdp en local).

Table `ins_parcours` :
- 14 filières **LICENCE** (grade = NULL)
- 3 filières **MASTER** (grade = NULL)
- **Aucun parcours MBA / BTS / DOCTORAT**

Table `ins_niveaux_etudes` (grades) :
- 1 = Licence 1, 2 = Licence 2, 3 = Licence 3, 4 = Master 1, 5 = Master 2
- **Manquent** : MBA 1, MBA 2, BTS 1, BTS 2, DOCTORAT 1, DOCTORAT 2, DOCTORAT 3

Table `ins_sessions` : liée à un `niveauEtudeId` (pas directement à un parcours).
Relation indirecte session→parcours : `Session.niveauEtudeId → NiveauEtude ← Parcours.niveauEtudeId`.

**Blocage actuel du wizard** : `ParcoursController.getArborescence()` retourne TOUS les parcours sans filtrage par session/niveau → l'étudiant voit tous les types au lieu de ceux de sa session.

---

## 3. OBJECTIFS FONCTIONNELS

1. **Données fondation** : créer les grades manquants + les parcours filières manquants + rattacher les filières par parcours (37 LICENCE + 37 MASTER + 2 MBA + 29 BTS).
2. **API** : permettre de récupérer les filières d'un parcours à partir d'une session (filtre par type / niveauEtudeId / sessionId). Rendre `getArborescence` filtrable.
3. **Front Angular** : dans le wizard d'inscription, la PHASE 1 « Choix du parcours » ne doit afficher QUE les filières du parcours correspondant à la session choisie.
4. **Réinscription** : gérer le passage d'année (LICENCE 1→2→3) et de parcours (Licence→Master).

---

## 4. FILIÈRES DE L'ÉCOLE (RÉFÉRENTIEL)

### LICENCE PROFESSIONNELLE / MASTER PROFESSIONNEL (37 filières — existent en double Licence + Master)
1. Administration générale
2. Administration des collectivités territoriales
3. Administration des collectivités locales
4. Marketing digital et E business
5. Protocole et relations publiques
6. Gestion commerciale
7. Gestion des ressources humaines
8. Science et techniques comptables et financières
9. Audit et contrôle de gestion
10. Commerce international
11. Transport logistique
12. Marketing-communication
13. Gestion des projets et passation des marchés
14. Réseaux et télécommunication
15. Génie logiciel
16. Génie civil
17. Energies renouvelables et efficacité énergétique
18. Sécurité informatique-cyber sécurité-cybercriminalité
19. Marketing
20. Génie électrique
21. Administration et gestion des affaires
22. Gestion fiscales des entreprises
23. Economie des transports et développement social
24. Management du tourisme et de l'hôtellerie
25. Management et gestion des organisations sportives
26. Journalisme
27. Banque et finance
28. Monnaie et finance
29. Banque-assurance
30. Technologies alimentaires et biologiques
31. Aquaculture
32. Informatique industrielle
33. Génie mécanique
34. Génie industriel
35. Agro business
36. Modélisation économétrique et analyse des données
37. Diplomatie, protocole et relations publiques

### MASTER OF BUSINESS ADMINISTRATION (MBA) — 2 filières
1. Gestion des entreprises
2. Leadership, gouvernance et performance des équipes

### BTS — 29 filières
1. Comptabilité et gestion des entreprises
2. Communication des entreprises
3. Assistant de gestion PME/PMI
4. Génie civil
5. Secrétariat de direction
6. Commerce international
7. Transport logistique
8. Action commerciale et force de vente
9. Gestion des ressources humaines
10. Gestion des collectivités locales
11. Informatique de gestion (développeur d'application)
12. Informatique de gestion (administrateur de réseaux locaux d'entreprise)
13. Télécommunications
14. Maintenance informatique et réseaux
15. Journalisme
16. Informatique industrielle
17. Géomètre topographe
18. Assurance
19. Finance banque
20. Génie électrique
21. Restauration
22. Hôtellerie
23. Génie thermique
24. Electromécanique
25. Electronique
26. Electrotechnique
27. Tourisme et loisirs
28. Aquaculture
29. Technologies alimentaires et biologiques

### DOCTORAT
- Aucune filière pour l'instant.

---

## 5. DÉCOUPAGE TECHNIQUE — SUIVI D'IMPLÉMENTATION

| # | Tâche | Couche | Fichiers concernés | Statut |
|---|---|---|---|---|
| 1 | Créer les grades manquants + insérer 105 filières dans `ins_parcours` | Base de données | `migrations/015_seed_filieres_inscription.sql` | **✅ FAIT + APPLIQUÉ** |
| 2 | Rendre `getArborescence` filtrable (sessionId / niveauEtudeId / type) | Backend | `ParcoursController.ts` | **✅ FAIT** |
| 3 | Transmettre le niveau/parcours de la session au wizard via query params | Front | `choisir-session-page.component.ts` | **✅ FAIT** |
| 4 | Filtrer la PHASE 1 par session → filières du parcours | Front | `inscription-wizard-page.component.ts`, `parcours.service.ts` | **✅ FAIT** |
| 5 | Réinscription : passage d'année / de parcours | Back+Front | `ReinscriptionController.ts`, `reinscription-wizard-page` | **✅ VALIDÉ** (autonome, pas de filtre arborescence) |
| 6 | Documents requis par niveau (référentiel `ins_document_requis_niveau`) | Backend / BDD | `seed-documents-requis-niveau.ts` | **✅ FAIT + APPLIQUÉ** |
| 7 | Correctif documents BTS (BTS 1 / BTS 2) | Backend / BDD | `seed-documents-requis-niveau.ts` | **✅ FAIT + APPLIQUÉ** |
| 8 | Compilation Angular (build) | Front | — | **✅ OK** |
| 9 | Tests d'intégration backend (API réelle) | Tests | `__tests__/helpers/integration-server.ts`, `ParcoursArborescence.integration.test.ts`, `DocumentRequisNiveau.integration.test.ts` | **✅ 14/14 PASSANTS** |

---

## 6. DÉTAIL DES MODIFICATIONS RÉALISÉES

### 6.1 Script seed `015_seed_filieres_inscription.sql`

**Chemin** : `D:\EASYECOLE\migrations\015_seed_filieres_inscription.sql`

Ce script SQL idempotent :
1. **Crée les grades manquants** dans `ins_niveaux_etudes` : MBA 1, MBA 2, BTS 1, BTS 2, Doctorat 1/2/3
2. **Supprime les anciennes filières de démo** dans `ins_parcours` (conserve celles liées à des demandes existantes)
3. **Insère les 247 lignes** (105 filières × grades par cycle) :
   - 37 filières × 3 grades LICENCE = 111 lignes
   - 37 filières × 2 grades MASTER = 74 lignes
   - 2 filières × 2 grades MBA = 4 lignes
   - 29 filières × 2 grades BTS = 58 lignes
4. Chaque filière est rattachée au bon `niveauEtudeId` (Licence 1/2/3, Master 1/2, MBA 1/2, BTS 1/2)

**Migration requise au préalable** : `012_grade_parcours.sql` (ajoute la colonne `grade` à `ins_parcours`).

**Commande d'application** :
```bash
# 1. Appliquer la migration 012 (colonne grade)
npx ts-node src/core/scripts/apply-migration-temp.ts 012_grade_parcours.sql

# 2. Appliquer le seed 015 (105 filières)
npx ts-node src/core/scripts/apply-migration-temp.ts 015_seed_filieres_inscription.sql
```

### 6.2 Backend — `ParcoursController.getArborescence()`

**Fichier** : `src/modules/inscription/controllers/ParcoursController.ts`

Ajout de 3 paramètres query optionnels :
- `sessionId` : résout le `niveauEtudeId` de la session et filtre les parcours correspondants
- `niveauEtudeId` : filtre direct par niveau d'étude
- `type` : filtre par cycle (LICENCE, MASTER, BTS, MBA, DOCTORAT)

Exemples d'appel :
```
GET /inscription/parcours/arborescence?sessionId=5
GET /inscription/parcours/arborescence?niveauEtudeId=1
GET /inscription/parcours/arborescence?type=LICENCE
```

### 6.3 Frontend — Service `ParcoursService`

**Fichier** : `src/app/data/modules/inscription/services/parcours.service.ts`

`getArborescence()` accepte désormais un objet de paramètres :
```typescript
getArborescence(params?: { sessionId?: string; niveauEtudeId?: string; type?: string })
```

### 6.4 Frontend — `ChoisirSessionPageComponent`

**Fichier** : `src/app/features/modules/inscription/pages/choisir-session-page/choisir-session-page.component.ts`

Lors du choix d'une session, transmet `sessionId` et `niveauEtudeId` en query params :
```typescript
this.router.navigate(['/inscription/demandes', demandeId], {
  queryParams: { sessionId: session.id, niveauEtudeId: session.niveauEtudeId }
})
```

### 6.5 Frontend — `InscriptionWizardPageComponent`

**Fichier** : `src/app/features/modules/inscription/pages/inscription-wizard-page/inscription-wizard-page.component.ts`

- Lit les query params `sessionId` et `niveauEtudeId` via `ActivatedRoute`
- Passe ces paramètres à `getArborescence()` pour filtrer les filières
- Auto-sélectionne la session correspondante si `sessionId` est fourni
- Recharge les documents requis lors du passage à l'étape 2 avec une session auto-sélectionnée

### 6.6 Référentiel des documents requis par niveau

**Fichier** : `src/core/scripts/seed-documents-requis-niveau.ts`

Script idempotent (`findOrCreate` par couple niveau+code) qui alimente `ins_document_requis_niveau` :
- **Tronc commun (tous niveaux)** : 11 documents (demande DG, attestation Bac simple/légalisée, relevé Bac simple/légalisé, naissance légalisée, duplicata nationalité, CNI, bordereau, photo, reçu 2000 FCFA).
- **LICENCE 2** : tronc + relevés 1ère année (12).
- **LICENCE 3** : tronc + relevés 1ère année + relevés 1ère & 2ème année (13).
- **MASTER 1/2** : tronc + attestation de réussite Licence + relevés 3 années de Licence (13).
- **MBA 1/2** et **BTS 1/2** : tronc commun (11).

**Correctif appliqué (étape 6) :** le niveau BTS était stocké en générique « BTS », alors que les grades des parcours BTS sont « BTS 1 » et « BTS 2 ». Le seed renvoyait donc **0 document** pour une filière BTS choisie dans le wizard. Le seed a été corrigé pour couvrir `BTS 1` et `BTS 2` (le niveau générique « BTS » est conservé pour compatibilité). Total en base après re-seed : **150 enregistrements**.

**Commande d'application (idempotente) :**
```bash
npx ts-node src/core/scripts/seed-documents-requis-niveau.ts
```

**Vérification du chargement au wizard :** `getByNiveau(grade)` fait `niveau.toUpperCase()` côté backend ; les grades (Licence 1…, Master 1/2, MBA 1/2, BTS 1/2) sont tous couverts. Les lots de parcours sans `grade` (grade NULL, résiduels de démo) ne sont pas reliés à des documents.

### 6.7 Tests d'intégration backend

**Infrastructure** : `src/__tests__/helpers/integration-server.ts`

Petit serveur Express de test qui ne monte QUE les routes d'inscription (parcours + documents requis), avec le **vrai middleware Authenticate** et la **vraie base MariaDB locale**. Le serveur s'écoute sur un port éphémère et expose un token JWT valide (signé avec `JWT_SECRET`, utilisateur admin `id=1`).

**Fichiers de tests** :
- `src/__tests__/modules/inscription/ParcoursArborescence.integration.test.ts` — 5 tests
- `src/__tests__/modules/inscription/DocumentRequisNiveau.integration.test.ts` — 9 tests

**Chaîne testée bout en bout** : HTTP → Authenticate (JWT vérifié + utilisateur réel en base) → controller → Sequelize → SQL MariaDB → réponse HTTP.

**Couverture des scénarios** :

| Scénario | Endpoint | Assertions |
|---|---|---|
| Arborescence sans filtre | `GET /parcours/arborescence` | ≥1 type retourné, LICENCE et MASTER présents |
| Filtrage `niveauEtudeId=3` | `GET /parcours/arborescence?niveauEtudeId=3` | Toutes les filières retournées ont `niveauEtudeId === 3` |
| Licence 3 non vide | `GET /parcours/arborescence?niveauEtudeId=3` | Au moins une filière de grade « Licence 3 » |
| Documents LICENCE 1 | `GET /documents-requis-niveau?niveau=LICENCE 1` | 11 documents (tronc commun) |
| Documents LICENCE 2 | `GET /documents-requis-niveau?niveau=LICENCE 2` | 12 documents (tronc + relevés 1ère) |
| Documents LICENCE 3 | `GET /documents-requis-niveau?niveau=LICENCE 3` | 13 documents (tronc + relevés 1ère, + 1ère&2ème) |
| Documents MASTER 1 | `GET /documents-requis-niveau?niveau=MASTER 1` | 13 documents (tronc + attestation + relevés Licence) |
| Documents MASTER 2 | `GET /documents-requis-niveau?niveau=MASTER 2` | 13 documents |
| Documents BTS 1 | `GET /documents-requis-niveau?niveau=BTS 1` | 11 documents (niveau = « BTS 1 ») |
| Documents BTS 2 | `GET /documents-requis-niveau?niveau=BTS 2` | 11 documents (niveau = « BTS 2 ») |
| Documents MBA 1 | `GET /documents-requis-niveau?niveau=MBA 1` | 11 documents |
| Niveau inexistant | `GET /documents-requis-niveau?niveau=NIVEAU_FAKE_99` | 0 documents |
| Auth refusée (parcours) | `GET /parcours/arborescence` sans token | 401 |
| Auth refusée (documents) | `GET /documents-requis-niveau` sans token | 401 |

**Commande d'exécution** :
```bash
npx jest --testPathPatterns="integration" --forceExit
```

---

## 7. OUTILS / INFRASTRUCTURE

- **Base** : MariaDB locale `localhost:3307`, base `easyecole`, user `root` (pas de mdp en dev local). Le `.env` du backend utilise `DB_HOST=localhost`, `DB_PORT=3307`.
- **Sous-agents opencode** : configurés (modèle `opencode/ling-3.0-flash-fin-free`) avec prompts avancés. Un **redémarrage d'opencode** est nécessaire pour activer les changements de config.

---

## 8. PROCHAINES ÉTAPES

1. **Redémarrer le backend** (`npm run dev`) pour que Sequelize synchronise le modèle avec la colonne `grade` (non redémarré depuis l'ajout de la colonne).
2. **Test du wizard** : vérifier que la Phase 1 « Choix de la filière » affiche uniquement les filières de la session choisie (ex. `sessionId=5&niveauEtudeId=3` → 37 filières Licence 3).
3. **Validation du flux complet** : session → filière → documents (grade) → infos → soumission, notamment le retour des documents à l'étape 2 pour chaque grade (dont BTS 1/2).
4. **Préparer les données DOCTORAT** si le client confirme (0 filières pour l'instant ; les documents DOCTORAT 1/2/3 sont déjà au référentiel).
