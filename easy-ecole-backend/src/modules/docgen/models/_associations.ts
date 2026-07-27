import { DocGenType } from "./DocGenType";
import { DocGenTemplate } from "./DocGenTemplate";
import { DocGenDocument } from "./DocGenDocument";
import { DocGenSignature } from "./DocGenSignature";
import { DocGenWorkflow } from "./DocGenWorkflow";
import { DocGenReference } from "./DocGenReference";

DocGenType.hasMany(DocGenTemplate, { foreignKey: 'typeId', as: 'templates' });
DocGenTemplate.belongsTo(DocGenType, { foreignKey: 'typeId', as: 'type' });

DocGenType.hasMany(DocGenDocument, { foreignKey: 'typeId', as: 'documents' });
DocGenDocument.belongsTo(DocGenType, { foreignKey: 'typeId', as: 'type' });

DocGenTemplate.hasMany(DocGenDocument, { foreignKey: 'templateId', as: 'documents' });
DocGenDocument.belongsTo(DocGenTemplate, { foreignKey: 'templateId', as: 'template' });

DocGenDocument.hasMany(DocGenSignature, { foreignKey: 'documentId', as: 'signatures' });
DocGenSignature.belongsTo(DocGenDocument, { foreignKey: 'documentId', as: 'document' });

DocGenType.hasMany(DocGenWorkflow, { foreignKey: 'typeId', as: 'workflowSteps' });
DocGenWorkflow.belongsTo(DocGenType, { foreignKey: 'typeId', as: 'type' });

DocGenType.hasMany(DocGenReference, { foreignKey: 'typeId', as: 'references' });
DocGenReference.belongsTo(DocGenType, { foreignKey: 'typeId', as: 'type' });
