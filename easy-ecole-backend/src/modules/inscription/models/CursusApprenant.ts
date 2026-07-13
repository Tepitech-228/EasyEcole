import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeInscription } from "./DemandeInscription";
import { AnneeAcademique } from "./AnneeAcademique";

export class CursusApprenant extends Model<InferAttributes<CursusApprenant>, InferCreationAttributes<CursusApprenant>> {
  declare id: CreationOptional<string>
  declare externe: boolean
  declare etablissement: string
  declare intituleParcours: string
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare demandeInscription?: NonAttribute<DemandeInscription>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    parcours: Association<CursusApprenant, Parcours>
    niveauEtude: Association<CursusApprenant, NiveauEtude>
    classe: Association<CursusApprenant, Classe>
    anneeAcademique: Association<CursusApprenant, AnneeAcademique>
    demandeInscription: Association<CursusApprenant, DemandeInscription>
    utilisateur: Association<CursusApprenant, Utilisateur>
  };
}

CursusApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  externe: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  etablissement: {
    type: new DataTypes.STRING,
    allowNull: true,
  },
  intituleParcours: {
    type: new DataTypes.STRING,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CursusApprenant',
  tableName: MODULE_TABLE_PREFIX + 'cursus_apprenants',
  timestamps: true
})