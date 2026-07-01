import { CoursEnLigne } from "./CoursEnLigne";
import { ModuleElearning } from "./ModuleElearning";
import { Support } from "./Support";
import { Commentaire } from "./Commentaire";
import { Salon } from "./Salon";
import { Message } from "./Message";
import { ParticipantSalon } from "./ParticipantSalon";
import { CouplageMail } from "./CouplageMail";
import { Notification } from "./Notification";
import { Devoir } from "./Devoir";
import { SoumissionDevoir } from "./SoumissionDevoir";
import { Quiz } from "./Quiz";
import { ReponseQuiz } from "./ReponseQuiz";
import { Certificat } from "./Certificat";
import { Utilisateur } from "../../auth/models/Utilisateur";

CoursEnLigne.hasMany(ModuleElearning, { foreignKey: 'coursId', as: 'modules' })
ModuleElearning.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })

ModuleElearning.hasMany(Support, { foreignKey: 'moduleId', as: 'supports' })
Support.belongsTo(ModuleElearning, { as: 'module', foreignKey: 'moduleId' })

Support.hasMany(Commentaire, { foreignKey: 'supportId', as: 'commentaires' })
Commentaire.belongsTo(Support, { as: 'support', foreignKey: 'supportId' })

Support.hasMany(CouplageMail, { foreignKey: 'supportId', as: 'couplagesMail' })
CouplageMail.belongsTo(Support, { as: 'support', foreignKey: 'supportId' })

CoursEnLigne.hasMany(Salon, { foreignKey: 'coursId', as: 'salons' })
Salon.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })

Salon.hasMany(Message, { foreignKey: 'salonId', as: 'messages' })
Message.belongsTo(Salon, { as: 'salon', foreignKey: 'salonId' })

Salon.hasMany(ParticipantSalon, { foreignKey: 'salonId', as: 'participants' })
ParticipantSalon.belongsTo(Salon, { as: 'salon', foreignKey: 'salonId' })

CoursEnLigne.hasMany(Devoir, { foreignKey: 'coursId', as: 'devoirs' })
Devoir.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })
Utilisateur.hasMany(Devoir, { foreignKey: 'enseignantId', as: 'devoirs' })
Devoir.belongsTo(Utilisateur, { as: 'enseignant', foreignKey: 'enseignantId' })

Devoir.hasMany(SoumissionDevoir, { foreignKey: 'devoirId', as: 'soumissions' })
SoumissionDevoir.belongsTo(Devoir, { as: 'devoir', foreignKey: 'devoirId' })
Utilisateur.hasMany(SoumissionDevoir, { foreignKey: 'apprenantId', as: 'soumissionsDevoirs' })
SoumissionDevoir.belongsTo(Utilisateur, { as: 'apprenant', foreignKey: 'apprenantId' })

CoursEnLigne.hasMany(Quiz, { foreignKey: 'coursId', as: 'quiz' })
Quiz.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })

Quiz.hasMany(ReponseQuiz, { foreignKey: 'quizId', as: 'reponses' })
ReponseQuiz.belongsTo(Quiz, { as: 'quiz', foreignKey: 'quizId' })
Utilisateur.hasMany(ReponseQuiz, { foreignKey: 'apprenantId', as: 'reponsesQuiz' })
ReponseQuiz.belongsTo(Utilisateur, { as: 'apprenant', foreignKey: 'apprenantId' })

CoursEnLigne.hasMany(Certificat, { foreignKey: 'coursId', as: 'certificats' })
Certificat.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })
Utilisateur.hasMany(Certificat, { foreignKey: 'apprenantId', as: 'certificats' })
Certificat.belongsTo(Utilisateur, { as: 'apprenant', foreignKey: 'apprenantId' })
