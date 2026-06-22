import { CoursEnLigne } from "./CoursEnLigne";
import { ModuleElearning } from "./ModuleElearning";
import { Support } from "./Support";
import { Commentaire } from "./Commentaire";
import { Salon } from "./Salon";
import { Message } from "./Message";
import { ParticipantSalon } from "./ParticipantSalon";
import { CouplageMail } from "./CouplageMail";

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
