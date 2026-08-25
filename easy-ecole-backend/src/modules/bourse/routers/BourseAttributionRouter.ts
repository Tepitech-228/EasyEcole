import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import BourseAttributionController from "../controllers/BourseAttributionController";

const router = express.Router();

router
    // ── Bourse active d'un étudiant ──
    .get('/etudiants/:dossierId/bourse',
        [Authenticate, CheckPermission('menu.bourses.attributions')],
        BourseAttributionController.getBourseActive)

    // ── Résumé financier avec bourse ──
    .get('/etudiants/:dossierId/frais',
        [Authenticate, CheckPermission('menu.bourses.attributions')],
        BourseAttributionController.resumeFinancier)

    // ── Historique des bourses d'un étudiant ──
    .get('/etudiants/:dossierId/bourses/historique',
        [Authenticate, CheckPermission('menu.bourses.attributions')],
        BourseAttributionController.historique)

    // ── Attribuer une bourse ──
    .post('/etudiants/:dossierId/bourse',
        [Authenticate, CheckPermission('action.bourse.attribution.creer')],
        BourseAttributionController.attribuer)

    // ── Modifier une attribution ──
    .put('/attributions/:id',
        [Authenticate, CheckPermission('action.bourse.attribution.modifier')],
        BourseAttributionController.modifier)

    // ── Suspendre une bourse ──
    .patch('/attributions/:id/suspendre',
        [Authenticate, CheckPermission('action.bourse.attribution.suspendre')],
        BourseAttributionController.suspendre)

    // ── Réactiver une bourse ──
    .patch('/attributions/:id/reactiver',
        [Authenticate, CheckPermission('action.bourse.attribution.reactiver')],
        BourseAttributionController.reactiver)

export default router;
