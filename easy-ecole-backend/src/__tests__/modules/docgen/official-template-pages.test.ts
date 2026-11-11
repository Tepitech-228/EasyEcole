import fs from "fs";
import path from "path";
import { load } from "cheerio";
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
    const recommendation = pages.find(({ typeCode }) => typeCode === "RCH008")?.contenu || "";
    expect(recommendation).not.toContain("ADKPELI");
    expect(recommendation).toContain("{{etudiant.nom}} {{etudiant.prenom}}");
    expect(recommendation).toContain("{{etudiant.filiere}}");
    expect(recommendation).toContain("{{dateEdition}}");
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

  it("renders the recommendation letter with the selected student's data", () => {
    const recommendation = extractOfficialTemplatePages(fs.readFileSync(sourcePath, "utf-8"))
      .find(({ typeCode }) => typeCode === "RCH008");

    const rendered = TemplateEngine.render(recommendation!.contenu, {
      dateEdition: "04/10/2026",
      etudiant: { nom: "TETE EKUE", prenom: "PATRICE", filiere: "Gestion commerciale" },
    });
    const $ = load(rendered);

    expect($("strong").text()).toContain("TETE EKUE PATRICE");
    expect($("strong").text()).toContain("Gestion commerciale");
    expect(rendered).toContain("Lomé, le 04/10/2026");
    expect(rendered).not.toContain("{{");
  });

  it("renders the committee's diploma and semester data directly in API cells", () => {
    const api = extractOfficialTemplatePages(fs.readFileSync(sourcePath, "utf-8"))
      .find(({ typeCode }) => typeCode === "API001");
    const rendered = TemplateEngine.render(api!.contenu, {
      anneeAcademique: "2026-2027",
      initialesComite: "JD",
      etudiants: [{
        nom: "TETE EKUE",
        prenom: "PATRICE",
        dateNaissance: "20/05/2002",
        lieuNaissance: "Lomé",
        nationalite: "Togolaise",
        filiere: "Gestion commerciale",
      }],
      autorisationProvisoire: {
        diplomeRecu: "LICENCE",
        dateDiplomeRecu: "12/07/2025",
        diplomeCellules: { BAC: "", LICENCE: "LICENCE", MASTER: "" },
        dateDiplomeCellules: { BAC: "", LICENCE: "12/07/2025", MASTER: "" },
        relevesDatesCellules: {
          S1_S2: "S1 : 01/06/2025, S2 : 02/06/2025",
          S3_S4: "S3 : 03/06/2025",
          S5_S6: "",
          S7_S8: "",
          S9_S10: "",
        },
        relevesCellules: {
          S1_S2: "S1, S2",
          S3_S4: "S3",
          S5_S6: "",
          S7_S8: "",
          S9_S10: "",
        },
        semestresAutorisesCellules: {
          S1_S2: "",
          S3_S4: "",
          S5_S6: "S5, S6",
          S7_S8: "",
          S9_S10: "",
        },
        signataire1: { nomComplet: "Membre A", signatureData: "data:image/png;base64,iVBORw0KGgo=" },
        signataire2: { nomComplet: "Membre B", signatureData: "" },
      },
    });
    const $ = load(rendered);

    expect($("p").first().next().text()).toContain("TETE EKUE PATRICE");
    expect($("p").first().next().text()).toContain("20/05/2002");
    expect($("p").first().next().text()).toContain("Lomé");
    expect($("p").first().next().text()).toContain("Togolaise");
    expect($(".data-table").eq(0).find("tr").eq(1).find("td").map((_i, el) => $(el).text()).get())
      .toEqual(["DIPLÔME REÇU", "", "", "", "LICENCE", "", "", ""]);
    expect($(".data-table").eq(0).find("tr").eq(2).find("td").map((_i, el) => $(el).text()).get())
      .toEqual(["Dates", "", "", "", "12/07/2025", "", "", ""]);
    expect($(".data-table").eq(1).find("tr").eq(1).find("td").map((_i, el) => $(el).text()).get())
      .toEqual(["SEMESTRES REÇUS", "S1, S2", "S3", "", "", ""]);
    expect($(".data-table").eq(1).find("tr").eq(2).find("td").map((_i, el) => $(el).text()).get())
      .toEqual(["Dates", "S1 : 01/06/2025, S2 : 02/06/2025", "S3 : 03/06/2025", "", "", ""]);
    expect($(".data-table").eq(2).find("tr").eq(1).find("td").map((_i, el) => $(el).text()).get())
      .toEqual(["SEMESTRES AUTORISÉS", "", "", "S5, S6", "", ""]);
    expect($(".data-table").find(".check-box")).toHaveLength(0);
    expect(rendered).not.toContain("√");
    for (const tableIndex of [0, 1]) {
      const rows = $(".data-table").eq(tableIndex).find("tr");
      expect(rows.eq(2).find("td").first().text()).toBe("Dates");
      expect(rows.eq(2).find("td")).toHaveLength(tableIndex === 0 ? 8 : 6);
    }
    expect($(".authorization-footer .committee-heading").text())
      .toContain("Pour le Comité d’Orientation, d’Equivalence et d’Etude de Dossiers");
    expect($(".authorization-footer .signatory-name").map((_i, el) => $(el).text()).get())
      .toEqual(["Membre A", "Membre B"]);
    expect($(".authorization-footer img").attr("src")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(rendered).not.toContain("{{");
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
