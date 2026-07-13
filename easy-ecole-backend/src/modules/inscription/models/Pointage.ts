import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Pointage extends Model<InferAttributes<Pointage>, InferCreationAttributes<Pointage>> {
  declare id: CreationOptional<string>
  declare date: Date
  declare heureArrivee: Date
  declare heureDepart: CreationOptional<Date | null>

  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<Pointage, Utilisateur>
  };
}

Pointage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heureArrivee: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureDepart: {
    type: DataTypes.TIME,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Pointage',
  tableName: MODULE_TABLE_PREFIX + 'pointages',
  timestamps: true
})
