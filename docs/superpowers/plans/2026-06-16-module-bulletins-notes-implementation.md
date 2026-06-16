# Module Bulletins & Relevé de Notes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un module complet de bulletins et relevés de notes, structuré par semestres avec CC/Devoir/Examen, généré et publié par l'institution.

**Architecture:** Backend : nouveau dossier `src/modules/bulletins/` avec modèles, contrôleur et routes. Frontend : nouveau module Angular `bulletins/` avec pages dédiées. Les modèles existants `ListeNoteEvaluation` et `TypeNoteEvaluation` sont enrichis de champs requis (anneeAcademiqueId, categorie).

**Tech Stack:** Node.js/Express + Sequelize/MySQL + Angular 20 standalone + Signals

---

### Phase 1 — Enrichissement des modèles existants

### Task 1: Ajouter `anneeAcademiqueId` à `ListeNoteEvaluation`

- [ ] **Step 1: Modifier le modèle backend**

```typescript
// easy-ecole-backend/src/modules/inscription/models/ListeNoteEvaluation.ts
// Ajouter après le champ commentaire :
  commentaire: {
    type: DataTypes.STRING,
    allowNull: true
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
```

- [ ] **Step 2: Ajouter l'association dans `_associations.ts`**

```typescript
// easy-ecole-backend/src/modules/inscription/models/_associations.ts
// Ajouter après les associations de ListeNoteEvaluation existantes :
  ListeNoteEvaluation.belongsTo(AnneeAcademique, {
    foreignKey: 'anneeAcademiqueId',
    as: 'anneeAcademique'
  });
```

- [ ] **Step 3: Synchroniser le modèle frontend**

```typescript
// easy-ecole-web/src/app/data/modules/inscription/models/ListeNoteEvaluation.model.ts
// Ajouter :
  anneeAcademiqueId?: number
  anneeAcademique?: AnneeAcademique
```

- [ ] **Step 4: Commit**

```bash
git add easy-ecole-backend/src/modules/inscription/models/ListeNoteEvaluation.ts easy-ecole-backend/src/modules/inscription/models/_associations.ts easy-ecole-web/src/app/data/modules/inscription/models/ListeNoteEvaluation.model.ts
git commit -m "feat(notes): add anneeAcademiqueId to ListeNoteEvaluation"
```

### Task 2: Ajouter `categorie` à `TypeNoteEvaluation`

- [ ] **Step 1: Créer un énumérateur partagé**

```typescript
// easy-ecole-backend/src/core/enums/CategorieEvaluation.ts
export enum CategorieEvaluation {
    CC = "controle_continu",
    DEVOIR = "devoir",
    EXAMEN = "examen",
}
```

- [ ] **Step 2: Ajouter le champ au modèle backend**

```typescript
// easy-ecole-backend/src/modules/inscription/models/TypeNoteEvaluation.ts
// Ajouter après description :
  categorie: {
    type: DataTypes.ENUM('controle_continu', 'devoir', 'examen'),
    allowNull: true
  },
```

- [ ] **Step 3: Synchroniser le modèle frontend**

```typescript
// easy-ecole-web/src/app/data/modules/inscription/models/TypeNoteEvaluation.model.ts
// Ajouter :
  categorie?: 'controle_continu' | 'devoir' | 'examen'
```

- [ ] **Step 4: Seed des catégories (optionnel — script)**

```json
// Ajouter dans le seed des types d'évaluation :
{ "libelle": "Interrogation", "categorie": "controle_continu", "poids": 20 },
{ "libelle": "Devoir", "categorie": "devoir", "poids": 30 },
{ "libelle": "Examen", "categorie": "examen", "poids": 50 }
```

- [ ] **Step 5: Commit**

```bash
git add easy-ecole-backend/src/core/enums/CategorieEvaluation.ts easy-ecole-backend/src/modules/inscription/models/TypeNoteEvaluation.ts easy-ecole-web/src/app/data/modules/inscription/models/TypeNoteEvaluation.model.ts
git commit -m "feat(notes): add categorie field to TypeNoteEvaluation"
```

---

### Phase 2 — Module Bulletins (backend)

### Task 3: Créer le modèle `Bulletin`

- [ ] **Step 1: Créer le dossier du module**

```bash
mkdir -p easy-ecole-backend/src/modules/bulletins/models easy-ecole-backend/src/modules/bulletins/controllers easy-ecole-backend/src/modules/bulletins/routers easy-ecole-backend/src/modules/bulletins/validators
```

- [ ] **Step 2: Créer le modèle Bulletin**

