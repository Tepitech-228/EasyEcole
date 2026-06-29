import express from "express"

import SalleDeClasseController from "../controllers/SalleDeClasseController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /inscription/sallesDeClasse:
 *   get:
 *     tags: [Salles de classe]
 *     summary: Liste toutes les salles de classe
 *     responses:
 *       200:
 *         description: Liste des salles de classe
 */
router
    .get('/', SalleDeClasseController.getAllSallesDeClasse)
/**
 * @openapi
 * /inscription/sallesDeClasse:
 *   post:
 *     tags: [Salles de classe]
 *     summary: Crée une nouvelle salle de classe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Salle de classe créée
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.salle.creer')], SalleDeClasseController.createSalleDeClasse)
/**
 * @openapi
 * /inscription/sallesDeClasse/{id}:
 *   get:
 *     tags: [Salles de classe]
 *     summary: Récupère une salle de classe par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la salle de classe
 *     responses:
 *       200:
 *         description: Détail de la salle de classe
 *       404:
 *         description: Salle de classe non trouvée
 */
    .get('/:id', SalleDeClasseController.getSalleDeClasse)
/**
 * @openapi
 * /inscription/sallesDeClasse/{id}:
 *   put:
 *     tags: [Salles de classe]
 *     summary: Met à jour une salle de classe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Salle de classe mise à jour
 *       404:
 *         description: Salle de classe non trouvée
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.salle.modifier')], SalleDeClasseController.updateSalleDeClasse)
/**
 * @openapi
 * /inscription/sallesDeClasse/{id}:
 *   delete:
 *     tags: [Salles de classe]
 *     summary: Supprime une salle de classe
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salle de classe supprimée
 *       404:
 *         description: Salle de classe non trouvée
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.salle.supprimer')], SalleDeClasseController.deleteSalleDeClasse)
/**
 * @openapi
 * /inscription/sallesDeClasse/statistics/count:
 *   get:
 *     tags: [Salles de classe]
 *     summary: Retourne le nombre total de salles de classe
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de salles de classe
 */
    .get('/statistics/count', [AuthInstitution], SalleDeClasseController.getCount)

export default router