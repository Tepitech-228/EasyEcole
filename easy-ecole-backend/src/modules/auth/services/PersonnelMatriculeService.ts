import { QueryTypes, Transaction } from "sequelize";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

type TypePersonnel = "enseignant" | "personnel_administratif";

export class PersonnelMatriculeService {
    static async generer(
        etablissementCode: string,
        categorieCode: string,
        siteCode: string,
        utilisateurId: number,
        typePersonnel: TypePersonnel,
        transaction?: Transaction,
    ): Promise<string> {
        const sequelize = DatabaseConnection.getInstance().sequelize;
        if (!transaction) {
            return sequelize.transaction(activeTransaction =>
                this.generer(
                    etablissementCode,
                    categorieCode,
                    siteCode,
                    utilisateurId,
                    typePersonnel,
                    activeTransaction,
                ),
            );
        }

        for (let attempt = 0; attempt < 100; attempt++) {
            await sequelize.query(
                "INSERT INTO `aut_matricules_personnel` (`matricule`) VALUES (NULL)",
                { transaction },
            );
            const rows = await sequelize.query<{ id: number | string }>(
                "SELECT LAST_INSERT_ID() AS `id`",
                { type: QueryTypes.SELECT, transaction },
            );
            const sequence = Number(rows[0]?.id);
            if (!Number.isSafeInteger(sequence) || sequence <= 0) {
                throw new Error("Impossible de réserver un numéro de matricule pour le personnel.");
            }

            const matricule = IDGenerator.generateMatricule(
                etablissementCode,
                categorieCode,
                siteCode,
                sequence,
            );

            try {
                await sequelize.query(
                    "UPDATE `aut_matricules_personnel` SET `matricule` = :matricule, `utilisateurId` = :utilisateurId, `typePersonnel` = :typePersonnel WHERE `id` = :id",
                    {
                        transaction,
                        replacements: { id: sequence, matricule, utilisateurId, typePersonnel },
                    },
                );
                return matricule;
            } catch (error: any) {
                const code = error?.parent?.code || error?.original?.code || "";
                if (code !== "ER_DUP_ENTRY" && error?.name !== "SequelizeUniqueConstraintError") {
                    throw error;
                }
            }
        }

        throw new Error("Impossible de générer un matricule unique pour le personnel après plusieurs tentatives.");
    }

    static async reserver(
        matricule: string,
        utilisateurId: number,
        typePersonnel: TypePersonnel,
        transaction?: Transaction,
    ): Promise<void> {
        const sequelize = DatabaseConnection.getInstance().sequelize;
        if (!transaction) {
            return sequelize.transaction(activeTransaction =>
                this.reserver(matricule, utilisateurId, typePersonnel, activeTransaction),
            );
        }

        try {
            await sequelize.query(
                "INSERT INTO `aut_matricules_personnel` (`matricule`, `utilisateurId`, `typePersonnel`) VALUES (:matricule, :utilisateurId, :typePersonnel)",
                {
                    transaction,
                    replacements: { matricule, utilisateurId, typePersonnel },
                },
            );
        } catch (error: any) {
            const code = error?.parent?.code || error?.original?.code || "";
            if (code !== "ER_DUP_ENTRY" && error?.name !== "SequelizeUniqueConstraintError") {
                throw error;
            }

            const rows = await sequelize.query<{
                utilisateurId: number | string | null;
                typePersonnel: string | null;
            }>(
                "SELECT `utilisateurId`, `typePersonnel` FROM `aut_matricules_personnel` WHERE `matricule` = :matricule LIMIT 1 FOR UPDATE",
                {
                    transaction,
                    replacements: { matricule },
                    type: QueryTypes.SELECT,
                },
            );
            const reservation = rows[0];
            if (
                Number(reservation?.utilisateurId) !== utilisateurId
                || reservation?.typePersonnel !== typePersonnel
            ) {
                throw new Error("Ce matricule est déjà attribué à un autre membre du personnel.");
            }
        }
    }
}
