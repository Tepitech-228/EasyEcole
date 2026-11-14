import { Server } from "socket.io";
import { SituationFinanciere } from "./SituationFinanciereService";
import { logHikvisionDiagnostic } from "./HikvisionDiagnosticLogger";

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

export interface TerminalAttendanceBroadcastResult {
  socketIoAvailable: boolean;
  siteRecipients: number;
  adminRecipients: number;
}

export default class PointageRealtimeService {
  private static io: Server | null = null;

  static initialize(io: Server): void {
    PointageRealtimeService.io = io;
  }

  static emitTerminalAttendance(update: TerminalAttendanceUpdate): TerminalAttendanceBroadcastResult {
    const io = PointageRealtimeService.io;
    if (!io) {
      console.error("[Pointage] Socket.IO n’est pas initialisé ; le pointage Hikvision n’a pas été diffusé.");
      const result = { socketIoAvailable: false, siteRecipients: 0, adminRecipients: 0 };
      logHikvisionDiagnostic("error", {
        phase: "diffusion_pointage_ecran",
        sens: "serveur_vers_ecran",
        transport: "Socket.IO",
        siteId: update.etablissementId,
        mode: update.mode,
        resultat: "socket_io_non_initialise",
        destinataires: { site: 0, administrateurs: 0 }
      });
      return result;
    }

    const siteRoom = `pointage:site:${update.etablissementId}`;
    const adminRoom = "pointage:administrateurs";
    const rooms = io.of("/").adapter.rooms;
    const siteRecipients = rooms.get(siteRoom)?.size ?? 0;
    const adminRecipients = rooms.get(adminRoom)?.size ?? 0;

    io.to(siteRoom).emit("pointage:terminal", update);
    io.to(adminRoom).emit("pointage:terminal", update);

    const result = { socketIoAvailable: true, siteRecipients, adminRecipients };
    logHikvisionDiagnostic(siteRecipients + adminRecipients > 0 ? "info" : "warn", {
      phase: "diffusion_pointage_ecran",
      sens: "serveur_vers_ecran",
      transport: "Socket.IO",
      siteId: update.etablissementId,
      mode: update.mode,
      resultat: "evenement_pointage_emis",
      evenement: "pointage:terminal",
      destinataires: { site: siteRecipients, administrateurs: adminRecipients },
      affichageNavigateurConfirme: false
    });
    return result;
  }
}
