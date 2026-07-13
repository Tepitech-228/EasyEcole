import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
    declare id: CreationOptional<string>
    declare nom: string
    declare description: CreationOptional<string | null>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

Role.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nom: {
        type: new DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    description: {
        type: new DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'Role',
    tableName: MODULE_TABLE_PREFIX + 'roles',
    paranoid: true,
    timestamps: true
});
