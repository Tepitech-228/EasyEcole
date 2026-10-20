import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { Utilisateur } from "./Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class SiteUtilisateur extends Model<InferAttributes<SiteUtilisateur>, InferCreationAttributes<SiteUtilisateur>> {
  declare id: CreationOptional<number>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare etablissementId: ForeignKey<Etablissement['id']>
  declare affectePar: CreationOptional<number | null>
  declare static associations: {
    etablissement: Association<SiteUtilisateur, Etablissement>
  }
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

SiteUtilisateur.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'uq_utilisateur_etablissement'
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'uq_utilisateur_etablissement'
  },
  affectePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'SiteUtilisateur',
  tableName: MODULE_TABLE_PREFIX + 'utilisateur_etablissements',
  timestamps: true
})
