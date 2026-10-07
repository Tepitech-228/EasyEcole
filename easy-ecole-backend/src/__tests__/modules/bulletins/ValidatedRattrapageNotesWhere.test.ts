import { Op } from "sequelize";
import { validatedRattrapageNotesWhere } from "../../../modules/bulletins/services/validatedRattrapageNotesWhere";

describe("validatedRattrapageNotesWhere", () => {
  it("limite le bulletin aux notes validées et aux étudiants/UE concernés", () => {
    const where = validatedRattrapageNotesWhere([12, 24], [3, 6]) as any;

    expect(where).toEqual({
      etudiantId: { [Op.in]: [12, 24] },
      ueId: { [Op.in]: [3, 6] },
      note_rattrapage: { [Op.not]: null },
      statut: "validée",
    });
  });
});
