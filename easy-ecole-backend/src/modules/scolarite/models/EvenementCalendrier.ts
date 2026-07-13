import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { Classe } from "../../inscription/models/Classe";
import { Parcours } from "../../inscription/models/Parcours";

export class EvenementCalendrier extends Model<InferAttributes<EvenementCalendrier>, InferCreationAttributes<EvenementCalendrier>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare date: Date
  declare description: string
  declare type: string
  declare recurrence: string
  declare dateFinRecurrence: CreationOptional<Date | null>
  declare couleur: CreationOptional<string | null>
  declare classeId: ForeignKey<Classe['id'] | null>
  declare classe?: NonAttribute<Classe>
  declare parcoursId: ForeignKey<Parcours['id'] | null>
  declare parcours?: NonAttribute<Parcours>
  declare visibilite: string
  declare statutEvenement: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    classe: Association<EvenementCalendrier, Classe>
    parcours: Association<EvenementCalendrier, Parcours>
  };
}

EvenementCalendrier.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('cours','examen','vacance','sportif','culturel','reunion','administratif','ferie'),
    allowNull: false
  },
  recurrence: {
    type: DataTypes.ENUM('aucune','quotidien','hebdomadaire','bimensuel','mensuel','annuel'),
    defaultValue: 'aucune',
    allowNull: false
  },
  dateFinRecurrence: {
    type: DataTypes.DATE,
    allowNull: true
  },
  couleur: {
    type: DataTypes.STRING(7),
    allowNull: true
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  visibilite: {
    type: DataTypes.ENUM('public','enseignant','etudiant','prive'),
    defaultValue: 'public',
    allowNull: false
  },
  statutEvenement: {
    type: DataTypes.ENUM('proposition','approuve','publie','annule'),
    defaultValue: 'proposition',
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'EvenementCalendrier',
  tableName: MODULE_TABLE_PREFIX + 'evenements_calendrier',
  timestamps: true
})
