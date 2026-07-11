import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

export class FraisParcours extends Model<InferAttributes<FraisParcours>, InferCreationAttributes<FraisParcours>> {
  declare id: CreationOptional<number>
  declare parcoursId: ForeignKey<number>
  declare niveauEtudeId: ForeignKey<number>
  declare anneeAcademiqueId: ForeignKey<number>
  declare montantInscription: number
  declare montantScolarite: number
  declare nbMensualites: number
  declare fraisBibliotheque: CreationOptional<number | null>
  declare fraisAssurance: CreationOptional<number | null>
  declare fraisLogement: CreationOptional<number | null>
  declare autresFrais: CreationOptional<object | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

FraisParcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  montantInscription: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  montantScolarite: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  nbMensualites: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  fraisBibliotheque: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  fraisAssurance: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  fraisLogement: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  autresFrais: {
    type: DataTypes.JSON,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'FraisParcours',
  tableName: MODULE_TABLE_PREFIX + 'frais_parcours',
  timestamps: true
})
