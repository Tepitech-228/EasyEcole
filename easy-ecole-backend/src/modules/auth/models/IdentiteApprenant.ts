
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { SituationsMatrimoniales } from "../../../core/enums/SituationsMatrimoniales";
import { EtatsPhysique } from "../../../core/enums/EtatsPhysique";

export class IdentiteApprenant extends Model<InferAttributes<IdentiteApprenant>, InferCreationAttributes<IdentiteApprenant>> {
  declare id: CreationOptional<string>
  declare nationalite: string
  declare ethnie: CreationOptional<string>
  declare prefecture: CreationOptional<string>
  declare religion: string
  declare situationMatrimoniale: SituationsMatrimoniales
  declare etatPhysique: EtatsPhysique
  declare handicapMoteur: CreationOptional<boolean>
  declare handicapVisuel: CreationOptional<boolean>
  declare handicapAuditif: CreationOptional<boolean>
  declare apprenantId: ForeignKey<Apprenant['id']>
  declare apprenant?: NonAttribute<Apprenant>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

IdentiteApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nationalite: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  ethnie: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  prefecture: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  religion: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  situationMatrimoniale: {
    type: DataTypes.ENUM,
    values: [SituationsMatrimoniales.CELIBATAIRE, SituationsMatrimoniales.MARIE, SituationsMatrimoniales.DIVORCE],
    defaultValue: SituationsMatrimoniales.CELIBATAIRE
  },
  etatPhysique: {
    type: DataTypes.ENUM,
    values: [EtatsPhysique.VALIDE, EtatsPhysique.HANDICAPE],
    defaultValue: EtatsPhysique.VALIDE
  },
  handicapMoteur: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  handicapVisuel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  handicapAuditif: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'IdentiteApprenant',
  tableName:  MODULE_TABLE_PREFIX + 'identites_apprenants',
  timestamps: true
})