import { DataResolverService } from "./src/modules/docgen/services/DataResolverService";

async function main() {
  const { DatabaseConnection } = require("./src/core/helpers/DatabaseConnection");
  const sequelize = DatabaseConnection.getInstance().sequelize;

  // Chargement des associations (comme au boot)
  require("./src/modules/inscription/models/_associations");
  require("./src/modules/docgen/models/_associations");

  const res = await DataResolverService.resolve("API001", {
    typeCode: "API001",
    demandeInscriptionId: 61,
    cursusApprenantId: 41,
    etudiantId: 74,
    anneeAcademiqueId: 3,
    parcoursId: 151,
    niveauEtudeId: 1,
    sourceId: 41 as any,
  } as any);

  console.log("etudiants.length =", res.etudiants?.length);
  console.log("etudiant[0] =", JSON.stringify(res.etudiants?.[0]));

  await sequelize.close();
}

main().catch((e) => {
  console.error("ERREUR:", e);
  process.exit(1);
});