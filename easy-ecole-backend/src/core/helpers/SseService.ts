import { Response } from "express";

interface SseClient {
  id: number;
  utilisateurId: number;
  res: Response;
}

class SseService {
  private clients: SseClient[] = [];
  private clientIdCounter: number = 0;
  private readonly MAX_CLIENTS: number = 200;
  private activeClients: number = 0;

  addClient(utilisateurId: number, res: Response): number {
    if (this.activeClients >= this.MAX_CLIENTS) return -1;
    const clientId = ++this.clientIdCounter;
    this.clients.push({ id: clientId, utilisateurId, res });
    this.activeClients++;
    res.on('close', () => this.removeClient(clientId));
    return clientId;
  }

  removeClient(clientId: number): void {
    const before = this.clients.length;
    this.clients = this.clients.filter(c => c.id !== clientId);
    if (this.clients.length < before) {
      this.activeClients = Math.max(0, this.activeClients - 1);
    }
  }

  get maxClients(): number {
    return this.MAX_CLIENTS;
  }

  sendToUser(utilisateurId: number, event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients
      .filter(c => c.utilisateurId === utilisateurId)
      .forEach(c => {
        try { c.res.write(payload); }
        catch { this.removeClient(c.id); }
      });
  }

  sendToAll(event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(c => {
      try { c.res.write(payload); }
      catch { this.removeClient(c.id); }
    });
  }

  broadcastByRole(utilisateurIds: number[], event: string, data: any): void {
    const ids = new Set(utilisateurIds);
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients
      .filter(c => ids.has(c.utilisateurId))
      .forEach(c => {
        try { c.res.write(payload); }
        catch { this.removeClient(c.id); }
      });
  }

  get connectedClients(): number {
    return this.clients.length;
  }
}

export default new SseService();
