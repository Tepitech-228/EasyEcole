import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Inventaire } from "./Inventaire";
import { Immobilisation } from "./Immobilisation";

export class LigneInventaire extends Model<InferAttributes<LigneInventaire>, InferCreationAttributes<LigneInventaire>> {
  declare id: CreationOptional<string>
  declare inventaireId: ForeignKey<Inventaire['id']>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare etatDeclare: CreationOptional<string>
  declare etatConstate: string
  declare commentaire: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

LigneInventaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  inventaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  etatDeclare: { type: DataTypes.ENUM('neuf', 'bon', 'moyen', 'mauvais', 'reforme'), allowNull: true },
  etatConstate: { type: DataTypes.ENUM('neuf', 'bon', 'moyen', 'mauvais', 'reforme'), allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneInventaire',
  tableName: MODULE_TABLE_PREFIX + 'ligne_inventaire',
  timestamps: true
})
