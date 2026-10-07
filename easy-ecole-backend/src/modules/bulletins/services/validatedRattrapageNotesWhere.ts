import { Op } from "sequelize";
import type { WhereOptions } from "sequelize";
import type { RattrapageNote } from "../../inscription/models/RattrapageNote";

export function validatedRattrapageNotesWhere(etudiantIds: number[], ueIds: number[]): WhereOptions<RattrapageNote> {
  return {
    etudiantId: { [Op.in]: etudiantIds },
    ueId: { [Op.in]: ueIds },
    note_rattrapage: { [Op.not]: null },
    statut: "validée",
  };
}
