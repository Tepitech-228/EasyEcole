import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../../core/config/jwt";

export interface SeancePointageConfirmation {
  seancePointageId: number;
  utilisateurId: number;
  etablissementId: number;
  date: string;
  heureFin: string;
}

export default class SeancePointageConfirmationService {
  static creer(confirmation: SeancePointageConfirmation): string {
    return jwt.sign(
      { purpose: "seance-pointage-terminal-fin", ...confirmation },
      JWT_SECRET,
      { expiresIn: "2m" }
    );
  }

  static verifier(token: unknown): SeancePointageConfirmation | null {
    if (typeof token !== "string" || !token) return null;
    try {
      const claims = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const seancePointageId = Number(claims.seancePointageId);
      const utilisateurId = Number(claims.utilisateurId);
      const etablissementId = Number(claims.etablissementId);
      if (
        claims.purpose !== "seance-pointage-terminal-fin"
        || !Number.isSafeInteger(seancePointageId) || seancePointageId <= 0
        || !Number.isSafeInteger(utilisateurId) || utilisateurId <= 0
        || !Number.isSafeInteger(etablissementId) || etablissementId <= 0
        || typeof claims.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(claims.date)
        || typeof claims.heureFin !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(claims.heureFin)
      ) return null;
      return { seancePointageId, utilisateurId, etablissementId, date: claims.date, heureFin: claims.heureFin };
    } catch {
      return null;
    }
  }
}
