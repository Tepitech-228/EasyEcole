import express from "express"
import CompteController from "../controllers/CompteController"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/comptes:
 *   get:
 *     tags: [Comptes Comptables]
 *     summary: Liste tous les comptes comptables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des comptes comptables
 */
router
  .get('/', CompteController.getAllComptes)

/**
 * @openapi
 * /comptabilite/comptes/classe/{classe}:
 *   get:
 *     tags: [Comptes Comptables]
 *     summary: Récupère les comptes par classe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classe
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comptes trouvés
 */
  .get('/classe/:classe', CompteController.getComptesByClasse)

/**
 * @openapi
 * /comptabilite/comptes/{id}:
 *   get:
 *     tags: [Comptes Comptables]
 *     summary: Récupère un compte comptable par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compte comptable trouvé
 */
  .get('/:id', CompteController.getCompte)

/**
 * @openapi
 * /comptabilite/comptes:
 *   post:
 *     tags: [Comptes Comptables]
 *     summary: Crée un nouveau compte comptable
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
 *         description: Compte comptable créé
 */
  .post('/', CompteController.createCompte)

/**
 * @openapi
 * /comptabilite/comptes/{id}:
 *   put:
 *     tags: [Comptes Comptables]
 *     summary: Met à jour un compte comptable
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Compte comptable mis à jour
 */
  .put('/:id', CompteController.updateCompte)

export default router
