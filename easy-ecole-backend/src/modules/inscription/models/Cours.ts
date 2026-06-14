import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Classe } from "./Classe";
import { Parcours } from "./Parcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { SemestresParcours } from "../../../core/enums/SemestresParcours";
import { Enseignant } from "../../auth/models/Enseignant";
import { ChapitreCours } from "./ChapitreCours";
import { Seance } from "./Seance";
import { DemandeInscription } from "./DemandeInscription";

export class Cours extends Model<InferAttributes<Cours>, InferCreationAttributes<Cours>> {
  declare id: CreationOptional<string>
  declare code: string
  declare intitule: string
  declare credit: CreationOptional<number>
  declare estObligatoire: CreationOptional<boolean>
  declare description: CreationOptional<string>
  declare semestre: CreationOptional<SemestresParcours>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare enseignantId: ForeignKey<Enseignant['id'] | null>
  declare enseignant?: NonAttribute<Enseignant>
  declare chapitresCours?: ChapitreCours[]
  declare seances?: Seance[]
  declare demandesInscription?: DemandeInscription[]

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    classe: Association<Cours, Classe>
    parcours: Association<Cours, Parcours>
    enseignant: Association<Cours, Enseignant>
    chapitresCours: Association<Cours, ChapitreCours>
    seances: Association<Cours, Seance>,
    demandesInscription: Association<Cours, DemandeInscription>,
  };
}

Cours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: 'code-parcours'
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'code-parcours'
  },
  intitule: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  credit: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  estObligatoire: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  semestre: {
    type: DataTypes.ENUM,
    values: [SemestresParcours.SEMESTRE1, SemestresParcours.SEMESTRE2, SemestresParcours.SEMESTRE3, SemestresParcours.SEMESTRE4, SemestresParcours.SEMESTRE5, SemestresParcours.SEMESTRE6],
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Cours',
  tableName: MODULE_TABLE_PREFIX + 'cours',
  timestamps: true
})