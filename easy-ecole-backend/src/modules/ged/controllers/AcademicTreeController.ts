import { Request, Response } from "express";
import { DomainTreeService } from "../services/DomainTreeService";

export default class AcademicTreeController {
  static async getTree(req: Request, res: Response): Promise<Response> {
    try {
      const tree = await DomainTreeService.getTree();
      return res.json(tree);
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
}
