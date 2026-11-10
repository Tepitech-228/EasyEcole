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

  it("renders API identity and checklist data in normal-weight text", () => {
    const api = extractOfficialTemplatePages(fs.readFileSync(sourcePath, "utf-8"))
      .find(({ typeCode }) => typeCode === "API001");
    const rendered = TemplateEngine.render(api!.contenu, {
      anneeAcademique: "2026-2027",
      initialesComite: "JD",
      etudiant: {
        nom: "TETE EKUE",
        prenom: "PATRICE",
        dateNaissance: "20/05/2002",
        lieuNaissance: "Lomé",
        nationalite: "Togolaise",
        filiere: "Gestion commerciale",
        specialiteDiplome: "Série D",
        specialiteReleves: "Gestion",
        specialiteParcours: "Gestion commerciale",
        diplomeBac: true,
        diplomeDtsDut: false,
        diplomeBts: true,
        diplomeLicence: false,
        diplomeMaitrise: false,
        diplomeMaster: true,
        diplomeAutres: false,
        relevesSem12: true,
        relevesSem34: true,
        relevesSem56: false,
        relevesSem78: false,
        relevesSem910: false,
        parcoursLicence12: false,
        parcoursLicence34: false,
        parcoursLicence56: true,
        parcoursMaster12: false,
        parcoursMaster34: false,
      },
    });
    const $ = load(rendered);

    expect($(".dotted-line").eq(1).text()).toBe("20/05/2002");
    expect($(".dotted-line").eq(2).text()).toBe("Lomé");
    expect($(".dotted-line").eq(3).text()).toBe("Togolaise");
    expect($("strong").text()).not.toContain("TETE EKUE");
    expect($("strong").text()).not.toContain("Série D");
    expect($(".data-table").eq(0).find(".check-box").map((_i, el) => $(el).text()).get())
      .toEqual(["√", "", "√", "", "", "√", ""]);
    expect($(".data-table").eq(1).find(".check-box").map((_i, el) => $(el).text()).get())
      .toEqual(["√", "√", "", "", ""]);
    expect($(".data-table").eq(2).find(".check-box").map((_i, el) => $(el).text()).get())
      .toEqual(["", "", "√", "", ""]);
    for (const tableIndex of [0, 1]) {
      const rows = $(".data-table").eq(tableIndex).find("tr");
      expect(rows.eq(2).find("td").first().text()).toBe("Dates");
      expect(rows.eq(2).find("td")).toHaveLength(tableIndex === 0 ? 8 : 6);
    }
    expect($(".authorization-footer .committee-heading").text())
      .toContain("Pour le Comité d’Orientation, d’Equivalence et d’Etude de Dossiers");
    expect($(".authorization-footer .signatory-name").map((_i, el) => $(el).text()).get())
      .toEqual(["Steve BARRIGAH-BENISSAN.", "GNOHOE-KPADE Jeannot"]);
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
