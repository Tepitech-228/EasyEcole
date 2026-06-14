import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { NiveauEtude } from "./NiveauEtude";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { DemandeInscription } from "./DemandeInscription";
import { FraisInscription } from "./FraisInscription";
import { DossierInscription } from "./DossierInscription";
import { AnneeAcademique } from "./AnneeAcademique";

export class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
  declare id: CreationOptional<string>
  declare dateDebut: Date
  declare dateFin: Date
  declare description: CreationOptional<string>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare demandesInscription?: NonAttribute<DemandeInscription[]>
  declare fraisInscription?: NonAttribute<FraisInscription[]>
  declare dossiersInscription?: NonAttribute<DossierInscription[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    niveauEtude: Association<Session, NiveauEtude>
    anneeAcademique: Association<Session, AnneeAcademique>
    demandesInscription: Association<Session, DemandeInscription>
    fraisInscription: Association<Session, FraisInscription>
    dossiersInscription: Association<Session, DossierInscription>
  };
}

Session.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: false,
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
  modelName: MODULE_MODEL_PREFIX + 'Session',
  tableName: MODULE_TABLE_PREFIX + 'sessions',
  timestamps: true
})