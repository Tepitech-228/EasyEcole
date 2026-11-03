import { Association, CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { SessionExamen } from "./SessionExamen";

export class CentreExamen extends Model<InferAttributes<CentreExamen>, InferCreationAttributes<CentreExamen>> {
  declare id: CreationOptional<number>;
  declare nom: string;
  declare code: string;
  declare ville: string;
  declare adresse: CreationOptional<string | null>;
  declare telephone: CreationOptional<string | null>;
  declare capacite: number;
  declare responsableId: ForeignKey<Utilisateur["id"]>;
  declare actif: CreationOptional<boolean>;
  declare responsable?: NonAttribute<Utilisateur>;
  declare sessions?: NonAttribute<SessionExamen[]>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    responsable: Association<CentreExamen, Utilisateur>;
    sessions: Association<CentreExamen, SessionExamen>;
  };
}

CentreExamen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING(160), allowNull: false },
  code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  ville: { type: DataTypes.STRING(120), allowNull: false },
  adresse: { type: DataTypes.STRING(500), allowNull: true },
  telephone: { type: DataTypes.STRING(40), allowNull: true },
  capacite: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "CentreExamen",
  tableName: MODULE_TABLE_PREFIX + "centres_examens",
  timestamps: true,
});