import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { RhDepartement } from "./models/RhDepartement";
import { RhPoste } from "./models/RhPoste";
import { RhTypeContrat } from "./models/RhTypeContrat";
import { RhRubriquePaie } from "./models/RhRubriquePaie";

export async function seedRh(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const depCount = await RhDepartement.count();
  if (depCount === 0) {
    await RhDepartement.bulkCreate([
      { nom: "Enseignement", description: "Département dédié aux activités pédagogiques et académiques" },
      { nom: "Administration", description: "Département chargé de la gestion administrative" },
      { nom: "Finance", description: "Département de gestion financière et comptable" },
    ]);
    console.log("3 Départements créés");
  }

  const posteCount = await RhPoste.count();
  if (posteCount === 0) {
    const deps = await RhDepartement.findAll();
    const depEns = deps.find(d => d.nom === "Enseignement");
    const depAdm = deps.find(d => d.nom === "Administration");
    const depFin = deps.find(d => d.nom === "Finance");
    await RhPoste.bulkCreate([
      { titre: "Enseignant", description: "Enseignant chercheur", departementId: depEns?.id ?? deps[0].id },
      { titre: "Comptable", description: "Agent comptable", departementId: depFin?.id ?? deps[1].id },
      { titre: "Secrétaire", description: "Secrétaire administratif", departementId: depAdm?.id ?? deps[2].id },
      { titre: "Directeur", description: "Directeur de département", departementId: depEns?.id ?? deps[0].id },
      { titre: "Agent d'entretien", description: "Agent de maintenance et propreté", departementId: depAdm?.id ?? deps[2].id },
    ]);
    console.log("5 Postes créés");
  }

  const contratCount = await RhTypeContrat.count();
  if (contratCount === 0) {
    await RhTypeContrat.bulkCreate([
      { code: "CDI", libelle: "Contrat à Durée Indéterminée" },
      { code: "CDD", libelle: "Contrat à Durée Déterminée" },
      { code: "VAC", libelle: "Vacataire" },
    ]);
    console.log("3 Types de contrat créés");
  }

  const rubriqueCount = await RhRubriquePaie.count();
  if (rubriqueCount === 0) {
    await RhRubriquePaie.bulkCreate([
      { code: "SAL", libelle: "Salaire de base", type: "gain", modeCalcul: "fixe", valeur: 0, imposable: true },
      { code: "ANC", libelle: "Prime d'ancienneté", type: "gain", modeCalcul: "pourcentage", valeur: 5, imposable: true },
      { code: "CNPS", libelle: "CNPS", type: "cotisation", modeCalcul: "pourcentage", valeur: 4, imposable: false },
      { code: "IRPP", libelle: "IRPP", type: "retenue", modeCalcul: "pourcentage", valeur: 6, imposable: false },
      { code: "AVA", libelle: "Avance", type: "retenue", modeCalcul: "fixe", valeur: 0, imposable: false },
    ]);
    console.log("5 Rubriques paie créées");
  }
}

if (require.main === module) {
  seedRh().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
