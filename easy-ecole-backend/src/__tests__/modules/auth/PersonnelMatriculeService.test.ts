const mockQuery = jest.fn();
const mockTransactionRunner = jest.fn();
const mockTransaction = {};

jest.mock("../../../core/helpers/DatabaseConnection", () => ({
    DatabaseConnection: {
        getInstance: jest.fn(() => ({
            sequelize: {
                query: mockQuery,
                transaction: mockTransactionRunner,
            },
        })),
    },
}));

import { PersonnelMatriculeService } from "../../../modules/auth/services/PersonnelMatriculeService";

describe("PersonnelMatriculeService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockTransactionRunner.mockImplementation((callback: (transaction: object) => unknown) =>
            Promise.resolve(callback(mockTransaction)),
        );
    });

    it("reserves a new global sequence when a matricule is already registered", async () => {
        let sequence = 0;
        mockQuery.mockImplementation((sql: string, options?: { replacements?: { matricule?: string } }) => {
            if (sql.startsWith("INSERT INTO")) return Promise.resolve([]);
            if (sql.startsWith("SELECT LAST_INSERT_ID")) return Promise.resolve([{ id: ++sequence }]);
            if (sql.startsWith("UPDATE") && options?.replacements?.matricule?.endsWith("0001")) {
                return Promise.reject({ parent: { code: "ER_DUP_ENTRY" } });
            }
            if (sql.startsWith("UPDATE")) return Promise.resolve([]);
            throw new Error(`Unexpected query: ${sql}`);
        });

        await expect(PersonnelMatriculeService.generer("ESA", "ADM", "SIE", 42, "personnel_administratif"))
            .resolves.toBe("ESA-ADM-SIE-0002");

        expect(mockQuery.mock.calls.filter(([sql]) => String(sql).startsWith("UPDATE"))).toHaveLength(2);
    });

    it("rejects a matricule reserved by another member of staff", async () => {
        mockQuery
            .mockRejectedValueOnce({ parent: { code: "ER_DUP_ENTRY" } })
            .mockResolvedValueOnce([{ utilisateurId: 7, typePersonnel: "enseignant" }]);

        await expect(PersonnelMatriculeService.reserver("ESA-ADM-SIE-0001", 42, "personnel_administratif"))
            .rejects.toThrow("Ce matricule est déjà attribué à un autre membre du personnel.");
    });
});
