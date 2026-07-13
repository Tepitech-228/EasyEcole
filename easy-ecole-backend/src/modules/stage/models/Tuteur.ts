import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Entreprise } from "./Entreprise";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class Tuteur extends Model<InferAttributes<Tuteur>, InferCreationAttributes<Tuteur>> {
  declare id: CreationOptional<string>
  declare entrepriseId: ForeignKey<Entreprise['id']>
  declare entreprise?: NonAttribute<Entreprise>
  declare nom: string
  declare fonction: CreationOptional<string>
  declare email: string
  declare telephone: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    entreprise: Association<Tuteur, Entreprise>
  }
}

Tuteur.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  fonction: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Tuteur',
  tableName: MODULE_TABLE_PREFIX + 'tuteurs',
  timestamps: true
})
