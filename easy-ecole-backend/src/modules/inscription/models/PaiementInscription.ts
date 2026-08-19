import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { DemandeInscription } from "./DemandeInscription";

export class PaiementInscription extends Model<InferAttributes<PaiementInscription>, InferCreationAttributes<PaiementInscription>> {
  declare id: CreationOptional<number>
  declare numero: string
  declare datePaiement: Date
  declare description: CreationOptional<string>
  declare montant: number
  declare matriculeInscription: string
  declare type: TypesPaiement
  declare dateValidation: CreationOptional<Date>
  declare transactionId: CreationOptional<string>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare demandeInscription?: NonAttribute<DemandeInscription>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<PaiementInscription, Utilisateur>
    demandeInscription: Association<PaiementInscription, DemandeInscription>
  };
}

PaiementInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  numero: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  datePaiement: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  matriculeInscription: {
    type: new DataTypes.STRING,
    allowNull: false,
    references: {
      model: DemandeInscription,
      key: 'matricule',
    }
  },
  type: {
    type: DataTypes.ENUM,
    values: [TypesPaiement.ESPECE, TypesPaiement.EN_LIGNE, TypesPaiement.MOBILE_MONEY],
    defaultValue: TypesPaiement.ESPECE,
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transactionId: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PaiementInscription',
  tableName: MODULE_TABLE_PREFIX + 'paiements_inscription',
  timestamps: true
})
