import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { ReponseOrientation } from "./ReponseOrientation";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class DemandeOrientation extends Model<InferAttributes<DemandeOrientation>, InferCreationAttributes<DemandeOrientation>> {
  declare id: CreationOptional<string>
  declare dateDemande: Date
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare reponseOrientation?: NonAttribute<ReponseOrientation>
  declare parcoursChoisis?: ParcoursChoisi[]
  declare anneeAcademique?: NonAttribute<AnneeAcademique>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<DemandeOrientation, Utilisateur>
    reponseOrientation: Association<DemandeOrientation, ReponseOrientation>
    parcoursChoisis: Association<DemandeOrientation, ParcoursChoisi>
    anneeAcademique: Association<DemandeOrientation, AnneeAcademique>
  };
}

DemandeOrientation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dateDemande: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeOrientation',
  tableName: MODULE_TABLE_PREFIX + 'demandes_orientation',
  timestamps: true
})