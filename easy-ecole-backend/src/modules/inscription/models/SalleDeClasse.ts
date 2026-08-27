import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";
import { Parcours } from "./Parcours";
import { Localisation } from "../../immobilisation/models/Localisation";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { RegimesCours } from "../../../core/enums/RegimesCours";
import { TypeSalle } from "../../../core/enums/TypeSalle";
import { StatutSalle } from "../../../core/enums/StatutSalle";

export type EquipementSalle = 'tableau' | 'videoprojecteur' | 'climatisation' | 'ordinateur' | 'wifi' | 'sonorisation' | 'micro' | 'cameras';

export class SalleDeClasse extends Model<InferAttributes<SalleDeClasse>, InferCreationAttributes<SalleDeClasse>> {
  declare id: CreationOptional<number>
  declare code: CreationOptional<string | null>
  declare libelle: string
  declare description: CreationOptional<string>
  declare etage: CreationOptional<string | null>
  declare type: CreationOptional<TypeSalle>
  declare regime: CreationOptional<RegimesCours>
  declare statut: CreationOptional<StatutSalle>
  declare capacite: CreationOptional<number>
  declare equipements: CreationOptional<string | null>
  declare localisationId: ForeignKey<Localisation['id'] | null>
  declare classeId: ForeignKey<Classe['id']>
  declare parcoursId: ForeignKey<Parcours['id'] | null>
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare classe?: NonAttribute<Classe>
  declare parcours?: NonAttribute<Parcours>
  declare etablissement?: NonAttribute<Etablissement>
  declare localisation?: NonAttribute<Localisation>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    classe: Association<SalleDeClasse, Classe>
    parcours: Association<SalleDeClasse, Parcours>
    etablissement: Association<SalleDeClasse, Etablissement>
    localisation: Association<SalleDeClasse, Localisation>
  };
}

SalleDeClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(50),
    allowNull: true,
    comment: "Code unique de la salle (ex: B204)"
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  etage: {
    type: new DataTypes.STRING(50),
    allowNull: true,
    comment: "Étage de la salle"
  },
  type: {
    type: DataTypes.ENUM(TypeSalle.COURS, TypeSalle.AMPHITHEATRE, TypeSalle.LABORATOIRE, TypeSalle.INFORMATIQUE, TypeSalle.AUTRE),
    allowNull: true,
    defaultValue: TypeSalle.COURS,
    comment: "Type de salle"
  },
  regime: {
    type: DataTypes.ENUM(RegimesCours.JOUR, RegimesCours.SOIR, RegimesCours.JOUR_ET_SOIR),
    allowNull: true,
    defaultValue: RegimesCours.JOUR_ET_SOIR,
    comment: "Régime autorisé (JOUR, SOIR ou les deux)"
  },
  statut: {
    type: DataTypes.ENUM(StatutSalle.DISPONIBLE, StatutSalle.INDISPONIBLE),
    allowNull: true,
    defaultValue: StatutSalle.DISPONIBLE,
    comment: "Disponibilité de la salle"
  },
  capacite: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 30
  },
  equipements: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Liste JSON des equipements de la salle: tableau, videoprojecteur, climatisation, ordinateur, wifi, sonorisation, micro, cameras"
  },
  localisationId: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SalleDeClasse',
  tableName: MODULE_TABLE_PREFIX + 'salles_de_classes',
  timestamps: true
})
