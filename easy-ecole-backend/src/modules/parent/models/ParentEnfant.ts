import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ParentModule";

export class ParentEnfant extends Model<InferAttributes<ParentEnfant>, InferCreationAttributes<ParentEnfant>> {
  declare id: CreationOptional<number>
  declare parentUtilisateurId: ForeignKey<Utilisateur['id']>
  declare apprenantId: ForeignKey<Apprenant['id']>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ParentEnfant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  parentUtilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'aut_utilisateurs', key: 'id' }
  },
  apprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'aut_apprenants', key: 'id' }
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ParentEnfant',
  tableName: MODULE_TABLE_PREFIX + 'parents_enfants',
  timestamps: true
})
