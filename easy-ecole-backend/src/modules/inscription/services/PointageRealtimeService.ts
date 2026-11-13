import { Server } from "socket.io";
import { SituationFinanciere } from "./SituationFinanciereService";

export interface TerminalAttendanceUpdate {
  utilisateurId: number;
  nom: string;
  prenoms: string;
  role: string;
  employeeNoString: string;
  date: string;
  time: string;
  mode: "arrivee" | "depart" | "passage" | "refuse";
  etablissementId: number;
  motifRefus?: string | null;
  avertissementPaiement?: string | null;
  situationFinanciere?: SituationFinanciere | null;
  enseignantNonProgramme?: boolean;
  heureArrivee?: string | null;
  heureDepart?: string | null;
  seancePointage?: {
    action: "debut" | "fin";
    seanceId: number;
    cours: string;
    heureDebutPrevue: string;
    heureFinPrevue: string;
    heureDebutReelle: string;
    heureFinReelle: string | null;
    heureReelle: string;
    confirmationToken?: string;
  };
  photo?: string;
  photoType?: "apprenant" | "enseignant" | "profile";
}

export default class PointageRealtimeService {
  private static io: Server | null = null;

  static initialize(io: Server): void {
    PointageRealtimeService.io = io;
  }

  static emitTerminalAttendance(update: TerminalAttendanceUpdate): void {
    if (!PointageRealtimeService.io) {
      console.error("[Pointage] Socket.IO n’est pas initialisé ; le pointage Hikvision n’a pas été diffusé.");
      return;
    }
    PointageRealtimeService.io
      .to(`pointage:site:${update.etablissementId}`)
      .emit("pointage:terminal", update);
    PointageRealtimeService.io.to("pointage:administrateurs").emit("pointage:terminal", update);
  }
}
