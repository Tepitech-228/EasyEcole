export type EvaluationPeriod = "semestre1" | "semestre2" | "semestre3" | "semestre4" | "annuel";
export type AssignmentPeriod = 0 | 1 | 2 | 3 | 4;

export function evaluationPeriodFromSourceSemester(sourceSemester: unknown): {
  examen: EvaluationPeriod;
  devoir: AssignmentPeriod;
} | null {
  const match = typeof sourceSemester === "string" ? /^semestre([1-6])$/.exec(sourceSemester) : null;
  if (!match) return null;
  const semesterNumber = Number(match[1]);
  if (semesterNumber <= 4) {
    return {
      examen: `semestre${semesterNumber}` as EvaluationPeriod,
      devoir: semesterNumber as AssignmentPeriod,
    };
  }
  return { examen: "annuel", devoir: 0 };
}

export function isSaturdayDate(value: string): boolean {
  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!datePart) return false;
  const year = Number(datePart[1]);
  const month = Number(datePart[2]);
  const day = Number(datePart[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCDay() === 6;
}
