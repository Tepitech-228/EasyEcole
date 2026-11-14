import { ChildProcess } from "child_process";
import { PointageTerminal } from "../models/PointageTerminal";
import HikvisionPushController from "../controllers/HikvisionPushController";
import HikvisionIsapiService, { buildTerminalUrl } from "./HikvisionIsapiService";
import { logHikvisionDiagnostic } from "./HikvisionDiagnosticLogger";

interface AlertStreamFlowState {
  serverToTerminalConfirmed: boolean;
  terminalToServerConfirmed: boolean;
  completeMessageLogged: boolean;
}

export default class HikvisionAlertStreamService {
  private static started = false;
  private static connections = new Map<number, {
    child: ChildProcess;
    configKey: string;
    flow: AlertStreamFlowState;
  }>();
  private static reconcileTimer: NodeJS.Timeout | null = null;

  private static configKey(terminal: PointageTerminal): string {
    return [
      terminal.sourceIp,
      terminal.hikvisionPort,
      terminal.hikvisionHttps,
      terminal.hikvisionUsername,
      terminal.hikvisionPasswordEncrypted
    ].join("|");
  }

  static start(): void {
    if (this.started) return;
    this.started = true;
    console.info("[Hikvision] Supervision alertStream démarrée.");
    void this.reconcile();
    this.reconcileTimer = setInterval(() => void this.reconcile(), 15_000);
  }

  static stop(): void {
    this.started = false;
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    this.reconcileTimer = null;
    for (const connection of this.connections.values()) connection.child.kill();
    this.connections.clear();
  }

