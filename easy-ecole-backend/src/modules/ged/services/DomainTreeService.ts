import { Op } from "sequelize";
import Domain from "../models/Domain";
import Folder from "../models/Folder";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { Session } from "../../inscription/models/Session";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Parcours } from "../../inscription/models/Parcours";
import { Classe } from "../../inscription/models/Classe";
import { DocumentGed } from "../models/DocumentGed";
import { RhDepartement } from "../../rh/models/RhDepartement";
import { RhEmploye } from "../../rh/models/RhEmploye";
import { Fournisseur } from "../../achats/models/Fournisseur";

export class DomainTreeService {
  static async getTree(): Promise<any[]> {
    const domains = await Domain.findAll({
      include: [{
        model: Folder,
        as: 'folders',
        required: false,
        where: { parentId: { [Op.is]: null } as any }
      }]
    });
    const annees = await AnneeAcademique.findAll({ order: [['libelle', 'DESC']] });
    const tree: any[] = [];

    for (const domain of domains) {
      const domainNode: any = {
        id: `domain-${domain.id}`,
        label: domain.label,
        type: 'domain',
        domainId: domain.id,
        data: { docCount: 0 },
        children: []
      };

      switch (domain.code) {
        case 'SCOL':
          await this.buildScolTree(domainNode, domain, annees);
          break;
        case 'RH':
          await this.buildRhTree(domainNode, domain, annees);
          break;
        case 'FIN':
        case 'PAT':
          await this.buildFinanceTree(domainNode, domain, annees);
          break;
        case 'EXT':
          await this.buildExtTree(domainNode, domain, annees);
          break;
        default:
          await this.buildGenericTree(domainNode, domain);
          break;
      }

      tree.push(domainNode);
    }
    return tree;
  }

