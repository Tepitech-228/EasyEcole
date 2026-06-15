import * as bcrypt from 'bcrypt';
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function seed() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    // Load all models
    require('../../modules/auth/models/_associations');
    require('../../modules/orientation/models/_associations');
    require('../../modules/inscription/models/_associations');
    require('../../modules/stage/models/_associations');
    require('../../modules/stock/models/_associations');
    require('../../modules/immobilisation/models/_associations');

    // ── MODELS ──
    const M = (name: string) => sequelize.model(name);

    const AutU = M('AutUtilisateur');
    const AutI = M('AutInstitution');
    const AutA = M('AutApprenant');
    const AutE = M('AutEnseignant');
    const AutC = M('AutCaissierBanque');
    const AutB = M('AutBanque');
    const AutAdrI = M('AutAdresseInstitution');
    const AutAdrA = M('AutAdresseApprenant');
    const AutAdrE = M('AutAdresseEnseignant');
    const AutAdrC = M('AutAdresseCaissierBanque');
    const AutIdA = M('AutIdentiteApprenant');
    const AutInfoP = M('AutInformationsParentsApprenant');
    const AutInfoS = M('AutInformationsSalarieApprenant');
    const AutPersP = M('AutPersonnePrevenirApprenant');

    const OriCat = M('OriCategorie');
    const OriNiv = M('ori_NiveauEtude');
    const OriPar = M('OriParcours');
    const OriDeb = M('OriDeboucheParcours');
    const OriMat = M('OriMatierePrerequis');
    const OriPreP = M('OriPrerequisParcours');
    const OriDem = M('OriDemandeOrientation');
    const OriParCh = M('OriParcoursChoisi');
    const OriPan = M('ori_PanierParcoursChoisi');
    const OriPrePCh = M('OriPrerequisParcoursChoisi');
    const OriRep = M('OriReponseOrientation');

    const InsAn = M('InsAnneeAcademique');
    const InsSess = M('InsSession');
    const InsNiv = M('InsNiveauEtude');
    const InsPar = M('InsParcours');
    const InsClasse = M('InsClasse');
    const InsCours = M('InsCours');
    const InsChap = M('InsChapitreCours');
    const InsRes = M('InsRessource');
    const InsFicRes = M('InsFichierRessource');
    const InsSalle = M('InsSalleDeClasse');
    const InsSeance = M('InsSeance');
    const InsLPres = M('InsListePresence');
    const InsPres = M('InsPresence');
    const InsPresCP = M('InsPresenceCoursParticipant');
    const InsCourP = M('InsCoursParticipant');
    const InsMat = M('InsMatierePrerequis');
    const InsPreP = M('InsPrerequisParcours');
    const InsParCh = M('InsParcoursChoisi');
    const InsPrePCh = M('InsPrerequisParcoursChoisi');
    const InsFrais = M('InsFraisInscription');
    const InsDem = M('InsDemandeInscription');
    const InsDemC = M('InsDemandeInscriptionCours');
    const InsDoss = M('InsDossierInscription');
    const InsDemD = M('InsDemandeInscriptionDossier');
    const InsPai = M('InsPaiementInscription');
    const InsCur = M('InsCursusApprenant');
    const InsCahier = M('InsCahierDeTexte');
    const InsBlocCah = M('InsBlocCahierDeTexte');
    const InsRep = M('InsReponseInscription');
    const InsTNE = M('InsTypeNoteEvaluation');
    const InsLNE = M('InsListeNoteEvaluation');
    const InsNE = M('InsNoteEvaluation');

    // ── STAGE MODELS ──
    const StgEnt = M('StgEntreprise');
    const StgTut = M('StgTuteur');
    const StgOff = M('StgOffreStage');
    const StgDem = M('StgDemandeStage');
    const StgConv = M('StgConventionStage');
    const StgRap = M('StgRapportStage');
    const StgNote = M('StgNoteStage');
    const StgAtt = M('StgAttestationStage');

    // ── STOCK MODELS ──
    const StkCat = M('StkCategorieArticle');
    const StkArt = M('StkArticle');
    const StkFour = M('StkFournisseur');
    const StkMouv = M('StkMouvementStock');
    const StkBC = M('StkBonCommande');
    const StkLBC = M('StkLigneBonCommande');

    // ── IMMOBILISATION MODELS ──
    const ImmSite = M('ImmSite');
    const ImmBat = M('ImmBatiment');
    const ImmLoc = M('ImmLocalisation');
    const ImmDep = M('ImmDepartement');
    const ImmCat = M('ImmCategorieImmobilisation');
    const ImmImmo = M('ImmImmobilisation');
    const ImmAcq = M('ImmAcquisition');
    const ImmAmort = M('ImmAmortissement');
    const ImmMaint = M('ImmMaintenance');
    const ImmMaintP = M('ImmMaintenanceProgrammee');
    const ImmCess = M('ImmCession');

    const hash = bcrypt.hashSync('password123', 10);

    console.log('\n═══════════════════════════════════════════');
    console.log('  STARTING SEED — Tous les modules');
    console.log('═══════════════════════════════════════════');

    // ════════════════════════════════════════════════════
    //  AUTH MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── AUTH / UTILISATEURS ──');

    const admin = await AutU.create({ nom: 'Admin', prenoms: 'Super', identifiant: 'admin', email: 'admin@easyecole.com', motDePasse: hash, role: 'admin', contact: '+2250100000000', dateVerificationEmail: new Date() });
    console.log('  ✓ Admin');

    // Institution 1 — Groupe Scolaire Riviera
    const uInst1 = await AutU.create({ nom: 'Konan', prenoms: 'Bernard', identifiant: 'institution1', email: 'institution@easyecole.com', motDePasse: hash, role: 'institution', contact: '+2250101000001', dateVerificationEmail: new Date() });
    const adrInst1 = await AutAdrI.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Riviera 3', boitePostale: 'BP 567 Abidjan', prorietaireBoitePostale: 'Groupe Scolaire Riviera', telMobile: '+2250101000001' });
    await AutI.create({ dateNaissance: new Date('1975-03-15'), lieuNaissance: 'Abidjan', fonction: 'Directeur Général', adresseId: adrInst1.id, utilisateurId: uInst1.id });
    console.log('  ✓ Institution 1 — Groupe Scolaire Riviera');

    // Institution 2 — Lycée Moderne d'Abobo
    const uInst2 = await AutU.create({ nom: 'Touré', prenoms: 'Fatim', identifiant: 'institution2', email: 'institution2@easyecole.com', motDePasse: hash, role: 'institution', contact: '+2250101000002', dateVerificationEmail: new Date() });
    const adrInst2 = await AutAdrI.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Abobo', boitePostale: 'BP 890 Abidjan', prorietaireBoitePostale: 'Lycée Moderne Abobo', telMobile: '+2250101000002' });
    await AutI.create({ dateNaissance: new Date('1982-07-22'), lieuNaissance: 'Odienné', fonction: 'Proviseur', adresseId: adrInst2.id, utilisateurId: uInst2.id });
    console.log('  ✓ Institution 2 — Lycée Moderne d\'Abobo');

    // Enseignant 1 — Prof Maths
    const uEns1 = await AutU.create({ nom: 'Kouamé', prenoms: 'Mamadou', identifiant: 'enseignant1', email: 'enseignant1@easyecole.com', motDePasse: hash, role: 'enseignant', contact: '+2250102000001', dateVerificationEmail: new Date() });
    const adrEns1 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Cocody', boitePostale: 'BP 111', prorietaireBoitePostale: 'Mamadou Kouamé', telMobile: '+2250102000001' });
    await AutE.create({ dateNaissance: new Date('1985-06-15'), lieuNaissance: 'Bouaké', fonction: 'Professeur de Mathématiques', adresseId: adrEns1.id, utilisateurId: uEns1.id });
    console.log('  ✓ Enseignant 1 — Mamadou Kouamé (Maths)');

    // Enseignant 2 — Prof Français
    const uEns2 = await AutU.create({ nom: 'N\'Guessan', prenoms: 'Aminata', identifiant: 'enseignant2', email: 'enseignant2@easyecole.com', motDePasse: hash, role: 'enseignant', contact: '+2250102000002', dateVerificationEmail: new Date() });
    const adrEns2 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Marcory', boitePostale: 'BP 222', prorietaireBoitePostale: 'Aminata N\'Guessan', telMobile: '+2250102000002' });
    await AutE.create({ dateNaissance: new Date('1990-11-30'), lieuNaissance: 'Abidjan', fonction: 'Professeur de Français', adresseId: adrEns2.id, utilisateurId: uEns2.id });
    console.log('  ✓ Enseignant 2 — Aminata N\'Guessan (Français)');

    // Enseignant 3 — Prof Informatique
    const uEns3 = await AutU.create({ nom: 'Bamba', prenoms: 'Souleymane', identifiant: 'enseignant3', email: 'enseignant3@easyecole.com', motDePasse: hash, role: 'enseignant', contact: '+2250102000003', dateVerificationEmail: new Date() });
    const adrEns3 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Plateau', boitePostale: 'BP 333', prorietaireBoitePostale: 'Souleymane Bamba', telMobile: '+2250102000003' });
    await AutE.create({ dateNaissance: new Date('1988-02-20'), lieuNaissance: 'Abidjan', fonction: 'Professeur d\'Informatique', adresseId: adrEns3.id, utilisateurId: uEns3.id });
    console.log('  ✓ Enseignant 3 — Souleymane Bamba (Info)');

    // Enseignant 4 — Prof Comptabilité
    const uEns4 = await AutU.create({ nom: 'Diallo', prenoms: 'Aïssata', identifiant: 'enseignant4', email: 'enseignant4@easyecole.com', motDePasse: hash, role: 'enseignant', contact: '+2250102000004', dateVerificationEmail: new Date() });
    const adrEns4 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Yopougon', boitePostale: 'BP 444', prorietaireBoitePostale: 'Aïssata Diallo', telMobile: '+2250102000004' });
    await AutE.create({ dateNaissance: new Date('1992-08-14'), lieuNaissance: 'Man', fonction: 'Professeur de Comptabilité', adresseId: adrEns4.id, utilisateurId: uEns4.id });
    console.log('  ✓ Enseignant 4 — Aïssata Diallo (Compta)');

    // Banques
    const bq1 = await AutB.create({ nom: 'Ecobank Côte d\'Ivoire' });
    const bq2 = await AutB.create({ nom: ' Société Générale CI' });
    console.log('  ✓ Banques');

    // Caissier 1
    const uCai1 = await AutU.create({ nom: 'Koné', prenoms: 'Mariam', identifiant: 'caissier1', email: 'caissier1@easyecole.com', motDePasse: hash, role: 'caissier_banque', contact: '+2250103000001', dateVerificationEmail: new Date() });
    const adrCai1 = await AutAdrC.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Treichville', boitePostale: 'BP 555', prorietaireBoitePostale: 'Mariam Koné', telMobile: '+2250103000001' });
    await AutC.create({ dateNaissance: new Date('1993-09-10'), lieuNaissance: 'Abidjan', fonction: 'Caissière Principale', adresseId: adrCai1.id, utilisateurId: uCai1.id, banqueId: bq1.id });
    console.log('  ✓ Caissier 1 — Mariam Koné');

    // Caissier 2
    const uCai2 = await AutU.create({ nom: 'Fofana', prenoms: 'Ibrahim', identifiant: 'caissier2', email: 'caissier2@easyecole.com', motDePasse: hash, role: 'caissier_banque', contact: '+2250103000002', dateVerificationEmail: new Date() });
    const adrCai2 = await AutAdrC.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Adjamé', boitePostale: 'BP 666', prorietaireBoitePostale: 'Ibrahim Fofana', telMobile: '+2250103000002' });
    await AutC.create({ dateNaissance: new Date('1991-12-05'), lieuNaissance: 'Korhogo', fonction: 'Caissier', adresseId: adrCai2.id, utilisateurId: uCai2.id, banqueId: bq2.id });
    console.log('  ✓ Caissier 2 — Ibrahim Fofana');

    // ── APPRENANTS ──
    interface AppSeed { nom: string; prenoms: string; identifiant: string; email: string; dateNais: Date; lieuNais: string; salarie: boolean; bp: string; tel: string; quartier: string; ville: string; pere: string; mere: string; professionPere: string; professionMere: string; nomPrevenir: string; telPrevenir: string; }
    const apprenants: AppSeed[] = [
        { nom: 'Traoré', prenoms: 'Aminata', identifiant: 'apprenant1', email: 'apprenant1@easyecole.com', dateNais: new Date('2002-05-10'), lieuNais: 'Abidjan', salarie: false, bp: 'BP 101', tel: '+2250501000001', quartier: 'Cocody Angré', ville: 'Abidjan', pere: 'Drissa Traoré', mere: 'Maimouna Koné', professionPere: 'Fonctionnaire', professionMere: 'Commerçante', nomPrevenir: 'Drissa Traoré', telPrevenir: '+2250701000001' },
        { nom: 'Kouamé', prenoms: 'Jean', identifiant: 'apprenant2', email: 'apprenant2@easyecole.com', dateNais: new Date('2001-08-22'), lieuNais: 'Bouaké', salarie: true, bp: 'BP 202', tel: '+2250502000002', quartier: 'Belle-ville', ville: 'Bouaké', pere: 'Paul Kouamé', mere: 'Marie N\'Dri', professionPere: 'Enseignant', professionMere: 'Ménagère', nomPrevenir: 'Paul Kouamé', telPrevenir: '+2250702000002' },
        { nom: 'Bamba', prenoms: 'Mariam', identifiant: 'apprenant3', email: 'apprenant3@easyecole.com', dateNais: new Date('2003-01-15'), lieuNais: 'Abidjan', salarie: false, bp: 'BP 303', tel: '+2250503000003', quartier: 'Yopougon', ville: 'Abidjan', pere: 'Moussa Bamba', mere: 'Fatou Diarra', professionPere: 'Entrepreneur', professionMere: 'Infirmière', nomPrevenir: 'Fatou Diarra', telPrevenir: '+2250703000003' },
        { nom: 'Soro', prenoms: 'Léon', identifiant: 'apprenant4', email: 'apprenant4@easyecole.com', dateNais: new Date('2002-11-30'), lieuNais: 'Korhogo', salarie: false, bp: 'BP 404', tel: '+2250504000004', quartier: 'Konankro', ville: 'Korhogo', pere: 'Yacouba Soro', mere: 'Gnoumata Soro', professionPere: 'Agriculteur', professionMere: 'Ménagère', nomPrevenir: 'Yacouba Soro', telPrevenir: '+2250704000004' },
        { nom: 'Yao', prenoms: 'Esther', identifiant: 'apprenant5', email: 'apprenant5@easyecole.com', dateNais: new Date('2003-04-05'), lieuNais: 'Daloa', salarie: false, bp: 'BP 505', tel: '+2250505000005', quartier: 'Commerce', ville: 'Daloa', pere: 'Kouassi Yao', mere: 'Akissi Yao', professionPere: 'Commerçant', professionMere: 'Institutrice', nomPrevenir: 'Kouassi Yao', telPrevenir: '+2250705000005' },
        { nom: 'Coulibaly', prenoms: 'Adama', identifiant: 'apprenant6', email: 'apprenant6@easyecole.com', dateNais: new Date('2001-07-19'), lieuNais: 'Séguela', salarie: true, bp: 'BP 606', tel: '+2250506000006', quartier: 'Centre', ville: 'Séguela', pere: 'Mamadou Coulibaly', mere: 'Hawa Touré', professionPere: 'Transporteur', professionMere: 'Coiffeuse', nomPrevenir: 'Mamadou Coulibaly', telPrevenir: '+2250706000006' },
        { nom: 'Koffi', prenoms: 'Aya', identifiant: 'apprenant7', email: 'apprenant7@easyecole.com', dateNais: new Date('2002-10-12'), lieuNais: 'Abidjan', salarie: false, bp: 'BP 707', tel: '+2250507000007', quartier: 'Cocody', ville: 'Abidjan', pere: 'Bernard Koffi', mere: 'Thérèse Koffi', professionPere: 'Médecin', professionMere: 'Infirmière', nomPrevenir: 'Bernard Koffi', telPrevenir: '+2250707000007' },
        { nom: 'Diomandé', prenoms: 'Yannick', identifiant: 'apprenant8', email: 'apprenant8@easyecole.com', dateNais: new Date('2003-03-18'), lieuNais: 'Man', salarie: false, bp: 'BP 808', tel: '+2250508000008', quartier: 'Libreville', ville: 'Man', pere: 'Alphonse Diomandé', mere: 'Odette Diomandé', professionPere: 'Instituteur', professionMere: 'Ménagère', nomPrevenir: 'Alphonse Diomandé', telPrevenir: '+2250708000008' },
        { nom: 'N\'Dri', prenoms: 'Grace', identifiant: 'apprenant9', email: 'apprenant9@easyecole.com', dateNais: new Date('2002-06-25'), lieuNais: 'Abidjan', salarie: true, bp: 'BP 909', tel: '+2250509000009', quartier: 'Marcory', ville: 'Abidjan', pere: 'Michel N\'Dri', mere: 'Emma N\'Dri', professionPere: 'Avocat', professionMere: 'Secrétaire', nomPrevenir: 'Michel N\'Dri', telPrevenir: '+2250709000009' },
        { nom: 'Toure', prenoms: 'Moussa', identifiant: 'apprenant10', email: 'apprenant10@easyecole.com', dateNais: new Date('2001-12-01'), lieuNais: 'Odienné', salarie: false, bp: 'BP 010', tel: '+2250510000010', quartier: 'Plateau', ville: 'Odienné', pere: 'Lamine Touré', mere: 'Kadiatou Touré', professionPere: 'Commerçant', professionMere: 'Ménagère', nomPrevenir: 'Lamine Touré', telPrevenir: '+2250710000010' },
        { nom: 'Guei', prenoms: 'Sarah', identifiant: 'apprenant11', email: 'apprenant11@easyecole.com', dateNais: new Date('2003-09-08'), lieuNais: 'Gagnoa', salarie: false, bp: 'BP 111', tel: '+2250511000011', quartier: 'Centre Ville', ville: 'Gagnoa', pere: 'Joseph Guei', mere: 'Marie Guei', professionPere: 'Fonctionnaire', professionMere: 'Commerçante', nomPrevenir: 'Joseph Guei', telPrevenir: '+2250711000011' },
        { nom: 'Kouadio', prenoms: 'Arnaud', identifiant: 'apprenant12', email: 'apprenant12@easyecole.com', dateNais: new Date('2002-02-14'), lieuNais: 'Yamoussoukro', salarie: true, bp: 'BP 121', tel: '+2250512000012', quartier: 'Habitat', ville: 'Yamoussoukro', pere: 'Pierre Kouadio', mere: 'Louise Kouadio', professionPere: 'Ingénieur', professionMere: 'Enseignante', nomPrevenir: 'Pierre Kouadio', telPrevenir: '+2250712000012' },
        { nom: 'Brou', prenoms: 'Ruth', identifiant: 'apprenant13', email: 'apprenant13@easyecole.com', dateNais: new Date('2001-05-20'), lieuNais: 'San-Pédro', salarie: false, bp: 'BP 131', tel: '+2250513000013', quartier: 'Balmer', ville: 'San-Pédro', pere: 'Alain Brou', mere: 'Joséphine Brou', professionPere: 'Pêcheur', professionMere: 'Ménagère', nomPrevenir: 'Alain Brou', telPrevenir: '+2250713000013' },
        { nom: 'Kouakou', prenoms: 'Samuel', identifiant: 'apprenant14', email: 'apprenant14@easyecole.com', dateNais: new Date('2003-08-30'), lieuNais: 'Bondoukou', salarie: false, bp: 'BP 141', tel: '+2250514000014', quartier: 'Zanzan', ville: 'Bondoukou', pere: 'Kouakou Georges', mere: 'Aya Rose', professionPere: 'Agriculteur', professionMere: 'Ménagère', nomPrevenir: 'Kouakou Georges', telPrevenir: '+2250714000014' },
        { nom: 'Zadi', prenoms: 'Nathalie', identifiant: 'apprenant15', email: 'apprenant15@easyecole.com', dateNais: new Date('2002-04-17'), lieuNais: 'Abidjan', salarie: false, bp: 'BP 151', tel: '+2250515000015', quartier: 'Koumassi', ville: 'Abidjan', pere: 'François Zadi', mere: 'Élisabeth Zadi', professionPere: 'Agent de banque', professionMere: 'Coiffeuse', nomPrevenir: 'François Zadi', telPrevenir: '+2250715000015' },
        { nom: 'Yoboué', prenoms: 'David', identifiant: 'apprenant16', email: 'apprenant16@easyecole.com', dateNais: new Date('2001-11-22'), lieuNais: 'Bouaflé', salarie: true, bp: 'BP 161', tel: '+2250516000016', quartier: 'Sankar', ville: 'Bouaflé', pere: 'Simon Yoboué', mere: 'Madeleine Yoboué', professionPere: 'Plombier', professionMere: 'Vendeuse', nomPrevenir: 'Simon Yoboué', telPrevenir: '+2250716000016' },
    ];

    const apprenantRecords: any[] = [];
    for (const a of apprenants) {
        const user = await AutU.create({
            nom: a.nom, prenoms: a.prenoms, identifiant: a.identifiant, email: a.email,
            motDePasse: hash, role: 'apprenant', contact: a.tel, dateVerificationEmail: new Date(),
        });
        const adr = await AutAdrA.create({
            pays: 'Côte d\'Ivoire', ville: a.ville, quartier: a.quartier,
            boitePostale: a.bp, prorietaireBoitePostale: `${a.prenoms} ${a.nom}`,
            telMobile: a.tel,
        });
        const identite = await AutIdA.create({
            nationalite: 'Côte d\'Ivoire', religion: 'Non spécifié',
            situationMatrimoniale: 'celibataire', etatPhysique: 'valide',
        });
        const infoParents = await AutInfoP.create({
            nomPrenomsPere: a.pere, professionPere: a.professionPere,
            nomPrenomsMere: a.mere, professionMere: a.professionMere,
        });
        const persPrevenir = await AutPersP.create({
            nom: a.nomPrevenir.split(' ').slice(0, -1).join(' ') || a.nomPrevenir,
            prenoms: a.nomPrevenir.split(' ').slice(-1)[0] || a.nomPrevenir,
            telMobile: a.telPrevenir, quartier: a.quartier, ville: a.ville, pays: 'Côte d\'Ivoire',
            boitePostale: a.bp, prorietaireBoitePostale: a.nomPrevenir,
        });
        const app = await AutA.create({
            dateNaissance: a.dateNais, lieuNaissance: a.lieuNais,
            utilisateurId: user.id, adresseId: adr.id, identiteId: identite.id,
        });
        await AutInfoS.create({ estSalarie: a.salarie });
        apprenantRecords.push(app);
    }
    console.log('  ✓ 16 Apprenants créés');

    // ════════════════════════════════════════════════════
    //  ORIENTATION MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── ORIENTATION ──');

    const oNiv1 = await OriNiv.create({ libelle: 'Baccalauréat' });
    const oNiv2 = await OriNiv.create({ libelle: 'Licence' });
    const oNiv3 = await OriNiv.create({ libelle: 'Master' });
    console.log('  ✓ 3 Niveaux d\'étude');

    const oCat1 = await OriCat.create({ libelle: 'Sciences & Technologies', description: 'Filières scientifiques et techniques' });
    const oCat2 = await OriCat.create({ libelle: 'Commerce & Gestion', description: 'Filières de commerce et de gestion' });
    const oCat3 = await OriCat.create({ libelle: 'Lettres & Sciences Humaines', description: 'Filières littéraires et humaines' });
    const oCat4 = await OriCat.create({ libelle: 'Santé', description: 'Filières médicales et paramédicales' });
    console.log('  ✓ 4 Catégories');

    const oParcoursData = [
        { titre: 'Développement Web & Mobile', duree: '3 ans', contenu: 'Formation complète en développement web (HTML, CSS, JavaScript, Angular, React, Node.js) et mobile (Flutter).', cat: oCat1.id, niv: oNiv2.id, video: '/videos/dev-web.mp4' },
        { titre: 'Réseaux & Cybersécurité', duree: '3 ans', contenu: 'Administration réseaux, sécurité informatique, cloud computing et DevOps.', cat: oCat1.id, niv: oNiv2.id, video: null },
        { titre: 'Intelligence Artificielle', duree: '5 ans', contenu: 'Machine Learning, Deep Learning, NLP, Computer Vision avec Python et TensorFlow.', cat: oCat1.id, niv: oNiv3.id, video: null },
        { titre: 'Comptabilité & Finance', duree: '3 ans', contenu: 'Comptabilité générale, analytique, audit, fiscalité et gestion financière.', cat: oCat2.id, niv: oNiv2.id, video: null },
        { titre: 'Marketing Digital & Communication', duree: '3 ans', contenu: 'Marketing digital, SEO, SEA, social media, brand content et stratégie de communication.', cat: oCat2.id, niv: oNiv2.id, video: null },
        { titre: 'Journalisme & Médias', duree: '3 ans', contenu: 'Journalisme multimédia, production audiovisuelle, storytelling numérique.', cat: oCat3.id, niv: oNiv2.id, video: '/videos/journalisme.mp4' },
        { titre: 'Droit des Affaires', duree: '5 ans', contenu: 'Droit commercial, droit des contrats, droit fiscal, droit du travail.', cat: oCat3.id, niv: oNiv3.id, video: null },
        { titre: 'Médecine Générale', duree: '7 ans', contenu: 'Formation complète en médecine générale avec stages hospitaliers.', cat: oCat4.id, niv: oNiv3.id, video: null },
    ];

    const oParcoursRecords: any[] = [];
    for (const p of oParcoursData) {
        const parc = await OriPar.create({
            titre: p.titre, dureeDeFormation: p.duree, contenu: p.contenu,
            categorieId: p.cat, niveauEtudeId: p.niv,
        });
        oParcoursRecords.push(parc);
    }
    console.log('  ✓ 8 Parcours de formation');

    await OriDeb.create({ titre: 'Développeur Full Stack', description: 'CDI - 450 000 XOF/mois - Abidjan', parcoursId: oParcoursRecords[0].id });
    await OriDeb.create({ titre: 'Architecte Logiciel', description: 'CDI - 800 000 XOF/mois - Abidjan', parcoursId: oParcoursRecords[0].id });
    await OriDeb.create({ titre: 'Ingénieur Réseaux', description: 'CDI - 500 000 XOF/mois - Abidjan', parcoursId: oParcoursRecords[1].id });
    await OriDeb.create({ titre: 'Data Scientist', description: 'CDI - 1 000 000 XOF/mois - International', parcoursId: oParcoursRecords[2].id });
    await OriDeb.create({ titre: 'Comptable Agréé', description: 'CDI - 350 000 XOF/mois - Abidjan', parcoursId: oParcoursRecords[3].id });
    await OriDeb.create({ titre: 'Community Manager', description: 'CDI - 250 000 XOF/mois - Abidjan', parcoursId: oParcoursRecords[4].id });
    console.log('  ✓ 6 Débouchés');

    const oMat1 = await OriMat.create({ libelle: 'Mathématiques' });
    const oMat2 = await OriMat.create({ libelle: 'Français' });
    const oMat3 = await OriMat.create({ libelle: 'Anglais' });
    const oMat4 = await OriMat.create({ libelle: 'Physique-Chimie' });
    const oMat5 = await OriMat.create({ libelle: 'Informatique' });
    console.log('  ✓ 5 Matières prérequis');

    await OriPreP.create({ noteRequise: 12, periodeEvaluation: 'baccalaureat', matierePrerequisId: oMat1.id, parcoursId: oParcoursRecords[0].id });
    await OriPreP.create({ noteRequise: 14, periodeEvaluation: 'baccalaureat', matierePrerequisId: oMat5.id, parcoursId: oParcoursRecords[0].id });
    await OriPreP.create({ noteRequise: 10, periodeEvaluation: 'baccalaureat', matierePrerequisId: oMat1.id, parcoursId: oParcoursRecords[3].id });
    await OriPreP.create({ noteRequise: 12, periodeEvaluation: 'baccalaureat', matierePrerequisId: oMat2.id, parcoursId: oParcoursRecords[5].id });
    console.log('  ✓ 4 Prérequis parcours');

    // Demandes d'orientation
    for (let i = 0; i < 3; i++) {
        const dem = await OriDem.create({ utilisateurId: apprenantRecords[i].id });
        const pCh = await OriParCh.create({ demandeOrientationId: dem.id, parcoursId: oParcoursRecords[i].id, etatDeValidation: 'accepte' });
        await OriPan.create({ parcoursChoisiId: pCh.id, demandeOrientationId: dem.id });
        await OriRep.create({ demandeOrientationId: dem.id, utilisateurId: uInst1.id, message: `Félicitations ${apprenants[i].prenoms}, votre candidature est acceptée.` });
    }
    console.log('  ✓ 3 Demandes + réponses orientation');

    // ════════════════════════════════════════════════════
    //  INSCRIPTION MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── INSCRIPTION ──');

    const insNiv1 = await InsNiv.create({ libelle: 'Licence' });
    const insNiv2 = await InsNiv.create({ libelle: 'Master' });
    console.log('  ✓ 2 Niveaux étude inscription');

    const insPar1 = await InsPar.create({ titre: 'Dev Web & Mobile', niveauEtudeId: insNiv1.id });
    const insPar2 = await InsPar.create({ titre: 'Réseaux & Cybersécurité', niveauEtudeId: insNiv1.id });
    const insPar3 = await InsPar.create({ titre: 'Comptabilité & Finance', niveauEtudeId: insNiv1.id });
    const insPar4 = await InsPar.create({ titre: 'Marketing Digital', niveauEtudeId: insNiv2.id });
    console.log('  ✓ 4 Parcours inscription');

    const an1 = await InsAn.create({ libelle: '2024-2025', dateDebut: new Date('2024-10-01'), dateFin: new Date('2025-07-31') });
    const an2 = await InsAn.create({ libelle: '2025-2026', dateDebut: new Date('2025-10-01'), dateFin: new Date('2026-07-31') });
    console.log('  ✓ 2 Années académiques');

    const sess1 = await InsSess.create({ libelle: 'Inscription 2024-2025', dateDebut: new Date('2024-06-01'), dateFin: new Date('2024-11-30') });
    const sess2 = await InsSess.create({ libelle: 'Inscription 2025-2026', dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-11-30') });
    console.log('  ✓ 2 Sessions');

    await InsSalle.create({ libelle: 'Salle 101' });
    await InsSalle.create({ libelle: 'Salle 102' });
    await InsSalle.create({ libelle: 'Labo Informatique' });
    await InsSalle.create({ libelle: 'Amphi A' });
    console.log('  ✓ 4 Salles');

    const classes = [
        await InsClasse.create({ libelle: 'L3 Dev Web', niveauEtudeId: insNiv1.id }),
        await InsClasse.create({ libelle: 'L3 Réseaux', niveauEtudeId: insNiv1.id }),
        await InsClasse.create({ libelle: 'L3 Comptabilité', niveauEtudeId: insNiv1.id }),
        await InsClasse.create({ libelle: 'M1 Marketing Digital', niveauEtudeId: insNiv2.id }),
    ];
    console.log('  ✓ 4 Classes');

    const matieres = [
        await InsMat.create({ libelle: 'Mathématiques Financières' }),
        await InsMat.create({ libelle: 'Anglais des Affaires' }),
        await InsMat.create({ libelle: 'Développement Web' }),
        await InsMat.create({ libelle: 'Algorithmique' }),
        await InsMat.create({ libelle: 'Comptabilité Approfondie' }),
        await InsMat.create({ libelle: 'Marketing Stratégique' }),
    ];
    console.log('  ✓ 6 Matières');

    await InsPreP.create({ noteRequise: 10, periodeEvaluation: 'licence', matierePrerequisId: matieres[1].id, parcoursId: insPar4.id });
    console.log('  ✓ 1 Prérequis inscription');

    // Cours
    const uEns1Id = (await AutE.findOne({ where: { utilisateurId: uEns1.id } })).id;
    const uEns2Id = (await AutE.findOne({ where: { utilisateurId: uEns2.id } })).id;
    const uEns3Id = (await AutE.findOne({ where: { utilisateurId: uEns3.id } })).id;
    const uEns4Id = (await AutE.findOne({ where: { utilisateurId: uEns4.id } })).id;

    const coursRecords = [
        // Parcours 1 — Dev Web & Mobile (4 cours)
        await InsCours.create({ intitule: 'Angular Avancé', code: 'DEV401', description: 'Architecture Angular, RxJS, NgRx, signaux', classeId: classes[0].id, parcoursId: insPar1.id, enseignantId: uEns3Id, credit: 5, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Développement Mobile Flutter', code: 'DEV402', description: 'Dart, Flutter Widgets, Firebase, publication', classeId: classes[0].id, parcoursId: insPar1.id, enseignantId: uEns3Id, credit: 4, semestre: 'semestre_2' }),
        await InsCours.create({ intitule: 'Bases de Données NoSQL', code: 'DEV403', description: 'MongoDB, Redis, Firebase Firestore, optimisation', classeId: classes[0].id, parcoursId: insPar1.id, enseignantId: uEns3Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'DevOps & CI/CD', code: 'DEV404', description: 'Docker, Jenkins, GitHub Actions, déploiement continu', classeId: classes[0].id, parcoursId: insPar1.id, enseignantId: uEns3Id, credit: 3, semestre: 'semestre_2' }),
        // Parcours 2 — Réseaux & Cybersécurité (4 cours)
        await InsCours.create({ intitule: 'Sécurité des Réseaux', code: 'RES401', description: 'Pare-feu, IDS/IPS, VPN, cryptographie', classeId: classes[1].id, parcoursId: insPar2.id, enseignantId: uEns1Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Cloud Computing', code: 'RES402', description: 'AWS, Azure, Docker, Kubernetes', classeId: classes[1].id, parcoursId: insPar2.id, enseignantId: uEns1Id, credit: 5, semestre: 'semestre_2' }),
        await InsCours.create({ intitule: 'Administration Linux', code: 'RES403', description: 'Shell scripting, Apache, Nginx, serveurs mail', classeId: classes[1].id, parcoursId: insPar2.id, enseignantId: uEns1Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'IoT & Réseaux Mobiles', code: 'RES404', description: 'Objets connectés, GSM, LTE, protocoles LPWAN', classeId: classes[1].id, parcoursId: insPar2.id, enseignantId: uEns1Id, credit: 3, semestre: 'semestre_2' }),
        // Parcours 3 — Comptabilité & Finance (4 cours)
        await InsCours.create({ intitule: 'Comptabilité Analytique', code: 'COM301', description: 'Méthodes des coûts complets, coûts partiels, seuil de rentabilité', classeId: classes[2].id, parcoursId: insPar3.id, enseignantId: uEns4Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Fiscalité des Entreprises', code: 'COM302', description: 'IS, TVA, IRPP, impôts locaux', classeId: classes[2].id, parcoursId: insPar3.id, enseignantId: uEns4Id, credit: 3, semestre: 'semestre_2' }),
        await InsCours.create({ intitule: 'Audit & Contrôle de Gestion', code: 'COM303', description: 'Audit financier, contrôle interne, reporting', classeId: classes[2].id, parcoursId: insPar3.id, enseignantId: uEns4Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Droit des Affaires', code: 'COM304', description: 'Droit des sociétés, droit du travail, contrats', classeId: classes[2].id, parcoursId: insPar3.id, enseignantId: uEns4Id, credit: 3, semestre: 'semestre_2' }),
        // Parcours 4 — Marketing Digital (4 cours)
        await InsCours.create({ intitule: 'Marketing Digital Avancé', code: 'MKT401', description: 'SEO, SEA, Social Ads, Analytics', classeId: classes[3].id, parcoursId: insPar4.id, enseignantId: uEns2Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Brand Content & Storytelling', code: 'MKT402', description: 'Stratégie de contenu, copywriting, vidéo', classeId: classes[3].id, parcoursId: insPar4.id, enseignantId: uEns2Id, credit: 3, semestre: 'semestre_2' }),
        await InsCours.create({ intitule: 'E-commerce & Marketplace', code: 'MKT403', description: 'Shopify, WooCommerce, Amazon FBA, logistique', classeId: classes[3].id, parcoursId: insPar4.id, enseignantId: uEns2Id, credit: 4, semestre: 'semestre_1' }),
        await InsCours.create({ intitule: 'Data Marketing & CRM', code: 'MKT404', description: 'Google Analytics, HubSpot, segmentation, KPI', classeId: classes[3].id, parcoursId: insPar4.id, enseignantId: uEns2Id, credit: 3, semestre: 'semestre_2' }),
    ];
    console.log('  ✓ 16 Cours (4 par parcours)');

    // Chapitres + ressources
    for (const c of coursRecords) {
        const chap1 = await InsChap.create({ titre: `Chapitre 1 : Introduction`, coursId: c.id });
        const chap2 = await InsChap.create({ titre: `Chapitre 2 : Concepts avancés`, coursId: c.id });
        await InsChap.create({ titre: `Chapitre 3 : Travaux pratiques`, coursId: c.id });

        const r1 = await InsRes.create({ titre: 'Cours complet PDF', description: 'Support de cours détaillé', type: 'fichier', chapitreId: chap1.id });
        const r2 = await InsRes.create({ titre: 'Vidéo explicative', description: 'Vidéo du chapitre 1', type: 'video', chapitreId: chap1.id });
        await InsRes.create({ titre: 'Exercices corrigés', description: 'Série d\'exercices avec solutions', type: 'fichier', chapitreId: chap2.id });

        await InsFicRes.create({ titre: 'cours.pdf', fichier: `/cours/ressources/${c.code}-ch1.pdf`, ressourceId: r1.id });
        await InsFicRes.create({ titre: 'video.mp4', fichier: `/cours/ressources/${c.code}-ch1.mp4`, ressourceId: r2.id });
    }
    console.log('  ✓ Chapitres et ressources');

    // Seances
    const today = new Date();
    for (const c of coursRecords) {
        for (let w = 1; w <= 4; w++) {
            await InsSeance.create({
                dateSeance: new Date(today.getFullYear(), today.getMonth(), today.getDate() + w * 7),
                semaine: w, heureDebut: '08:00', heureFin: '10:00',
                coursId: c.id, salleDeClasseId: 1,
            });
        }
    }
    console.log('  ✓ Séances de cours');

    // Demandes d'inscription
    const demInsc: any[] = [];
    for (let i = 0; i < apprenantRecords.length; i++) {
        const classIdx = i % 4;
        const baseIdx = classIdx * 4;
        const dem = await InsDem.create({
            matricule: `ETU${String(2025).slice(-2)}${String(i + 1).padStart(3, '0')}`,
            sessionId: sess2.id, utilisateurId: apprenantRecords[i].id,
        });
        demInsc.push(dem);

        for (let j = 0; j < 4; j++) {
            await InsChoisi(dem.id, coursRecords[baseIdx + j].id);
        }

        // Dossier
        const doss = await InsDoss.create({ titre: `Dossier ${apprenants[i].prenoms} ${apprenants[i].nom}`, sessionId: sess2.id });
        await InsDemD.create({ nomFichier: 'releve-notes.pdf', demandeId: dem.id, dossierId: doss.id });
        const doss2 = await InsDoss.create({ titre: `Pièces identité ${apprenants[i].prenoms}`, sessionId: sess2.id });
        await InsDemD.create({ nomFichier: 'carte-identite.pdf', demandeId: dem.id, dossierId: doss2.id });
        const doss3 = await InsDoss.create({ titre: `Acte de naissance ${apprenants[i].prenoms}`, sessionId: sess2.id });
        await InsDemD.create({ nomFichier: 'acte-naissance.pdf', demandeId: dem.id, dossierId: doss3.id });

        // Paiement (1 par étudiant)
        await InsPai.create({
            numero: `PAY${String(2025).slice(-2)}${String(i + 1).padStart(3, '0')}`,
            montant: 500000, typePaiement: i % 2 === 0 ? 'mobile_money' : 'espece',
            matriculeInscription: dem.matricule, utilisateurId: apprenantRecords[i].id,
        });

        // Cursus
        const curNiveauId = classIdx === 3 ? insNiv2.id : insNiv1.id;
        const cur = await InsCur.create({ utilisateurId: apprenantRecords[i].id, classeId: classes[classIdx].id, niveauEtudeId: curNiveauId });

        // CoursParticipant (4 cours par apprenant)
        const cpIds: any[] = [];
        for (let j = 0; j < 4; j++) {
            const cp = await InsCourP.create({ utilisateurId: apprenantRecords[i].id, coursId: coursRecords[baseIdx + j].id, cursusApprenantId: cur.id });
            cpIds.push(cp);
        }

        // Réponse
        await InsRep.create({ demandeInscriptionId: dem.id, message: 'Inscription validée. Bienvenue !', utilisateurId: uInst1.id });

        // Présences
        for (let j = 0; j < cpIds.length; j++) {
            const seances = await InsSeance.findAll({ where: { coursId: coursRecords[baseIdx + j].id }, limit: 2 });
            for (const s of seances) {
                const pres = await InsPres.create({
                    dateSeance: s.dateSeance, heureDebut: s.heureDebut, heureFin: s.heureFin,
                    estAbsent: j === 0, justifier: false,
                });
                await InsPresCP.create({ coursParticipantId: cpIds[j].id, presenceId: pres.id });
            }
        }
    }
    console.log('  ✓ 16 Demandes inscription, dossiers, paiements, cursus, présences');

    // Cahier de texte
    for (const c of coursRecords) {
        const cahier = await InsCahier.create({ coursId: c.id, periodeDu: new Date('2025-11-01'), periodeAu: new Date('2025-11-07') });
        await InsBlocCah.create({ heureDebut: '08:00', heureFin: '10:00', contenu: `Séance sur les concepts fondamentaux de ${c.intitule}`, date: new Date('2025-11-02'), cahierDeTexteId: cahier.id });
        await InsBlocCah.create({ heureDebut: '10:00', heureFin: '12:00', contenu: `Exercices pratiques et études de cas`, date: new Date('2025-11-04'), cahierDeTexteId: cahier.id });
    }
    console.log('  ✓ Cahiers de texte');

    // Frais d'inscription
    await InsFrais.create({ titre: 'Frais d\'inscription', montant: 50000, sessionId: sess1.id });
    await InsFrais.create({ titre: 'Frais de scolarité', montant: 500000, sessionId: sess2.id });
    console.log('  ✓ Frais d\'inscription');

    // Notes d'évaluation — liées aux étudiants via coursParticipantId
    const tne1 = await InsTNE.create({ libelle: 'Contrôle Continu' });
    const tne2 = await InsTNE.create({ libelle: 'Examen Final' });
    const tne3 = await InsTNE.create({ libelle: 'Devoir' });
    for (const c of coursRecords) {
        const participants = await InsCourP.findAll({ where: { coursId: c.id } });
        if (participants.length === 0) continue;

        // Contrôle Continu
        const lne1 = await InsLNE.create({ date: new Date(), poidsTypeNoteEvaluation: 20, heureDebut: '08:00', heureFin: '10:00', typeNoteEvaluationId: tne1.id, coursId: c.id });
        for (const p of participants) {
            await InsNE.create({ note: Math.floor(Math.random() * 8) + 12, listeNoteEvaluationId: lne1.id, coursParticipantId: p.id });
        }

        // Devoir
        const lne3 = await InsLNE.create({ date: new Date(), poidsTypeNoteEvaluation: 30, heureDebut: '10:00', heureFin: '12:00', typeNoteEvaluationId: tne3.id, coursId: c.id });
        for (const p of participants) {
            await InsNE.create({ note: Math.floor(Math.random() * 8) + 10, listeNoteEvaluationId: lne3.id, coursParticipantId: p.id });
        }

        // Examen Final
        const lne2 = await InsLNE.create({ date: new Date(), poidsTypeNoteEvaluation: 50, heureDebut: '13:00', heureFin: '16:00', typeNoteEvaluationId: tne2.id, coursId: c.id });
        for (const p of participants) {
            await InsNE.create({ note: Math.floor(Math.random() * 8) + 10, listeNoteEvaluationId: lne2.id, coursParticipantId: p.id });
        }
    }
    console.log('  ✓ Notes d\'évaluation (3 types, 1 note par étudiant par liste)');

    // ════════════════════════════════════════════════════
    //  STAGE MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── STAGES ──');

    // Entreprises
    const stgEnt1 = await StgEnt.create({ nom: 'Orange CI', adresse: 'Abidjan, Plateau', telephone: '+2252720202020', email: 'contact@orange.ci', siteWeb: 'https://orange.ci', description: 'Opérateur de télécommunications' });
    const stgEnt2 = await StgEnt.create({ nom: 'MTN CI', adresse: 'Abidjan, Marcory', telephone: '+2252721212121', email: 'info@mtn.ci', siteWeb: 'https://mtn.ci', description: 'Opérateur mobile' });
    const stgEnt3 = await StgEnt.create({ nom: 'Ecobank CI', adresse: 'Abidjan, Plateau', telephone: '+2252723222323', email: 'ecobank@ecobank.ci', siteWeb: 'https://ecobank.ci', description: 'Banque panafricaine' });
    console.log('  ✓ 3 Entreprises');

    // Tuteurs
    await StgTut.create({ nom: 'Koffi Aimé', fonction: 'Responsable RH', email: 'aime.koffi@orange.ci', telephone: '+2250701010101', entrepriseId: stgEnt1.id });
    await StgTut.create({ nom: 'Diallo Mariam', fonction: 'Chef de service', email: 'mariam.diallo@mtn.ci', telephone: '+2250702020202', entrepriseId: stgEnt2.id });
    await StgTut.create({ nom: 'N\'Guessan Patrice', fonction: 'Directeur Financier', email: 'patrice.nguessan@ecobank.ci', telephone: '+2250703030303', entrepriseId: stgEnt3.id });
    console.log('  ✓ 3 Tuteurs');

    // Offres de stage
    const uInst1Id = (await AutI.findOne({ where: { utilisateurId: (await AutU.findOne({ where: { identifiant: 'institution1' } })).id } })).id;
    const stgOff1 = await StgOff.create({ titre: 'Développeur Web Full Stack', description: 'Stage en développement web avec Angular et Node.js', dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-09-30'), lieu: 'Abidjan', nombrePlaces: 2, statut: 'ouvert', institutionId: uInst1Id });
    const stgOff2 = await StgOff.create({ titre: 'Assistant Comptable', description: 'Stage en comptabilité et gestion financière', dateDebut: new Date('2025-06-15'), dateFin: new Date('2025-10-15'), lieu: 'Abidjan', nombrePlaces: 1, statut: 'ouvert', institutionId: uInst1Id });
    const stgOff3 = await StgOff.create({ titre: 'Technicien Réseaux', description: 'Stage en administration réseaux et cybersécurité', dateDebut: new Date('2025-07-01'), dateFin: new Date('2025-10-31'), lieu: 'Abidjan', nombrePlaces: 3, statut: 'ouvert', institutionId: uInst1Id });
    console.log('  ✓ 3 Offres de stage');

    // Demandes de stage (quelques apprenants)
    const appIds = await AutA.findAll({ limit: 6 });
    const stgDems: any[] = [];
    for (let i = 0; i < 3; i++) {
        const ens = await AutE.findOne({ where: { utilisateurId: (await AutU.findOne({ where: { identifiant: `enseignant${i + 1}` } })).id } });
        const dem = await StgDem.create({ offreStageId: [stgOff1.id, stgOff2.id, stgOff3.id][i].id, apprenantId: appIds[i].id, entrepriseId: [stgEnt1.id, stgEnt2.id, stgEnt3.id][i].id, dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-09-30'), statut: 'valide' });
        stgDems.push(dem);

        if (i < 2) {
            await StgConv.create({ demandeStageId: dem.id, fichier: `/stages/conventions/convention-${i + 1}.pdf`, dateSignature: new Date('2025-05-15') });
            await StgRap.create({ demandeStageId: dem.id, fichier: `/stages/rapports/rapport-${i + 1}.pdf`, dateSoumission: new Date('2025-09-25') });
            await StgNote.create({ demandeStageId: dem.id, enseignantId: ens.id, note: 16.5, appreciation: 'Excellent travail, très bon rapport' });
            await StgAtt.create({ demandeStageId: dem.id, fichier: `/stages/attestations/attestation-${i + 1}.pdf`, dateEmission: new Date('2025-10-01') });
        }
    }
    console.log('  ✓ 3 Demandes de stage, conventions, rapports, notes, attestations');

    // ════════════════════════════════════════════════════
    //  STOCK MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── STOCKS ──');

    const skCat1 = await StkCat.create({ nom: 'Fournitures de bureau', description: 'Stylos, cahiers, ramettes de papier' });
    const skCat2 = await StkCat.create({ nom: 'Matériel informatique', description: 'Ordinateurs, imprimantes, accessoires' });
    const skCat3 = await StkCat.create({ nom: 'Mobilier', description: 'Tables, chaises, armoires' });
    console.log('  ✓ 3 Catégories d\'articles');

    const skArt1 = await StkArt.create({ nom: 'Ramette de papier A4', reference: 'FOUR-A4-001', description: 'Ramette 500 feuilles', stockActuel: 150, stockMinimum: 20, prixUnitaire: 5000, categorieId: skCat1.id });
    const skArt2 = await StkArt.create({ nom: 'Stylo bleu', reference: 'FOUR-STY-001', description: 'Stylo à bille bleu', stockActuel: 500, stockMinimum: 100, prixUnitaire: 200, categorieId: skCat1.id });
    const skArt3 = await StkArt.create({ nom: 'Ordinateur Portable Dell', reference: 'INFO-DELL-001', description: 'Dell Latitude 5440 i5 16Go', stockActuel: 10, stockMinimum: 2, prixUnitaire: 450000, categorieId: skCat2.id });
    const skArt4 = await StkArt.create({ nom: 'Imprimante HP LaserJet', reference: 'INFO-HP-001', description: 'Imprimante laser noir et blanc', stockActuel: 5, stockMinimum: 1, prixUnitaire: 150000, categorieId: skCat2.id });
    const skArt5 = await StkArt.create({ nom: 'Table bureau', reference: 'MOB-TBL-001', description: 'Table de bureau 120x60cm', stockActuel: 25, stockMinimum: 5, prixUnitaire: 75000, categorieId: skCat3.id });
    console.log('  ✓ 5 Articles');

    const skFour1 = await StkFour.create({ nom: 'Fournitures Modernes SARL', contact: 'Kouamé Paul', email: 'contact@fournitures-modernes.ci', telephone: '+2252727272727', adresse: 'Abidjan, Treichville' });
    const skFour2 = await StkFour.create({ nom: 'Informatique Pro CI', contact: 'Koné Moussa', email: 'info@informatiquepro.ci', telephone: '+2252728282828', adresse: 'Abidjan, Cocody' });
    console.log('  ✓ 2 Fournisseurs');

    // Mouvements de stock
    await StkMouv.create({ type: 'entree', quantite: 50, motif: 'Réapprovisionnement', prixUnitaire: 4500, articleId: skArt1.id, fournisseurId: skFour1.id, utilisateurId: 1 });
    await StkMouv.create({ type: 'sortie', quantite: 10, motif: 'Distribution service compta', articleId: skArt1.id, utilisateurId: 1 });
    await StkMouv.create({ type: 'entree', quantite: 3, motif: 'Nouvel achat', prixUnitaire: 440000, articleId: skArt3.id, fournisseurId: skFour2.id, utilisateurId: 1 });
    await StkMouv.create({ type: 'sortie', quantite: 1, motif: 'Attribution enseignant', articleId: skArt3.id, utilisateurId: 1 });
    console.log('  ✓ 4 Mouvements de stock');

    // Bons de commande
    const bc1 = await StkBC.create({ dateCommande: new Date('2025-01-15'), dateLivraisonPrevue: new Date('2025-01-30'), statut: 'livree', montantTotal: 225000, fournisseurId: skFour1.id });
    const bc2 = await StkBC.create({ dateCommande: new Date('2025-02-01'), dateLivraisonPrevue: new Date('2025-02-15'), statut: 'en_attente', montantTotal: 1320000, fournisseurId: skFour2.id });
    console.log('  ✓ 2 Bons de commande');

    await StkLBC.create({ quantite: 50, prixUnitaire: 4500, bonCommandeId: bc1.id, articleId: skArt1.id });
    await StkLBC.create({ quantite: 3, prixUnitaire: 440000, bonCommandeId: bc2.id, articleId: skArt3.id });
    console.log('  ✓ 2 Lignes de bon de commande');

    // ════════════════════════════════════════════════════
    //  IMMOBILISATION MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── IMMOBILISATIONS ──');

    // Sites
    const immSite1 = await ImmSite.create({ nom: 'Campus Principal Riviera', adresse: 'Abidjan, Riviera 3, BP 567' });
    const immSite2 = await ImmSite.create({ nom: 'Annexe Abobo', adresse: 'Abidjan, Abobo, BP 890' });
    console.log('  ✓ 2 Sites');

    // Bâtiments
    const immBat1 = await ImmBat.create({ nom: 'Bâtiment A (Administration)', siteId: immSite1.id, adresse: 'Riviera 3 - Bloc A' });
    const immBat2 = await ImmBat.create({ nom: 'Bâtiment B (Salles de cours)', siteId: immSite1.id, adresse: 'Riviera 3 - Bloc B' });
    const immBat3 = await ImmBat.create({ nom: 'Bâtiment C (Labos)', siteId: immSite1.id, adresse: 'Riviera 3 - Bloc C' });
    const immBat4 = await ImmBat.create({ nom: 'Bâtiment Principal', siteId: immSite2.id, adresse: 'Abobo - Central' });
    console.log('  ✓ 4 Bâtiments');

    // Localisations
    const immLoc1 = await ImmLoc.create({ code: 'A-001', batimentId: immBat1.id, capacite: 10 });
    const immLoc2 = await ImmLoc.create({ code: 'B-101', batimentId: immBat2.id, capacite: 40 });
    const immLoc3 = await ImmLoc.create({ code: 'B-102', batimentId: immBat2.id, capacite: 30 });
    const immLoc4 = await ImmLoc.create({ code: 'C-LAB1', batimentId: immBat3.id, capacite: 20 });
    const immLoc5 = await ImmLoc.create({ code: 'AB-001', batimentId: immBat4.id, capacite: 50 });
    console.log('  ✓ 5 Localisations');

    // Départements
    await ImmDep.create({ nom: 'Direction' });
    await ImmDep.create({ nom: 'Comptabilité' });
    await ImmDep.create({ nom: 'Pédagogie' });
    await ImmDep.create({ nom: 'Informatique' });
    console.log('  ✓ 4 Départements');

    // Catégories d'immobilisations
    const immCat1 = await ImmCat.create({ nom: 'Matériel Informatique', description: 'Ordinateurs, serveurs, périphériques', tauxAmortissement: 25, dureeVie: 4 });
    const immCat2 = await ImmCat.create({ nom: 'Mobilier de Bureau', description: 'Tables, chaises, armoires, étagères', tauxAmortissement: 10, dureeVie: 10 });
    const immCat3 = await ImmCat.create({ nom: 'Véhicules', description: 'Voitures, motos', tauxAmortissement: 20, dureeVie: 5 });
    const immCat4 = await ImmCat.create({ nom: 'Bâtiments & Infrastructures', description: 'Bâtiments, installations', tauxAmortissement: 5, dureeVie: 20 });
    const immCat5 = await ImmCat.create({ nom: 'Équipements de Bureau', description: 'Climatiseurs, onduleurs, photocopieurs', tauxAmortissement: 15, dureeVie: 7 });
    console.log('  ✓ 5 Catégories d\'immobilisations');

    // Immobilisations
    const immoDir = (await ImmDep.findOne({ where: { nom: 'Direction' } })).id;
    const immoComp = (await ImmDep.findOne({ where: { nom: 'Comptabilité' } })).id;
    const immoPed = (await ImmDep.findOne({ where: { nom: 'Pédagogie' } })).id;
    const immoInfo = (await ImmDep.findOne({ where: { nom: 'Informatique' } })).id;

    const immImmo1 = await ImmImmo.create({ nom: 'Ordinateur Dell Serveur', reference: 'SRV-DELL-001', description: 'Serveur principal Dell PowerEdge', etat: 'bon', dateMiseEnService: new Date('2023-01-15'), valeurAcquisition: 2500000, responsableNom: 'Kouamé Mamadou', categorieId: immCat1.id, localisationId: immLoc1.id, departementId: immoInfo, siteId: immSite1.id });
    const immImmo2 = await ImmImmo.create({ nom: 'Ordinateur HP Pro', reference: 'PC-HPPRO-001', description: 'PC de bureau HP ProDesk', etat: 'neuf', dateMiseEnService: new Date('2025-03-01'), valeurAcquisition: 600000, responsableNom: 'Koné Mariam', categorieId: immCat1.id, localisationId: immLoc2.id, departementId: immoComp, siteId: immSite1.id });
    const immImmo3 = await ImmImmo.create({ nom: 'Table Bureau Directeur', reference: 'TBL-DIR-001', description: 'Table bureau direction en bois', etat: 'bon', dateMiseEnService: new Date('2022-06-01'), valeurAcquisition: 350000, responsableNom: 'Konan Bernard', categorieId: immCat2.id, localisationId: immLoc1.id, departementId: immoDir, siteId: immSite1.id });
    const immImmo4 = await ImmImmo.create({ nom: 'Climatiseur Salle B101', reference: 'CLIM-B101', description: 'Climatiseur mural 12000 BTU', etat: 'moyen', dateMiseEnService: new Date('2021-09-01'), valeurAcquisition: 250000, responsableNom: 'Touré Fatim', categorieId: immCat5.id, localisationId: immLoc2.id, departementId: immoPed, siteId: immSite1.id });
    const immImmo5 = await ImmImmo.create({ nom: 'Véhicule Toyota Hilux', reference: 'VHL-TOY-001', description: 'Pick-up double cabine', etat: 'bon', dateMiseEnService: new Date('2024-01-10'), valeurAcquisition: 15000000, responsableNom: 'Konan Bernard', categorieId: immCat3.id, departementId: immoDir, siteId: immSite1.id });
    const immImmo6 = await ImmImmo.create({ nom: 'Photocopieur Canon', reference: 'CP-CAN-001', description: 'Photocopieur multifonction Canon', etat: 'moyen', dateMiseEnService: new Date('2022-03-15'), valeurAcquisition: 800000, responsableNom: 'N\'Guessan Aminata', categorieId: immCat5.id, localisationId: immLoc5.id, departementId: immoPed, siteId: immSite2.id });
    const immImmo7 = await ImmImmo.create({ nom: 'Tableau Blanc Interactif', reference: 'TBI-SMART-001', description: 'Tableau blanc interactif Smart Board', etat: 'neuf', dateMiseEnService: new Date('2025-09-01'), valeurAcquisition: 1200000, responsableNom: 'Bamba Souleymane', categorieId: immCat5.id, localisationId: immLoc3.id, departementId: immoPed, siteId: immSite1.id });
    console.log('  ✓ 7 Immobilisations');

    // Acquisitions
    await ImmAcq.create({ immobilisationId: immImmo1.id, fournisseurNom: 'Informatique Pro CI', montant: 2500000, dateAcquisition: new Date('2023-01-10'), modeAcquisition: 'achat' });
    await ImmAcq.create({ immobilisationId: immImmo2.id, fournisseurNom: 'Informatique Pro CI', montant: 600000, dateAcquisition: new Date('2025-02-20'), modeAcquisition: 'achat' });
    await ImmAcq.create({ immobilisationId: immImmo3.id, fournisseurNom: 'Mobilier Moderne SARL', montant: 350000, dateAcquisition: new Date('2022-05-25'), modeAcquisition: 'achat' });
    await ImmAcq.create({ immobilisationId: immImmo5.id, fournisseurNom: 'Toyota CI', montant: 15000000, dateAcquisition: new Date('2024-01-05'), modeAcquisition: 'achat' });
    await ImmAcq.create({ immobilisationId: immImmo7.id, fournisseurNom: 'EduTech Solutions', montant: 1200000, dateAcquisition: new Date('2025-08-15'), modeAcquisition: 'achat' });
    console.log('  ✓ 5 Acquisitions');

    // Amortissements
    for (const immo of [immImmo1, immImmo2, immImmo3, immImmo4, immImmo6]) {
        const categorie = await ImmCat.findByPk(immo.categorieId);
        const taux = Number(categorie.tauxAmortissement) / 100;
        let vnc = Number(immo.valeurAcquisition);
        const duree = Number(categorie.dureeVie);
        for (let an = 1; an <= Math.min(duree, 3); an++) {
            const montantAmorti = vnc * taux;
            vnc -= montantAmorti;
            await ImmAmort.create({ immobilisationId: immo.id, annee: 2022 + an, montantAmorti: Math.round(montantAmorti * 100) / 100, valeurResiduelle: Math.round(vnc * 100) / 100, dateCalcul: new Date(2022 + an, 11, 31) });
        }
    }
    console.log('  ✓ Amortissements');

    // Maintenances
    await ImmMaint.create({ immobilisationId: immImmo1.id, dateMaintenance: new Date('2024-06-15'), type: 'preventive', description: 'Nettoyage et vérification des composants', cout: 50000, prestataire: 'IT Services CI' });
    await ImmMaint.create({ immobilisationId: immImmo1.id, dateMaintenance: new Date('2025-03-20'), type: 'corrective', description: 'Remplacement disque dur défectueux', cout: 150000, prestataire: 'IT Services CI' });
    await ImmMaint.create({ immobilisationId: immImmo4.id, dateMaintenance: new Date('2024-11-10'), type: 'corrective', description: 'Recharge de gaz climatiseur', cout: 35000, prestataire: 'Clim Services' });
    await ImmMaint.create({ immobilisationId: immImmo5.id, dateMaintenance: new Date('2025-05-05'), type: 'preventive', description: 'Révision 20 000 km', cout: 200000, prestataire: 'Toyota CI Garage' });
    await ImmMaint.create({ immobilisationId: immImmo6.id, dateMaintenance: new Date('2024-09-01'), type: 'preventive', description: 'Maintenance annuelle photocopieur', cout: 75000, prestataire: 'Canon Services' });
    console.log('  ✓ 5 Maintenances');

    // Maintenances programmées
    await ImmMaintP.create({ immobilisationId: immImmo1.id, description: 'Maintenance trimestrielle serveur', periodicite: 'trimestrielle', prochaineEcheance: new Date('2025-06-15'), actif: true });
    await ImmMaintP.create({ immobilisationId: immImmo4.id, description: 'Vérification climatiseur avant saison chaude', periodicite: 'annuelle', prochaineEcheance: new Date('2026-02-01'), actif: true });
    await ImmMaintP.create({ immobilisationId: immImmo5.id, description: 'Révision vidange tous les 5000 km', periodicite: 'semestrielle', prochaineEcheance: new Date('2025-11-05'), actif: true });
    console.log('  ✓ 3 Maintenances programmées');

    // Cessions
    await ImmCess.create({ immobilisationId: immImmo4.id, dateCession: new Date('2025-12-15'), motif: 'Vétusté - remplacement prévu', prixCession: 50000, destinataire: 'Recyclage Electronique CI' });
    console.log('  ✓ 1 Cession');

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED COMPLETED — 83 modèles');
    console.log('═══════════════════════════════════════════');
    console.log('\n📋 COMPTES DE DÉMO :');
    console.log('───────────────────────────────────────────');
    console.log('👤 ADMIN            | admin          | password123');
    console.log('🏫 INSTITUTION 1    | institution1   | password123');
    console.log('🏫 INSTITUTION 2    | institution2   | password123');
    console.log('👨‍🏫 ENSEIGNANT 1     | enseignant1    | password123');
    console.log('👨‍🏫 ENSEIGNANT 2     | enseignant2    | password123');
    console.log('👨‍🏫 ENSEIGNANT 3     | enseignant3    | password123');
    console.log('👨‍🏫 ENSEIGNANT 4     | enseignant4    | password123');
    console.log('💰 CAISSIER 1       | caissier1      | password123');
    console.log('💰 CAISSIER 2       | caissier2      | password123');
    console.log('👨‍🎓 16 APPRENANTS    | apprenant1..16 | password123');
    console.log('───────────────────────────────────────────');
    console.log('📊 Données : 8 parcours, 16 cours, 4 classes,');
    console.log('  2 sessions, 2 années, 16 demandes ins.,');
    console.log('  3 offres stage, 3 demandes stage,');
    console.log('  5 articles, 2 fournisseurs, 2 bons cmde,');
    console.log('  7 immobilisations, 5 maintenances,');
    console.log('  présences, notes, cahiers de texte, etc.');
    console.log('═══════════════════════════════════════════\n');
}

async function InsChoisi(demandeId: any, coursId: any) {
    const { DemandeInscriptionCours } = require('../../modules/inscription/models/DemandeInscriptionCours');
    await DemandeInscriptionCours.create({ demandeInscriptionId: demandeId, coursId: coursId });
}

seed().catch((err: any) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
