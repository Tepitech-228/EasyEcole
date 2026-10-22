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
import { ProgressionApprenant } from "./ProgressionApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Cours } from "../../inscription/models/Cours";
import { TarifCredit } from "./TarifCredit";
import { Enveloppe } from "./Enveloppe";
import { Mouvement } from "./Mouvement";
import { Encaissement } from "./Encaissement";
import { SelectionCours } from "./SelectionCours";
import { Audit } from "./Audit";
import { AnneeElearning } from "./AnneeElearning";
import { Examen } from "./Examen";
import { NoteExamen } from "./NoteExamen";

CoursEnLigne.belongsTo(Cours, { as: 'coursPedagogique', foreignKey: 'coursId', constraints: false });
Cours.hasMany(CoursEnLigne, { foreignKey: 'coursId', as: 'coursEnLigne', constraints: false });
CoursEnLigne.belongsTo(Cours, { as: 'ue', foreignKey: 'ueId', constraints: false });
CoursEnLigne.belongsTo(Utilisateur, { as: 'chargeSupport', foreignKey: 'chargeSupportId', constraints: false });
CoursEnLigne.belongsTo(Utilisateur, { as: 'professeurResponsable', foreignKey: 'professeurId', constraints: false });

Enveloppe.hasMany(Mouvement, { foreignKey: 'enveloppeId', as: 'mouvements' });
Mouvement.belongsTo(Enveloppe, { foreignKey: 'enveloppeId', as: 'enveloppe' });
Enveloppe.hasMany(Encaissement, { foreignKey: 'enveloppeId', as: 'encaissements' });
Encaissement.belongsTo(Enveloppe, { foreignKey: 'enveloppeId', as: 'enveloppe' });
Enveloppe.hasMany(SelectionCours, { foreignKey: 'enveloppeId', as: 'selections' });
SelectionCours.belongsTo(Enveloppe, { foreignKey: 'enveloppeId', as: 'enveloppe' });
CoursEnLigne.hasMany(SelectionCours, { foreignKey: 'coursId', as: 'selections' });
SelectionCours.belongsTo(CoursEnLigne, { foreignKey: 'coursId', as: 'cours' });
Utilisateur.hasMany(Enveloppe, { foreignKey: 'utilisateurId', as: 'enveloppesElearning' });
Enveloppe.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });
Utilisateur.hasMany(Encaissement, { foreignKey: 'utilisateurId', as: 'encaissementsElearning' });
Encaissement.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });
Utilisateur.hasMany(Audit, { foreignKey: 'acteurId', as: 'auditsElearning' });
Audit.belongsTo(Utilisateur, { foreignKey: 'acteurId', as: 'acteur' });

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
CoursEnLigne.hasMany(Examen, { foreignKey: 'coursId', as: 'examens' })
Examen.belongsTo(CoursEnLigne, { as: 'cours', foreignKey: 'coursId' })
Examen.hasMany(NoteExamen, { foreignKey: 'examenId', as: 'notes' })
NoteExamen.belongsTo(Examen, { foreignKey: 'examenId', as: 'examen' })
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

Support.hasMany(ProgressionApprenant, { foreignKey: 'supportId', as: 'progressions' })
ProgressionApprenant.belongsTo(Support, { as: 'support', foreignKey: 'supportId' })
Utilisateur.hasMany(ProgressionApprenant, { foreignKey: 'apprenantId', as: 'progressionsElearning' })
ProgressionApprenant.belongsTo(Utilisateur, { as: 'apprenant', foreignKey: 'apprenantId' })

// CoursEnLigne -> Enseignant (Utilisateur)
CoursEnLigne.belongsTo(Utilisateur, { as: 'enseignant', foreignKey: 'enseignantId' })
Utilisateur.hasMany(CoursEnLigne, { foreignKey: 'enseignantId', as: 'coursEnLigne' })

// Salon createdBy (sans FK constraint car type mismatch avec la base existante)
Salon.belongsTo(Utilisateur, { as: 'createdBy', foreignKey: 'createdById', constraints: false })
Utilisateur.hasMany(Salon, { foreignKey: 'createdById', as: 'salonsCrees' })

// ParticipantSalon -> Utilisateur
ParticipantSalon.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId', constraints: false })
Utilisateur.hasMany(ParticipantSalon, { foreignKey: 'utilisateurId', as: 'participationsSalons' })
