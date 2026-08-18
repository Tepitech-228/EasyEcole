# Audit de performance — EasyEcole
# Rapport d'audit : requêtes N+1, indexes manquants, caches, optimisations

## Résumé exécutif

| Domaine | Constat | Impact | Priorité |
|---------|---------|--------|----------|
| N+1 queries | Plusieurs include sans subQuery:false | Requêtes N+1 sur bulletins, inscriptions | **P1** |
| Indexes | Manquants sur foreign keys fréquentes | scans full table sur bulletins, notes | **P1** |
| Caching | Aucun cache Redis/mémoire | Requêtes répétées (classes, niveaux, années) | **P2** |
| Pagination | findAll sans limite sur certaines listes | Chargement mémoire excessif | **P2** |
| Compression | Absente sur l'API | Réponses JSON volumineuses | **P3** |
| Frontend | OnPush pas systématique, pas de trackBy | Renders Angular excessifs | **P3** |

---

## 1. Requêtes N+1 identifiées

### 1.1 BulletinController — findAll
**Fichier :** `modules/bulletins/controllers/BulletinController.ts`

**Problème :**
```typescript
Bulletin.findAll({
  include: [
    Bulletin.associations.lignesBulletins,
    Bulletin.associations.utilisateur,
    Bulletin.associations.classe,
    // ...
  ]
})
```
Avec `subQuery: false` manquant, Sequelize génère des sous-requêtes pour chaque association.

**Correction :**
```typescript
Bulletin.findAll({
  subQuery: false,
  include: [
    { association: 'lignesBulletins', separate: false },
    { association: 'utilisateur', separate: false },
    { association: 'classe', separate: false },
  ]
})
```

### 1.2 InscriptionController — getAllClasses / getAllCursus
**Fichier :** `modules/inscription/controllers/ClasseController.ts`, `CursusApprenantController.ts`

**Problème :** Includes chaînés `classe -> niveauEtude -> parcours` sans `subQuery: false`.

**Correction :**
```typescript
Classe.findAll({
  subQuery: false,
  include: [
    { association: 'niveauEtude' },
    { association: 'parcours' },
    { association: 'sallesDeClasse' }
  ]
})
```

### 1.3 AuthController — getApprenant
**Fichier :** `modules/auth/controllers/ApprenantController.ts`

**Problème :** Include chaîné `utilisateur -> cursusApprenant -> classe -> niveauEtude`.

**Correction :**
```typescript
Apprenant.findOne({
  subQuery: false,
  include: [
    Apprenant.associations.adresse,
    Apprenant.associations.identite,
    {
      association: Apprenant.associations.utilisateur,
      include: [
        {
          association: 'cursusApprenant',
          include: [
            { association: 'classe', include: [{ association: 'niveauEtude' }] },
            { association: 'parcours' },
            { association: 'anneeAcademique' }
          ]
        }
      ]
    }
  ]
})
```

---

## 2. Indexes manquants à ajouter

### 2.1 Migration SQL : `migrations/003_add_indexes.sql`

```sql
-- =============================================================================
-- Indexes pour optimiser les requêtes fréquentes
-- =============================================================================

-- Bulletins : filtrage par cursus + année + semestre
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_cursus_annee_semestre` (`cursusApprenantId`, `anneeAcademiqueId`, `semestre`);

-- Bulletins : filtrage par classe + année
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_classe_annee` (`classeId`, `anneeAcademiqueId`);

-- Bulletins : filtrage par utilisateur
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_utilisateur` (`utilisateurId`);

-- Lignes de bulletin : filtrage par cours
ALTER TABLE `ins_lignes_bulletins`
    ADD INDEX `idx_lignes_bulletins_cours` (`coursId`);

-- Notes : filtrage par participant + année
ALTER TABLE `ins_notes_evaluations`
    ADD INDEX `idx_notes_participant_annee` (`coursParticipantId`, `anneeAcademiqueId`);

-- Cursus apprenant : filtrage par classe + année + statut
ALTER TABLE `ins_cursus_apprenants`
    ADD INDEX `idx_cursus_classe_annee_statut` (`classeId`, `anneeAcademiqueId`, `statutReinscription`);

-- Cursus apprenant : filtrage par utilisateur
ALTER TABLE `ins_cursus_apprenants`
    ADD INDEX `idx_cursus_utilisateur` (`utilisateurId`);

-- Paiements : filtrage par inscription + date
ALTER TABLE `ins_paiements`
    ADD INDEX `idx_paiements_inscription_date` (`inscriptionId`, `datePaiement`);

-- Présences : filtrage par séance
ALTER TABLE `ins_presences`
    ADD INDEX `idx_presences_seance` (`seanceId`);

-- Cours : filtrage par classe + enseignant
ALTER TABLE `ins_cours`
    ADD INDEX `idx_cours_classe_enseignant` (`classeId`, `enseignantId`);
