import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class NoteExamen extends Model<InferAttributes<NoteExamen>, InferCreationAttributes<NoteExamen>> {
  declare id: CreationOptional<number>;
  declare examenId: number;
  declare utilisateurId: number;
  declare note: number;
  declare commentaire: CreationOptional<string | null>;
  declare saisiePar: number;
  declare notePubliee: CreationOptional<boolean>;
  declare notePublieeLe: CreationOptional<Date | null>;
  declare notePublieePar: CreationOptional<number | null>;
  declare apprenant?: NonAttribute<Utilisateur>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    apprenant: Association<NoteExamen, Utilisateur>;
  };
}

NoteExamen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  examenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  note: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  saisiePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  notePubliee: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  notePublieeLe: { type: DataTypes.DATE, allowNull: true },
  notePublieePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "NoteExamen",
  tableName: MODULE_TABLE_PREFIX + "notes_examens",
  timestamps: true,
  indexes: [{ unique: true, fields: ["examenId", "utilisateurId"] }],
});
