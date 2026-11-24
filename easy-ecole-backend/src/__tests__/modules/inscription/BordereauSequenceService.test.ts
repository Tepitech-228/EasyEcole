jest.mock("../../../modules/inscription/models/Bordereau", () => ({
  Bordereau: { findAll: jest.fn() },
}))

const { Bordereau } = require("../../../modules/inscription/models/Bordereau")
import { attribuerNumeroSequenceBordereaux } from "../../../modules/inscription/services/BordereauSequenceService"

describe("attribuerNumeroSequenceBordereaux", () => {
  it("reuses the rank after a rejected bordereau and sequences per student", async () => {
    const historique = [
      { id: 1, utilisateurId: 7, statut: "rejete" },
      { id: 2, utilisateurId: 7, statut: "en_attente" },
      { id: 3, utilisateurId: 7, statut: "rejete" },
      { id: 4, utilisateurId: 7, statut: "valide" },
      { id: 5, utilisateurId: 9, statut: "traite" },
    ]
    Bordereau.findAll.mockResolvedValue(historique)
    const bordereaux = historique.map(({ id, utilisateurId, statut }) => ({
      id,
      utilisateurId,
      statut,
      setDataValue: jest.fn(),
    }))

    await attribuerNumeroSequenceBordereaux(bordereaux as any)

    expect(bordereaux.map(bordereau => bordereau.setDataValue.mock.calls[0][1])).toEqual([1, 1, 2, 2, 1])
  })
})
