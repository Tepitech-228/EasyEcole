import { load } from "cheerio";

export interface OfficialTemplatePage {
  pageNumber: number;
  libelle: string;
  typeCode: string;
  contenu: string;
}

const PAGE_TYPES = [
  { pageNumber: 1, libelle: "Autorisation provisoire d'inscription ESA", typeCode: "API001" },
  { pageNumber: 2, libelle: "Fiche des UE prescrites pour autorisation d'inscription ESA", typeCode: "API002" },
  { pageNumber: 3, libelle: "Pièces pour autorisation d'inscription ESA", typeCode: "INS011" },
  { pageNumber: 4, libelle: "Pièces d'admissibilité Licence ESA", typeCode: "INS012" },
  { pageNumber: 5, libelle: "Pièces d'admissibilité Master ESA", typeCode: "INS013" },
  { pageNumber: 6, libelle: "Attestation d'admissibilité ESA", typeCode: "ADM020" },
  { pageNumber: 7, libelle: "Pièces de soutenance Licence ESA", typeCode: "INS014" },
  { pageNumber: 8, libelle: "Pièces de soutenance Master ESA", typeCode: "INS015" },
  { pageNumber: 9, libelle: "Autorisation de soutenance ESA", typeCode: "SOU001" },
  { pageNumber: 10, libelle: "Pièces de délivrance de diplôme Licence ESA", typeCode: "INS016" },
  { pageNumber: 11, libelle: "Pièces de délivrance de diplôme Master ESA", typeCode: "INS017" },
  { pageNumber: 12, libelle: "Autorisation de délivrance de diplôme Licence ESA", typeCode: "SOU002" },
  { pageNumber: 13, libelle: "Autorisation de délivrance de diplôme Master ESA", typeCode: "SOU003" },
  { pageNumber: 14, libelle: "Fiche d'engagement BTS / Licence ESA", typeCode: "ENG001" },
  { pageNumber: 15, libelle: "Rapport de validation du mémoire ESA", typeCode: "SOU004" },
  { pageNumber: 16, libelle: "Fiche de dépôt de mémoire définitif ESA", typeCode: "SOU005" },
  { pageNumber: 17, libelle: "Lettre de recommandation pour stage ESA", typeCode: "RCH008" },
] as const;

export const OFFICIAL_TEMPLATE_TYPE_CODES = new Set<string>(PAGE_TYPES.map(({ typeCode }) => typeCode));

const STUDENT_FIELDS: Record<number, string[]> = {
  1: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "",
    "",
    "",
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{anneeAcademique}}",
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.filiere}}",
  ],
  2: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{anneeAcademique}}", "{{etudiant.niveau}}", "{{etudiant.filiere}}", ""],
  3: ["{{etudiant.nom}}", "{{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  4: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  5: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  6: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.filiere}}",
    "{{etudiant.option}}",
    "",
    "",
    "{{etudiant.diplomeVise}}",
  ],
  7: ["{{etudiant.nom}}", "{{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  8: ["{{etudiant.nom}}", "{{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  9: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.parcours}}",
    "{{etudiant.filiere}}",
    "{{etudiant.nom}} {{etudiant.prenom}}",
  ],
  10: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  11: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{etudiant.parcours}}", "{{etudiant.filiere}}"],
  12: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.filiere}}",
    "{{etudiant.creditsValides}}",
    "{{etudiant.diplomeVise}}",
    "{{etudiant.filiere}}",
    "{{etudiant.nom}} {{etudiant.prenom}}",
  ],
  13: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{etudiant.filiere}}",
    "{{etudiant.creditsValides}}",
    "{{etudiant.diplomeVise}}",
    "{{etudiant.filiere}}",
    "{{etudiant.nom}} {{etudiant.prenom}}",
  ],
  14: ["{{etudiant.nom}} {{etudiant.prenom}}", "{{etudiant.filiere}}", "{{etudiant.filiere}}"],
  15: [
    "{{etudiant.nom}} {{etudiant.prenom}}",
    "{{sujet.sujet}}",
    "{{etudiant.filiere}}",
    "",
    "",
  ],
  16: ["{{etudiant.nom}} {{etudiant.filiere}}"],
};

export function extractOfficialTemplatePages(source: string): OfficialTemplatePage[] {
  const $ = load(source);
  const css = $("head style").map((_index, element) => $(element).html() || "").get().join("\n");
  const pages = $("body > .doc-page").toArray();

  if (pages.length !== 18) {
    throw new Error(`Le document de référence contient ${pages.length} pages; 18 sont attendues.`);
  }

  return PAGE_TYPES.map(({ pageNumber, libelle, typeCode }) => {
    const page = $(pages[pageNumber - 1]);
    if (pageNumber === 1) {
      const footer = page.find(".footer-table").first();
      if (!footer.length) {
        throw new Error("Le pied de page de l'autorisation provisoire est absent du document source.");
      }
      footer.before('<p class="committee-initials">Initiales des membres du comité ayant validé : {{initialesComite}}</p>');
    }
    const fields = STUDENT_FIELDS[pageNumber] || [];
    page.find(".dotted-line").each((index, element) => {
      const value = fields[index];
      if (value) {
        $(element).text(value);
      }
    });
    if (pageNumber === 2) {
      const prescribedRows = page.find(".prescribed-ue-table tbody");
      if (!prescribedRows.length) {
        throw new Error("Le tableau des UE prescrites est absent de la page 2 du document source.");
      }
      prescribedRows.html(`
        {{#each etudiant.uesPrescrites}}
        <tr><td class="center">{{index}}</td><td>{{code}}</td><td>{{intitule}}</td><td>{{etudiant.niveau}} / {{semestre}}</td><td>{{credit}}</td></tr>
        {{/each}}`);
    }
    if (pageNumber === 16) {
      const theme = page.find("strong")
        .filter((_index, element) => $(element).text().trim().startsWith("Thème du Mémoire"))
        .first()
        .nextAll("div")
        .first();
      if (!theme.length) {
        throw new Error("Le champ thème du mémoire est absent de la page 16 du document source.");
      }
      theme.text("{{etudiant.sujet}}");
    }
    let contenu = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>${css}</style>
</head>
<body>
${$.html(page)}
</body>
</html>`;
    if (pageNumber === 17) {
      contenu = contenu
        .replace(/ADKPELI Nes\.\.\. Françoise/g, "{{etudiant.nom}} {{etudiant.prenom}}")
        .replace(/ADKPELI/g, "{{etudiant.nom}}")
        .replace(/Assistant de Gestion PMI-PME/g, "{{etudiant.option}}")
        .replace(/22 septembre 2026/g, "{{dateEdition}}");
    }

    return { pageNumber, libelle, typeCode, contenu };
  });
}
