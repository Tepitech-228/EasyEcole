import {
  calculerDureeSeanceEffective,
  depasseFenetreDebut,
  normaliserHeureDebut,
  normaliserHeureFin,
} from "../../../modules/inscription/services/SeancePointageRulesService";

describe("SeancePointageRulesService", () => {
  it("allows a start from exactly 15 minutes before the scheduled start", () => {
    expect(depasseFenetreDebut("08:44:59", "09:00:00")).toBe(true);
    expect(depasseFenetreDebut("08:45:00", "09:00:00")).toBe(false);
    expect(depasseFenetreDebut("14:00:00", "09:00:00")).toBe(false);
  });

  it("clamps a departure during the grace period to the scheduled end", () => {
    expect(normaliserHeureFin("10:10:00", "10:00:00")).toBe("10:00:00");
    expect(normaliserHeureFin("09:40:00", "10:00:00")).toBe("09:40:00");
  });

  it("uses the scheduled start when a teacher clocks in early", () => {
    expect(normaliserHeureDebut("10:31:00", "10:40:00")).toBe("10:40:00");
    expect(normaliserHeureDebut("10:40:00", "10:40:00")).toBe("10:40:00");
    expect(normaliserHeureDebut("10:45:00", "10:40:00")).toBe("10:45:00");
  });

  it("calculates time from the effective start and end and caps it to the assigned duration", () => {
    expect(calculerDureeSeanceEffective("10:31:00", "11:40:00", "10:40:00", "11:40:00")).toEqual({
      heureDebutEffective: "10:40:00",
      heureFinEffective: "11:40:00",
      retardMinutes: 0,
      dureeMinutes: 60,
    });
    expect(calculerDureeSeanceEffective("08:55:00", "10:10:00", "09:00:00", "10:00:00")).toEqual({
      heureDebutEffective: "09:00:00",
      heureFinEffective: "10:00:00",
      retardMinutes: 0,
      dureeMinutes: 60,
    });
    expect(calculerDureeSeanceEffective("09:15:00", "09:50:00", "09:00:00", "10:00:00")).toEqual({
      heureDebutEffective: "09:15:00",
      heureFinEffective: "09:50:00",
      retardMinutes: 15,
      dureeMinutes: 35,
    });
    expect(calculerDureeSeanceEffective("10:05:00", "10:10:00", "09:00:00", "10:00:00")?.dureeMinutes).toBe(0);
  });
});
