import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { DocumentGed } from "./DocumentGed";
import Tag from "./Tag";

export class DocumentTag extends Model<InferAttributes<DocumentTag>, InferCreationAttributes<DocumentTag>> {
  declare id: CreationOptional<number>
  declare documentId: ForeignKey<DocumentGed['id']>
  declare tagId: ForeignKey<Tag['id']>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocumentTag.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  documentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tagId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: MODULE_TABLE_PREFIX + 'document_tags',
  modelName: MODULE_MODEL_PREFIX + 'DocumentTag',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['documentId', 'tagId'] }
  ]
});

export default DocumentTag;
