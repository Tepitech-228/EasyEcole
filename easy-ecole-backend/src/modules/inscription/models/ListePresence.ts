import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Presence } from "./Presence";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class ListePresence extends Model<InferAttributes<ListePresence>, InferCreationAttributes<ListePresence>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare description: CreationOptional<string>

  declare coursId: CreationOptional<ForeignKey<Cours['id']> | null>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: CreationOptional<ForeignKey<Enseignant['id']> | null>
  declare enseignant?: NonAttribute<Enseignant>
  declare parcoursId: CreationOptional<ForeignKey<Parcours['id']> | null>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: CreationOptional<ForeignKey<NiveauEtude['id']> | null>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare etablissementId: CreationOptional<ForeignKey<Etablissement['id']> | null>
  declare etablissement?: NonAttribute<Etablissement>
  declare presences?: NonAttribute<Presence[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    cours: Association<ListePresence, Cours>,
    enseignant: Association<ListePresence, Enseignant>,
    parcours: Association<ListePresence, Parcours>,
    niveauEtude: Association<ListePresence, NiveauEtude>,
    etablissement: Association<ListePresence, Etablissement>,
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
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  enseignantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ListePresence',
  tableName: MODULE_TABLE_PREFIX + 'listes_presences',
  timestamps: true
})
