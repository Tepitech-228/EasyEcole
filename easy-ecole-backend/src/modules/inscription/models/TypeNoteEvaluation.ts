import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { NiveauEtude } from "./NiveauEtude";

export class TypeNoteEvaluation extends Model<InferAttributes<TypeNoteEvaluation>, InferCreationAttributes<TypeNoteEvaluation>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare description: CreationOptional<string>
  declare poids: CreationOptional<Number>
  declare categorie: CreationOptional<string>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

TypeNoteEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  poids: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  categorie: {
    type: DataTypes.ENUM('controle_continu', 'devoir', 'examen'),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'TypeNoteEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'types_note_evaluation',
  timestamps: true
})