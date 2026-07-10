import { Response } from "express";

interface SseClient {
  id: number;
  utilisateurId: number;
  res: Response;
}

class SseService {
  private clients: SseClient[] = [];
  private clientIdCounter: number = 0;

  addClient(utilisateurId: number, res: Response): number {
    const clientId = ++this.clientIdCounter;
    this.clients.push({ id: clientId, utilisateurId, res });
    res.on('close', () => this.removeClient(clientId));
    return clientId;
  }

  removeClient(clientId: number): void {
    this.clients = this.clients.filter(c => c.id !== clientId);
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
