import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Devoir } from "./Devoir";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class SoumissionDevoir extends Model<InferAttributes<SoumissionDevoir>, InferCreationAttributes<SoumissionDevoir>> {
  declare id: CreationOptional<string>
  declare devoirId: ForeignKey<Devoir['id']>
  declare devoir?: NonAttribute<Devoir>
  declare apprenantId: ForeignKey<Utilisateur['id']>
  declare apprenant?: NonAttribute<Utilisateur>
  declare fichier: string
  declare note: CreationOptional<number>
  declare commentaire: CreationOptional<string>
  declare dateSoumission: CreationOptional<Date>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    devoir: Association<SoumissionDevoir, Devoir>
    apprenant: Association<SoumissionDevoir, Utilisateur>
  }
}

SoumissionDevoir.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichier: { type: new DataTypes.STRING, allowNull: false },
  note: { type: DataTypes.FLOAT, allowNull: true },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  dateSoumission: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SoumissionDevoir',
  tableName: MODULE_TABLE_PREFIX + 'soumissions_devoirs',
  timestamps: true
})
