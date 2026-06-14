import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Presence } from "./Presence";

export class ListePresence extends Model<InferAttributes<ListePresence>, InferCreationAttributes<ListePresence>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>

  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>
  declare presences?: NonAttribute<Presence[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<ListePresence, Cours>,
    enseignant: Association<ListePresence, Enseignant>,
    presences: Association<ListePresence, Presence>
  };
}

ListePresence.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ListePresence',
  tableName: MODULE_TABLE_PREFIX + 'listes_presences',
  timestamps: true
})