```typescript
// easy-ecole-backend/src/modules/bulletins/models/Bulletin.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../core/sequelize';

interface BulletinAttributes {
  id: number;
  anneeAcademiqueId: number;
  semestre: 'semestre1' | 'semestre2';
  cursusApprenantId: number;
  utilisateurId: number;
  classeId: number;
  parcoursId: number;
  niveauEtudeId: number;
  moyenneGenerale: number | null;
  totalCredits: number | null;
  creditsValides: number | null;
  rang: number | null;
  effectifClasse: number | null;
  mention: string | null;
  appreciation: string | null;
  statut: 'brouillon' | 'publie';
  dateGeneration: Date | null;
  datePublication: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface BulletinCreationAttributes extends Optional<BulletinAttributes, 'id' | 'moyenneGenerale' | 'totalCredits' | 'creditsValides' | 'rang' | 'effectifClasse' | 'mention' | 'appreciation' | 'statut' | 'dateGeneration' | 'datePublication' | 'deletedAt'> {}

export class Bulletin extends Model<BulletinAttributes, BulletinCreationAttributes> implements BulletinAttributes {
  declare id: number;
  declare anneeAcademiqueId: number;
  declare semestre: 'semestre1' | 'semestre2';
  declare cursusApprenantId: number;
  declare utilisateurId: number;
  declare classeId: number;
  declare parcoursId: number;
  declare niveauEtudeId: number;
  declare moyenneGenerale: number | null;
  declare totalCredits: number | null;
  declare creditsValides: number | null;
  declare rang: number | null;
  declare effectifClasse: number | null;
  declare mention: string | null;
  declare appreciation: string | null;
  declare statut: 'brouillon' | 'publie';
  declare dateGeneration: Date | null;
  declare datePublication: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;

  static associations = {
    lignesBulletins: 'lignesBulletins',
    anneeAcademique: 'anneeAcademique',
    cursusApprenant: 'cursusApprenant',
    utilisateur: 'utilisateur',
    classe: 'classe',
    parcours: 'parcours',
    niveauEtude: 'niveauEtude',
  } as const;
}

Bulletin.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2'),
    allowNull: false
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  moyenneGenerale: { type: DataTypes.FLOAT, allowNull: true },
  totalCredits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  creditsValides: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  rang: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  effectifClasse: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  mention: { type: DataTypes.STRING(50), allowNull: true },
  appreciation: { type: DataTypes.TEXT, allowNull: true },
  statut: {
    type: DataTypes.ENUM('brouillon', 'publie'),
    allowNull: false,
    defaultValue: 'brouillon'
  },
  dateGeneration: { type: DataTypes.DATE, allowNull: true },
  datePublication: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  tableName: 'ins_bulletins',
  paranoid: true
});
```

- [ ] **Step 3: Commit**

```bash
git add easy-ecole-backend/src/modules/bulletins/models/Bulletin.ts
git commit -m "feat(bulletins): create Bulletin model"
```

### Task 4: Créer le modèle `LigneBulletin`

- [ ] **Step 1: Créer le modèle**

```typescript
// easy-ecole-backend/src/modules/bulletins/models/LigneBulletin.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../core/sequelize';

interface LigneBulletinAttributes {
  id: number;
  bulletinId: number;
  coursId: number;
  moyenneCC: number | null;
  noteDevoir: number | null;
  noteExamen: number | null;
  moyenne: number | null;
  coefficient: number | null;
  rang: number | null;
  appreciation: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LigneBulletinCreationAttributes extends Optional<LigneBulletinAttributes, 'id' | 'moyenneCC' | 'noteDevoir' | 'noteExamen' | 'moyenne' | 'coefficient' | 'rang' | 'appreciation'> {}

export class LigneBulletin extends Model<LigneBulletinAttributes, LigneBulletinCreationAttributes> implements LigneBulletinAttributes {
  declare id: number;
  declare bulletinId: number;
  declare coursId: number;
  declare moyenneCC: number | null;
  declare noteDevoir: number | null;
  declare noteExamen: number | null;
  declare moyenne: number | null;
  declare coefficient: number | null;
  declare rang: number | null;
  declare appreciation: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associations = {
    bulletin: 'bulletin',
    cours: 'cours',
  } as const;
}

LigneBulletin.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  bulletinId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  moyenneCC: { type: DataTypes.FLOAT, allowNull: true },
  noteDevoir: { type: DataTypes.FLOAT, allowNull: true },
  noteExamen: { type: DataTypes.FLOAT, allowNull: true },
  moyenne: { type: DataTypes.FLOAT, allowNull: true },
  coefficient: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  rang: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  appreciation: { type: DataTypes.TEXT, allowNull: true },
}, {
  sequelize,
  tableName: 'ins_lignes_bulletins',
  timestamps: true
});
```

- [ ] **Step 2: Créer les associations du module bulletins**

