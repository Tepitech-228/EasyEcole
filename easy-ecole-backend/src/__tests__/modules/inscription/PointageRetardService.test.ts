import { calculerAlerteRetardEtudiant } from "../../../modules/inscription/services/PointageRetardService";

describe("PointageRetardService", () => {
  it("uses the student day and evening start times as the punctuality thresholds", () => {
    expect(calculerAlerteRetardEtudiant("2026-11-19", "08:00:00", "matin", []).estEnRetard).toBe(false);
    expect(calculerAlerteRetardEtudiant("2026-11-19", "08:01:00", "matin", []).estEnRetard).toBe(true);
    expect(calculerAlerteRetardEtudiant("2026-11-19", "18:30:00", "soir", []).estEnRetard).toBe(false);
    expect(calculerAlerteRetardEtudiant("2026-11-19", "18:31:00", "soir", []).estEnRetard).toBe(true);
  });

  it("announces the sixth consecutive late arrival during the month", () => {
    const history = [18, 17, 16, 15, 14].map(day => ({
      date: `2026-11-${day}`,
      heureArrivee: "08:05:00",
    }));

    const result = calculerAlerteRetardEtudiant("2026-11-19", "08:05:00", "matin", history);

    expect(result.retardsConsecutifs).toBe(6);
    expect(result.messageVocal).toContain("sixième retard d'affilée");
  });

  it("announces the fifteenth late arrival of the month", () => {
    const history = Array.from({ length: 14 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return { date: `2026-11-${day}`, heureArrivee: "18:31:00" };
    });

    const result = calculerAlerteRetardEtudiant("2026-11-19", "18:31:00", "soir", history);

    expect(result.totalRetardsMois).toBe(15);
    expect(result.messageVocal).toContain("quinze retards ce mois-ci");
  });

  it("resets the consecutive streak after an on-time attendance", () => {
    const history = [
      { date: "2026-11-18", heureArrivee: "08:05:00" },
      { date: "2026-11-17", heureArrivee: "08:00:00" },
      { date: "2026-11-16", heureArrivee: "08:05:00" },
    ];

    const result = calculerAlerteRetardEtudiant("2026-11-19", "08:05:00", "matin", history);

    expect(result.retardsConsecutifs).toBe(2);
    expect(result.messageVocal).toBeNull();
  });
});
