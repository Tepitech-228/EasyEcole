import { Sequelize } from "sequelize";
import { ensureBordereauFinance } from "../../../core/helpers/ensureBordereauFinance";

describe("ensureBordereauFinance", () => {
  const createSequelizeMock = (existingTrackingColumns: string[] = []) => {
    const query = jest.fn(async (sql: string) => {
      if (sql.includes("SHOW COLUMNS FROM `ins_bordereaux` WHERE Field IN")) {
        return [existingTrackingColumns.map(Field => ({ Field })), {}];
      }
      if (sql.includes("SHOW COLUMNS FROM `ins_bordereaux` LIKE 'type'")) {
        return [[{ Type: "enum('inscription','mixte')" }], {}];
      }
      return [[], {}];
    });

    return {
      sequelize: { query } as unknown as Sequelize,
      query,
    };
  };

  it("adds the accounting columns when upgrading an existing schema", async () => {
    const { sequelize, query } = createSequelizeMock();

    await ensureBordereauFinance(sequelize);

    expect(query).toHaveBeenCalledWith(
      "ALTER TABLE `ins_bordereaux` ADD COLUMN `saisiParId` INT UNSIGNED NULL DEFAULT NULL"
    );
    expect(query).toHaveBeenCalledWith(
      "ALTER TABLE `ins_bordereaux` ADD COLUMN `dateSaisieComptable` DATETIME NULL DEFAULT NULL"
    );
  });

  it("does not recreate accounting columns that already exist", async () => {
    const { sequelize, query } = createSequelizeMock(["saisiParId", "dateSaisieComptable"]);

    await ensureBordereauFinance(sequelize);

    expect(query).not.toHaveBeenCalledWith(
      "ALTER TABLE `ins_bordereaux` ADD COLUMN `saisiParId` INT UNSIGNED NULL DEFAULT NULL"
    );
    expect(query).not.toHaveBeenCalledWith(
      "ALTER TABLE `ins_bordereaux` ADD COLUMN `dateSaisieComptable` DATETIME NULL DEFAULT NULL"
    );
  });
});
