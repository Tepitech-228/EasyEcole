import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Validateur extends Model<InferAttributes<Validateur>, InferCreationAttributes<Validateur>> {
  declare id: CreationOptional<string>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare niveau: number
  declare montantMax: number
  declare actif: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<Validateur, Utilisateur>
  };
}

Validateur.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  niveau: { type: DataTypes.INTEGER, allowNull: false },
  montantMax: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Validateur',
  tableName: MODULE_TABLE_PREFIX + 'validateurs',
  timestamps: true
})
