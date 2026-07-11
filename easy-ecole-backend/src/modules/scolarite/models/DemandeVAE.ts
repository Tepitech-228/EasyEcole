import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Parcours } from "../../inscription/models/Parcours";

export class DemandeVAE extends Model<InferAttributes<DemandeVAE>, InferCreationAttributes<DemandeVAE>> {
  declare id: CreationOptional<string>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare type: 'vae' | 'vap' | 'equivalence'
  declare parcoursCibleId: ForeignKey<Parcours['id']>
  declare parcoursCible?: NonAttribute<Parcours>
  declare justificatifs: CreationOptional<object>
  declare statut: CreationOptional<'soumise' | 'instruction' | 'acceptee' | 'rejetee'>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandeVAE.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('vae', 'vap', 'equivalence'),
    allowNull: false
  },
  justificatifs: {
    type: DataTypes.JSON,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('soumise', 'instruction', 'acceptee', 'rejetee'),
    defaultValue: 'soumise'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DemandeVAE',
  tableName: MODULE_TABLE_PREFIX + 'demandes_vae',
  timestamps: true
})
