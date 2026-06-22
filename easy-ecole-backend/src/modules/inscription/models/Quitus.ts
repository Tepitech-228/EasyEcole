import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { PaiementInscription } from "./PaiementInscription";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class Quitus extends Model<InferAttributes<Quitus>, InferCreationAttributes<Quitus>> {
  declare id: CreationOptional<string>
  declare paiementInscriptionId: ForeignKey<PaiementInscription['id']>
  declare code: string
  declare dateEmission: CreationOptional<Date>
  declare fichierPDF: CreationOptional<string>
  declare statut: string
  declare paiementInscription?: NonAttribute<PaiementInscription>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    paiementInscription: Association<Quitus, PaiementInscription>
  };
}

Quitus.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  dateEmission: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  fichierPDF: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('genere', 'valide', 'annule'),
    defaultValue: 'genere',
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Quitus',
  tableName: MODULE_TABLE_PREFIX + 'quitus',
  timestamps: true
})
