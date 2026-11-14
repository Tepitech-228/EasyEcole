import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Presence } from "./Presence";
import { BlocCahierDeTexte } from "./BlocCahierDeTexte";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class CahierDeTexte extends Model<InferAttributes<CahierDeTexte>, InferCreationAttributes<CahierDeTexte>> {
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
  declare blocsCahierDeTexte?: NonAttribute<BlocCahierDeTexte[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    cours: Association<CahierDeTexte, Cours>,
    enseignant: Association<CahierDeTexte, Enseignant>,
    parcours: Association<CahierDeTexte, Parcours>,
    niveauEtude: Association<CahierDeTexte, NiveauEtude>,
    etablissement: Association<CahierDeTexte, Etablissement>,
    blocsCahierDeTexte: Association<CahierDeTexte, BlocCahierDeTexte>
  };
}

CahierDeTexte.init({
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
  modelName: MODULE_MODEL_PREFIX + 'CahierDeTexte',
  tableName: MODULE_TABLE_PREFIX + 'cahiers_de_texte',
  timestamps: true
})
