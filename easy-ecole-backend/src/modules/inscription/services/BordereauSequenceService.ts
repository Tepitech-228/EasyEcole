import { Op } from "sequelize"
import { Bordereau } from "../models/Bordereau"

export async function attribuerNumeroSequenceBordereaux(bordereaux: Bordereau[]): Promise<void> {
  const utilisateurIds = [...new Set(
    bordereaux
      .map(bordereau => Number(bordereau.utilisateurId))
      .filter(id => Number.isSafeInteger(id) && id > 0)
  )]
  if (utilisateurIds.length === 0) return

  const historique = await Bordereau.findAll({
    attributes: ["id", "utilisateurId", "statut", "dateSoumission"],
    where: { utilisateurId: { [Op.in]: utilisateurIds } },
    order: [["dateSoumission", "ASC"], ["id", "ASC"]],
  })

  const prochainsRangs = new Map<number, number>()
  const rangsParBordereau = new Map<number, number>()
  for (const bordereau of historique) {
    const utilisateurId = Number(bordereau.utilisateurId)
    const rang = (prochainsRangs.get(utilisateurId) ?? 0) + 1
    rangsParBordereau.set(Number(bordereau.id), rang)
    if (bordereau.statut !== "rejete") prochainsRangs.set(utilisateurId, rang)
  }

  for (const bordereau of bordereaux) {
    bordereau.setDataValue("numeroSequence", rangsParBordereau.get(Number(bordereau.id)) ?? 1)
  }
}
