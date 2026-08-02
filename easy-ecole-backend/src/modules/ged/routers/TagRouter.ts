import express from "express";
import TagController from "../controllers/TagController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router();

router
    // CRUD tags
        /**
     * @openapi
     * /tags:
     *   get:
     *     tags: [GED]
     *     summary: Liste des tags
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: search
     *         schema: { type: string }
     *       - in: query
     *         name: page
     *         schema: { type: integer }
     *       - in: query
     *         name: limit
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Liste des tags
     */
.get('/', [Authenticate], TagController.getAll)
        /**
     * @openapi
     * /tags/:id:
     *   get:
     *     tags: [GED]
     *     summary: Détail d'un tag
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Tag
     */
.get('/:id', [Authenticate], TagController.getById)
        /**
     * @openapi
     * /tags:
     *   post:
     *     tags: [GED]
     *     summary: Créer un tag (admin)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       201:
     *         description: Tag créé
     */
.post('/', [Authenticate], TagController.create)
        /**
     * @openapi
     * /tags/:id:
     *   put:
     *     tags: [GED]
     *     summary: Modifier un tag (admin)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Tag modifié
     */
.put('/:id', [Authenticate], TagController.update)
        /**
     * @openapi
     * /tags/:id:
     *   delete:
     *     tags: [GED]
     *     summary: Supprimer un tag (admin)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Tag supprimé
     */
.delete('/:id', [Authenticate], TagController.delete)

    // Association document ⇔ tags
        /**
     * @openapi
     * /tags/document/:id:
     *   get:
     *     tags: [GED]
     *     summary: Tags d'un document
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Tags du document
     */
.get('/document/:id', [Authenticate], TagController.getDocumentTags)
        /**
     * @openapi
     * /tags/document/:id/tag/:tagId:
     *   post:
     *     tags: [GED]
     *     summary: Associer un tag à un document
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       201:
     *         description: Tag associé
     */
.post('/document/:id/tag/:tagId', [Authenticate], TagController.addTagToDocument)
        /**
     * @openapi
     * /tags/document/:id/tag/:tagId:
     *   delete:
     *     tags: [GED]
     *     summary: Retirer un tag d'un document
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Tag retiré
     */
.delete('/document/:id/tag/:tagId', [Authenticate], TagController.removeTagFromDocument)

export default router;