```typescript
// easy-ecole-backend/src/modules/bulletins/models/_associations.ts
import { Bulletin } from './Bulletin';
import { LigneBulletin } from './LigneBulletin';
import { AnneeAcademique } from '../../inscription/models/AnneeAcademique';
import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { Classe } from '../../inscription/models/Classe';
import { Parcours } from '../../inscription/models/Parcours';
import { NiveauEtude } from '../../inscription/models/NiveauEtude';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { Cours } from '../../inscription/models/Cours';

export function initBulletinAssociations() {
  Bulletin.hasMany(LigneBulletin, {
    foreignKey: 'bulletinId',
    as: 'lignesBulletins'
  });
  LigneBulletin.belongsTo(Bulletin, {
    foreignKey: 'bulletinId',
    as: 'bulletin'
  });

  Bulletin.belongsTo(AnneeAcademique, {
    foreignKey: 'anneeAcademiqueId',
    as: 'anneeAcademique'
  });
  Bulletin.belongsTo(CursusApprenant, {
    foreignKey: 'cursusApprenantId',
    as: 'cursusApprenant'
  });
  Bulletin.belongsTo(Utilisateur, {
    foreignKey: 'utilisateurId',
    as: 'utilisateur'
  });
  Bulletin.belongsTo(Classe, {
    foreignKey: 'classeId',
    as: 'classe'
  });
  Bulletin.belongsTo(Parcours, {
    foreignKey: 'parcoursId',
    as: 'parcours'
  });
  Bulletin.belongsTo(NiveauEtude, {
    foreignKey: 'niveauEtudeId',
    as: 'niveauEtude'
  });

  LigneBulletin.belongsTo(Cours, {
    foreignKey: 'coursId',
    as: 'cours'
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add easy-ecole-backend/src/modules/bulletins/models/LigneBulletin.ts easy-ecole-backend/src/modules/bulletins/models/_associations.ts
git commit -m "feat(bulletins): create LigneBulletin model and module associations"
```

### Task 5: Créer le `BulletinController`

- [ ] **Step 1: Créer le contrôleur**

Le contrôleur gère : génération (POST), liste (GET), détail (GET), mise à jour (PUT), publication (PUT), export PDF (GET).

