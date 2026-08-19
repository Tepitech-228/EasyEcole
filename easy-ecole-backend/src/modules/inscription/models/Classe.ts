import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { NiveauEtude } from "./NiveauEtude";
import { Parcours } from "./Parcours";
import { CursusApprenant } from "./CursusApprenant";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class Classe extends Model<InferAttributes<Classe>, InferCreationAttributes<Classe>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare description: CreationOptional<string>
  declare capaciteMax: CreationOptional<number>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare parcoursId: ForeignKey<Parcours['id']> | null
  declare parcours?: NonAttribute<Parcours>
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare etablissement?: NonAttribute<Etablissement>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare cursusApprenants?: NonAttribute<CursusApprenant[]>

  declare static associations: {
    niveauEtude: Association<Classe, NiveauEtude>
    parcours: Association<Classe, Parcours>
    etablissement: Association<Classe, Etablissement>
    cursusApprenants: Association<Classe, CursusApprenant>
  };
}

Classe.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  capaciteMax: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: "Capacite maximale d'etudiants pour cette classe"
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Classe',
  tableName: MODULE_TABLE_PREFIX + 'classes',
  timestamps: true
})
