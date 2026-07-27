import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhPrestataire } from "./RhPrestataire";

export class RhIndemnitePrestataire extends Model<InferAttributes<RhIndemnitePrestataire>, InferCreationAttributes<RhIndemnitePrestataire>> {
    declare id: CreationOptional<string>
    declare prestataireId: ForeignKey<RhPrestataire['id']>
    declare typeIndemnite: string
    declare libelle: string
    declare montant: number
    declare devise: CreationOptional<string>
    declare dateDebut: string
    declare dateFin: string
    declare nombreJours: number
    declare description: string
    declare statut: CreationOptional<string>
    declare datePaiement: string
    declare modePaiement: string
    declare validePar: string
    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>

    declare prestataire?: NonAttribute<RhPrestataire>

    declare static associations: {
        prestataire: Association<RhIndemnitePrestataire, RhPrestataire>
    }
}

RhIndemnitePrestataire.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    prestataireId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    typeIndemnite: {
        type: DataTypes.ENUM('journalier', 'forfait', 'frais_deplacement', 'hebergement', 'autre'),
        allowNull: false
    },
    libelle: { type: DataTypes.STRING(200), allowNull: false },
    montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    devise: { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'FCFA' },
    dateDebut: { type: DataTypes.DATEONLY, allowNull: true },
    dateFin: { type: DataTypes.DATEONLY, allowNull: true },
    nombreJours: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    description: { type: DataTypes.TEXT, allowNull: true },
    statut: { type: DataTypes.ENUM('En attente', 'Payé', 'Annulé'), defaultValue: 'En attente' },
    datePaiement: { type: DataTypes.DATEONLY, allowNull: true },
    modePaiement: { type: DataTypes.STRING(100), allowNull: true },
    validePar: { type: DataTypes.STRING(150), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    paranoid: true,
    modelName: MODULE_MODEL_PREFIX + 'IndemnitePrestataire',
    tableName: MODULE_TABLE_PREFIX + 'indemnites_prestataires',
    timestamps: true
})
