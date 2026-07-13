import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { RhEmploye } from "./RhEmploye";

export class RhPlanningPersonnel extends Model<InferAttributes<RhPlanningPersonnel>, InferCreationAttributes<RhPlanningPersonnel>> {
  declare id: CreationOptional<string>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare jourSemaine: JoursSemaine
  declare heureDebut: Date
  declare heureFin: Date
  declare tache: string
  declare couleur: CreationOptional<string>
  declare dateDebut: Date
  declare dateFin: Date
  declare description: CreationOptional<string>

  declare employe?: NonAttribute<RhEmploye>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    employe: Association<RhPlanningPersonnel, RhEmploye>
  }
}

RhPlanningPersonnel.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  jourSemaine: {
    type: DataTypes.ENUM,
    values: [JoursSemaine.LUNDI, JoursSemaine.MARDI, JoursSemaine.MERCREDI, JoursSemaine.JEUDI, JoursSemaine.VENDREDI, JoursSemaine.SAMEDI],
    allowNull: false
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false
  },
  tache: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  couleur: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3b82f6'
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PlanningPersonnel',
  tableName: MODULE_TABLE_PREFIX + 'planning_personnel',
  timestamps: true
})
