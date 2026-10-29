import { ChildProcess } from "child_process";
import { PointageTerminal } from "../models/PointageTerminal";
import HikvisionPushController from "../controllers/HikvisionPushController";
import HikvisionIsapiService from "./HikvisionIsapiService";

export default class HikvisionAlertStreamService {
  private static started = false;
  private static connections = new Map<number, ChildProcess>();
  private static reconcileTimer: NodeJS.Timeout | null = null;

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
    for (const child of this.connections.values()) child.kill();
    this.connections.clear();
  }

  private static async reconcile(): Promise<void> {
    try {
      const terminals = await PointageTerminal.findAll({
        where: { protocol: "hikvision_isapi", actif: true }
      });
      const activeIds = new Set(terminals.map(terminal => Number(terminal.id)));

      for (const [id, child] of this.connections) {
        if (!activeIds.has(id)) {
          child.kill();
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
          this.connections.set(id, child);
          child.on("error", error => {
            console.error(`[Hikvision] Connexion alertStream du terminal ${id} impossible:`, error.message);
          });
          child.on("close", code => {
            if (this.connections.get(id) === child) this.connections.delete(id);
            if (this.started && activeIds.has(id)) {
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