import { Request, Response } from "express";
import { Op } from "sequelize";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { ModuleElearning } from "../models/ModuleElearning";
import { Quiz } from "../models/Quiz";
import { ReponseQuiz } from "../models/ReponseQuiz";
import { Devoir } from "../models/Devoir";
import { SoumissionDevoir } from "../models/SoumissionDevoir";
import { Certificat } from "../models/Certificat";

export default class ProgressionController {

  static async getProgression(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).utilisateurId;

      const totalCours = await CoursEnLigne.count();
      const totalQuiz = await Quiz.count();
      const totalDevoirs = await Devoir.count();

      const quizFaits = await ReponseQuiz.count({ where: { apprenantId: userId } });
      const devoirsRemis = await SoumissionDevoir.count({ where: { apprenantId: userId } });
      const certifications = await Certificat.count({ where: { apprenantId: userId } });

      const moyQuiz = await ReponseQuiz.findOne({
        where: { apprenantId: userId },
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('score')), 'moyenne']]
      });

      const quizRecents = await ReponseQuiz.findAll({
        where: { apprenantId: userId },
        include: [{ association: ReponseQuiz.associations.quiz, attributes: ['titre'] }],
        order: [['date', 'DESC']],
        limit: 5
      });

      return res.status(200).send({
        totalCours,
        totalModules: await ModuleElearning.count(),
        totalQuiz,
        totalDevoirs,
        quizFaits,
        devoirsRemis,
        certifications,
        moyenneQuiz: Math.round(parseFloat((moyQuiz as any)?.dataValues?.moyenne || '0') * 10) / 10,
        quizRecents
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
