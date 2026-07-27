import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhIndemnitePrestataire } from "./RhIndemnitePrestataire";

export class RhPrestataire extends Model<InferAttributes<RhPrestataire>, InferCreationAttributes<RhPrestataire>> {
    declare id: CreationOptional<string>
    declare nom: string
    declare prenom: string
    declare type: 'stagiaire' | 'consultant' | 'prestataire'
    declare email: string
    declare telephone: string
    declare adresse: string
    declare specialite: string
    declare modeReglement: string
    declare tauxJournalier: number
    declare numeroCompte: string
    declare statut: CreationOptional<string>
    declare dateDebut: string
    declare dateFin: string
    declare notes: string
    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>

    declare indemnites?: NonAttribute<RhIndemnitePrestataire[]>

    declare static associations: {
        indemnites: Association<RhPrestataire, RhIndemnitePrestataire>
    }
}

RhPrestataire.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('stagiaire', 'consultant', 'prestataire'), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: true },
    telephone: { type: DataTypes.STRING(50), allowNull: true },
    adresse: { type: DataTypes.TEXT, allowNull: true },
    specialite: { type: DataTypes.STRING(200), allowNull: true },
    modeReglement: { type: DataTypes.STRING(100), allowNull: true },
    tauxJournalier: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    numeroCompte: { type: DataTypes.STRING(100), allowNull: true },
    statut: { type: DataTypes.ENUM('Actif', 'Inactif'), defaultValue: 'Actif' },
    dateDebut: { type: DataTypes.DATEONLY, allowNull: true },
    dateFin: { type: DataTypes.DATEONLY, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    paranoid: true,
    modelName: MODULE_MODEL_PREFIX + 'Prestataire',
    tableName: MODULE_TABLE_PREFIX + 'prestataires',
    timestamps: true
})
