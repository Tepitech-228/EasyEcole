import fs from "fs";
import path from "path";
import { extractOfficialTemplatePages } from "../../../modules/docgen/seed/official-template-pages";
import { TemplateEngine } from "../../../modules/docgen/services/TemplateEngine";

describe("official academic DocGen templates", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../../../modules/docgen/seed/templates/formulaires-academiques-officiels-source.html",
  );

  it("extracts independent, correctly mapped forms with student data slots", () => {
    const pages = extractOfficialTemplatePages(fs.readFileSync(sourcePath, "utf-8"));

    expect(pages).toHaveLength(17);
    expect(pages.map(({ typeCode }) => typeCode)).toEqual([
      "API001", "API002", "INS011", "INS012", "INS013", "ADM020",
      "INS014", "INS015", "SOU001", "INS016", "INS017",
      "SOU002", "SOU003", "ENG001", "SOU004", "SOU005", "RCH008",
    ]);
    expect(new Set(pages.map(({ typeCode }) => typeCode)).size).toBe(pages.length);

    const checklist = pages.find(({ typeCode }) => typeCode === "INS011");
    expect(checklist?.contenu).toContain("{{etudiant.nom}}");
    expect(checklist?.contenu).toContain("{{etudiant.filiere}}");
    expect(checklist?.contenu).toContain("<style>");
    expect(checklist?.contenu).toContain("Fiche de demande");
    expect(pages.find(({ typeCode }) => typeCode === "API001")?.contenu)
      .toContain("{{initialesComite}}");
    expect(pages.find(({ typeCode }) => typeCode === "API002")?.contenu)
      .toContain("{{#each etudiant.uesPrescrites}}");
    expect(pages.find(({ typeCode }) => typeCode === "RCH008")?.contenu)
      .not.toContain("ADKPELI");
  });

  it("renders student values in the extracted form", () => {
    const checklist = extractOfficialTemplatePages(fs.readFileSync(sourcePath, "utf-8"))
      .find(({ typeCode }) => typeCode === "INS011");

    const rendered = TemplateEngine.render(checklist!.contenu, {
      etudiant: { nom: "Doe", prenom: "Jane", parcours: "Licence", filiere: "Gestion" },
    });

    expect(rendered).toContain("Doe");
    expect(rendered).toContain("Jane");
    expect(rendered).toContain("Gestion");
    expect(rendered).not.toContain("{{etudiant.");
  });

  it("fails explicitly if the reference pack page structure changes", () => {
    expect(() => extractOfficialTemplatePages("<html><body></body></html>"))
      .toThrow("18 sont attendues");
  });

  it("renders UE categories and semester without teacher or visa columns", () => {
    const templateDirectory = path.resolve(__dirname, "../../../modules/docgen/seed/templates");
    const context = {
      etablissement: { nom: "ESA" },
      reference: "REF-001",
      dateGeneration: "2026-10-04",
      anneeAcademique: "2026-2027",
      semestre: "Semestre 1",
      etudiant: {
        nom: "Doe",
        prenom: "Jane",
        unites: [{
          code: "UE-MAJ-1",
          intitule: "Fondamentaux",
          categorieUeLibelle: "UE majeure",
          creditEcts: 6,
          moyenneUe: "14.00",
          semestre: "Semestre 1",
          matieres: [{
            nom: "Analyse",
            creditEcts: 6,
            note: "14.00",
            semestre: "Semestre 1",
            session: "Normale",
          }],
        }],
      },
    };

    for (const fileName of ["bulletin.html", "releve-notes.html"]) {
      const template = fs.readFileSync(path.join(templateDirectory, fileName), "utf-8");
      const rendered = TemplateEngine.render(template, context);

      expect(rendered).toContain("UE majeure");
      expect(rendered).toContain("Semestre 1");
      expect(rendered).not.toContain(">Enseignant<");
      expect(rendered).not.toContain("Visa / Sign.");
    }
  });
});
