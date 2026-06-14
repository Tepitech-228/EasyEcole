import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class PanierParcoursChoisi extends Model<InferAttributes<PanierParcoursChoisi>, InferCreationAttributes<PanierParcoursChoisi>> {
  declare id: CreationOptional<string>
  declare parcoursChoisiId: ForeignKey<ParcoursChoisi['id']>
  declare parcoursChoisi?: NonAttribute<ParcoursChoisi>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

PanierParcoursChoisi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_TABLE_PREFIX + 'PanierParcoursChoisi',
  tableName:  MODULE_TABLE_PREFIX + 'panier_parcours_choisis',
  timestamps: true
})