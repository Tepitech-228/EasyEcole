import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Demande } from "./Demande";
import { Validateur } from "./Validateur";

export class Validation extends Model<InferAttributes<Validation>, InferCreationAttributes<Validation>> {
  declare id: CreationOptional<string>
  declare demandeId: ForeignKey<Demande['id']>
  declare demande?: NonAttribute<Demande>
  declare validateurId: ForeignKey<Validateur['id']>
  declare validateur?: NonAttribute<Validateur>
  declare statut: string
  declare commentaire: CreationOptional<string>
  declare date: CreationOptional<Date>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demande: Association<Validation, Demande>
    validateur: Association<Validation, Validateur>
  };
}

Validation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  statut: { type: DataTypes.ENUM('approuve', 'rejete'), allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Validation',
  tableName: MODULE_TABLE_PREFIX + 'validations',
  timestamps: true
})
