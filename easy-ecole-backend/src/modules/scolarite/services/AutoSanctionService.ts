import { Op } from "sequelize";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { PresenceCoursParticipant } from "../../inscription/models/PresenceCoursParticipant";
import { SanctionAcademique } from "../models/SanctionAcademique";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";

export interface SeuilSanction {
  seuilAbsences: number
  typeSanction: 'avertissement' | 'suspension' | 'exclusion'
  message: string
}

const SEUILS: SeuilSanction[] = [
  { seuilAbsences: 5, typeSanction: 'avertissement', message: 'Avertissement pour absences répétées' },
  { seuilAbsences: 10, typeSanction: 'suspension', message: 'Suspension pour absentéisme excessif' },
  { seuilAbsences: 20, typeSanction: 'exclusion', message: 'Exclusion pour absentéisme chronique' },
];

export class AutoSanctionService {

  static async verifierEtSanctionner(cursusApprenantId: number): Promise<SanctionAcademique | null> {
    const cp = await CoursParticipant.findOne({
      where: { cursusApprenantId }
    });
    if (!cp) return null;

    const absencesNonJustifiees = await PresenceCoursParticipant.count({
      where: {
        coursParticipantId: cp.id as any,
        etatDePresence: EtatsDePresence.ABSENT
      }
    });

    const seuilAtteint = SEUILS.find(s => absencesNonJustifiees >= s.seuilAbsences);
    if (!seuilAtteint) return null;

    const existing = await SanctionAcademique.findOne({
      where: {
        cursusApprenantId: cursusApprenantId as any,
        type: seuilAtteint.typeSanction,
        dateFin: { [Op.gt]: new Date() }
      }
    });
    if (existing) return null;

    const duree = seuilAtteint.typeSanction === 'avertissement' ? 30 :
                  seuilAtteint.typeSanction === 'suspension' ? 90 : 365;

    const sanction = await SanctionAcademique.create({
      cursusApprenantId: cursusApprenantId as any,
      type: seuilAtteint.typeSanction,
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + duree * 24 * 60 * 60 * 1000),
      motif: `${seuilAtteint.message} (${absencesNonJustifiees} absences non justifiées)`,
      decidePar: 0
    });

    return sanction;
  }

  static async verifierTous(): Promise<{ sanctionne: number; total: number }> {
    const cursusList = await CursusApprenant.findAll({
      attributes: ['id'],
      raw: true
    });

    let sanctionne = 0;
    for (const c of cursusList) {
      const s = await AutoSanctionService.verifierEtSanctionner(Number((c as any).id));
      if (s) sanctionne++;
    }
    return { sanctionne, total: cursusList.length };
  }
}
