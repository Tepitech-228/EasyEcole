import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Reclamation } from "./Reclamation";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class ReponseReclamation extends Model<InferAttributes<ReponseReclamation>, InferCreationAttributes<ReponseReclamation>> {
  declare id: CreationOptional<string>
  declare reclamationId: ForeignKey<Reclamation['id']>
  declare repondeurId: ForeignKey<Utilisateur['id']>
  declare reponse: string
  declare date: CreationOptional<Date>
  declare reclamation?: NonAttribute<Reclamation>
  declare repondeur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    reclamation: Association<ReponseReclamation, Reclamation>
    repondeur: Association<ReponseReclamation, Utilisateur>
  };
}

ReponseReclamation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  reponse: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReponseReclamation',
  tableName: MODULE_TABLE_PREFIX + 'reponses_reclamation',
  timestamps: true
})
