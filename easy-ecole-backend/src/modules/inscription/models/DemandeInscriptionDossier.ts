import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { DemandeInscription } from "./DemandeInscription";
import { DossierInscription } from "./DossierInscription";

export class DemandeInscriptionDossier extends Model<InferAttributes<DemandeInscriptionDossier>, InferCreationAttributes<DemandeInscriptionDossier>> {
  declare nomFichier: CreationOptional<string>
  declare demandeId: ForeignKey<DemandeInscription['id']>
  declare dossierId: ForeignKey<DossierInscription['id']>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandeInscriptionDossier.init({
  nomFichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  demandeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'demande-dossier'
  },
  dossierId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'demande-dossier'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeInscriptionDossier',
  tableName: MODULE_TABLE_PREFIX + 'dossiers_demandes',
  timestamps: true
})