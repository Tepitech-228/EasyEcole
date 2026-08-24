import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeDocument } from "./DemandeDocument";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

/** Journal de traçabilité du module secrétariat. */
export class JournalSecretariat extends Model<InferAttributes<JournalSecretariat>, InferCreationAttributes<JournalSecretariat>> {
    declare id: CreationOptional<number>
    declare action: string
    declare utilisateurId: CreationOptional<number | null>
    declare demandeDocumentId: CreationOptional<number | null>
    declare details: CreationOptional<string | null>
    declare utilisateur?: NonAttribute<Utilisateur>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>

    declare static associations: {
        utilisateur: Association<JournalSecretariat, Utilisateur>
    };
}

JournalSecretariat.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    action: {
        type: new DataTypes.STRING(50),
        allowNull: false
    },
    utilisateurId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'aut_utilisateurs', key: 'id' }
    },
    demandeDocumentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'scol_demandes_document', key: 'id' }
    },
    details: {
        type: new DataTypes.STRING(500),
        allowNull: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    paranoid: true,
    modelName: MODULE_MODEL_PREFIX + 'JournalSecretariat',
    tableName: MODULE_TABLE_PREFIX + 'journal_secretariat',
    timestamps: true
})
