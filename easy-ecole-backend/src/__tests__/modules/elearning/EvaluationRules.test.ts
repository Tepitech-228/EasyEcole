import { evaluationPeriodFromSourceSemester, isSaturdayDate } from "../../../modules/elearning/services/EvaluationRules";

describe("evaluationPeriodFromSourceSemester", () => {
  it.each([
    ["semestre1", { examen: "semestre1", devoir: 1 }],
    ["semestre2", { examen: "semestre2", devoir: 2 }],
    ["semestre3", { examen: "semestre3", devoir: 3 }],
    ["semestre4", { examen: "semestre4", devoir: 4 }],
    ["semestre5", { examen: "annuel", devoir: 0 }],
    ["semestre6", { examen: "annuel", devoir: 0 }],
  ])("maps %s to its evaluation period", (source, expected) => {
    expect(evaluationPeriodFromSourceSemester(source)).toEqual(expected);
  });

  it("rejects a missing or unrecognized semester", () => {
    expect(evaluationPeriodFromSourceSemester(null)).toBeNull();
    expect(evaluationPeriodFromSourceSemester("semestre7")).toBeNull();
  });
});

describe("isSaturdayDate", () => {
  it("accepts a Saturday calendar date regardless of the time suffix", () => {
    expect(isSaturdayDate("2026-11-07T09:00")).toBe(true);
  });

  it("rejects a weekday and an invalid date", () => {
    expect(isSaturdayDate("2026-11-06T09:00")).toBe(false);
    expect(isSaturdayDate("2026-02-31T09:00")).toBe(false);
  });
});
