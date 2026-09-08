import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

/**
 * Document obligatoire d'inscription, rattaché à un NIVEAU d'étude.
 *
 * Les documents sont définis PAR NIVEAU (ex : LICENCE 1, LICENCE 2, LICENCE 3,
 * MASTER, DOCTORAT, MBA). Le tronc commun est partagé par tous les niveaux ;
 * chaque niveau ajoute des documents qui lui sont propres (relevés des années
 * antérieures, attestation de réussite…).
 *
 * Cette table est GERABLE (CRUD) : l'administration peut allonger la liste
 * des documents obligatoires de l'école à tout moment, sans modifier le code.
 */
export class DocumentRequisNiveau extends Model<
    InferAttributes<DocumentRequisNiveau>,
    InferCreationAttributes<DocumentRequisNiveau>
> {
    declare id: CreationOptional<number>
    declare code: string
    declare libelle: string
    declare niveau: string
    declare description: CreationOptional<string | null>
    declare ordre: CreationOptional<number>
    declare obligatoire: CreationOptional<boolean>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

DocumentRequisNiveau.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: new DataTypes.STRING(100),
        allowNull: false,
    },
    libelle: {
        type: new DataTypes.STRING,
        allowNull: false,
    },
    niveau: {
        type: new DataTypes.STRING(60),
        allowNull: false,
    },
    description: {
        type: new DataTypes.STRING,
        allowNull: true,
    },
    ordre: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    obligatoire: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'DocumentRequisNiveau',
    tableName: MODULE_TABLE_PREFIX + 'document_requis_niveau',
    timestamps: true,
    indexes: [
        { fields: ['niveau', 'code'], unique: true },
        { fields: ['niveau'] },
        { fields: ['ordre'] },
    ]
})

export default DocumentRequisNiveau;
