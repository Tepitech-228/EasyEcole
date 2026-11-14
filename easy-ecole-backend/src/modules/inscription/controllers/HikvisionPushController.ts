import { createHash } from "crypto";
import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";
import { Enseignant } from "../../auth/models/Enseignant";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { PointageTerminal } from "../models/PointageTerminal";
import { PointageTerminalEvent } from "../models/PointageTerminalEvent";
import { Op } from "sequelize";
import PointageTerminalController from "./PointageTerminalController";
import PointageRealtimeService from "../services/PointageRealtimeService";
import PointageTerminalTokenService from "../services/PointageTerminalTokenService";
import { normalizeHikvisionEmployeeNo } from "../services/HikvisionIsapiService";
import { isHikvisionHeartbeat, parseHikvisionPushEvent } from "../services/HikvisionPushEventParser";
import { logHikvisionDiagnostic } from "../services/HikvisionDiagnosticLogger";

function normalizedIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

async function resolveUtilisateur(employeeNo: string, etablissementId: number): Promise<Utilisateur | null> {
  const [dossiers, siteUsers] = await Promise.all([
    DossierEtudiant.findAll({
      where: { matricule: employeeNo, etablissementId },
      attributes: ["utilisateurId"]
    }),
    SiteUtilisateur.findAll({ where: { etablissementId }, attributes: ["utilisateurId"] })
  ]);

  const siteUserIds = siteUsers.map(item => Number(item.utilisateurId));
  const [personnels, enseignants] = await Promise.all([
    PersonnelAdministratif.findAll({
      where: {
        matricule: employeeNo,
        [Op.or]: [
          { utilisateurId: { [Op.in]: siteUserIds } },
          { etablissementId }
        ]
      },
      attributes: ["utilisateurId"]
    }),
    Enseignant.findAll({
      where: { matricule: employeeNo, utilisateurId: { [Op.in]: siteUserIds } },
      attributes: ["utilisateurId"]
    })
  ]);
  const profileIds = new Set<number>([
    ...dossiers.map(item => Number(item.utilisateurId)),
    ...personnels.map(item => Number(item.utilisateurId)),
    ...enseignants.map(item => Number(item.utilisateurId))
  ].filter(id => Number.isSafeInteger(id) && id > 0));

  if (profileIds.size > 1) return null;
  if (profileIds.size === 1) return Utilisateur.findByPk(Array.from(profileIds)[0]);

  const identifiants = await Utilisateur.findAll({
    where: { identifiant: employeeNo },
    attributes: ["id"]
  });
  const matchingIds = new Set<number>(
    identifiants.map(item => Number(item.id)).filter(id => Number.isSafeInteger(id) && id > 0)
  );
  if (matchingIds.size === 1) return Utilisateur.findByPk(Array.from(matchingIds)[0]);
  if (matchingIds.size > 1) return null;

  // Les terminaux recovent un employeeNo alphanumerique (sans - ni _).
  // On retrouve le profil en comparant les matricules normalises du site.
  const normalized = normalizeHikvisionEmployeeNo(employeeNo);
  if (normalized) {
    const [siteDossiers, sitePersonnels, siteEnseignants] = await Promise.all([
      DossierEtudiant.findAll({
        where: { etablissementId },
        attributes: ["matricule", "utilisateurId"]
      }),
      PersonnelAdministratif.findAll({
        where: {
          [Op.or]: [
            { utilisateurId: { [Op.in]: siteUserIds } },
            { etablissementId }
          ]
        },
        attributes: ["matricule", "utilisateurId"]
      }),
      Enseignant.findAll({
        where: { utilisateurId: { [Op.in]: siteUserIds } },
        attributes: ["matricule", "utilisateurId"]
      })
    ]);
    const normalizedIds = new Set<number>();
    for (const profil of [...siteDossiers, ...sitePersonnels, ...siteEnseignants]) {
      if (profil.matricule && normalizeHikvisionEmployeeNo(String(profil.matricule)) === normalized) {
        normalizedIds.add(Number(profil.utilisateurId));
      }
    }
    if (normalizedIds.size === 1) return Utilisateur.findByPk(Array.from(normalizedIds)[0]);
    if (normalizedIds.size > 1) return null;
  }

  if (/^\d+$/.test(employeeNo)) return Utilisateur.findByPk(Number(employeeNo));
  return null;
}

