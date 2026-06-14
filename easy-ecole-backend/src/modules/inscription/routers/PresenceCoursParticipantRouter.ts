import express from "express"

import PresenceCoursParticipantController from "../controllers/PresenceCoursParticipantController"

const router = express.Router()

router
    .get('/', PresenceCoursParticipantController.getAllPresencesCoursParticipants)
    .post('/', [], PresenceCoursParticipantController.createPresenceCoursParticipant)
    .get('/:id', PresenceCoursParticipantController.getPresenceCoursParticipant)
    .put('/:id', [], PresenceCoursParticipantController.updatePresenceCoursParticipant)
    .delete('/:id', [], PresenceCoursParticipantController.deletePresenceCoursParticipant)
    .get('/statistics/count', [], PresenceCoursParticipantController.getCount)

export default router