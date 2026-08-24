import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeDocument } from "./DemandeDocument";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

/** Reçu de caisse du secrétariat — numéro unique obligatoire. */
export class RecuCaisse extends Model<InferAttributes<RecuCaisse>, InferCreationAttributes<RecuCaisse>> {
    declare id: CreationOptional<number>
    declare numero: string
    declare demandeDocumentId: ForeignKey<DemandeDocument['id']>
    declare montant: number
    declare modePaiement: 'especes' | 'mobile_money' | 'autre'
    declare caissierId: ForeignKey<Utilisateur['id']>
    declare datePaiement: Date
    declare fichierPDF: CreationOptional<string | null>
    declare demande?: NonAttribute<DemandeDocument>
    declare caissier?: NonAttribute<Utilisateur>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>

    declare static associations: {
        demandeDocument: Association<RecuCaisse, DemandeDocument>
        caissier: Association<RecuCaisse, Utilisateur>
    };
}

RecuCaisse.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    numero: {
        type: new DataTypes.STRING(40),
        allowNull: false,
        unique: true
    },
    demandeDocumentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'scol_demandes_document', key: 'id' }
    },
    montant: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    modePaiement: {
        type: DataTypes.ENUM('especes', 'mobile_money', 'autre'),
        allowNull: false,
        defaultValue: 'especes'
    },
    caissierId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'aut_utilisateurs', key: 'id' }
    },
    datePaiement: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fichierPDF: {
        type: new DataTypes.STRING(255),
        allowNull: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    paranoid: true,
    modelName: MODULE_MODEL_PREFIX + 'RecuCaisse',
    tableName: MODULE_TABLE_PREFIX + 'recus_caisse',
    timestamps: true
})
