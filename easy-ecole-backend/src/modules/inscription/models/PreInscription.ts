import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeInscription } from "./DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export enum EtatPreInscription {
    EN_ATTENTE = "en_attente",
    VALIDE = "valide",
    REJETE = "rejete",
}

export class PreInscription extends Model<InferAttributes<PreInscription>, InferCreationAttributes<PreInscription>> {
  declare id: CreationOptional<string>
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare statut: string
  declare commentaire: CreationOptional<string>
  declare dateTraitement: CreationOptional<Date>
  declare traiteParId: ForeignKey<Utilisateur['id']>
  declare autorisationPDF: CreationOptional<string>

  declare demandeInscription?: NonAttribute<DemandeInscription>
  declare traitePar?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeInscription: Association<PreInscription, DemandeInscription>
    traitePar: Association<PreInscription, Utilisateur>
  };
}

PreInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  statut: {
    type: DataTypes.ENUM,
    values: [EtatPreInscription.EN_ATTENTE, EtatPreInscription.VALIDE, EtatPreInscription.REJETE],
    defaultValue: EtatPreInscription.EN_ATTENTE,
    allowNull: false
  },
  commentaire: {
    type: new DataTypes.TEXT,
    allowNull: true
  },
  dateTraitement: {
    type: DataTypes.DATE,
    allowNull: true
  },
  autorisationPDF: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PreInscription',
  tableName: MODULE_TABLE_PREFIX + 'pre_inscriptions',
  timestamps: true
})