async function getUtilisateurPhoto(
  utilisateur: Utilisateur,
  etablissementId: number
): Promise<{ photo: string; photoType: "apprenant" | "enseignant" | "profile" } | null> {
  try {
    if (utilisateur.role === RolesUtilisateur.APPRENANT) {
      const [dossier, apprenant] = await Promise.all([
        DossierEtudiant.findOne({
          where: { utilisateurId: utilisateur.id, etablissementId },
          attributes: ["photo"]
        }),
        Apprenant.findOne({
          where: { utilisateurId: utilisateur.id },
          attributes: ["photo"]
        })
      ]);
      const photo = dossier?.photo || apprenant?.photo;
      return photo ? { photo, photoType: "apprenant" } : null;
    }

    if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
      const enseignant = await Enseignant.findOne({
        where: { utilisateurId: utilisateur.id },
        attributes: ["photo"]
      });
      return enseignant?.photo ? { photo: enseignant.photo, photoType: "enseignant" } : null;
    }

    return utilisateur.photoDeProfil
      ? { photo: utilisateur.photoDeProfil, photoType: "profile" }
      : null;
  } catch (error) {
    console.error(`[Hikvision] Impossible de récupérer la photo du compte ${utilisateur.id}:`, error);
    return null;
  }
}

async function traiterEvenement(terminal: PointageTerminal, eventId: number): Promise<void> {
  try {
    const pendingEvent = await PointageTerminalEvent.findOne({
      where: { id: eventId, terminalId: terminal.id, statut: "en_attente" }
    });
    if (!pendingEvent) return;
    await terminal.update({ lastSeenAt: new Date() });
    const utilisateur = await resolveUtilisateur(pendingEvent.pin, Number(terminal.etablissementId));
    const log = {
      pin: pendingEvent.pin,
      date: pendingEvent.date,
      time: pendingEvent.heure,
      statusCode: pendingEvent.statusCode,
      verifyType: pendingEvent.verifyType,
      utilisateurId: utilisateur ? Number(utilisateur.id) : undefined,
      eventId: Number(pendingEvent.id)
    };
    const recorded = await PointageTerminalController.processAttendanceEvent(terminal, log);
    if (!utilisateur) {
      logHikvisionDiagnostic("warn", {
        phase: "evenement_terminal_traite",
        sens: "terminal_vers_serveur",
        transport: "alertStream_ou_callback",
        terminalId: Number(terminal.id),
        eventId: Number(pendingEvent.id),
        resultat: "utilisateur_non_resolu",
        statutPointage: "refuse_ou_non_identifie",
        codesEvenement: { major: pendingEvent.statusCode, minor: pendingEvent.verifyType }
      });
      return;
    }
    const photo = await getUtilisateurPhoto(utilisateur, Number(terminal.etablissementId));

    if (!recorded.recorded) {
      // Refus (paiement non à jour, compte non autorisé, déjà traité…) : on
      // notifie tout de même l’application pour qu’elle annonce le refus.
      if (recorded.mode === "refuse") {
        const broadcast = PointageRealtimeService.emitTerminalAttendance({
          utilisateurId: Number(utilisateur.id),
          nom: utilisateur.nom,
          prenoms: utilisateur.prenoms,
          role: utilisateur.role,
          employeeNoString: pendingEvent.pin,
          date: pendingEvent.date,
          time: pendingEvent.heure,
          mode: "refuse",
          etablissementId: Number(terminal.etablissementId),
          motifRefus: recorded.motifRefus,
          enseignantNonProgramme: recorded.enseignantNonProgramme,
          situationFinanciere: recorded.situationFinanciere,
          ...photo
        });
        logHikvisionDiagnostic("warn", {
          phase: "evenement_terminal_traite",
          sens: "terminal_vers_serveur",
          transport: "alertStream_ou_callback",
          terminalId: Number(terminal.id),
          eventId: Number(pendingEvent.id),
          resultat: "pointage_refuse",
          motif: recorded.motifRefus || null,
          socketIoDisponible: broadcast.socketIoAvailable,
          destinatairesEcran: {
            site: broadcast.siteRecipients,
            administrateurs: broadcast.adminRecipients
          },
          codesEvenement: { major: pendingEvent.statusCode, minor: pendingEvent.verifyType }
        });
      }
      if (recorded.mode !== "refuse") {
        logHikvisionDiagnostic("info", {
          phase: "evenement_terminal_traite",
          sens: "terminal_vers_serveur",
          transport: "alertStream_ou_callback",
          terminalId: Number(terminal.id),
          eventId: Number(pendingEvent.id),
          resultat: "non_enregistre",
          codesEvenement: { major: pendingEvent.statusCode, minor: pendingEvent.verifyType }
        });
      }
      return;
    }

    const broadcast = PointageRealtimeService.emitTerminalAttendance({
      utilisateurId: Number(utilisateur.id),
      nom: utilisateur.nom,
      prenoms: utilisateur.prenoms,
      role: utilisateur.role,
      employeeNoString: pendingEvent.pin,
      date: pendingEvent.date,
      time: pendingEvent.heure,
      mode: recorded.mode,
      etablissementId: Number(terminal.etablissementId),
      avertissementPaiement: recorded.avertissementPaiement,
      situationFinanciere: recorded.situationFinanciere,
      heureArrivee: recorded.heureArrivee,
      heureDepart: recorded.heureDepart,
      seancePointage: recorded.seancePointage,
      ...photo
    });
    logHikvisionDiagnostic("info", {
      phase: "evenement_terminal_traite",
      sens: "terminal_vers_serveur",
      transport: "alertStream_ou_callback",
      terminalId: Number(terminal.id),
      eventId: Number(pendingEvent.id),
      resultat: "pointage_enregistre_et_evenement_diffuse",
      mode: recorded.mode,
      siteId: Number(terminal.etablissementId),
      socketIoDisponible: broadcast.socketIoAvailable,
      destinatairesEcran: {
        site: broadcast.siteRecipients,
        administrateurs: broadcast.adminRecipients
      },
      codesEvenement: { major: pendingEvent.statusCode, minor: pendingEvent.verifyType },
      configuration: !broadcast.socketIoAvailable
        ? "flux_terminal_serveur_ok_socket_io_indisponible"
        : broadcast.siteRecipients + broadcast.adminRecipients === 0
          ? "flux_terminal_serveur_ok_aucun_ecran_connecte"
          : "flux_bien_configure"
    });
  } catch (error) {
    console.error(`[Hikvision] Échec du traitement d’un événement du terminal ${terminal.id}:`, error);
    logHikvisionDiagnostic("error", {
      phase: "evenement_terminal_traitement_echec",
      sens: "terminal_vers_serveur",
      transport: "alertStream_ou_callback",
      terminalId: Number(terminal.id),
      eventId,
      message: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
}

export default class HikvisionPushController {
  static async receiveFromStream(
    terminal: PointageTerminal,
    body: unknown
  ): Promise<{ type: "heartbeat" | "event" | "ignored"; eventId?: number; created?: boolean }> {
    if (isHikvisionHeartbeat(body)) {
      await terminal.update({ lastSeenAt: new Date() });
      logHikvisionDiagnostic("info", {
        phase: "message_stream_recu",
        sens: "terminal_vers_serveur",
        transport: "alertStream",
        terminalId: Number(terminal.id),
        resultat: "heartbeat_recu_et_serveur_vivant",
        configuration: "connexion_bidirectionnelle_active"
      });
      return { type: "heartbeat" };
    }

    const event = parseHikvisionPushEvent(body);
    if (!event) {
      logHikvisionDiagnostic("warn", {
        phase: "message_stream_recu",
        sens: "terminal_vers_serveur",
        transport: "alertStream",
        terminalId: Number(terminal.id),
        resultat: "message_ignore_format_non_reconnu"
      });
      return { type: "ignored" };
    }

    const fingerprint = createHash("sha256")
      .update([terminal.serialNumber, event.employeeNoString, event.date, event.time, event.major, event.minor].join("|"))
      .digest("hex");
    const [received, created] = await PointageTerminalEvent.findOrCreate({
      where: { fingerprint },
      defaults: {
        terminalId: Number(terminal.id),
        utilisateurId: null,
        etablissementId: Number(terminal.etablissementId),
        pointageId: null,
        pin: event.employeeNoString,
        date: event.date,
        heure: event.time,
        statusCode: event.major,
        verifyType: event.minor,
        statut: "en_attente",
        motifRefus: null,
        fingerprint
      }
    });
    await terminal.update({ lastSeenAt: new Date() });
    logHikvisionDiagnostic("info", {
      phase: "evenement_stream_recu",
      sens: "terminal_vers_serveur",
      transport: "alertStream",
      terminalId: Number(terminal.id),
      siteId: Number(terminal.etablissementId),
      evenement: {
        date: event.date,
        heure: event.time,
        major: event.major,
        minor: event.minor
      },
      reponseServeur: {
        statut: "evenement_accepte",
        eventId: Number(received.id),
        nouveau: created
      },
      configuration: "flux_retour_evenement_confirme_traitement_en_attente"
    });
    if (received.statut === "en_attente") {
      void traiterEvenement(terminal, Number(received.id));
    }
    return { type: "event", eventId: Number(received.id), created };
  }

  static async resumePendingEvents(): Promise<void> {
    let lastEventId = 0;
    while (true) {
      const pendingEvents = await PointageTerminalEvent.findAll({
        where: { statut: "en_attente", id: { [Op.gt]: lastEventId } },
        order: [["id", "ASC"]],
        limit: 100
      });
      if (pendingEvents.length === 0) return;
      for (const event of pendingEvents) {
        lastEventId = Number(event.id);
        const terminal = await PointageTerminal.findOne({
          where: { id: event.terminalId, protocol: "hikvision_isapi", actif: true }
        });
        if (!terminal) {
          console.error(`[Hikvision] Reçu en attente ${event.id}: aucun terminal actif correspondant.`);
          continue;
        }
        await traiterEvenement(terminal, Number(event.id));
      }
    }
  }

  static async receive(req: Request, res: Response): Promise<Response> {
    const sourceIp = normalizedIp(req.socket.remoteAddress || "");
    const logExchange = (
      statusHttp: number,
      resultat: string,
      extra: Record<string, unknown> = {}
    ): void => {
      logHikvisionDiagnostic(statusHttp >= 500 ? "error" : statusHttp >= 400 ? "warn" : "info", {
        phase: "callback_requete_reponse",
        sens: "terminal_vers_serveur_puis_reponse_serveur_vers_terminal",
        transport: "HTTP_callback",
        requete: {
          methode: req.method,
          chemin: "/api/hikvision/event",
          jetonDansChemin: req.params.deviceToken !== undefined,
          adresseSource: sourceIp || null
        },
        reponseServeur: { statutHttp: statusHttp, resultat },
        ...extra
      });
    };

    // Le heartbeat emprunte le meme canal que les evenements : il faut
    // l'acquitter avant le parsing, sinon le terminal desactive le push.
    if (isHikvisionHeartbeat(req.body)) {
      logExchange(200, "heartbeat_acquitte", {
        configuration: "callback_retour_ok_en_attente_evenement_acces"
      });
      return res.status(200).type("text/plain").send("OK");
    }

    const event = parseHikvisionPushEvent(req.body);
    if (!event) {
      // Le terminal envoie aussi des evenements système (ouverture/fermeture
      // de porte, minor 21/22) sans employeeNoString. Les refuser le bloque :
      // il rejoue la même file en boucle et les vrais pointages n'arrivent plus.
      const body = req.body as Record<string, unknown> | undefined;
      const rawEvent = body && typeof body === "object" && typeof body.AccessControllerEvent === "string"
        ? body.AccessControllerEvent
        : "";
      if (!/"employeeNoString"\s*:\s*"[^"]+"/.test(rawEvent)) {
        logExchange(200, "evenement_systeme_acquitte_sans_pointage");
        return res.status(200).type("text/plain").send("OK");
      }
      logExchange(400, "format_evenement_invalide");
      return res.status(400).type("text/plain").send("INVALID EVENT");
    }

    try {
      // Jeton du terminal (recommandé dès que le push transite par un tunnel) :
      // il identifie le terminal même si toutes les requêtes viennent de Cloudflare.
      // Sans jeton, on retombe sur l'ancienne authentification par IP source.
      const token = PointageTerminalTokenService.extract(req);
      let terminals: PointageTerminal[];
      if (token) {
        const hashedToken = PointageTerminalTokenService.hash(token);
        terminals = await PointageTerminal.findAll({
          where: { protocol: "hikvision_isapi", deviceTokenHash: hashedToken, actif: true }
        });
        if (terminals.length === 1 && !PointageTerminalTokenService.matches(token, terminals[0].deviceTokenHash)) {
          terminals = [];
        }
      } else {
        const remoteIp = sourceIp;
        if (!remoteIp) {
          logExchange(403, "adresse_source_absente");
          return res.status(403).type("text/plain").send("FORBIDDEN");
        }
        terminals = await PointageTerminal.findAll({
          where: { protocol: "hikvision_isapi", sourceIp: remoteIp, actif: true }
        });
      }
      if (terminals.length !== 1) {
        logExchange(403, "terminal_non_autorise", {
          terminauxCorrespondants: terminals.length,
          methodeAuthentification: token ? "jeton_terminal" : "adresse_ip_source"
        });
        return res.status(403).type("text/plain").send("TERMINAL NOT AUTHORIZED");
      }
      const terminal = terminals[0];
      const fingerprint = createHash("sha256")
        .update([terminal.serialNumber, event.employeeNoString, event.date, event.time, event.major, event.minor].join("|"))
        .digest("hex");
      const [received, created] = await PointageTerminalEvent.findOrCreate({
        where: { fingerprint },
        defaults: {
          terminalId: Number(terminal.id),
          utilisateurId: null,
          etablissementId: Number(terminal.etablissementId),
          pointageId: null,
          pin: event.employeeNoString,
          date: event.date,
          heure: event.time,
          statusCode: event.major,
          verifyType: event.minor,
          statut: "en_attente",
          motifRefus: null,
          fingerprint
        }
      });
      if (Number(received.terminalId) !== Number(terminal.id)) {
        logExchange(409, "conflit_identifiant_evenement", { terminalId: Number(terminal.id) });
        return res.status(409).type("text/plain").send("EVENT CONFLICT");
      }
      logExchange(200, "evenement_accepte_et_persiste", {
        terminalId: Number(terminal.id),
        siteId: Number(terminal.etablissementId),
        eventId: Number(received.id),
        nouveau: created,
        evenement: {
          date: event.date,
          heure: event.time,
          major: event.major,
          minor: event.minor
        },
        configuration: "flux_callback_reception_confirmee_traitement_en_attente"
      });
      console.info(`[Hikvision][Terminal ${Number(terminal.id)}] POINTEUSE -> SERVEUR : événement de pointage reçu et accepté (eventId=${Number(received.id)}).`);
      res.status(200).type("text/plain").send("OK");
      console.info(`[Hikvision][Terminal ${Number(terminal.id)}] SERVEUR -> POINTEUSE : accusé de réception HTTP 200 OK envoyé.`);
      console.info(`[Hikvision][Terminal ${Number(terminal.id)}] FLUX EN PLACE : pointeuse -> serveur et accusé serveur -> pointeuse confirmés.`);
      if (created || received.statut === "en_attente") {
        void traiterEvenement(terminal, Number(received.id));
      }
      return res;
    } catch (error) {
      console.error("[Hikvision] Échec de réception d’un événement push:", error);
      logExchange(503, "erreur_serveur_reception_evenement", {
        message: error instanceof Error ? error.message : "Erreur inconnue"
      });
      return res.status(503).type("text/plain").send("RETRY");
    }
  }
}