```

### 2.2 Vérification des indexes existants
```sql
SHOW INDEX FROM `ins_bulletins`;
SHOW INDEX FROM `ins_cursus_apprenants`;
SHOW INDEX FROM `ins_notes_evaluations`;
```

---

## 3. Caching — Stratégie

### 3.1 Backend : Cache Service (Redis)
**Fichier à créer :** `core/services/CacheService.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable({ providedIn: 'root' })
export class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    })
  }

  async getOrSet<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached)

    const result = await fn()
    await this.redis.setex(key, ttl, JSON.stringify(result))
    return result
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length) await this.redis.del(...keys)
  }
}
```

### 3.2 Données à cacher

| Clé | TTL | Donnée |
|-----|-----|--------|
| `classes:annee:{id}` | 1h | Classes par année académique |
| `niveaux:departement:{id}` | 24h | Niveaux par département |
| `parcours:niveau:{id}` | 24h | Parcours par niveau |
| `bulletins:stats:{classeId}:{anneeId}` | 15min | Statistiques de classe |
| `user:permissions:{id}` | 1h | Permissions utilisateur |

### 3.3 Intégration dans les contrôleurs
```typescript
// Exemple : ClasseController
const classes = await cacheService.getOrSet(
  `classes:annee:${anneeId}`,
  3600,
  () => Classe.findAll({ where: { anneeAcademiqueId: anneeId } })
)
```

---

## 4. Pagination

### 4.1 Problème
Certains endpoints retournent des tableaux complets sans pagination :
- `GET /bulletins` — peut retourner des centaines de bulletins
- `GET /inscription/cursus-apprenant` — tous les cursus

### 4.2 Correction
```typescript
// Ajouter limit/offset par défaut
const page = parseInt(req.query.page as string) || 1
const limit = parseInt(req.query.limit as string) || 50

const { rows, count } = await Bulletin.findAndCountAll({
  where: { /* ... */ },
  limit,
  offset: (page - 1) * limit,
  subQuery: false,
  include: [/* ... */]
})

return res.json({
  data: rows,
  meta: { page, limit, total: count, pages: Math.ceil(count / limit) }
})
```

---

## 5. Compression HTTP

### 5.1 Backend
**Fichier :** `app.ts`

```typescript
import compression from 'compression'

// Ajouter avant les routes
app.use(compression({
  threshold: 1024, // compresser réponses > 1KB
  level: 6
}))
```

### 5.2 Frontend (nginx)
**Fichier :** `easy-ecole-web/nginx.conf`

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml font/woff font/woff2;
gzip_vary on;
```

---

## 6. Frontend — Optimisations Angular

### 6.1 Change Detection
**Action :** Ajouter `ChangeDetectionStrategy.OnPush` sur tous les composants listés.

**Composants à modifier :**
- `emplois-du-temps-page.component.ts`
- `liste-notes-page.component.ts`
- `bulletins-page.component.ts`
- `paiements-page.component.ts`
- `cartes-page.component.ts`

### 6.2 trackBy pour les *ngFor
**Action :** Ajouter `trackBy` sur toutes les boucles `*ngFor` avec > 20 items.

```typescript
trackByStudentId(index: number, student: any): number {
  return student.id
}
```

### 6.3 Mémoization
**Action :** Utiliser `memoize` ou `shareReplay(1)` pour les observables de configuration.

```typescript
classes$ = this.http.get<Classe[]>('/api/v1/inscription/classes').pipe(
  shareReplay(1),
  catchError(() => of([]))
)
```

---

## 7. Monitoring production

### 7.1 Métriques backend (prom-client)
```typescript
import { Counter, Histogram } from 'prom-client'

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
})

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
})
```

### 7.2 Frontend (web-vitals)
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getLCP(console.log)
getFID(console.log)
```

---

## 8. Plan d'action

| Phase | Action | Effort | Priorité |
|-------|--------|--------|----------|
| **Phase 1** | Corriger N+1 queries (Bulletin, Classe, Cursus) | 1 jour | P1 |
| **Phase 2** | Appliquer indexes manquants (migration 003) | 0.5 jour | P1 |
| **Phase 3** | Implémenter CacheService Redis | 1 jour | P2 |
| **Phase 4** | Ajouter pagination sur endpoints volumineux | 0.5 jour | P2 |
| **Phase 5** | Compression HTTP (backend + nginx) | 0.25 jour | P3 |
| **Phase 6** | Frontend : OnPush + trackBy | 1 jour | P3 |
| **Phase 7** | Monitoring (prom-client + web-vitals) | 0.5 jour | P3 |
| **TOTAL** | | **4.75 jours** | |

---

## 9. Tests de performance

### 9.1 Outils recommandés
- **Backend** : ApacheBench, k6, ou autocannon
- **Frontend** : Lighthouse, WebPageTest
- **Base de données** : `EXPLAIN ANALYZE` sur les requêtes lentes

### 9.2 Scénarios de test
```
1. Chargement page d'accueil (authentifié)
   - Mesurer LCP, FID, CLS
   - Vérifier nombre de requêtes API

2. Liste des bulletins (classe de 50 élèves)
   - Mesurer temps de réponse API
   - Vérifier absence de N+1

3. Upload d'un document GED (10 MB)
   - Mesurer temps de traitement
   - Vérifier compression

4. Planning emploi du temps (semaine complète)
   - Mesurer rendu Angular
   - Vérifier OnPush + trackBy
```

---

## 10. Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `migrations/003_add_indexes.sql` | CRÉER |
| `core/services/CacheService.ts` | CRÉER |
| `core/middlewares/CompressionMiddleware.ts` | CRÉER |
| `app.ts` | MODIFIER (ajouter compression) |
| `modules/bulletins/controllers/BulletinController.ts` | MODIFIER (subQuery:false) |
| `modules/inscription/controllers/ClasseController.ts` | MODIFIER (subQuery:false) |
| `modules/auth/controllers/ApprenantController.ts` | MODIFIER (subQuery:false) |
| `features/modules/scolarite/pages/emplois-du-temps-page/*` | MODIFIER (OnPush + trackBy) |
| `features/modules/inscription/pages/liste-notes-page/*` | MODIFIER (OnPush + trackBy) |
