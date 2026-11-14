export type HikvisionDiagnosticLevel = "info" | "warn" | "error";

export function logHikvisionDiagnostic(
  level: HikvisionDiagnosticLevel,
  details: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    system: "easyecole-backend",
    module: "hikvision",
    ...details
  };
  console[level](`[HIKVISION_DIAGNOSTIC] ${JSON.stringify(entry)}`);
}
