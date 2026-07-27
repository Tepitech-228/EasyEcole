import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import DocumentType from "../models/DocumentType";
import { ProcessusGenerateur } from "../models/ProcessusGenerateur";

const AnneeAcademique = () => DatabaseConnection.getInstance().sequelize.model('InsAnneeAcademique') as any;
const NiveauEtude = () => DatabaseConnection.getInstance().sequelize.model('InsNiveauEtude') as any;
const Classe = () => DatabaseConnection.getInstance().sequelize.model('InsClasse') as any;

export class NamingConventionService {
  static async buildDocumentName(params: {
    anneeAcademiqueId?: number
    domainCode?: string
    processusGenerateurId?: string
    niveauEtudeId?: number
    classeId?: number
    matricule?: string
    documentTypeId?: number
  }): Promise<string> {
    const parts: string[] = [];
    const exists = (v: any) => v !== undefined && v !== null && v !== '';

    if (exists(params.anneeAcademiqueId)) {
      const annee = await AnneeAcademique().findByPk(params.anneeAcademiqueId);
      const code = annee?.code_annee || annee?.libelle?.replace('/', '-') || String(params.anneeAcademiqueId);
      parts.push(code);
    }

    if (exists(params.domainCode)) parts.push(params.domainCode!);

    if (exists(params.processusGenerateurId)) {
      const proc = await ProcessusGenerateur.findByPk(params.processusGenerateurId);
      if (proc) parts.push(proc.code || proc.libelle.substring(0, 4).toUpperCase());
    }

    if (exists(params.niveauEtudeId)) {
      const niveau = await NiveauEtude().findByPk(params.niveauEtudeId);
      if (niveau) parts.push(niveau.code?.toUpperCase() || niveau.libelle.replace(/\s+/g, '').substring(0, 4).toUpperCase());
    }

    if (exists(params.classeId)) {
      const classe = await Classe().findByPk(params.classeId);
      if (classe) parts.push(classe.libelle?.replace(/\s+/g, '-') || String(params.classeId));
    }

    if (exists(params.matricule)) parts.push(params.matricule!);

    if (exists(params.documentTypeId)) {
      const dt = await DocumentType.findByPk(params.documentTypeId);
      if (dt) parts.push(dt.code || dt.shortCode || dt.label.replace(/\s+/g, '-').toLowerCase());
    }

    return parts.join('_');
  }
}
