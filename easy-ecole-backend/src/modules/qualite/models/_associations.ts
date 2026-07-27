import { QuaNonConformite } from "./QuaNonConformite";
import { QuaActionCorrective } from "./QuaActionCorrective";
import { QuaAudit } from "./QuaAudit";
import { QuaAuditPiste } from "./QuaAuditPiste";
import { QuaRevueDirection } from "./QuaRevueDirection";
import { QuaDecisionRevue } from "./QuaDecisionRevue";
import { QuaEnqueteSatisfaction } from "./QuaEnqueteSatisfaction";
import { QuaReponseSatisfaction } from "./QuaReponseSatisfaction";

QuaNonConformite.hasMany(QuaActionCorrective, { foreignKey: 'nonConformiteId', as: 'actionsCorrectives' })
QuaActionCorrective.belongsTo(QuaNonConformite, { foreignKey: 'nonConformiteId', as: 'nonConformite' })

QuaAudit.hasMany(QuaAuditPiste, { foreignKey: 'auditId', as: 'pistes' })
QuaAuditPiste.belongsTo(QuaAudit, { foreignKey: 'auditId', as: 'audit' })

QuaRevueDirection.hasMany(QuaDecisionRevue, { foreignKey: 'revueDirectionId', as: 'decisions' })
QuaDecisionRevue.belongsTo(QuaRevueDirection, { foreignKey: 'revueDirectionId', as: 'revueDirection' })

QuaEnqueteSatisfaction.hasMany(QuaReponseSatisfaction, { foreignKey: 'enqueteSatisfactionId', as: 'reponses' })
QuaReponseSatisfaction.belongsTo(QuaEnqueteSatisfaction, { foreignKey: 'enqueteSatisfactionId', as: 'enquete' })
