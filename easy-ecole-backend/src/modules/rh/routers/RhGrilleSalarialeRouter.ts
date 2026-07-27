import express from "express"
import RhGrilleSalarialeController from "../controllers/RhGrilleSalarialeController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/grilles-salariales:
   *   get:
   *     tags: [RH - Grilles salariales]
   *     summary: Liste toutes les grilles salariales
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des grilles salariales
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.getAll)
  /**
   * @openapi
   * /rh/grilles-salariales/by-poste/{posteId}:
   *   get:
   *     tags: [RH - Grilles salariales]
   *     summary: Liste les grilles salariales par poste
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: posteId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Grilles salariales du poste
   */
  .get('/by-poste/:posteId', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.getByPoste)
  /**
   * @openapi
   * /rh/grilles-salariales/by-categorie/{categorieId}:
   *   get:
   *     tags: [RH - Grilles salariales]
   *     summary: Liste les grilles salariales par catégorie professionnelle
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: categorieId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Grilles salariales de la catégorie
   */
  .get('/by-categorie/:categorieId', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.getByCategorie)
  /**
   * @openapi
   * /rh/grilles-salariales/{id}:
   *   get:
   *     tags: [RH - Grilles salariales]
   *     summary: Récupère une grille salariale par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la grille salariale
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.get)
  /**
   * @openapi
   * /rh/grilles-salariales:
   *   post:
   *     tags: [RH - Grilles salariales]
   *     summary: Crée une nouvelle grille salariale
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               categorieId:
   *                 type: string
   *               posteId:
   *                 type: string
   *               salaireMin:
   *                 type: number
   *               salaireMax:
   *                 type: number
   *               echelon:
   *                 type: string
   *               anneeVigueur:
   *                 type: number
   *     responses:
   *       201:
   *         description: Grille salariale créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.create)
  /**
   * @openapi
   * /rh/grilles-salariales/simuler:
   *   post:
   *     tags: [RH - Grilles salariales]
   *     summary: Simule un salaire par rapport à la grille
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               salaireBase:
   *                 type: number
   *               posteId:
   *                 type: string
   *               categorieId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Résultat de la simulation
   */
  .post('/simuler', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.simuler)
  /**
   * @openapi
   * /rh/grilles-salariales/{id}:
   *   put:
   *     tags: [RH - Grilles salariales]
   *     summary: Met à jour une grille salariale
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
   *               salaireMin:
   *                 type: number
   *               salaireMax:
   *                 type: number
   *               echelon:
   *                 type: string
   *               anneeVigueur:
   *                 type: number
   *     responses:
   *       200:
   *         description: Grille salariale mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.update)
  /**
   * @openapi
   * /rh/grilles-salariales/{id}:
   *   delete:
   *     tags: [RH - Grilles salariales]
   *     summary: Supprime une grille salariale
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Grille salariale supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhGrilleSalarialeController.delete)

export default router
