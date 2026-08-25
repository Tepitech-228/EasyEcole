import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import BourseConfigurationController from "../controllers/BourseConfigurationController";

const router = express.Router();

router
    .get('/',          [Authenticate, CheckPermission('menu.bourses.configurations')], BourseConfigurationController.getAll)
    .get('/:id',       [Authenticate, CheckPermission('menu.bourses.configurations')], BourseConfigurationController.get)
    .post('/',         [Authenticate, CheckPermission('action.bourse.configuration.creer')], BourseConfigurationController.create)
    .put('/:id',       [Authenticate, CheckPermission('action.bourse.configuration.modifier')], BourseConfigurationController.update)
    .patch('/:id/statut', [Authenticate, CheckPermission('action.bourse.configuration.modifier')], BourseConfigurationController.toggleStatut)

export default router;
