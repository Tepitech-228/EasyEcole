import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
    declare id: CreationOptional<string>
    declare key: string
    declare libelle: string
    declare module: string
    declare type: 'menu' | 'action'
    declare parentKey: CreationOptional<string | null>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

Permission.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    key: {
        type: new DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    libelle: {
        type: new DataTypes.STRING(255),
        allowNull: false
    },
    module: {
        type: new DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: new DataTypes.STRING(20),
        allowNull: false
    },
    parentKey: {
        type: new DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'Permission',
    tableName: MODULE_TABLE_PREFIX + 'permissions',
    paranoid: true,
    timestamps: true
});
