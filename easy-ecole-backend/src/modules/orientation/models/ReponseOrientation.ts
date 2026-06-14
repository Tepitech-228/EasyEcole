import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeOrientation } from "./DemandeOrientation";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class ReponseOrientation extends Model<InferAttributes<ReponseOrientation>, InferCreationAttributes<ReponseOrientation>> {
  declare id: CreationOptional<string>
  declare message: CreationOptional<string>
  declare dateReponse: Date
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare demandeOrientationId: ForeignKey<DemandeOrientation['id']>
  declare demandeOrientation?: NonAttribute<DemandeOrientation>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ReponseOrientation.init({
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
  modelName: MODULE_MODEL_PREFIX + 'ReponseOrientation',
  tableName: MODULE_TABLE_PREFIX + 'reponses_orientation',
  timestamps: true
})