```typescript
// easy-ecole-backend/src/modules/bulletins/controllers/BulletinController.ts
import { Request, Response } from 'express';
import { Bulletin } from '../models/Bulletin';
import { LigneBulletin } from '../models/LigneBulletin';
import { ListeNoteEvaluation } from '../../inscription/models/ListeNoteEvaluation';
import { TypeNoteEvaluation } from '../../inscription/models/TypeNoteEvaluation';
import { NoteEvaluation } from '../../inscription/models/NoteEvaluation';
import { Cours } from '../../inscription/models/Cours';
import { CoursParticipant } from '../../inscription/models/CoursParticipant';
import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { sequelize } from '../../../core/sequelize';
import { Op } from 'sequelize';

function calculerMention(moyenne: number): string {
  if (moyenne >= 16) return 'Très Bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez Bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
}

export class BulletinController {
  // POST /bulletins/generer
  async generer(req: Request, res: Response) {
    try {
      const { classeId, semestre, anneeAcademiqueId } = req.body;

      if (!classeId || !semestre || !anneeAcademiqueId) {
        return res.status(400).json({ message: 'classeId, semestre, anneeAcademiqueId requis' });
      }

      // Récupérer tous les apprenants de la classe via CursusApprenant
      const cursusList = await CursusApprenant.findAll({
        where: { classeId, anneeAcademiqueId },
        include: [{ association: CursusApprenant.associations.utilisateur }]
      });

      if (!cursusList.length) {
        return res.status(404).json({ message: 'Aucun apprenant trouvé dans cette classe' });
      }

      // Récupérer les cours de cette classe pour ce semestre
      const coursList = await Cours.findAll({
        where: { classeId, semestre },
        include: [
          { association: Cours.associations.parcours },
          { association: Cours.associations.niveauEtude }
        ]
      });

      if (!coursList.length) {
        return res.status(404).json({ message: 'Aucun cours trouvé pour ce semestre' });
      }

      const bulletinsCrees: number[] = [];

      for (const cursus of cursusList) {
        // Vérifier si un bulletin existe déjà
        const existant = await Bulletin.findOne({
          where: { cursusApprenantId: cursus.id, semestre, anneeAcademiqueId }
        });
        if (existant) {
          // Ne pas recréer, mais on continue
          continue;
        }

        const lignesBulletin: Array<{
          coursId: number;
          moyenneCC: number | null;
          noteDevoir: number | null;
          noteExamen: number | null;
          moyenne: number;
          coefficient: number | null;
        }> = [];

        for (const cours of coursList) {
          const coursParticipant = await CoursParticipant.findOne({
            where: { coursId: cours.id, cursusApprenantId: cursus.id }
          });

          if (!coursParticipant) continue;

          // Récupérer toutes les évaluations pour ce cours + année
          const listesEval = await ListeNoteEvaluation.findAll({
            where: { coursId: cours.id, anneeAcademiqueId },
            include: [
              { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
              {
                association: ListeNoteEvaluation.associations.notesEvaluation,
                where: { coursParticipantId: coursParticipant.id },
                required: false
              }
            ]
          });

          let notesCC: number[] = [];
          let noteDevoir: number | null = null;
          let noteExamen: number | null = null;

          for (const evalList of listesEval) {
            if (evalList.notesEvaluation?.length) {
              const note = evalList.notesEvaluation[0].note;
              if (note == null) continue;

              const categorie = (evalList as any).typeNoteEvaluation?.categorie;
              if (categorie === 'devoir') {
                noteDevoir = note;
              } else if (categorie === 'examen') {
                noteExamen = note;
              } else {
                // CC ou non catégorisé
                notesCC.push(note);
              }
            }
          }

          const moyenneCC = notesCC.length ? notesCC.reduce((a, b) => a + b, 0) / notesCC.length : null;
          const poidsCC = moyenneCC != null ? 0.2 : 0;
          const poidsDevoir = noteDevoir != null ? 0.3 : 0;
          const poidsExamen = noteExamen != null ? 0.5 : 0;
          const poidsTotal = poidsCC + poidsDevoir + poidsExamen;

          let moyenne = 0;
          if (poidsTotal > 0) {
            moyenne = (
              (moyenneCC ?? 0) * poidsCC +
              (noteDevoir ?? 0) * poidsDevoir +
              (noteExamen ?? 0) * poidsExamen
            ) / poidsTotal;
            moyenne = Math.round(moyenne * 100) / 100;
          }

          lignesBulletin.push({
            coursId: cours.id,
            moyenneCC,
            noteDevoir,
            noteExamen,
            moyenne,
            coefficient: cours.credit ?? null
          });
        }

        // Calculer la moyenne générale pondérée
        let sommeNotesCoef = 0;
        let sommeCoefs = 0;
        for (const l of lignesBulletin) {
          if (l.coefficient) {
            sommeNotesCoef += l.moyenne * l.coefficient;
            sommeCoefs += l.coefficient;
          }
        }
        const moyenneGenerale = sommeCoefs > 0
          ? Math.round((sommeNotesCoef / sommeCoefs) * 100) / 100
          : null;

        const bulletin = await Bulletin.create({
          anneeAcademiqueId,
          semestre,
          cursusApprenantId: cursus.id,
          utilisateurId: cursus.utilisateurId,
          classeId,
          parcoursId: coursList[0].parcoursId,
          niveauEtudeId: coursList[0]?.niveauEtudeId,
          moyenneGenerale,
          totalCredits: sommeCoefs,
          creditsValides: null,
          statut: 'brouillon',
          dateGeneration: new Date(),
        });

        // Créer les lignes
        for (const l of lignesBulletin) {
          await LigneBulletin.create({
            bulletinId: bulletin.id,
            coursId: l.coursId,
            moyenneCC: l.moyenneCC,
            noteDevoir: l.noteDevoir,
            noteExamen: l.noteExamen,
            moyenne: l.moyenne,
            coefficient: l.coefficient,
          });
        }

        bulletinsCrees.push(bulletin.id);
      }

      const bulletins = await Bulletin.findAll({
        where: { id: { [Op.in]: bulletinsCrees } },
        include: [{ association: Bulletin.associations.lignesBulletins }]
      });

      // Calculer les rangs après génération de tous les bulletins
      await this.calculerRangs(classeId, semestre, anneeAcademiqueId);

      return res.status(201).json(bulletins);
    } catch (error) {
      console.error('Erreur génération bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la génération' });
    }
  }

  private async calculerRangs(classeId: number, semestre: string, anneeAcademiqueId: number) {
    const bulletins = await Bulletin.findAll({
      where: { classeId, semestre, anneeAcademiqueId, statut: 'brouillon' },
      order: [['moyenneGenerale', 'DESC']]
    });
    const effectif = bulletins.length;
    for (let i = 0; i < bulletins.length; i++) {
      await bulletins[i].update({
        rang: i + 1,
        effectifClasse: effectif,
        mention: bulletins[i].moyenneGenerale != null
          ? calculerMention(bulletins[i].moyenneGenerale!)
          : null
      });
    }
  }

  // GET /bulletins
  async getAll(req: Request, res: Response) {
    try {
      const { classeId, semestre, anneeAcademiqueId, statut } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (semestre) where.semestre = semestre;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (statut) where.statut = statut;

      const bulletins = await Bulletin.findAll({
        where,
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.anneeAcademique },
          { association: Bulletin.associations.lignesBulletins }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.json(bulletins);
    } catch (error) {
      console.error('Erreur liste bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  // GET /bulletins/:id
  async getOne(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id, {
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.parcours },
          { association: Bulletin.associations.niveauEtude },
          { association: Bulletin.associations.anneeAcademique },
          {
            association: Bulletin.associations.lignesBulletins,
            include: [{ association: LigneBulletin.associations.cours }]
          }
        ]
      });
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur détail bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  // PUT /bulletins/:id
  async update(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });

      if (bulletin.statut === 'publie') {
        return res.status(400).json({ message: 'Impossible de modifier un bulletin publié' });
      }

      const { appreciation } = req.body;
      if (appreciation !== undefined) {
        await bulletin.update({ appreciation });
      }

      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur mise à jour bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }

  // PUT /bulletins/:id/publier
  async publier(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });
      if (bulletin.statut === 'publie') return res.status(400).json({ message: 'Déjà publié' });

      await bulletin.update({
        statut: 'publie',
        datePublication: new Date()
      });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur publication bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la publication' });
    }
  }

  // GET /bulletins/mon-releve
  async monReleve(req: Request, res: Response) {
    try {
      const utilisateurId = (req as any).utilisateurId;
      if (!utilisateurId) return res.status(401).json({ message: 'Non authentifié' });

      const bulletin = await Bulletin.findOne({
        where: { utilisateurId, statut: 'publie' },
        include: [
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.anneeAcademique },
          {
            association: Bulletin.associations.lignesBulletins,
            include: [{ association: LigneBulletin.associations.cours }]
          }
        ],
        order: [['datePublication', 'DESC']]
      });
      if (!bulletin) return res.status(404).json({ message: 'Aucun bulletin publié trouvé' });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur relevé:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add easy-ecole-backend/src/modules/bulletins/controllers/BulletinController.ts
git commit -m "feat(bulletins): create BulletinController with CRUD + generation + publication"
```

