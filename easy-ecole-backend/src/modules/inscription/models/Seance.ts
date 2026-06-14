import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Enseignant } from "../../auth/models/Enseignant";

export class Seance extends Model<InferAttributes<Seance>, InferCreationAttributes<Seance>> {
  declare id: CreationOptional<string>
  declare titre: string
  // declare jour: CreationOptional<JoursSemaine>
  declare date: Date
  declare heureDebut: Date
  declare heureFin: Date
  declare description: CreationOptional<string>

  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<Seance, Cours>,
    enseignant: Association<Seance, Enseignant>,
  };
}

Seance.init({
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
  // jour: {
  //   type: DataTypes.ENUM,
  //   values: [JoursSemaine.LUNDI, JoursSemaine.MARDI, JoursSemaine.MERCREDI, JoursSemaine.JEUDI, JoursSemaine.VENDREDI, JoursSemaine.SAMEDI, JoursSemaine.DIMANCHE],
  //   allowNull: true
  // },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Seance',
  tableName: MODULE_TABLE_PREFIX + 'seances',
  timestamps: true
})