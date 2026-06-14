import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { AdresseCaissierBanque } from "./AdresseCaissierBanque";
import { Banque } from "./Banque";

export class CaissierBanque extends Model<InferAttributes<CaissierBanque>, InferCreationAttributes<CaissierBanque>> {
  declare id: CreationOptional<string>
  declare dateNaissance: CreationOptional<Date>
  declare lieuNaissance: CreationOptional<string>
  declare fonction: CreationOptional<string>
  declare adresseId: ForeignKey<AdresseCaissierBanque['id']>
  declare adresse?: AdresseCaissierBanque
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare banqueId: ForeignKey<Banque['id']>
  declare banque?: NonAttribute<Banque>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    adresse: Association<CaissierBanque, AdresseCaissierBanque>
    utilisateur: Association<CaissierBanque, Utilisateur>
    banque: Association<CaissierBanque, Banque>
  }
}

CaissierBanque.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lieuNaissance: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  fonction: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'CaissierBanque',
  tableName:  MODULE_TABLE_PREFIX + 'caissiers_banque',
  timestamps: true
})