### Task 6: Créer le `BulletinRouter` et enregistrer le module

- [ ] **Step 1: Créer le router**

```typescript
// easy-ecole-backend/src/modules/bulletins/routers/BulletinRouter.ts
import { Router } from 'express';
import { BulletinController } from '../controllers/BulletinController';
import { AuthEnseignant } from '../../auth/middlewares/enseignantAuth';
import { AuthInstitution } from '../../auth/middlewares/institutionAuth';

const router = Router();
const controller = new BulletinController();

router.post('/bulletins/generer', AuthInstitution, controller.generer);
router.get('/bulletins', AuthEnseignant, controller.getAll);
router.get('/bulletins/mon-releve', AuthEnseignant, controller.monReleve);
router.get('/bulletins/:id', AuthEnseignant, controller.getOne);
router.put('/bulletins/:id', AuthInstitution, controller.update);
router.put('/bulletins/:id/publier', AuthInstitution, controller.publier);

export default router;
```

- [ ] **Step 2: Enregistrer le router dans le module inscription principal**

```typescript
// easy-ecole-backend/src/modules/inscription/InscriptionModule.ts (ou fichier équivalent)
// Ajouter :
import bulletinRouter from '../bulletins/routers/BulletinRouter';
// ...
router.use(bulletinRouter);
```

- [ ] **Step 3: Appeler `initBulletinAssociations` au démarrage**

```typescript
// easy-ecole-backend/src/modules/inscription/models/_associations.ts
// À la fin, ajouter :
import { initBulletinAssociations } from '../../bulletins/models/_associations';
// ...
initBulletinAssociations();
```

- [ ] **Step 4: Commit**

```bash
git add easy-ecole-backend/src/modules/bulletins/routers/BulletinRouter.ts easy-ecole-backend/src/modules/inscription/InscriptionModule.ts easy-ecole-backend/src/modules/inscription/models/_associations.ts
git commit -m "feat(bulletins): register bulletin routes and associations"
```

---

### Phase 3 — Module Bulletins (frontend)

### Task 7: Créer le module Angular `bulletins`

- [ ] **Step 1: Créer le module et le routing**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/bulletins-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';

