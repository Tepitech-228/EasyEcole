import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { OffreStage } from "./OffreStage";
import { Entreprise } from "./Entreprise";
import { Apprenant } from "../../auth/models/Apprenant";
import { ConventionStage } from "./ConventionStage";
import { RapportStage } from "./RapportStage";
import { NoteStage } from "./NoteStage";
import { AttestationStage } from "./AttestationStage";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class DemandeStage extends Model<InferAttributes<DemandeStage>, InferCreationAttributes<DemandeStage>> {
  declare id: CreationOptional<string>
  declare offreStageId: ForeignKey<OffreStage['id']>
  declare offreStage?: NonAttribute<OffreStage>
  declare apprenantId: ForeignKey<Apprenant['id']>
  declare apprenant?: NonAttribute<Apprenant>
  declare entrepriseId: ForeignKey<Entreprise['id']>
  declare entreprise?: NonAttribute<Entreprise>
  declare nouvelleEntreprise: CreationOptional<string>
  declare dateDebut: string
  declare dateFin: string
  declare statut: CreationOptional<string>
  declare motifRejet: CreationOptional<string>
  declare conventionStage?: NonAttribute<ConventionStage>
  declare rapportStage?: NonAttribute<RapportStage>
  declare noteStage?: NonAttribute<NoteStage>
  declare attestationStage?: NonAttribute<AttestationStage>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    offreStage: Association<DemandeStage, OffreStage>
    apprenant: Association<DemandeStage, Apprenant>
    entreprise: Association<DemandeStage, Entreprise>
    conventionStage: Association<DemandeStage, ConventionStage>
    rapportStage: Association<DemandeStage, RapportStage>
    noteStage: Association<DemandeStage, NoteStage>
    attestationStage: Association<DemandeStage, AttestationStage>
  }
}

DemandeStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nouvelleEntreprise: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'rejete'),
    defaultValue: 'en_attente'
  },
  motifRejet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeStage',
  tableName: MODULE_TABLE_PREFIX + 'demandes_stage',
  timestamps: true
})
