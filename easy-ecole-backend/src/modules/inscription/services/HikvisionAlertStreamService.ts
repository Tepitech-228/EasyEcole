import { ChildProcess } from "child_process";
import { PointageTerminal } from "../models/PointageTerminal";
import HikvisionPushController from "../controllers/HikvisionPushController";
import HikvisionIsapiService from "./HikvisionIsapiService";

export default class HikvisionAlertStreamService {
  private static started = false;
  private static connections = new Map<number, { child: ChildProcess; configKey: string }>();
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
      const activeTerminals = new Map(terminals.map(terminal => [Number(terminal.id), terminal]));

      for (const [id, connection] of this.connections) {
        const terminal = activeTerminals.get(id);
        if (!terminal || connection.configKey !== this.configKey(terminal)) {
          connection.child.kill();
          this.connections.delete(id);
        }
      }

      for (const terminal of terminals) {
        if (!this.started) return;
        const id = Number(terminal.id);
        if (this.connections.has(id)) continue;
        try {
          const child = HikvisionIsapiService.startAccessEventStream(terminal, value => {
            void HikvisionPushController.receiveFromStream(terminal, value).catch(error => {
              console.error(`[Hikvision] Événement alertStream du terminal ${id} non traité:`, error);
            });
          });
          const connection = { child, configKey: this.configKey(terminal) };
          this.connections.set(id, connection);
          child.on("error", error => {
            console.error(`[Hikvision] Connexion alertStream du terminal ${id} impossible:`, error.message);
          });
          child.on("close", code => {
            if (this.connections.get(id) === connection) this.connections.delete(id);
            if (this.started && activeTerminals.has(id)) {
              console.warn(`[Hikvision] Flux alertStream du terminal ${id} fermé (code ${code ?? "inconnu"}); reconnexion automatique sous 15 s.`);
            }
          });
        } catch (error) {
          console.error(`[Hikvision] Démarrage alertStream du terminal ${id} impossible:`, error);
        }
      }
    } catch (error) {
      console.error("[Hikvision] Synchronisation des flux alertStream impossible:", error);
    }
  }
}