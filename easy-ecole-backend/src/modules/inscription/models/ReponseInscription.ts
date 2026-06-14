import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeInscription } from "./DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class ReponseInscription extends Model<InferAttributes<ReponseInscription>, InferCreationAttributes<ReponseInscription>> {
  declare id: CreationOptional<string>
  declare message: CreationOptional<string>
  declare dateReponse: Date
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare demandeInscription?: NonAttribute<DemandeInscription>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ReponseInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateReponse: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReponseInscription',
  tableName: MODULE_TABLE_PREFIX + 'reponses_inscription',
  timestamps: true
})