import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhCategorieProfessionnelle } from "./RhCategorieProfessionnelle";
import { RhPoste } from "./RhPoste";

export class RhGrilleSalariale extends Model<InferAttributes<RhGrilleSalariale>, InferCreationAttributes<RhGrilleSalariale>> {
  declare id: CreationOptional<string>
  declare categorieId: ForeignKey<RhCategorieProfessionnelle['id'] | null>
  declare posteId: ForeignKey<RhPoste['id'] | null>
  declare salaireMin: number
  declare salaireMax: number
  declare echelon: CreationOptional<string>
  declare anneeVigueur: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhGrilleSalariale.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  categorieId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  posteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  salaireMin: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  salaireMax: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  echelon: { type: new DataTypes.STRING, allowNull: true },
  anneeVigueur: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'GrilleSalariale',
  tableName: MODULE_TABLE_PREFIX + 'grille_salariale',
  timestamps: true
})
