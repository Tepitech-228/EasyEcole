import { Request, Response } from "express";
import SseService from "../../../core/helpers/SseService";

export default class SseController {

  static async connect(req: Request, res: Response): Promise<void> {
    const utilisateurId = req.utilisateurId!;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write('event: connected\ndata: {}\n\n');

    const clientId = SseService.addClient(utilisateurId, res);

    const keepAlive = setInterval(() => {
      try { res.write(':keepalive\n\n'); }
      catch { clearInterval(keepAlive); }
    }, 30000);

    res.on('close', () => {
      clearInterval(keepAlive);
      SseService.removeClient(clientId);
    });
  }
}
