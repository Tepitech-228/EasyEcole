# Audit frontend : données hardcodées → API
# Rapport d'audit et plan de correction

## Résumé exécutif

| Zone | Fichiers analysés | Champs hardcodés critiques | Actions requises |
|------|------------------|---------------------------|------------------|
| Scolarité | emplois-du-temps, bordereaux, cartes | Mois, jours, couleurs, entêtes CSV | Créer ConfigService + endpoints API |
| Bulletins | liste-notes, bulletins | Aucun critique | OK |
| Inscription | paiements, dossiers | Statuts, modes de paiement | Exposer via API |

---

## 1. Données hardcodées identifiées

### 1.1 Mois et jours de la semaine
**Fichiers impactés :**
- `easy-ecole-web/src/app/features/modules/scolarite/pages/emplois-du-temps-page/emplois-du-temps-page.component.ts`
- `easy-ecole-web/src/app/features/modules/comptabilite/pages/bordereaux-page/bordereaux-page.component.ts`
- `easy-ecole-web/src/app/features/modules/paie/pages/paie-page/paie-page.component.ts`
- `easy-ecole-web/src/app/features/modules/prestations/pages/prestations-page/prestations-page.component.ts`

**Données hardcodées :**
```typescript
const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
```

**Action :** Créer `ConfigService` qui appelle `/api/v1/auth/configuration/labels` et expose des observables `moisNom$`, `joursSemaine$`.

### 1.2 Couleurs du planning
**Fichier impacté :**
- `easy-ecole-web/src/app/features/modules/scolarite/pages/emplois-du-temps-page/emplois-du-temps-page.component.ts`

**Données hardcodées :**
```typescript
const COULEURS_PALETTE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', ...]
```

**Action :** Exposer via API `/api/v1/auth/configuration/colors` ou utiliser un thème CSS défini dans `styles.scss`.

### 1.3 En-têtes CSV
**Fichiers impactés :**
- `easy-ecole-web/src/app/features/modules/ged/components/ged-merge/ged-merge.component.ts`
- `easy-ecole-web/src/app/features/modules/comptabilite/pages/bordereaux-page/bordereaux-page.component.ts`

**Données hardcodées :**
```typescript
const headers = ["N°", "Date", "Montant", "Mode", "Statut"]
```

**Action :** Créer endpoint `/api/v1/auth/configuration/csv-headers` retournant les en-têtes par ressource.

### 1.4 Avatars et initiales
**Fichiers impactés :**
- `easy-ecole-web/src/app/features/modules/inscription/pages/cartes-page/cartes-page.component.ts`

**Données hardcodées :**
```typescript
const AVATARS = ['/assets/images/avatar1.png', '/assets/images/avatar2.png', ...]
```

**Action :** Les avatars étant des assets statiques, conserver en dur mais uniformiser via `environments.ts`.

---

## 2. Plan de correction

### Phase 1 : Backend — Endpoints de configuration
Créer dans `modules/auth/controllers/ConfigurationController.ts` :
- `GET /configuration/labels` → `{ mois: string[], jours: string[], civilites: string[], ... }`
- `GET /configuration/colors` → `{ palette: string[], success: string, warning: string, ... }`
- `GET /configuration/csv-headers` → `{ bordereau: string[], bulletin: string[], ... }`

### Phase 2 : Frontend — ConfigService
Créer `core/services/config.service.ts` :
```typescript
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private labels$ = new BehaviorSubject<Labels>({})
  private colors$ = new BehaviorSubject<Colors>({})
  
  constructor(private http: HttpClient) {
    this.loadAll()
  }
  
  async loadAll(): Promise<void> {
    const [labels, colors] = await Promise.all([
      this.http.get<Labels>('/api/v1/auth/configuration/labels').toPromise(),
      this.http.get<Colors>('/api/v1/auth/configuration/colors').toPromise()
    ])
    this.labels$.next(labels)
    this.colors$.next(colors)
  }
}
```

### Phase 3 : Remplacement composant par composant
| Composant | Action |
|-----------|--------|
| `emplois-du-temps-page` | Remplacer `COULEURS_PALETTE` par `configService.colors$.palette` |
| `bordereaux-page` | Remplacer `moisNoms` par `configService.labels$.mois` |
| `paie-page` | Remplacer `MOIS_NOMS` par `configService.labels$.mois` |
| `prestations-page` | Remplacer `noms` par `configService.labels$.mois` |
| `ged-merge` | Remplacer `headers` par `configService.csvHeaders$.bordereau` |

---

## 3. Données pouvant rester en dur (justification)

| Donnée | Raison |
|--------|--------|
| Civilites (`M.`, `Mme`, `Mlle`) | Faible évolution, utilisées dans les formulaires natifs |
| Sexes (`M`, `F`, `Autre`) | Correspond à l'enum backend `DataTypes.ENUM('M', 'F', 'Autre')` |
| Statuts bulletins (`publie`, `brouillon`, `valide`) | Directement liés au modèle Sequelize |
| Modes de paiement (`espece`, `virement`, `mobile_money`) | Correspond à l'enum backend |

---

## 4. Estimation d'effort

| Tâche | Effort estimé |
|-------|--------------|
| Backend : ConfigurationController + seed | 0.5 jour |
| Frontend : ConfigService | 0.25 jour |
| Remplacement dans emplois-du-temps | 0.25 jour |
| Remplacement dans bordereaux/paie/prestations | 0.25 jour |
| Remplacement dans ged-merge | 0.25 jour |
| Tests | 0.5 jour |
| **TOTAL** | **2 jours** |

---

## 5. Priorisation

| Priorité | Composant | Impact |
|----------|-----------|--------|
| P1 | emplois-du-temps-page | Affichage jours/mois critique pour l'utilisateur |
| P1 | bordereaux-page | Export CSV impacté |
| P2 | paie-page / prestations-page | Mois pour les filtres |
| P3 | ged-merge | En-têtes CSV moins critiques |
| P4 | cartes-page | Avatars statiques, faible impact |
