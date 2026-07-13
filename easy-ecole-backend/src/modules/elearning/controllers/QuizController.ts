import { Request, Response } from "express";
import { Quiz } from "../models/Quiz";
import { ReponseQuiz } from "../models/ReponseQuiz";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class QuizController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const coursId = req.query.coursId as string | undefined;
      const where: any = {};
      if (coursId) where.coursId = coursId;
      const quizList = await Quiz.findAll({
        where,
        include: [Quiz.associations.cours],
        order: [['createdAt', 'DESC']]
      });
      const role = (req as any).utilisateurRole;
      if (role === RolesUtilisateur.APPRENANT) {
        const userId = (req as any).utilisateurId;
        const result = [];
        for (const q of quizList) {
          const reponse = await ReponseQuiz.findOne({
            where: { quizId: q.id, apprenantId: userId }
          });
          result.push({ ...q.toJSON(), questions: undefined, reponse: reponse || null });
        }
        return res.status(200).send(result);
      }
      return res.status(200).send(quizList);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const quiz = await Quiz.findByPk(req.params.id, {
        include: [Quiz.associations.cours]
      });
      if (!quiz) return res.status(404).json({ success: false, message: "Quiz non trouvé" });
      return res.status(200).send(quiz);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Réservé aux enseignants" });
    }
    try {
      const quiz = await Quiz.create({
        titre: req.body.titre,
        description: req.body.description,
        tempsLimite: req.body.tempsLimite || null,
        questions: JSON.stringify(req.body.questions || []),
        coursId: req.body.coursId,
      });
      return res.status(201).send(quiz);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async repondre(req: Request, res: Response): Promise<Response> {
    try {
      const quiz = await Quiz.findByPk(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, message: "Quiz non trouvé" });

      const questions = JSON.parse(quiz.questions);
      const reponsesData = req.body.reponses || [];
      let score = 0;
      for (const r of reponsesData) {
        const q = questions.find((qq: any) => qq.id === r.questionId);
        if (q && q.reponseCorrecte === r.reponse) score++;
      }

      const reponse = await ReponseQuiz.create({
        quizId: req.params.id as any,
        apprenantId: (req as any).utilisateurId,
        reponses: JSON.stringify(reponsesData),
        score,
        total: questions.length,
      });
      return res.status(201).send({ id: reponse.id, score, total: questions.length });
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async resultat(req: Request, res: Response): Promise<Response> {
    try {
      const reponse = await ReponseQuiz.findOne({
        where: { quizId: req.params.id, apprenantId: (req as any).utilisateurId },
        include: [{ association: ReponseQuiz.associations.quiz, attributes: ['titre'] }]
      });
      if (!reponse) return res.status(404).json({ success: false, message: "Aucun résultat trouvé" });
      return res.status(200).send(reponse);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const quiz = await Quiz.findByPk(req.params.id);
      if (!quiz) return res.status(404).json({ success: false });
      await ReponseQuiz.destroy({ where: { quizId: quiz.id } });
      await quiz.destroy();
      return res.status(200).json({ success: true });
    } catch { return res.status(500).json({ success: false }); }
  }
}
