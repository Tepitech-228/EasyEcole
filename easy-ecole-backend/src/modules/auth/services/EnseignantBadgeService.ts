import * as fs from "fs";
import * as path from "path";
import { Op } from "sequelize";
import QRCode from "qrcode";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { Enseignant } from "../models/Enseignant";

export class EnseignantBadgeService {
  static async ensureIdentity(
    enseignant: Enseignant,
    etablissementId?: number | string | null,
  ): Promise<{ matricule: string; qrCode: string }> {
    if (!enseignant.id || !enseignant.utilisateurId) {
      throw new Error("Le profil enseignant doit être enregistré et lié à un compte avant la génération de son badge.");
    }

    if (!enseignant.matricule) {
      const etablissement = etablissementId
        ? await Etablissement.findByPk(etablissementId)
        : null;
      const etabCode = IDGenerator.deriveEtablissementCode(etablissement);
      const siteCode = IDGenerator.deriveSiteCode(etablissement);
      const matiereCode = IDGenerator.deriveMatiereCode(enseignant.specialite);
      const prefix = `${etabCode}-${matiereCode}-${siteCode}-`;
      let generated = false;

      for (let attempt = 0; attempt < 5; attempt++) {
        const count = Number(await Enseignant.count({
          where: { matricule: { [Op.like]: `${prefix}%` } },
        } as any));
        const matricule = IDGenerator.generateMatricule(etabCode, matiereCode, siteCode, count + 1);
        try {
          await enseignant.update({ matricule });
          generated = true;
          break;
        } catch (error: any) {
          const code = error?.parent?.code || error?.original?.code || "";
          if ((code !== "ER_DUP_ENTRY" && error?.name !== "SequelizeUniqueConstraintError") || attempt === 4) {
            throw error;
          }
        }
      }

      if (!generated) {
        throw new Error("Impossible de générer un matricule unique pour cet enseignant.");
      }
    }

    const directory = path.resolve(process.cwd(), "storage", "qr-codes", "enseignants");
    await fs.promises.mkdir(directory, { recursive: true });

    const qrCode = enseignant.qrCode || `${enseignant.utilisateurId}.png`;
    const filePath = path.join(directory, qrCode);
    if (!enseignant.qrCode || !fs.existsSync(filePath)) {
      await QRCode.toFile(filePath, QrTokenService.signer(Number(enseignant.utilisateurId)), {
        type: "png",
        width: 600,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      await enseignant.update({ qrCode });
    }

    return { matricule: enseignant.matricule!, qrCode };
  }
}
