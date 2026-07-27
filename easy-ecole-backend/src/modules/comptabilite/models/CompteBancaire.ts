import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { ReleveBancaire } from "./ReleveBancaire";

export class CompteBancaire extends Model<InferAttributes<CompteBancaire>, InferCreationAttributes<CompteBancaire>> {
  declare id: CreationOptional<number>
  declare banque: string
  declare rib: string
  declare iban: string
  declare swift: CreationOptional<string | null>
  declare titulaire: string
  declare numeroCompte: string
  declare solde: CreationOptional<number>
  declare devise: CreationOptional<string>
  declare actif: CreationOptional<boolean>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare releves?: NonAttribute<ReleveBancaire[]>

  declare static associations: {
    releves: Association<CompteBancaire, ReleveBancaire>
  }
}

CompteBancaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  banque: { type: DataTypes.STRING(100), allowNull: false },
  rib: { type: DataTypes.STRING(50), allowNull: false },
  iban: { type: DataTypes.STRING(50), allowNull: false },
  swift: { type: DataTypes.STRING(20), allowNull: true },
  titulaire: { type: DataTypes.STRING(200), allowNull: false },
  numeroCompte: { type: DataTypes.STRING(50), allowNull: false },
  solde: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  devise: { type: DataTypes.STRING(5), defaultValue: 'XOF' },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CompteBancaire',
  tableName: MODULE_TABLE_PREFIX + 'comptes_bancaires',
  timestamps: true
})
