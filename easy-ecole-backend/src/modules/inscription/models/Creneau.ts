import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RegimesCours } from "../../../core/enums/RegimesCours";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { Seance } from "./Seance";

export class Creneau extends Model<InferAttributes<Creneau>, InferCreationAttributes<Creneau>> {
  declare id: CreationOptional<number>
  declare code: string
  declare libelle: string
  declare heureDebut: string
  declare heureFin: string
  declare regime: RegimesCours
  declare statut: CreationOptional<'ACTIF' | 'INACTIF'>
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare etablissement?: NonAttribute<Etablissement>
  declare seances?: NonAttribute<Seance[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    etablissement: Association<Creneau, Etablissement>,
    seances: Association<Creneau, Seance>,
  };
}

Creneau.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(50),
    allowNull: false,
    comment: "Code du créneau (ex: J1, J2, S1)"
  },
  libelle: {
    type: new DataTypes.STRING(100),
    allowNull: false,
    comment: "Libellé affichable (ex: 08:00 - 10:00)"
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: "Heure de début"
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: "Heure de fin"
  },
  regime: {
    type: DataTypes.ENUM(RegimesCours.JOUR, RegimesCours.SOIR, RegimesCours.JOUR_ET_SOIR),
    allowNull: false,
    comment: "Régime du créneau"
  },
  statut: {
    type: DataTypes.ENUM('ACTIF', 'INACTIF'),
    allowNull: false,
    defaultValue: 'ACTIF',
    comment: "Statut du créneau"
  },
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Creneau',
  tableName: MODULE_TABLE_PREFIX + 'creneaux',
  timestamps: true
})