  private static async buildScolTree(domainNode: any, domain: any, annees: any[]) {
    for (const annee of annees) {
      const anneeDocCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id }
      });
      const sessions = await Session.findAll({
        where: { anneeAcademiqueId: annee.id },
        attributes: ['niveauEtudeId'],
        group: ['niveauEtudeId']
      });
      const niveauIds = sessions.map((s: any) => s.niveauEtudeId).filter(Boolean);
      if (niveauIds.length === 0) {
        if (anneeDocCount > 0) {
          (domainNode.children as any[]).push(this.makeAnneeNode(annee, domain.id, anneeDocCount));
        }
        continue;
      }
      const niveaux = await NiveauEtude.findAll({ where: { id: { [Op.in]: niveauIds } } });
      const anneeNode: any = this.makeAnneeNode(annee, domain.id, anneeDocCount);
      for (const niveau of niveaux) {
        const niveauDocCount = await DocumentGed.count({
          where: { niveauEtudeId: niveau.id, anneeAcademiqueId: annee.id, domainId: domain.id }
        });
        const parcours = await Parcours.findAll({ where: { niveauEtudeId: niveau.id } });
        const niveauNode: any = this.makeNiveauNode(niveau, annee, domain.id, niveauDocCount);
        for (const parc of parcours) {
          const parcDocCount = await DocumentGed.count({
            where: { parcoursId: parc.id, niveauEtudeId: niveau.id, anneeAcademiqueId: annee.id, domainId: domain.id }
          });
          const classes = await Classe.findAll({ where: { niveauEtudeId: niveau.id } });
          const parcNode: any = this.makeParcoursNode(parc, niveau, annee, domain.id, parcDocCount);
          for (const cls of classes) {
            const clsDocCount = await DocumentGed.count({
              where: { classeId: cls.id, parcoursId: parc.id, niveauEtudeId: niveau.id, anneeAcademiqueId: annee.id, domainId: domain.id }
            });
            if (clsDocCount === 0) continue;
            (parcNode.children as any[]).push({
              id: `classe-${cls.id}-annee-${annee.id}`,
              label: cls.libelle, type: 'classe', classeId: cls.id,
              parcoursId: parc.id, niveauId: niveau.id, anneeId: annee.id,
              domainId: domain.id, data: { docCount: clsDocCount }, children: [], leaf: true
            });
          }
          if ((parcNode.children as any[]).length > 0 || parcDocCount > 0) (niveauNode.children as any[]).push(parcNode);
        }
        if (parcours.length === 0 && niveauDocCount > 0) { niveauNode.leaf = true; (anneeNode.children as any[]).push(niveauNode); continue; }
        if ((niveauNode.children as any[]).length > 0 || niveauDocCount > 0) (anneeNode.children as any[]).push(niveauNode);
      }
      if ((anneeNode.children as any[]).length > 0 || anneeDocCount > 0) (domainNode.children as any[]).push(anneeNode);
    }
  }

  private static async buildRhTree(domainNode: any, domain: any, annees: any[]) {
    const departements = await RhDepartement.findAll({ order: [['nom', 'ASC']] }) || [];
    for (const annee of annees) {
      const anneeDocCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id }
      });
      if (anneeDocCount === 0 && departements.length === 0) continue;
      const anneeNode: any = this.makeAnneeNode(annee, domain.id, anneeDocCount);
      for (const dept of departements) {
        const deptDocCount = await DocumentGed.count({
          where: { anneeAcademiqueId: annee.id, domainId: domain.id }
        });
        const employes = await (RhEmploye as any).findAll({
          where: { departementId: dept.id },
          order: [['id', 'ASC']]
        }) as any[] || [];
        const deptNode: any = {
          id: `rh-dept-${dept.id}-annee-${annee.id}`,
          label: dept.nom, type: 'departement', departementId: dept.id,
          anneeId: annee.id, domainId: domain.id,
          data: { docCount: deptDocCount }, children: []
        };
        for (const emp of employes) {
          const empDocCount = await DocumentGed.count({
            where: { anneeAcademiqueId: annee.id, domainId: domain.id }
          });
          if (empDocCount === 0) continue;
          (deptNode.children as any[]).push({
            id: `rh-employe-${emp.id}-annee-${annee.id}`,
            label: emp.nom || `Employé #${emp.id}`,
            type: 'employe', employeId: emp.id,
            departementId: dept.id, anneeId: annee.id, domainId: domain.id,
            data: { docCount: empDocCount }, children: [], leaf: true
          });
        }
        if ((deptNode.children as any[]).length > 0 || deptDocCount > 0) (anneeNode.children as any[]).push(deptNode);
      }
      if ((anneeNode.children as any[]).length > 0) (domainNode.children as any[]).push(anneeNode);
    }
  }

  private static async buildFinanceTree(domainNode: any, domain: any, annees: any[]) {
    const fournisseurs = await Fournisseur.findAll({ order: [['nom', 'ASC']] }) || [];
    for (const annee of annees) {
      const anneeDocCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id }
      });
      if (anneeDocCount === 0 && fournisseurs.length === 0) continue;
      const anneeNode: any = this.makeAnneeNode(annee, domain.id, anneeDocCount);
      for (const four of fournisseurs) {
        const fourDocCount = await DocumentGed.count({
          where: { anneeAcademiqueId: annee.id, domainId: domain.id }
        });
        if (fourDocCount === 0) continue;
        (anneeNode.children as any[]).push({
          id: `fournisseur-${four.id}-annee-${annee.id}`,
          label: four.nom, type: 'fournisseur', fournisseurId: four.id,
          anneeId: annee.id, domainId: domain.id,
          data: { docCount: fourDocCount }, children: [], leaf: true
        });
      }
      if ((anneeNode.children as any[]).length > 0) (domainNode.children as any[]).push(anneeNode);
    }
  }

  private static async buildExtTree(domainNode: any, domain: any, annees: any[]) {
    for (const annee of annees) {
      const anneeDocCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id }
      });
      if (anneeDocCount === 0) continue;
      const anneeNode: any = this.makeAnneeNode(annee, domain.id, anneeDocCount);
      const entrantCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id, sourceType: 'recu_externe' }
      });
      const sortantCount = await DocumentGed.count({
        where: { anneeAcademiqueId: annee.id, domainId: domain.id, sourceType: 'document_sortant' }
      });
      if (entrantCount > 0) {
        (anneeNode.children as any[]).push({
          id: `ext-entrant-annee-${annee.id}`, label: 'Courriers entrants',
          type: 'courrier_entrant', anneeId: annee.id, domainId: domain.id,
          sourceType: 'recu_externe', data: { docCount: entrantCount }, children: [], leaf: true
        });
      }
      if (sortantCount > 0) {
        (anneeNode.children as any[]).push({
          id: `ext-sortant-annee-${annee.id}`, label: 'Courriers sortants',
          type: 'courrier_sortant', anneeId: annee.id, domainId: domain.id,
          sourceType: 'document_sortant', data: { docCount: sortantCount }, children: [], leaf: true
        });
      }
      if ((anneeNode.children as any[]).length > 0) (domainNode.children as any[]).push(anneeNode);
    }
  }

  private static async buildGenericTree(domainNode: any, domain: any) {
    const folders = (domain as any).folders || [];
    for (const folder of folders) {
      (domainNode.children as any[]).push({
        id: `folder-${folder.id}`, label: folder.nom, type: 'folder',
        folderId: folder.id, domainId: domain.id,
        data: { docCount: 0 }, children: []
      });
    }
  }

  private static makeAnneeNode(annee: any, domainId: number, docCount: number) {
    return {
      id: `annee-${annee.id}`, label: annee.libelle, type: 'annee',
      anneeId: annee.id, domainId, data: { docCount }, children: []
    };
  }

  private static makeNiveauNode(niveau: any, annee: any, domainId: number, docCount: number) {
    return {
      id: `niveau-${niveau.id}-annee-${annee.id}`, label: niveau.libelle,
      type: 'niveau', niveauId: niveau.id, anneeId: annee.id,
      domainId, data: { docCount }, children: []
    };
  }

  private static makeParcoursNode(parc: any, niveau: any, annee: any, domainId: number, docCount: number) {
    return {
      id: `parcours-${parc.id}-annee-${annee.id}`, label: parc.titre,
      type: 'parcours', parcoursId: parc.id, niveauId: niveau.id,
      anneeId: annee.id, domainId, data: { docCount }, children: []
    };
  }
}
