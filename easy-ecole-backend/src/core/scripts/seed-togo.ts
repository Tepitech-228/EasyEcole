import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { SemestresParcours } from "../../core/enums/SemestresParcours";
import * as bcrypt from "bcrypt";

async function seedTogo() {
  const db = DatabaseConnection.getInstance();
  const s = db.sequelize;
  await s.authenticate();
  require("../../modules/auth/models/_associations");
  require("../../modules/inscription/models/_associations");
  require("../../modules/bulletins/models/_associations");

  const M = (n: string) => s.model(n);
  const AutU = M("AutUtilisateur");
  const AutI = M("AutInstitution");
  const AutA = M("AutApprenant");
  const AutAdrA = M("AutAdresseApprenant");
  const AutIdA = M("AutIdentiteApprenant");
  const AutInfoP = M("AutInformationsParentsApprenant");
  const AutPersP = M("AutPersonnePrevenirApprenant");
  const AutInfoS = M("AutInformationsSalarieApprenant");
  const InsAn = M("InsAnneeAcademique");
  const InsClasse = M("InsClasse");
  const InsCours = M("InsCours");
  const InsCourP = M("InsCoursParticipant");
  const InsCur = M("InsCursusApprenant");
  const InsTNE = M("InsTypeNoteEvaluation");
  const InsLNE = M("InsListeNoteEvaluation");
  const InsNE = M("InsNoteEvaluation");
  const InsLigneBulletin = M("LigneBulletin");
  const InsBulletin = M("Bulletin");

  const hash = bcrypt.hashSync("password123", 10);
  const an = await InsAn.findOne({ where: { libelle: "2025-2026" } });
  if (!an) throw new Error("Annee 2025-2026 introuvable");
  const anneId = (an as any).id;

  await s.query("SET FOREIGN_KEY_CHECKS = 0", { raw: true });
  // clean course data
  for (const t of ["ins_lignes_bulletins","ins_bulletins","ins_notes_evaluation","ins_listes_notes_evaluation","ins_cours_participants","ins_cursus_apprenants","ins_cours"]) {
    await s.query("DELETE FROM " + t, { raw: true });
  }
  // clean existing togo users
  const [urows] = await s.query("SELECT id FROM aut_utilisateurs WHERE identifiant LIKE 'togo%'") as any;
  const uids = (urows || []).map((u: any) => u.id);
  if (uids.length > 0) {
    const idList = uids.join(',');
    const [arows] = await s.query("SELECT id FROM aut_apprenants WHERE utilisateurId IN (" + idList + ")") as any;
    const aids = (arows || []).map((a: any) => a.id);
    if (aids.length > 0) {
      const appList = aids.join(',');
      await s.query("DELETE FROM aut_informations_parents_apprenants WHERE apprenantId IN (" + appList + ")", { raw: true });
      await s.query("DELETE FROM aut_personnes_prevenir_apprenants WHERE apprenantId IN (" + appList + ")", { raw: true });
      await s.query("DELETE FROM aut_informations_salarie_apprenants WHERE apprenantId IN (" + appList + ")", { raw: true });
      await s.query("DELETE FROM aut_identites_apprenants WHERE apprenantId IN (" + appList + ")", { raw: true });
      await s.query("DELETE FROM aut_adresses_apprenants WHERE apprenantId IN (" + appList + ")", { raw: true });
      await s.query("DELETE FROM aut_apprenants WHERE id IN (" + appList + ")", { raw: true });
    }
    await s.query("DELETE FROM aut_utilisateurs WHERE id IN (" + idList + ")", { raw: true });
  }
  await s.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });

  const classes = [1, 2, 3, 4];
  const matieres = [
    "Programmation Web", "Base de Donnees", "Reseaux", "Mathematiques",
    "Anglais", "Gestion de Projet", "Droit Informatique", "Securite SI",
    "Marketing Digital", "Comptabilite", "Economie", "Algorithmique",
    "Systemes d'Information", "Intelligence Artificielle", "IoT", "Cloud Computing"
  ];

  const coursRecords: any[] = [];
  let cpt = 1;
  let globalCpt = 1;
  for (const cl of classes) {
    for (let i = 0; i < 8; i++) {
      const sem = i < 4 ? SemestresParcours.SEMESTRE1 : SemestresParcours.SEMESTRE2;
      const code = `TOGO${String(globalCpt++).padStart(3, "0")}`;
      const cr = await InsCours.create({
        code,
        intitule: matieres[(cpt - 1) % matieres.length],
        credit: [3, 4, 5][i % 3],
        semestre: sem,
        classeId: cl,
        parcoursId: cl,
        enseignantId: 1,
      });
      coursRecords.push(cr);
      cpt++;
    }
  }

  const typesEval = [
    { libelle: "Controle Continu", categorie: "controle_continu" },
    { libelle: "Devoir", categorie: "devoir" },
    { libelle: "Examen Final", categorie: "examen" },
    { libelle: "Projet", categorie: "devoir" },
    { libelle: "TP", categorie: "controle_continu" },
  ];
  const typeRecords: any[] = [];
  for (const t of typesEval) {
    let tr = await InsTNE.findOne({ where: { libelle: t.libelle } });
    if (!tr) tr = await InsTNE.create({ libelle: t.libelle, categorie: t.categorie });
    typeRecords.push(tr);
  }

  const apprenantsTogo = [
    { nom: "Agbobli", prenoms: "Kossi" },
    { nom: "Akakpo", prenoms: "Eyram" },
    { nom: "Amouzou", prenoms: "Afi" },
    { nom: "Assou", prenoms: "Komlan" },
    { nom: "Atayi", prenoms: "Mawuli" },
    { nom: "Attiogbe", prenoms: "Yawa" },
    { nom: "Bocco", prenoms: "Edem" },
    { nom: "Degbevi", prenoms: "Senam" },
    { nom: "Doh", prenoms: "Akouvi" },
    { nom: "Dotche", prenoms: "Kodjo" },
    { nom: "Edorh", prenoms: "Elom" },
    { nom: "Gbadoe", prenoms: "Komi" },
    { nom: "Gbekley", prenoms: "Amavi" },
    { nom: "Hountondji", prenoms: "Kossiwa" },
    { nom: "Koffi", prenoms: "Esso" },
    { nom: "Lawson", prenoms: "Tete" },
    { nom: "Mensah", prenoms: "Yao" },
    { nom: "Senou", prenoms: "Mawule" },
    { nom: "Tete", prenoms: "Gnekele" },
    { nom: "Togbe", prenoms: "Ayaba" },
    { nom: "Agbodjan", prenoms: "Komla" },
    { nom: "Ahadji", prenoms: "Dovi" },
    { nom: "Akue", prenoms: "Aklesso" },
    { nom: "Alognon", prenoms: "Kafui" },
    { nom: "Amedegnato", prenoms: "Sika" },
    { nom: "Apelo", prenoms: "Atsu" },
    { nom: "Atayi", prenoms: "Delali" },
    { nom: "Azalekor", prenoms: "Efoe" },
    { nom: "Badou", prenoms: "Koku" },
    { nom: "Bakpatina", prenoms: "Akossiwa" },
  ];

  let totalNotes = 0;
  for (let idx = 0; idx < apprenantsTogo.length; idx++) {
    const a = apprenantsTogo[idx];
    const cl = classes[idx % 4];
    const appId = String(idx + 1).padStart(4, "0");
    const user = await AutU.create({
      nom: a.nom, prenoms: a.prenoms,
      identifiant: "togo" + appId,
      email: "togo" + appId + "@easyecole.com",
      motDePasse: hash,
      role: "apprenant",
      contact: "+22890" + appId,
      dateVerificationEmail: new Date(),
    });
    const userId = (user as any).id;
    const adr = await AutAdrA.create({
      pays: "Togo", ville: "Lome", quartier: "Lome",
      boitePostale: "BP " + appId,
      prorietaireBoitePostale: a.nom + " " + a.prenoms,
      telMobile: "+22890" + appId,
    });
    const adrId = (adr as any).id;
    const identite = await AutIdA.create({
      nationalite: "Togolaise", religion: "Non specifie",
      situationMatrimoniale: "celibataire", etatPhysique: "valide",
    });
    const identiteId = (identite as any).id;
    await AutInfoP.create({
      nomPrenomsPere: "Pere " + a.nom, professionPere: "Fonctionnaire",
      nomPrenomsMere: "Mere " + a.nom, professionMere: "Menagere",
    });
    await AutPersP.create({
      nom: a.nom, prenoms: a.prenoms,
      telMobile: "+22890" + appId,
      quartier: "Lome", ville: "Lome", pays: "Togo",
      boitePostale: "BP " + appId,
    });
    await AutA.create({
      dateNaissance: new Date(2000 + (idx % 5), idx % 12, (idx % 28) + 1),
      lieuNaissance: "Lome",
      utilisateurId: userId,
      adresseId: adrId,
      identiteId: identiteId,
    });
    await AutInfoS.create({ estSalarie: false });

    const debutIdx = (cl - 1) * 8;
    const cur = await InsCur.create({
      utilisateurId: userId,
      classeId: cl,
      niveauEtudeId: 1,
      parcoursId: cl,
      anneeAcademiqueId: anneId,
    });
    const curId = (cur as any).id;

    for (let c = 0; c < 8; c++) {
      const cours = coursRecords[debutIdx + c];
      const coursId = (cours as any).id;
      const cp = await InsCourP.create({
        utilisateurId: userId,
        coursId: coursId,
        cursusApprenantId: curId,
      });
      const cpId = (cp as any).id;

      const poidsEvals = [20, 15, 50, 10, 15];
      for (let e = 0; e < typeRecords.length; e++) {
        const lne = await InsLNE.create({
          date: new Date("2025-" + String(10 + e).padStart(2, "0") + "-15"),
          heureDebut: "08:00:00",
          heureFin: "10:00:00",
          poidsTypeNoteEvaluation: poidsEvals[e],
          typeNoteEvaluationId: (typeRecords[e] as any).id,
          coursId: coursId,
          anneeAcademiqueId: anneId,
        });
        const lneId = (lne as any).id;
        const noteVal = +(10 + Math.random() * 9).toFixed(1);
        await InsNE.create({
          note: Math.min(noteVal, 20),
          listeNoteEvaluationId: lneId,
          coursParticipantId: cpId,
        });
        totalNotes++;
      }
    }
  }

  console.log("OK " + apprenantsTogo.length + " etudiants, " + coursRecords.length + " cours, " + totalNotes + " notes");
  await s.close();
}

seedTogo().catch((e: any) => { console.error(e); process.exit(1); });
