import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { ModuleElearning } from "./ModuleElearning";
import { Commentaire } from "./Commentaire";
import { CouplageMail } from "./CouplageMail";

export class Support extends Model<InferAttributes<Support>, InferCreationAttributes<Support>> {
  declare id: CreationOptional<string>
  declare moduleId: ForeignKey<ModuleElearning['id']>
  declare type: string
  declare fichierOriginal: string
  declare fichierCompresse: CreationOptional<string>
  declare dureeVideo: CreationOptional<string>
  declare taille: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare module?: NonAttribute<ModuleElearning>
  declare commentaires?: NonAttribute<Commentaire[]>
  declare couplagesMail?: NonAttribute<CouplageMail[]>

  declare static associations: {
    module: Association<Support, ModuleElearning>
    commentaires: Association<Support, Commentaire>
    couplagesMail: Association<Support, CouplageMail>
  };
}

Support.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  moduleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  fichierOriginal: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  fichierCompresse: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  dureeVideo: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  taille: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Support',
  tableName: MODULE_TABLE_PREFIX + 'supports',
  timestamps: true
})
