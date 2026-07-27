import { Request, Response } from "express";
import { DomainTreeService } from "../services/DomainTreeService";

export default class AcademicTreeController {
  static async getTree(req: Request, res: Response): Promise<Response> {
    try {
      const tree = await DomainTreeService.getTree();
      return res.json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Erreur' });
    }
  }
}
