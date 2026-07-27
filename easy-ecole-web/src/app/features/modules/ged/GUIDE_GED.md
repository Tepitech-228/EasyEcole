# Guide d'utilisation de la GED (Gestion Électronique de Documents)

## Menu « Archivages Numeriques »

La GED est organisée en **4 sous-menus** :

### 📁 Documents
| Page | Route | Usage |
|------|-------|-------|
| **Catalogue** | `/ged/catalog` | Naviguer dans l'arborescence des documents, filtrer par domaine/confidentialité/cycle de vie, consulter la liste paginée |
| **Recherche avancée** | `/ged/search` | Trouver un document précis avec filtres multiples (domaine, type, dossier, niveau de confidentialité, cycle de vie, semestre, classe, type source) |
| **Dossiers** | `/ged/folders` | Créer, lister et supprimer des dossiers pour organiser les documents |

### 📤 Traitement
| Page | Route | Usage |
|------|-------|-------|
| **Téléverser** | `/ged/upload` | Uploader un fichier avec ses métadonnées (titre, référence, catégorie, durée de conservation), choisir un dossier/session, assigner un processus générateur, configurer le chiffrement et l'emplacement de stockage |

### 🗂 Organisation
| Page | Route | Usage |
|------|-------|-------|
| **Nomenclature** | `/ged/nomenclature` | Générer un nom de fichier normalisé selon les règles de l'établissement (type + date + catégorie + référence) — copie rapide dans le presse-papiers |
| **Sessions** | `/ged/sessions` | Gérer les sessions (conseils de classe, commissions, etc.) : lister, créer, consulter les détails d'une session |
| **Conservation** | `/ged/conservation` | Suivre l'état de conservation des documents : tous, DUA approchante, DUA expirée, à détruire, archivés |
| **Bordereaux** (Admin) | `/ged/disposal` | Valider ou rejeter les demandes de destruction de documents (bordereaux d'élimination) |

### 🔧 Administration (pages hors menu, accès direct par URL)
| Page | Route | Usage | Accès |
|------|-------|-------|-------|
| **Dossiers virtuels** | `/ged/dossiers-virtuels` | Consulter tous les documents liés à un étudiant ou employé (par ID entité) | lecture |
| **Document** | `/ged/document/:id` | Voir le détail d'un document : aperçu, historique des versions, audit trail, marquer/supprimer une version | équipe GED |
| **Archives** | `/ged/archives` | Lister l'ensemble des documents archivés avec taille totale, télécharger les archives | équipe GED |
| **Processus** | `/ged/processus` | Lister et activer/désactiver les processus générateurs de documents | Admin |
| **Permissions** | `/ged/permissions` | Configurer les droits d'accès par rôle, processus et domaine | Admin |
| **Configuration stockage** | `/ged/storage-config` | Configurer le chemin local, la connexion NAS, le cloud provider, l'algorithme de chiffrement et la rotation des clés | Admin |

---

## Workflows typiques

### 1. Déposer un document
1. **Nomenclature** → générer le nom normalisé
2. **Dossiers** → créer un dossier si nécessaire
3. **Téléverser** → uploader le fichier renseigner les métadonnées, assigner un processus et un dossier
4. Le document apparaît dans le **Catalogue**

### 2. Rechercher et consulter
- **Recherche avancée** → trouver le document par critères
- Cliquer sur un résultat → ouvre `/ged/document/:id` (détail + versions + audit)

### 3. Gérer le cycle de vie
- **Conservation** → surveiller les DUA approchantes/expirées
- **Bordereaux** → traiter les demandes de destruction (Admin)
- **Archives** → consulter et télécharger les documents archivés

### 4. Session (conseil / commission)
1. **Sessions** → créer une session
2. **Téléverser** → uploader les documents liés à cette session
3. **Sessions** → suivre les documents associés

---

## Rôles et permissions

| Rôle | Pages accessibles |
|------|-------------------|
| **Tout utilisateur** | Catalogue, Recherche, Nomenclature, Conservation, Dossiers virtuels |
| **Équipe GED** | + Téléverser, Dossiers, Sessions, Document, Archives |
| **Admin** | + Bordereaux, Processus, Permissions, Configuration stockage |

---

## Navigation rapide
- `/ged/catalog` — point d'entrée par défaut
- `/ged/upload` — upload rapide
- `/ged/search` — recherche multicritères
- `/ged/document/123` — vue détail d'un document
