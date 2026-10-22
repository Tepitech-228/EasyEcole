import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";

export class NoteExamen extends Model<InferAttributes<NoteExamen>, InferCreationAttributes<NoteExamen>> {
  declare id: CreationOptional<number>;
  declare examenId: number;
  declare utilisateurId: number;
  declare note: number;
  declare commentaire: CreationOptional<string | null>;
  declare saisiePar: number;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

NoteExamen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  examenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  note: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  saisiePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "NoteExamen",
  tableName: MODULE_TABLE_PREFIX + "notes_examens",
  timestamps: true,
  indexes: [{ unique: true, fields: ["examenId", "utilisateurId"] }],
});
