import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Certificat extends Model<InferAttributes<Certificat>, InferCreationAttributes<Certificat>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare code: CreationOptional<string>
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare cours?: NonAttribute<CoursEnLigne>
  declare apprenantId: ForeignKey<Utilisateur['id']>
  declare apprenant?: NonAttribute<Utilisateur>
  declare dateObtention: CreationOptional<Date>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    cours: Association<Certificat, CoursEnLigne>
    apprenant: Association<Certificat, Utilisateur>
  }
}

Certificat.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: { type: new DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  code: { type: new DataTypes.STRING, allowNull: true },
  dateObtention: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Certificat',
  tableName: MODULE_TABLE_PREFIX + 'certificats',
  timestamps: true
})
