import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { DocumentGed } from "./DocumentGed";

export class ProcessusGenerateur extends Model<InferAttributes<ProcessusGenerateur>, InferCreationAttributes<ProcessusGenerateur>> {
  declare id: CreationOptional<string>
  declare code: string
  declare libelle: string
  declare description: CreationOptional<string | null>
  declare moduleSource: CreationOptional<string | null>
  declare isActif: CreationOptional<boolean>

  declare documents?: NonAttribute<DocumentGed[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ProcessusGenerateur.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(50),
    allowNull: false
  },
  libelle: {
    type: new DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moduleSource: {
    type: new DataTypes.STRING(50),
    allowNull: true,
    field: 'module_source'
  },
  isActif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_actif'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'ProcessusGenerateur',
  tableName: MODULE_TABLE_PREFIX + 'processus',
  timestamps: true
});
