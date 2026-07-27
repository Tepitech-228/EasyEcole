import { DocGenReference } from "../models/DocGenReference";

export class ReferenceService {
  static async generer(typeId: number): Promise<string> {
    const annee = new Date().getFullYear();
    const [ref] = await DocGenReference.findOrCreate({
      where: { typeId, annee },
      defaults: { typeId, annee, compteur: 0 }
    });
    ref.compteur += 1;
    await ref.save();
    const compteur = String(ref.compteur).padStart(4, '0');
    return `DOC-${annee}-${typeId}-${compteur}`;
  }
}