  private static async reconcile(): Promise<void> {
    try {
      const terminals = await PointageTerminal.findAll({
        where: { protocol: "hikvision_isapi", actif: true }
      });
      // L'alertStream est une connexion sortante : un terminal sans IP locale
      // (déploiement tunnel uniquement) n'est pas supervisable par ce canal.
      const supervisables = terminals.filter(terminal => Boolean(terminal.sourceIp));
      console.info(`[Hikvision] ${supervisables.length}/${terminals.length} terminal(aux) actif(s) à superviser.`);
      logHikvisionDiagnostic(supervisables.length > 0 ? "info" : "warn", {
        phase: "supervision_alertStream",
        sens: "serveur_vers_terminal",
        transport: "ISAPI_alertStream",
        resultat: supervisables.length > 0 ? "terminaux_supervisables" : "aucun_terminal_supervisable",
        terminauxActifs: terminals.length,
        terminauxSupervisables: supervisables.length
      });
      const activeTerminals = new Map(supervisables.map(terminal => [Number(terminal.id), terminal]));

      for (const [id, connection] of this.connections) {
        const terminal = activeTerminals.get(id);
        if (!terminal || connection.configKey !== this.configKey(terminal)) {
          connection.child.kill();
          this.connections.delete(id);
        }
      }

      for (const terminal of supervisables) {
        if (!this.started) return;
        const id = Number(terminal.id);
        if (this.connections.has(id)) continue;
        try {
          console.info(`[Hikvision] Connexion alertStream au terminal ${id} (${terminal.sourceIp}:${terminal.hikvisionPort}).`);
          const streamUrl = buildTerminalUrl(terminal, "/ISAPI/Event/notification/alertStream");
          logHikvisionDiagnostic("info", {
            phase: "requete_alertStream_emise",
            sens: "serveur_vers_terminal",
            transport: "ISAPI_alertStream",
            terminalId: id,
            requete: {
              methode: "GET",
              chemin: streamUrl.pathname,
              protocole: streamUrl.protocol.replace(":", "").toUpperCase(),
              adresse: `${streamUrl.hostname}:${streamUrl.port || (streamUrl.protocol === "https:" ? 443 : 80)}`
            },
            resultat: "connexion_demandee",
            configuration: "en_attente_reponse_terminal"
          });
          let lastHttpStatus: number | null = null;
          const flow: AlertStreamFlowState = {
            serverToTerminalConfirmed: false,
            terminalToServerConfirmed: false,
            completeMessageLogged: false
          };
          const child = HikvisionIsapiService.startAccessEventStream(
            terminal,
            value => {
              void HikvisionPushController.receiveFromStream(terminal, value)
                .then(result => {
                  if (result.type === "ignored") return;
                  if (!flow.terminalToServerConfirmed) {
                    flow.terminalToServerConfirmed = true;
                    const receivedMessage = result.type === "heartbeat" ? "heartbeat reçu" : "événement reçu et accepté";
                    console.info(`[Hikvision][Terminal ${id}] POINTEUSE -> SERVEUR : ${receivedMessage} via alertStream.`);
                  }
                  this.logFlowEstablished(id, flow);
                })
                .catch(error => {
                  logHikvisionDiagnostic("error", {
                    phase: "evenement_alertStream_non_traite",
                    sens: "terminal_vers_serveur",
                    transport: "ISAPI_alertStream",
                    terminalId: id,
                    message: error instanceof Error ? error.message : "Erreur inconnue"
                  });
                  console.error(`[Hikvision][Terminal ${id}] POINTEUSE -> SERVEUR : message reçu mais non traité :`, error);
                });
            },
            response => {
              lastHttpStatus = response.status;
              const multipart = response.contentType.toLowerCase().startsWith("multipart/");
              const connected = response.status === 200 && multipart;
              if (connected && !flow.serverToTerminalConfirmed) {
                flow.serverToTerminalConfirmed = true;
                console.info(
                  `[Hikvision][Terminal ${id}] SERVEUR -> POINTEUSE : connexion AlertStream acceptée ` +
                  `(HTTP ${response.status}, ${response.contentType}). En attente du premier message de la pointeuse.`
                );
                this.logFlowEstablished(id, flow);
              }
              logHikvisionDiagnostic(
                connected ? "info" : response.status && response.status >= 400 && response.status !== 401 ? "error" : "warn",
                {
                  phase: "reponse_alertStream_terminal",
                  sens: "terminal_vers_serveur",
                  transport: "ISAPI_alertStream",
                  terminalId: id,
                  reponseTerminal: {
                    statutHttp: response.status,
                    typeContenu: response.contentType || null,
                    boundaryMultipart: response.boundary
                  },
                  resultat: connected
                    ? "connexion_HTTP_persistante_et_multipart_confirmee"
                    : response.status === 401
                      ? "defi_digest_ou_authentification_refusee"
                      : "reponse_inattendue",
                  configuration: connected
                    ? "connexion_active_en_attente_premier_evenement"
                    : "flux_non_confirme"
                }
              );
            }
          );
          const connection = { child, configKey: this.configKey(terminal), flow };
          this.connections.set(id, connection);
          child.on("error", error => {
            logHikvisionDiagnostic("error", {
              phase: "connexion_alertStream_echec",
              sens: "serveur_vers_terminal",
              transport: "ISAPI_alertStream",
              terminalId: id,
              statutHttpObserve: lastHttpStatus,
              message: error.message
            });
            console.error(`[Hikvision] Connexion alertStream du terminal ${id} impossible:`, error.message);
          });
          child.on("close", code => {
            if (this.connections.get(id) === connection) this.connections.delete(id);
            logHikvisionDiagnostic(this.started && activeTerminals.has(id) ? "warn" : "info", {
              phase: "connexion_alertStream_fermee",
              sens: "serveur_vers_terminal_et_retour",
              transport: "ISAPI_alertStream",
              terminalId: id,
              codeSortie: code,
              statutHttpObserve: lastHttpStatus,
              resultat: this.started && activeTerminals.has(id)
                ? "flux_interrompu_reconnexion_programmee"
                : "connexion_arretee"
            });
            if (this.started && activeTerminals.has(id)) {
              console.warn(`[Hikvision] Flux alertStream du terminal ${id} fermé (code ${code ?? "inconnu"}); reconnexion automatique sous 15 s.`);
              console.warn(`[Hikvision][Terminal ${id}] FLUX INTERROMPU : la connexion sera retentée dans 15 secondes.`);
            }
          });
        } catch (error) {
          logHikvisionDiagnostic("error", {
            phase: "demarrage_alertStream_echec",
            sens: "serveur_vers_terminal",
            transport: "ISAPI_alertStream",
            terminalId: id,
            message: error instanceof Error ? error.message : "Erreur inconnue"
          });
          console.error(`[Hikvision] Démarrage alertStream du terminal ${id} impossible:`, error);
        }
      }
    } catch (error) {
      console.error("[Hikvision] Synchronisation des flux alertStream impossible:", error);
    }
  }

  private static logFlowEstablished(id: number, flow: AlertStreamFlowState): void {
    if (!flow.serverToTerminalConfirmed || !flow.terminalToServerConfirmed || flow.completeMessageLogged) return;
    flow.completeMessageLogged = true;
    console.info(`[Hikvision][Terminal ${id}] FLUX EN PLACE : serveur -> pointeuse et pointeuse -> serveur confirmés.`);
  }
}