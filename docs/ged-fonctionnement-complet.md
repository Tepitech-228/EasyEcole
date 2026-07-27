# GED — Guide complet de fonctionnement

## Sommaire

1. [Présentation générale](#1-présentation-générale)
2. [Architecture de stockage physique](#2-architecture-de-stockage-physique)
3. [Cycle de vie d'un document](#3-cycle-de-vie-dun-document)
4. [Arborescence des dossiers virtuels](#4-arborescence-des-dossiers-virtuels)
5. [Types documentaires et domaines](#5-types-documentaires-et-domaines)
6. [Conventions de nommage et références](#6-conventions-de-nommage-et-références)
7. [Flux détaillé : Inscription d'un étudiant](#7-flux-détaillé--inscription-dun-étudiant)
8. [Flux détaillé : Relevé de notes / Bulletin](#8-flux-détaillé--relevé-de-notes--bulletin)
9. [Flux détaillé : PV de jury / Délibération](#9-flux-détaillé--pv-de-jury--délibération)
10. [Sécurité, confidentialité et intégrité](#10-sécurité-confidentialité-et-intégrité)
11. [Services de stockage supportés](#11-services-de-stockage-supportés)
12. [Schéma récapitulatif](#12-schéma-récapitulatif)

---

## 1. Présentation générale

Le module **GED** (Gestion Électronique de Documents) d'EasyÉcole couvre l'ensemble du cycle de vie documentaire de l'établissement :

- **Numérisation / Dépôt** — upload manuel ou génération automatique depuis les modules métier
- **Classement** — arborescence par domaine, année, processus, niveau, classe, matricule
- **Recherche** — texte libre, filtres avancés, fulltext sur titre/référence/contenu
- **Cycle de vie** — courant → intermédiaire → définitif → à détruire
- **Archivage** — documents définitifs avec DUA (Durée d'Utilité Administrative)
- **Destruction** — workflow en 2 étapes (demande + confirmation)
- **Signature électronique** — workflow de signature avec code de vérification
- **Registre courrier** — courriers entrants/sortants avec numérotation automatique
- **Pistes d'audit** — toutes les actions tracées dans `ged_audit_logs`

**7 domaines documentaires** couverts : Scolarité, RH, Finances, Recherche, Gouvernance, Patrimoine, Externe.

---

## 2. Architecture de stockage physique

### 2.1 Répertoire racine

```
easy-ecole-backend/public/ged/
```

Tous les fichiers sont stockés dans ce répertoire. Le chemin est configurable via `config/storage.json`.

### 2.2 Arborescence complète

```
public/ged/
│
├── {folderId}/                       # Dossiers virtuels (par ID numérique)
│   └── {timestamp}-{random9}.{ext}   # Exemple : 1784803340333-460015.pdf
│
├── versions/                         # Anciennes versions des documents
│   └── v{major}.{minor}_{docId}.pdf  # Exemple : v1.1_42.pdf
│
├── pdf/                              # Résumés PDF générés (fiche métadata)
│
├── seed_demo/                        # Jeu de démo initial (899 documents)
│
├── seed_full/                        # Jeu de démo complet (1 056 fichiers)
│   ├── doc_scol_0.pdf
│   ├── doc_scol_1.pdf
│   ├── doc_scol_2.pdf
│   ├── doc_rh_197.pdf
│   ├── doc_fin_*.pdf
│   ├── doc_gouv_*.pdf
│   └── ...
│
├── 1784803340333-460015.pdf          # Fichier à la racine (pas de dossier)
└── demo_scol_*.pdf                   # Anciens fichiers de démo
```

### 2.3 Convention de nommage des fichiers

| Type | Format | Exemple |
|---|---|---|
| Upload standard | `{timestamp}-{random9}{ext}` | `1784803340333-460015.pdf` |
| Version | `v{major}.{minor}_{docId}{ext}` | `v1.1_42.pdf` |
| Seed démo | `doc_{domaine}_{num}.pdf` | `doc_scol_12.pdf` |
| Seed complet | `{full}_{num}_{hash}.pdf` | `full_0_3d7cf2.pdf` |
| PV généré (local) | `pv_deliberation_{id}_{timestamp}.pdf` | `pv_deliberation_15_1784803340.pdf` |

### 2.4 Organisation par dossier virtuel

Quand un document est uploadé avec un `folderId`, le fichier est déplacé dans `public/ged/{folderId}/`. Les documents sans dossier restent à la racine de `public/ged/`.

### 2.5 Règles de fichier

| Règle | Valeur |
|---|---|
| Formats acceptés | **PDF** (`application/pdf`), **TIFF** (`image/tiff`, `image/x-tiff`) |
| Taille maximale | **3 Go** (3 × 1024 × 1024 × 1024 octets) |
| Upload par lot | Maximum **50 fichiers** par requête |
| Nom généré | `Date.now()` + `Math.round(Math.random() * 1E9)` + extension |
| Doublon | Détection par SHA-256 : rejet avec code 409 si le hash existe déjà |

---

## 3. Cycle de vie d'un document

```
                    ┌──────────────────┐
                    │    COURANT       │  (actif, modifiable)
                    │ lifecycleStatus  │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐  ┌────────────┐  ┌──────────────────┐
    │   VALIDATION    │  │  SIGNATURE │  │ MARQUAGE         │
    │ (admin/inst)    │  │  request   │  │ DESTRUCTION      │
    └────────┬────────┘  └─────┬──────┘  └────────┬─────────┘
             │                 │                   │
             ▼                 ▼                   ▼
    ┌─────────────────┐  ┌────────────┐  ┌──────────────────┐
    │  INTERMÉDIAIRE  │  │ INTERMÉD.  │  │  À DÉTRUIRE      │
    │  (verrouillé)   │  │ (verrou.)  │  │ lifecycleStatus  │
    │  DUA démarrée   │  │            │  │                  │
    └────────┬────────┘  └─────┬──────┘  └────────┬─────────┘
             │                 │                   │
             ▼                 ▼                   ▼
    ┌─────────────────┐  ┌────────────┐  ┌──────────────────┐
    │   DÉFINITIF     │◄─┤  SIGNÉ     │  │ CONFIRMATION     │
    │   (archivé)     │  │ définitif  │  │ DESTRUCTION      │
    │   (verrouillé)  │  │ verrouillé │  │ (admin)          │
    └─────────────────┘  └────────────┘  └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ SOFT-DELETE      │
                                          │ fichier supprimé │
                                          │ DB: deletedAt    │
                                          └──────────────────┘
```

**Restauration possible** à tout moment par un admin (sauf destruction confirmée).

---

## 4. Arborescence des dossiers virtuels

### 4.1 Génération automatique

Le `FolderAutoService` crée l'arborescence par année académique.

#### SCOL (Scolarité)
```
Année Académique → SCOL → Processus → Niveau → Parcours → Classe
                                                              │
                                              ┌───────────────┼───────────────┐
                                              │               │               │
                                          Autorisations  Bulletins        PV
                                          Bordereaux     Cartes           Dossiers
                                          Diplômes       Paiements
```

Pour chaque étudiant, un sous-dossier `{MATRICULE}` est créé dans sa classe avec 8 sous-dossiers pré-définis.

#### RH (Ressources Humaines)
```
Année Académique → RH → Processus → Service (Département) → Employé
```

#### FIN (Finances)
```
Année Académique → FIN → Processus → Fournisseur
```

#### GOUV (Gouvernance)
```
Année Académique → GOUV → Processus → Instance
                                     → Conseil d'Administration
                                     → Conseil Académique
                                     → Comité de Gestion
```

#### REC (Recherche)
```
Année Académique → REC → Processus
```

#### PAT (Patrimoine)
```
Année Académique → PAT → Processus → Site
                                   → Campus Principal
                                   → Campus Annexe
                                   → Résidence
```

#### EXT (Documents Externes)
```
Année Académique → EXT → Processus → Partenaire
```

### 4.2 Liste des types de dossiers

| Type | Description |
|---|---|
| `YEAR` | Année académique |
| `DOMAIN` | Domaine documentaire |
| `PROCESS` | Processus générateur |
| `NIVEAU` | Niveau d'étude |
| `CLASSE` | Classe |
| `SERVICE` | Service / Département |
| `EMPLOYE` | Employé |
| `FOURNISSEUR` | Fournisseur |
| `INSTANCE` | Instance de gouvernance |
| `SITE` | Site géographique |
| `MATRICULE` | Dossier étudiant |
| `DOSSIER_ETUDIANT` | Regroupement étudiant |

---

## 5. Types documentaires et domaines

### Domaines (7)

| Code | Libellé | Exemples |
|---|---|---|
| `SCOL` | Scolarité | Relevés, diplômes, PV jury, inscriptions, certificats |
| `RH` | Ressources Humaines | Contrats, bulletins paie, CV, attestations |
| `FIN` | Finances | Factures, quitus, bordereaux |
| `REC` | Recherche | Publications, thèses, rapports |
| `GOUV` | Gouvernance | Délibérations, PV, règlements |
| `PAT` | Patrimoine | Inventaires, bons de commande |
| `EXT` | Documents externes | Conventions, courriers reçus |

### Types documentaires principaux (31)

#### SCOL
| Code | Short | Libellé | Conf. | DUA | Permanent |
|---|---|---|---|---|---|
| `releve_notes` | REL | Relevé de notes | interne | 5 ans | ❌ |
| `diplome` | DIPL | Diplôme | confidentiel | — | ✅ |
| `pv_jury` | PV | Procès-verbal de jury | restreint | — | ✅ |
| `fiche_inscription` | FINS | Fiche d'inscription | confidentiel | 10 ans | ❌ |
| `certificat_scolarite` | CERT | Certificat de scolarité | public | 5 ans | ❌ |
| `attestation_reussite` | AR | Attestation de réussite | public | — | ✅ |
| `convention_stage` | CONV | Convention de stage | interne | 10 ans | ❌ |
| `bulletin` | BULL | Bulletin de notes | restreint | 10 ans | ❌ |
| `dossier_inscription` | DOSS | Dossier d'inscription | confidentiel | 10 ans | ❌ |
| `contrat_formation` | CFORM | Contrat de formation | confidentiel | 10 ans | ❌ |

#### RH
| Code | Short | Libellé | Conf. | DUA | Permanent |
|---|---|---|---|---|---|
| `contrat_travail` | CTR | Contrat de travail | confidentiel | 50 ans | ❌ |
| `bulletin_paie` | BULL | Bulletin de paie | confidentiel | 5 ans | ❌ |
| `cv` | CV | Curriculum vitae | interne | 2 ans | ❌ |
| `attestation_travail` | ATT | Attestation de travail | interne | 5 ans | ❌ |

#### FIN
| Code | Short | Libellé | Conf. | DUA | Permanent |
|---|---|---|---|---|---|
| `facture` | FACT | Facture | interne | 10 ans | ❌ |
| `quitus` | QUIT | Quitus | interne | 10 ans | ❌ |
| `bordereau` | BORD | Bordereau | interne | 10 ans | ❌ |

#### GOUV
| Code | Short | Libellé | Conf. | DUA | Permanent |
|---|---|---|---|---|---|
| `deliberation` | DELIB | Délibération | restreint | — | ✅ |
| `proces_verbal` | PVRB | Procès-verbal | restreint | — | ✅ |
| `reglement_interieur` | REGL | Règlement intérieur | public | — | ✅ |

---

## 6. Conventions de nommage et références

### 6.1 Titre automatique des documents

Format (assemblé par `NamingConventionService.buildDocumentName()`) :

```
{ANNEE}_{DOMAINE}_{PROCESSU}_ {NIVEAU}_{CLASSE}_{MATRICULE}_{TYPE_DOC}
```

Exemple concret :
```
2025-2026_SCOL_INSC_LIC1_L1-A_UST2600001_fiche-inscription
```

Chaque segment est résolu ainsi :

| Segment | Source | Règle |
|---|---|---|
| Année | `anneeAcademiqueId` | `code_annee` → `libelle` (avec `/` → `-`) → ID numérique |
| Domaine | `domainCode` | Utilisé tel quel |
| Processus | `processusGenerateurId` | `processus.code` → 4 premières lettres majuscules du libellé |
| Niveau | `niveauEtudeId` | `niveau.code` en majuscule → 4 premières lettres du libellé |
| Classe | `classeId` | `classe.libelle` (espaces → `-`) → ID numérique |
| Matricule | `matricule` | Utilisé tel quel |
| Type doc | `documentTypeId` | `code` → `shortCode` → `label` normalisé |

### 6.2 Référence unique

Format (généré par `ReferenceService`) :

```
{CODE_DOMAINE}-{SHORT_CODE_TYPE}-{ANNEE}-{SEQUENCE:05d}
```

Exemple :
```
SCOL-DIPL-2026-00147
SCOL-REL-2026-00042
FIN-FACT-2026-00001
```

Le compteur utilise un `UPSERT` atomique sur la table `ged_reference_counters` garanti sans collision.

### 6.3 Processus générateurs

Liste des processus prédéfinis et créés dynamiquement :

| Code | Libellé | Module source | Origine |
|---|---|---|---|
| `PAIE` | Paie | rh | Seed |
| `POINTAGE` | Pointage | rh | Seed |
| `CONTRAT_ENSEIGNANT` | Contrat enseignant | rh | Seed |
| `FACTURE` | Facture fournisseur | comptabilité | Seed |
| `BON_COMMANDE` | Bon de commande | achats | Seed |
| `RECEPTION` | Bon de réception | stock | Seed |
| `INSCRIPTION` | Inscription | inscription | Dynamique |
| `BORDEREAU` | Bordereau de paiement | finance | Dynamique |
| `BULLETIN` | Bulletin de notes | scolarité | Dynamique |
| `DELIBERATION` | Délibération | scolarité | Dynamique |
| `DIPLOME` | Diplôme | scolarité | Dynamique |
| `SCOLARITE_DEMANDE` | Demande de scolarité | scolarité | Dynamique |

---

## 7. Flux détaillé : Inscription d'un étudiant

### Schéma du parcours

```
Étudiant fait une demande d'inscription
           │
           ▼
Dossier déposé via Préinscription
  → Fichier : public/inscription/dossiers/{dossier}.pdf
           │
           ▼
PréInscription validée
  → ArchiveGedService.archiverDocumentInscription()
           │
           ▼
Document GED créé :
  • Domaine      : SCOL
  • Type         : fiche_inscription (confidentiel)
  • Processus    : INSCRIPTION
  • Dossier virt.: SCOL > Inscriptions > Dossiers d'inscription
  • Fichier copié: public/ged/{folderId}/{timestamp}-{random}.pdf
  • Référence    : SCOL-FINS-2026-00001
  • Lifecycle    : courant
  • Lien         : inscriptionDossierId → demande d'inscription
  • Hash SHA-256 : calculé et stocké
           │
           ▼
Étudiant paie les frais
  → Bordereau généré → public/inscription/bordereaux/{bordereau}.pdf
           │
           ▼
ArchiveGedService.archiverBordereau()
  → Document GED :
  • Domaine      : FIN
  • Type         : bordereau (interne)
  • Processus    : BORDEREAU
  • Dossier virt.: FIN > Bordereaux de paiement
  • Référence    : FIN-BORD-2026-00001
  • Lien         : bordereauId → bordereau de paiement
           │
           ▼
Inscription finalisée
  → Dossier étudiant complet dans :
    SCOL/Inscription/{Niveau}/{Parcours}/{Classe}/{MATRICULE}/
      ├── Autorisations/
      ├── Bordereaux/
      ├── Bulletins/
      ├── Cartes/
      ├── Diplômes/
      ├── Dossiers/
      ├── Paiements/
      └── PV/
```

### Code : appel à l'archivage

Depuis `DemandeInscriptionController` (extrait) :
```
// Après validation de la préinscription
ArchiveGedService.archiverDocumentInscription({
  fichierSource: 'public/inscription/dossiers/dossier_123.pdf',
  inscriptionDossierId: 123,
  userId: 1,
  anneeAcademiqueId: 1,
  niveauEtudeId: 5,
  parcoursId: 3,
  classeId: 12,
  matricule: 'UST2600001',
  // ...
});
```

### Stockage physique final

```
public/ged/
└── 5/                          # folderId du dossier étudiant
    └── 1784803340333-460015.pdf   # Fiche d'inscription
```

Et en base de données, le champ `fichier` contient : `5/1784803340333-460015.pdf`

---

## 8. Flux détaillé : Relevé de notes / Bulletin

### Schéma du parcours

```
Enseignant saisit les notes
  → Validation par l'administration
           │
           ▼
Bulletin généré (PDF)
  → stocké localement dans le module bulletins
           │
           ▼
Bulletin publié
  → BulletinController → ArchiveGedService.archiverBulletin()
           │
           ▼
Document GED créé :
  • Domaine      : SCOL
  • Type         : bulletin (restreint) → fallback releve_notes
  • Processus    : BULLETIN
  • Confidentialité : restreint
  • Cycle de vie    : définitif (direct, car publié)
  • Verrouillé   : oui (ne peut plus être modifié)
  • Dossier virt.: SCOL > Bulletins et relevés de notes
  • Titre auto   : "Bulletin - {mention} - {moyenneGenerale}/20"
  • Référence    : SCOL-BULL-2026-00042
  • Lien         : bulletinId → bulletin de notes
           │
           ▼
Consultable par l'étudiant et l'administration
  → accessible via GED (recherche) ou depuis le module scolarité
```

### Stockage physique final

```
public/ged/
└── 12/                          # folderId des bulletins
    └── 1784804000123-842915.pdf    # Bulletin de l'étudiant
```

### Accès

- **Étudiant** : peut voir ses propres bulletins (confidentialité `restreint` → accès via `DocumentAccessGrant`)
- **Administration** : accès à tous les bulletins
- **Enseignant** : accès aux bulletins de ses classes

---

## 9. Flux détaillé : PV de jury / Délibération

### Schéma du parcours

```
Conseil de classe / Jury de délibération
  → Résultats saisis dans le module Délibération
           │
           ▼
Génération du PV (PDF)
  → GenerateurPVService → uploads/pv/pv_deliberation_{id}_{timestamp}.pdf
           │
           ▼
Appel ArchiveGedService.archiverDocumentDeliberation()
           │
           ▼
Document GED créé :
  • Domaine      : SCOL
  • Type         : pv_jury (restreint)
  • Processus    : DÉLIBÉRATION
  • Confidentialité : restreint
  • Cycle de vie    : définitif
  • Verrouillé   : oui
  • Dossier virt.: SCOL > Délibérations et PV de jury
  • Titre auto   : "PV Délibération - {classe} - {session}"
  • Référence    : SCOL-PV-2026-00017
           │
           ▼
Autres PV possibles :
  • GOUV > délibération  → PV du Conseil d'Administration (restreint, permanent)
  • GOUV > proces_verbal → PV du Conseil Académique (restreint, permanent)
```

### Note importante sur l'état actuel

Le `GenerateurPVService` génère bien le PDF sur le disque (`uploads/pv/`), mais **l'appel à `archiverDocumentDeliberation()` n'est pas encore branché** dans `DeliberationController.genererPV()`. Actuellement le PV est téléchargeable via une route dédiée mais pas encore automatiquement versé dans la GED. C'est un point d'intégration à finaliser.

### Stockage physique final (une fois branché)

```
public/ged/
└── 18/                          # folderId des PV de jury
    └── 1784805000123-317502.pdf    # PV de délibération
```

---

## 10. Sécurité, confidentialité et intégrité

### 10.1 Niveaux de confidentialité

| Niveau | Accès | Exemples |
|---|---|---|
| `public` | Tous les rôles | Certificats, attestations, règlements |
| `interne` | Institution, Admin, Enseignant, RH, Caissier, Comptable, Comité | Relevés, conventions, factures |
| `restreint` | Institution, Admin uniquement | PV de jury, délibérations, bulletins |
| `confidentiel` | Admin uniquement | Diplômes, fiches d'inscription, contrats |

### 10.2 Matrice de permissions

La table `ged_role_permissions` définit pour chaque `(confidentiality_level, role)` si l'accès est autorisé. Des `DocumentAccessGrant` permettent des accès exceptionnels avec expiration.

### 10.3 Intégrité des fichiers

- Chaque fichier reçoit un **hash SHA-256** stocké dans `integrityHash`
- À tout moment, une **vérification d'intégrité** peut être demandée (re-calcul du hash et comparaison)
- Un admin peut lancer une **vérification massive** de tous les documents
- La **détection de doublons** se fait par comparaison de hash : refus avec code 409

### 10.4 Chiffrement

- Optionnel, via clé maître AES-256 dans `.env` (`ENCRYPTION_MASTER_KEY`)
- Marqué par `isEncrypted = true` et `encryptionKeyId` tracé
- Téléchargement des documents chiffrés restreint aux admins

### 10.5 Piste d'audit

Toutes les actions sont tracées dans `ged_audit_logs` :
`consultation`, `telechargement`, `creation`, `modification`, `validation`, `archivage`, `marquage_destruction`, `suppression_effective`, `restauration`, `nouvelle_version`, `verrouillage`, `deverrouillage`, `verification_integrite`

---

## 11. Services de stockage supportés

Le système supporte 6 providers configurables via l'UI (`/api/v1/ged/storage/config`) :

| Provider | Description |
|---|---|
| `local` | Stockage sur disque local (défaut) |
| `s3` | Amazon S3 ou compatible |
| `ftp` | Serveur FTP |
| `webdav` | WebDAV |
| `azure` | Azure Blob Storage |
| `gcs` | Google Cloud Storage |

Configuration actuelle (`config/storage.json`) :
```json
{
  "provider": "local",
  "basePath": "public/ged",
  "options": {}
}
```

---

## 12. Schéma récapitulatif

```
                     ┌─────────────────────────────────────┐
                     │         MODULES MÉTIER              │
                     │                                     │
                     │  Inscription ──┐                    │
                     │  Bulletin ─────┤                    │
                     │  Délibération ─┤                    │
                     │  Paie ─────────┤                    │
                     │  Facture ──────┤                    │
                     │  Courrier ─────┤                    │
                     │  Upload manuel ┤                    │
                     └────────────────┼────────────────────┘
                                      │
                                      ▼
                     ┌─────────────────────────────────────┐
                     │      ArchiveGedService              │
                     │   (intégration programmatique)      │
                     └────────────────┬────────────────────┘
                                      │
                                      ▼
                     ┌─────────────────────────────────────┐
                     │      DocumentGedController           │
                     │   + Middleware AuthConfidentiality   │
                     └────────────────┬────────────────────┘
                                      │
                     ┌────────────────┼────────────────────┐
                     │                │                    │
                     ▼                ▼                    ▼
              ┌────────────┐  ┌────────────┐  ┌──────────────────┐
              │   Disque   │  │   Base     │  │   Moteur de      │
              │  physique  │  │ de données │  │   recherche      │
              │ public/ged/│  │ ged_*      │  │   FULLTEXT       │
              │            │  │            │  │                  │
              │ *.pdf/tiff │  │ 15 tables  │  │ titre, référence │
              │ versions/  │  │ ~50 cols   │  │ contenuTexte     │
              │ pdf/       │  │ par doc    │  │ tags, auteur     │
              └────────────┘  └────────────┘  └──────────────────┘
```

### Liens entre tables et disque

```
ged_documents
├── fichier          → public/ged/5/1784803340333-460015.pdf
├── integrityHash    → SHA-256 du fichier
├── domainId         → ged_domains (SCOL, RH, ...)
├── documentTypeId   → ged_document_types (releve_notes, bulletin, ...)
├── processusGenerateurId → ged_processus (INSCRIPTION, BULLETIN, ...)
├── folderId         → ged_folders (arborescence virtuelle)
├── bulletinId       → bulletin (module scolarité)
├── inscriptionDossierId → demande_inscription (module inscription)
├── bordereauId      → bordereau (module finance)
└── parentDocumentId → ged_documents (versioning)
```

---

*Document généré le 27/07/2026 — EasyÉcole GED v2*