const routes: Routes = [
  { path: '', component: ListeBulletinsPageComponent },
  { path: 'generer', component: GenererBulletinsPageComponent },
  { path: ':id', component: DetailBulletinPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BulletinsRoutingModule {}
```

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/bulletins.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BulletinsRoutingModule } from './bulletins-routing.module';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';

@NgModule({
  declarations: [
    ListeBulletinsPageComponent,
    GenererBulletinsPageComponent,
    DetailBulletinPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BulletinsRoutingModule
  ]
})
export class BulletinsModule {}
```

- [ ] **Step 2: Ajouter la route dans le routing principal**

```typescript
// easy-ecole-web/src/app/features/modules/cours/cours-routing.module.ts
// OU fichier de routing principal :
  { path: 'bulletins', loadChildren: () => import('./modules/bulletins/bulletins.module').then(m => m.BulletinsModule) }
```

- [ ] **Step 3: Créer le service frontend**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/services/bulletin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BulletinService {
  private apiUrl = `${environment.apiUrl}/inscription/bulletins`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  generer(classeId: number, semestre: string, anneeAcademiqueId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/generer`, { classeId, semestre, anneeAcademiqueId });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  publier(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/publier`, {});
  }

  monReleve(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mon-releve`);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add easy-ecole-web/src/app/features/modules/bulletins/ easy-ecole-web/src/app/features/modules/cours/cours-routing.module.ts
git commit -m "feat(bulletins): create Angular module with routing and service"
```

### Task 8: Créer la page `liste-bulletins-page`

- [ ] **Step 1: Créer le composant**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/pages/liste-bulletins-page/liste-bulletins-page.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-liste-bulletins-page',
  templateUrl: './liste-bulletins-page.component.html',
  styleUrls: ['./liste-bulletins-page.component.scss']
})
export class ListeBulletinsPageComponent implements OnInit {
  bulletins = signal<any[]>([]);
  loading = signal(false);
  filtres = { classeId: '', semestre: '', anneeAcademiqueId: '', statut: '' };

  constructor(private bulletinService: BulletinService) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.loading.set(true);
    this.bulletinService.getAll(this.filtres).subscribe({
      next: (data) => this.bulletins.set(data),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }
}
```

- [ ] **Step 2: Créer le template**

```html
<div class="page-header">
  <h1>Bulletins de notes</h1>
  <a routerLink="/bulletins/generer" class="btn btn-primary">+ Générer</a>
</div>

<div class="filters">
  <select [(ngModel)]="filtres.anneeAcademiqueId" (change)="charger()">
    <option value="">Année scolaire</option>
  </select>
  <select [(ngModel)]="filtres.semestre" (change)="charger()">
    <option value="">Semestre</option>
    <option value="semestre1">Semestre 1</option>
    <option value="semestre2">Semestre 2</option>
  </select>
  <select [(ngModel)]="filtres.classeId" (change)="charger()">
    <option value="">Classe</option>
  </select>
  <select [(ngModel)]="filtres.statut" (change)="charger()">
    <option value="">Tous</option>
    <option value="brouillon">Brouillon</option>
    <option value="publie">Publié</option>
  </select>
</div>

<table class="table">
  <thead>
    <tr>
      <th>Élève</th>
      <th>Classe</th>
      <th>Semestre</th>
      <th>Moy. Gén.</th>
      <th>Mention</th>
      <th>Rang</th>
      <th>Statut</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    @for (b of bulletins(); track b.id) {
      <tr>
        <td>{{ b.utilisateur?.nom }} {{ b.utilisateur?.prenoms }}</td>
        <td>{{ b.classe?.libelle }}</td>
        <td>{{ b.semestre === 'semestre1' ? 'S1' : 'S2' }}</td>
        <td>{{ b.moyenneGenerale != null ? b.moyenneGenerale + '/20' : '-' }}</td>
        <td><span class="mention" [class]="b.mention?.toLowerCase().replace(' ', '-')">{{ b.mention || '-' }}</span></td>
        <td>{{ b.rang ? b.rang + '/' + b.effectifClasse : '-' }}</td>
        <td><span class="badge" [class.badge-warning]="b.statut==='brouillon'" [class.badge-success]="b.statut==='publie'">{{ b.statut }}</span></td>
        <td>
          <a [routerLink]="b.id">Voir</a>
        </td>
      </tr>
    } @empty {
      <tr><td colspan="8">Aucun bulletin</td></tr>
    }
  </tbody>
</table>
```

- [ ] **Step 3: Commit**

```bash
git add easy-ecole-web/src/app/features/modules/bulletins/pages/liste-bulletins-page/
git commit -m "feat(bulletins): create liste-bulletins-page with filters"
```

### Task 9: Créer la page `generer-bulletins-page`

- [ ] **Step 1: Créer le composant (formulaire wizard)**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/pages/generer-bulletins-page/generer-bulletins-page.component.ts
import { Component, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-generer-bulletins-page',
  templateUrl: './generer-bulletins-page.component.html',
  styleUrls: ['./generer-bulletins-page.component.scss']
})
export class GenererBulletinsPageComponent {
  anneeAcademiqueId = signal<number | null>(null);
  semestre = signal<string>('');
  classeId = signal<number | null>(null);
  loading = signal(false);
  resultat = signal<any[] | null>(null);
  erreur = signal<string | null>(null);

  constructor(private bulletinService: BulletinService) {}

  generer() {
    if (!this.anneeAcademiqueId() || !this.semestre() || !this.classeId()) return;
    this.loading.set(true);
    this.erreur.set(null);
    this.resultat.set(null);

    this.bulletinService.generer(this.classeId()!, this.semestre()!, this.anneeAcademiqueId()!).subscribe({
      next: (data) => this.resultat.set(data),
      error: (err) => this.erreur.set(err.error?.message || 'Erreur de génération'),
      complete: () => this.loading.set(false)
    });
  }
}
```

```html
<div class="page-header">
  <h1>Générer les bulletins</h1>
</div>

<div class="card">
  <div class="card-body">
    <div class="form-group">
      <label>Année académique</label>
      <select class="form-control" [(ngModel)]="anneeAcademiqueId">
        <option [value]="null">Sélectionner...</option>
      </select>
    </div>
    <div class="form-group">
      <label>Semestre</label>
      <select class="form-control" [(ngModel)]="semestre">
        <option value="">Sélectionner...</option>
        <option value="semestre1">Semestre 1</option>
        <option value="semestre2">Semestre 2</option>
      </select>
    </div>
    <div class="form-group">
      <label>Classe</label>
      <select class="form-control" [(ngModel)]="classeId">
        <option [value]="null">Sélectionner...</option>
      </select>
    </div>
    <button class="btn btn-primary" (click)="generer()" [disabled]="!anneeAcademiqueId() || !semestre() || !classeId() || loading()">
      {{ loading() ? 'Génération...' : 'Générer les bulletins' }}
    </button>
  </div>
</div>

@if (resultat(); as bulletins) {
  <div class="alert alert-success mt-3">{{ bulletins.length }} bulletin(s) créé(s)</div>
  <a routerLink="/bulletins" class="btn btn-outline-primary">Voir les bulletins</a>
}

@if (erreur(); as msg) {
  <div class="alert alert-danger mt-3">{{ msg }}</div>
}
```

- [ ] **Step 2: Commit**

```bash
git add easy-ecole-web/src/app/features/modules/bulletins/pages/generer-bulletins-page/
git commit -m "feat(bulletins): create generer-bulletins-page"
```

### Task 10: Créer la page `detail-bulletin-page`

- [ ] **Step 1: Créer le composant (vue imprimable)**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/pages/detail-bulletin-page/detail-bulletin-page.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-detail-bulletin-page',
  templateUrl: './detail-bulletin-page.component.html',
  styleUrls: ['./detail-bulletin-page.component.scss']
})
export class DetailBulletinPageComponent implements OnInit {
  bulletin = signal<any | null>(null);
  loading = signal(false);
  appreciation = signal('');

