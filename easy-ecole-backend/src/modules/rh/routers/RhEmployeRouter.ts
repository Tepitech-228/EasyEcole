import express from "express"
import RhEmployeController from "../controllers/RhEmployeController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/employes:
   *   get:
   *     tags: [RH - Employés]
   *     summary: Liste tous les employés
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des employés
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhEmployeController.getAll)
  /**
   * @openapi
   * /rh/employes/statistics/count:
   *   get:
   *     tags: [RH - Employés]
   *     summary: Retourne le nombre total d'employés
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Nombre d'employés
   */
  .get('/statistics/count', [Authenticate, AuthRessourcesHumaines], RhEmployeController.getCount)
  /**
   * @openapi
   * /rh/employes/{id}:
   *   get:
   *     tags: [RH - Employés]
   *     summary: Récupère un employé par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de l'employé
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhEmployeController.get)
  /**
   * @openapi
   * /rh/employes:
   *   post:
   *     tags: [RH - Employés]
   *     summary: Crée un nouvel employé
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               utilisateurId:
   *                 type: string
   *               posteId:
   *                 type: string
   *               departementId:
   *                 type: string
   *               dateEmbauche:
   *                 type: string
   *                 format: date
   *               typeContratId:
   *                 type: string
   *               salaireBase:
   *                 type: number
   *     responses:
   *       201:
   *         description: Employé créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhEmployeController.create)
  /**
   * @openapi
   * /rh/employes/{id}:
   *   put:
   *     tags: [RH - Employés]
   *     summary: Met à jour un employé
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               posteId:
   *                 type: string
   *               departementId:
   *                 type: string
   *               statut:
   *                 type: string
   *               salaireBase:
   *                 type: number
   *     responses:
   *       200:
   *         description: Employé mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhEmployeController.update)
  /**
   * @openapi
   * /rh/employes/{id}:
   *   delete:
   *     tags: [RH - Employés]
   *     summary: Supprime un employé
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Employé supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhEmployeController.delete)

export default router
