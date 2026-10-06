import { Sequelize } from "sequelize";
import { ensureReferenceData } from "../../../core/helpers/ensureReferenceData";

describe("ensureReferenceData", () => {
  it("propagates failed permission writes instead of continuing with an incomplete authorization seed", async () => {
    const databaseError = new Error("permission table unavailable");
    const query = jest.fn().mockRejectedValue(databaseError);
    const sequelize = { query } as unknown as Sequelize;

    await expect(ensureReferenceData(sequelize)).rejects.toBe(databaseError);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