  constructor(
    private route: ActivatedRoute,
    private bulletinService: BulletinService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) this.charger(id);
  }

  charger(id: number) {
    this.loading.set(true);
    this.bulletinService.getOne(id).subscribe({
      next: (data) => {
        this.bulletin.set(data);
        this.appreciation.set(data.appreciation || '');
      },
      complete: () => this.loading.set(false)
    });
  }

  sauvegarderAppreciation() {
    const id = this.bulletin()?.id;
    if (!id) return;
    this.bulletinService.update(id, { appreciation: this.appreciation() }).subscribe({
      next: (data) => this.bulletin.set(data)
    });
  }

  publier() {
    const id = this.bulletin()?.id;
    if (!id) return;
    if (!confirm('Publier ce bulletin ? Il sera figé.')) return;
    this.bulletinService.publier(id).subscribe({
      next: (data) => this.bulletin.set(data)
    });
  }

  imprimer() {
    window.print();
  }
}
```

```html
@if (bulletin(); as b) {
  <div class="page-actions no-print">
    <button class="btn btn-outline-primary" (click)="imprimer()">🖨 Imprimer</button>
    @if (b.statut === 'brouillon') {
      <button class="btn btn-success" (click)="publier()">📢 Publier</button>
    }
  </div>

  <div class="bulletin-print">
    <!-- Header -->
    <div class="bulletin-header">
      <h2>ÉCOLE SUPÉRIEURE</h2>
      <p>{{ b.anneeAcademique?.libelle }} | {{ b.semestre === 'semestre1' ? 'Semestre 1' : 'Semestre 2' }}</p>
      <p>{{ b.classe?.libelle }} — {{ b.parcours?.titre }}</p>
    </div>

    <div class="bulletin-eleve">
      <h3>{{ b.utilisateur?.nom }} {{ b.utilisateur?.prenoms }}</h3>
    </div>

    <!-- Notes table -->
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Matières</th>
          <th>CC</th>
          <th>Devoir</th>
          <th>Examen</th>
          <th>Moyenne</th>
          <th>Coef</th>
          <th>Mention</th>
        </tr>
      </thead>
      <tbody>
        @for (l of b.lignesBulletins; track l.id) {
          <tr>
            <td>{{ l.cours?.intitule }}</td>
            <td class="text-center">{{ l.moyenneCC != null ? l.moyenneCC : '-' }}</td>
            <td class="text-center">{{ l.noteDevoir != null ? l.noteDevoir : '-' }}</td>
            <td class="text-center">{{ l.noteExamen != null ? l.noteExamen : '-' }}</td>
            <td class="text-center"><strong>{{ l.moyenne != null ? l.moyenne + '/20' : '-' }}</strong></td>
            <td class="text-center">{{ l.coefficient || '-' }}</td>
            <td class="text-center">{{ l.moyenne != null ? (l.moyenne >= 10 ? 'Validé' : 'Non validé') : '-' }}</td>
          </tr>
        }
      </tbody>
    </table>

    <!-- Footer -->
    <div class="bulletin-footer">
      <div class="row">
        <div class="col"><strong>Moyenne Générale :</strong> {{ b.moyenneGenerale != null ? b.moyenneGenerale + '/20' : '-' }}</div>
        <div class="col"><strong>Mention :</strong> {{ b.mention || '-' }}</div>
        <div class="col"><strong>Rang :</strong> {{ b.rang ? b.rang + '/' + b.effectifClasse : '-' }}</div>
        <div class="col"><strong>Crédits :</strong> {{ b.creditsValides || '-' }}/{{ b.totalCredits || '-' }}</div>
      </div>

      @if (b.statut === 'brouillon') {
        <div class="form-group mt-3">
          <label>Appréciation</label>
          <textarea class="form-control" [(ngModel)]="appreciation" rows="2"></textarea>
          <button class="btn btn-sm btn-outline-secondary mt-1" (click)="sauvegarderAppreciation()">Sauvegarder</button>
        </div>
      } @else {
        @if (b.appreciation) {
          <p class="mt-3"><strong>Appréciation :</strong> {{ b.appreciation }}</p>
        }
      }

      <div class="signatures mt-4">
        <div class="signature-box">Signature Enseignant<br><div class="sig-line"></div></div>
        <div class="signature-box">Signature Chef d'Établissement<br><div class="sig-line"></div></div>
      </div>
    </div>
  </div>
}
```

- [ ] **Step 2: Ajouter le style SCSS**

```scss
// easy-ecole-web/src/app/features/modules/bulletins/pages/detail-bulletin-page/detail-bulletin-page.component.scss
.bulletin-print {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.bulletin-header {
  text-align: center;
  border-bottom: 2px solid #000;
  margin-bottom: 20px;
  padding-bottom: 10px;
}
.bulletin-eleve {
  margin-bottom: 20px;
  font-size: 1.2em;
}
.signatures {
  display: flex;
  justify-content: space-between;
}
.signature-box {
  text-align: center;
  width: 200px;
}
.sig-line {
  border-bottom: 1px solid #000;
  height: 40px;
  margin-top: 5px;
}
@media print {
  .no-print { display: none !important; }
  .bulletin-print { max-width: 100%; }
}
```

- [ ] **Step 3: Commit**

```bash
git add easy-ecole-web/src/app/features/modules/bulletins/pages/detail-bulletin-page/
git commit -m "feat(bulletins): create detail-bulletin-page with print view"
```

### Task 11: Ajouter la rubrique Bulletins au menu latéral

- [ ] **Step 1: Modifier le menu**

```html
<!-- easy-ecole-web/src/app/shared/components/.../sidebar.component.html -->
<!-- Ajouter après la section Cours/Notes existante : -->
<li class="nav-section">BULLETINS</li>
<li>
  <a routerLink="/bulletins" routerLinkActive="active">
    <span class="icon">📊</span>
    <span class="label">Tous les bulletins</span>
  </a>
</li>
<li>
  <a routerLink="/bulletins/generer" routerLinkActive="active">
    <span class="icon">⚙️</span>
    <span class="label">Générer</span>
  </a>
</li>
```

- [ ] **Step 2: Commit**

```bash
git add easy-ecole-web/src/app/shared/components/...
git commit -m "feat(bulletins): add bulletins menu items to sidebar"
```

---

### Phase 4 — Rélevé étudiant

### Task 12: Créer la page `mon-releve-page`

- [ ] **Step 1: Ajouter la route mon-releve**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/bulletins-routing.module.ts
// Ajouter dans routes :
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';
// ...
  { path: 'mon-releve', component: MonRelevePageComponent },
```

- [ ] **Step 2: Créer le composant**

```typescript
// easy-ecole-web/src/app/features/modules/bulletins/pages/mon-releve-page/mon-releve-page.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-mon-releve-page',
  templateUrl: './mon-releve-page.component.html',
  styleUrls: ['./mon-releve-page.component.scss']
})
export class MonRelevePageComponent implements OnInit {
  releve = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private bulletinService: BulletinService) {}

  ngOnInit() {
    this.loading.set(true);
    this.bulletinService.monReleve().subscribe({
      next: (data) => this.releve.set(data),
      error: (err) => this.error.set(err.error?.message || 'Aucun relevé disponible'),
      complete: () => this.loading.set(false)
    });
  }
}
```

```html
<div class="page-header">
  <h1>Mon relevé de notes</h1>
</div>

@if (loading()) {
  <p>Chargement...</p>
}

@if (error(); as msg) {
  <div class="alert alert-info">{{ msg }}</div>
}

@if (releve(); as r) {
  <div class="card">
    <div class="card-body">
      <div class="text-center mb-3">
        <h3>{{ r.anneeAcademique?.libelle }} — {{ r.semestre === 'semestre1' ? 'Semestre 1' : 'Semestre 2' }}</h3>
        <p class="text-muted">{{ r.classe?.libelle }}</p>
      </div>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Matière</th>
            <th>Moyenne</th>
            <th>Coef</th>
            <th>Crédit</th>
          </tr>
        </thead>
        <tbody>
          @for (l of r.lignesBulletins; track l.id) {
            <tr>
              <td>{{ l.cours?.intitule }}</td>
              <td class="text-center"><strong>{{ l.moyenne != null ? l.moyenne + '/20' : '-' }}</strong></td>
              <td class="text-center">{{ l.coefficient || '-' }}</td>
              <td class="text-center">{{ l.moyenne != null && l.moyenne >= 10 ? 'Validé' : '-' }}</td>
            </tr>
          }
        </tbody>
      </table>

      <div class="row mt-3">
        <div class="col"><strong>Moyenne Générale :</strong> {{ r.moyenneGenerale }}/20</div>
        <div class="col"><strong>Mention :</strong> {{ r.mention }}</div>
        <div class="col"><strong>Rang :</strong> {{ r.rang }}/{{ r.effectifClasse }}</div>
      </div>
    </div>
  </div>

  <button class="btn btn-outline-primary mt-2" (click)="window.print()">Imprimer</button>
}
```

- [ ] **Step 3: Commit**

```bash
git add easy-ecole-web/src/app/features/modules/bulletins/pages/mon-releve-page/ easy-ecole-web/src/app/features/modules/bulletins/bulletins-routing.module.ts
git commit -m "feat(bulletins): create mon-releve-page for students"
```

---

### Verification

### Task 13: Vérification backend

- [ ] **Step 1: Vérifier la compilation**

```bash
cd easy-ecole-backend && npx tsc --noEmit
```

Expected: Pas d'erreur TypeScript.

- [ ] **Step 2: Vérifier les routes**

```bash
curl -s http://localhost:3000/api/v1/inscription/bulletins | head -5
```

Expected: Retourne un tableau JSON (vide ou avec données).

### Task 14: Vérification frontend

- [ ] **Step 1: Vérifier la compilation**

```bash
cd easy-ecole-web && npx tsc --noEmit
```

Expected: Pas d'erreur TypeScript.

- [ ] **Step 2: Vérifier les routes**

```bash
curl -s http://localhost:4200/bulletins | head -5
```

Expected: Retourne le HTML de la page bulletins.
