import * as bcrypt from 'bcrypt';
import { TypesEvaluation } from '../enums/TypesEvaluation';
import { PeriodesEvaluation } from '../enums/PeriodesEvaluation';
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function seed() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/auth/models/_associations');
    require('../../modules/orientation/models/_associations');
    require('../../modules/inscription/models/_associations');
    require('../../modules/stage/models/_associations');
    require('../../modules/stock/models/_associations');
    require('../../modules/immobilisation/models/_associations');
    require('../../modules/bulletins/models/_associations');

    const M = (name: string) => sequelize.model(name);

    const AutU = M('AutUtilisateur');
    const AutI = M('AutInstitution');
    const AutA = M('AutApprenant');
    const AutE = M('AutEnseignant');
    const AutC = M('AutCaissierBanque');
    const AutB = M('AutBanque');
    const AutCO = M('AutComiteOrientation');
    const AutAdrI = M('AutAdresseInstitution');
    const AutAdrA = M('AutAdresseApprenant');
    const AutAdrE = M('AutAdresseEnseignant');
    const AutAdrC = M('AutAdresseCaissierBanque');
    const AutIdA = M('AutIdentiteApprenant');
    const AutInfoP = M('AutInformationsParentsApprenant');
    const AutInfoS = M('AutInformationsSalarieApprenant');
    const AutPersP = M('AutPersonnePrevenirApprenant');

    const OriNiv = M('ori_NiveauEtude');
    const OriCat = M('OriCategorie');
    const OriPar = M('OriParcours');
    const OriDeb = M('OriDeboucheParcours');
    const OriMat = M('OriMatierePrerequis');
    const OriPreP = M('OriPrerequisParcours');

    const InsAn = M('InsAnneeAcademique');
    const InsSess = M('InsSession');
    const InsNiv = M('InsNiveauEtude');
    const InsPar = M('InsParcours');
    const InsClasse = M('InsClasse');
    const InsSalle = M('InsSalleDeClasse');
    const InsCours = M('InsCours');
    const InsChap = M('InsChapitreCours');
    const InsRes = M('InsRessource');
    const InsFicRes = M('InsFichierRessource');
    const InsFrais = M('InsFraisInscription');
    const InsMat = M('InsMatierePrerequis');
    const InsPreP = M('InsPrerequisParcours');
    const InsParCh = M('InsParcoursChoisi');
    const InsPrePCh = M('InsPrerequisParcoursChoisi');
    const InsDem = M('InsDemandeInscription');
    const InsDemC = M('InsDemandeInscriptionCours');
    const InsDoss = M('InsDossierInscription');
    const InsDemD = M('InsDemandeInscriptionDossier');
    const InsPai = M('InsPaiementInscription');
    const InsPreIns = M('InsPreInscription');
    const InsRep = M('InsReponseInscription');
    const InsCur = M('InsCursusApprenant');
    const InsDosEt = M('InsDossierEtudiant');
    const InsEch = M('InsEcheance');
    const InsBor = M('InsBordereau');
    const InsSeance = M('InsSeance');
    const InsCourP = M('InsCoursParticipant');
    const InsLPres = M('InsListePresence');
    const InsPres = M('InsPresence');
    const InsPresCP = M('InsPresenceCoursParticipant');
    const InsCahier = M('InsCahierDeTexte');
    const InsBlocCah = M('InsBlocCahierDeTexte');

    const StgEnt = M('StgEntreprise');
    const StgTut = M('StgTuteur');
    const StgOff = M('StgOffreStage');

    const StkCat = M('StkCategorieArticle');
    const StkArt = M('StkArticle');
    const StkFour = M('StkFournisseur');
    const StkMouv = M('StkMouvementStock');

    const ImmSite = M('ImmSite');
    const ImmBat = M('ImmBatiment');
    const ImmLoc = M('ImmLocalisation');
    const ImmCat = M('ImmCategorieImmobilisation');
    const ImmImmo = M('ImmImmobilisation');
    const ImmAcq = M('ImmAcquisition');
    const ImmMaint = M('ImmMaintenance');

    const hash = bcrypt.hashSync('password123', 10);

    console.log('\n═══════════════════════════════════════════');
    console.log('  UST — Université des Sciences et Technologies');
    console.log('═══════════════════════════════════════════');

    // ════════════════════════════════════════════════════
    //  AUTH / UTILISATEURS
    // ════════════════════════════════════════════════════
    console.log('\n── UTILISATEURS ──');

    const admin = await AutU.create({ nom: 'Admin', prenoms: 'Système', identifiant: 'admin', email: 'admin@ust.ci', motDePasse: hash, role: 'admin', contact: '+2250100000000', dateVerificationEmail: new Date() });
    console.log('  ✓ Admin');

    const uInst = await AutU.create({ nom: 'Koffi', prenoms: 'Philippe', identifiant: 'institution', email: 'institution@ust.ci', motDePasse: hash, role: 'institution', contact: '+2250101000001', dateVerificationEmail: new Date() });
    const adrInst = await AutAdrI.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Cocody Angré', boitePostale: 'BP 1500 Abidjan', prorietaireBoitePostale: 'UST', telMobile: '+2250101000001' });
    await AutI.create({ dateNaissance: new Date('1970-05-20'), lieuNaissance: 'Abidjan', fonction: 'Recteur', adresseId: adrInst.id, utilisateurId: uInst.id });
    console.log('  ✓ Institution — UST');

    const uEns1 = await AutU.create({ nom: 'Konan', prenoms: 'Yves', identifiant: 'prof-maths', email: 'yves.konan@ust.ci', motDePasse: hash, role: 'enseignant', contact: '+2250102000001', dateVerificationEmail: new Date() });
    const adrEns1 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Cocody', boitePostale: 'BP 101', prorietaireBoitePostale: 'Yves Konan', telMobile: '+2250102000001' });
    const ens1 = await AutE.create({ dateNaissance: new Date('1982-03-10'), lieuNaissance: 'Abidjan', fonction: 'Professeur de Mathématiques', adresseId: adrEns1.id, utilisateurId: uEns1.id });
    console.log('  ✓ Enseignant — Yves Konan (Maths)');

    const uEns2 = await AutU.create({ nom: 'N\'Dri', prenoms: 'Aline', identifiant: 'prof-info', email: 'aline.ndri@ust.ci', motDePasse: hash, role: 'enseignant', contact: '+2250102000002', dateVerificationEmail: new Date() });
    const adrEns2 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Marcory', boitePostale: 'BP 102', prorietaireBoitePostale: 'Aline N\'Dri', telMobile: '+2250102000002' });
    const ens2 = await AutE.create({ dateNaissance: new Date('1985-07-22'), lieuNaissance: 'Bouaké', fonction: 'Professeur d\'Informatique', adresseId: adrEns2.id, utilisateurId: uEns2.id });
    console.log('  ✓ Enseignant — Aline N\'Dri (Info)');

    const uEns3 = await AutU.create({ nom: 'Touré', prenoms: 'Moussa', identifiant: 'prof-gestion', email: 'moussa.toure@ust.ci', motDePasse: hash, role: 'enseignant', contact: '+2250102000003', dateVerificationEmail: new Date() });
    const adrEns3 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Plateau', boitePostale: 'BP 103', prorietaireBoitePostale: 'Moussa Touré', telMobile: '+2250102000003' });
    const ens3 = await AutE.create({ dateNaissance: new Date('1980-11-15'), lieuNaissance: 'Odienné', fonction: 'Professeur de Gestion', adresseId: adrEns3.id, utilisateurId: uEns3.id });
    console.log('  ✓ Enseignant — Moussa Touré (Gestion)');

    const uEns4 = await AutU.create({ nom: 'Bamba', prenoms: 'Fatou', identifiant: 'prof-droit', email: 'fatou.bamba@ust.ci', motDePasse: hash, role: 'enseignant', contact: '+2250102000004', dateVerificationEmail: new Date() });
    const adrEns4 = await AutAdrE.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Yopougon', boitePostale: 'BP 104', prorietaireBoitePostale: 'Fatou Bamba', telMobile: '+2250102000004' });
    const ens4 = await AutE.create({ dateNaissance: new Date('1988-09-05'), lieuNaissance: 'Man', fonction: 'Professeur de Droit', adresseId: adrEns4.id, utilisateurId: uEns4.id });
    console.log('  ✓ Enseignant — Fatou Bamba (Droit)');

    const bq = await AutB.create({ nom: 'Société Générale Côte d\'Ivoire' });
    console.log('  ✓ Banque');

    const uCai1 = await AutU.create({ nom: 'Koné', prenoms: 'Mariam', identifiant: 'caissier1', email: 'mariam.kone@ust.ci', motDePasse: hash, role: 'caissier_banque', contact: '+2250103000001', dateVerificationEmail: new Date() });
    const adrCai1 = await AutAdrC.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Cocody', boitePostale: 'BP 105', prorietaireBoitePostale: 'Mariam Koné', telMobile: '+2250103000001' });
    await AutC.create({ dateNaissance: new Date('1992-06-18'), lieuNaissance: 'Abidjan', fonction: 'Caissière Principale', adresseId: adrCai1.id, utilisateurId: uCai1.id, banqueId: bq.id });
    console.log('  ✓ Caissier — Mariam Koné');

    const uCai2 = await AutU.create({ nom: 'Diaby', prenoms: 'Ibrahim', identifiant: 'caissier2', email: 'ibrahim.diaby@ust.ci', motDePasse: hash, role: 'caissier_banque', contact: '+2250103000002', dateVerificationEmail: new Date() });
    const adrCai2 = await AutAdrC.create({ pays: 'Côte d\'Ivoire', ville: 'Abidjan', quartier: 'Adjamé', boitePostale: 'BP 106', prorietaireBoitePostale: 'Ibrahim Diaby', telMobile: '+2250103000002' });
    await AutC.create({ dateNaissance: new Date('1990-01-25'), lieuNaissance: 'Korhogo', fonction: 'Caissier', adresseId: adrCai2.id, utilisateurId: uCai2.id, banqueId: bq.id });
    console.log('  ✓ Caissier — Ibrahim Diaby');

    const uCom1 = await AutU.create({ nom: 'Kouassi', prenoms: 'Laurent', identifiant: 'comite1', email: 'laurent.kouassi@ust.ci', motDePasse: hash, role: 'comite_orientation', contact: '+2250104000001', dateVerificationEmail: new Date() });
    await AutCO.create({ fonction: 'Président du Comité', utilisateurId: uCom1.id });
    console.log('  ✓ Comité orientation — Laurent Kouassi');

    const uCom2 = await AutU.create({ nom: 'Soro', prenoms: 'Nathalie', identifiant: 'comite2', email: 'nathalie.soro@ust.ci', motDePasse: hash, role: 'comite_orientation', contact: '+2250104000002', dateVerificationEmail: new Date() });
    await AutCO.create({ fonction: 'Membre du Comité', utilisateurId: uCom2.id });
    console.log('  ✓ Comité orientation — Nathalie Soro');

    interface AppSeed { nom: string; prenoms: string; identifiant: string; email: string; dateNais: Date; lieuNais: string; bp: string; tel: string; quartier: string; ville: string; pere: string; mere: string; professionPere: string; professionMere: string; nomPrevenir: string; telPrevenir: string; }
    const apprenants: AppSeed[] = [
        { nom: 'Traoré', prenoms: 'Aminata', identifiant: 'etudiant1', email: 'aminata.traore@etu.ust.ci', dateNais: new Date('2002-05-10'), lieuNais: 'Abidjan', bp: 'BP 1001', tel: '+2250501000001', quartier: 'Cocody Angré', ville: 'Abidjan', pere: 'Drissa Traoré', mere: 'Maimouna Koné', professionPere: 'Fonctionnaire', professionMere: 'Commerçante', nomPrevenir: 'Drissa Traoré', telPrevenir: '+2250701000001' },
        { nom: 'Kouamé', prenoms: 'Jean', identifiant: 'etudiant2', email: 'jean.kouame@etu.ust.ci', dateNais: new Date('2001-08-22'), lieuNais: 'Bouaké', bp: 'BP 1002', tel: '+2250502000002', quartier: 'Belle-ville', ville: 'Bouaké', pere: 'Paul Kouamé', mere: 'Marie N\'Dri', professionPere: 'Enseignant', professionMere: 'Ménagère', nomPrevenir: 'Paul Kouamé', telPrevenir: '+2250702000002' },
        { nom: 'Bamba', prenoms: 'Mariam', identifiant: 'etudiant3', email: 'mariam.bamba@etu.ust.ci', dateNais: new Date('2003-01-15'), lieuNais: 'Abidjan', bp: 'BP 1003', tel: '+2250503000003', quartier: 'Yopougon', ville: 'Abidjan', pere: 'Moussa Bamba', mere: 'Fatou Diarra', professionPere: 'Entrepreneur', professionMere: 'Infirmière', nomPrevenir: 'Fatou Diarra', telPrevenir: '+2250703000003' },
        { nom: 'Soro', prenoms: 'Léon', identifiant: 'etudiant4', email: 'leon.soro@etu.ust.ci', dateNais: new Date('2002-11-30'), lieuNais: 'Korhogo', bp: 'BP 1004', tel: '+2250504000004', quartier: 'Konankro', ville: 'Korhogo', pere: 'Yacouba Soro', mere: 'Gnoumata Soro', professionPere: 'Agriculteur', professionMere: 'Ménagère', nomPrevenir: 'Yacouba Soro', telPrevenir: '+2250704000004' },
        { nom: 'Yao', prenoms: 'Esther', identifiant: 'etudiant5', email: 'esther.yao@etu.ust.ci', dateNais: new Date('2003-04-05'), lieuNais: 'Daloa', bp: 'BP 1005', tel: '+2250505000005', quartier: 'Commerce', ville: 'Daloa', pere: 'Kouassi Yao', mere: 'Akissi Yao', professionPere: 'Commerçant', professionMere: 'Institutrice', nomPrevenir: 'Kouassi Yao', telPrevenir: '+2250705000005' },
        { nom: 'Coulibaly', prenoms: 'Adama', identifiant: 'etudiant6', email: 'adama.coulibaly@etu.ust.ci', dateNais: new Date('2001-07-19'), lieuNais: 'Séguela', bp: 'BP 1006', tel: '+2250506000006', quartier: 'Centre', ville: 'Séguela', pere: 'Mamadou Coulibaly', mere: 'Hawa Touré', professionPere: 'Transporteur', professionMere: 'Coiffeuse', nomPrevenir: 'Mamadou Coulibaly', telPrevenir: '+2250706000006' },
        { nom: 'Koffi', prenoms: 'Aya', identifiant: 'etudiant7', email: 'aya.koffi@etu.ust.ci', dateNais: new Date('2002-10-12'), lieuNais: 'Abidjan', bp: 'BP 1007', tel: '+2250507000007', quartier: 'Cocody', ville: 'Abidjan', pere: 'Bernard Koffi', mere: 'Thérèse Koffi', professionPere: 'Médecin', professionMere: 'Ménagère', nomPrevenir: 'Bernard Koffi', telPrevenir: '+2250707000007' },
        { nom: 'Diomandé', prenoms: 'Yannick', identifiant: 'etudiant8', email: 'yannick.diomande@etu.ust.ci', dateNais: new Date('2003-03-18'), lieuNais: 'Man', bp: 'BP 1008', tel: '+2250508000008', quartier: 'Libreville', ville: 'Man', pere: 'Alphonse Diomandé', mere: 'Odette Diomandé', professionPere: 'Instituteur', professionMere: 'Ménagère', nomPrevenir: 'Alphonse Diomandé', telPrevenir: '+2250708000008' },
        { nom: 'N\'Dri', prenoms: 'Grace', identifiant: 'etudiant9', email: 'grace.ndri@etu.ust.ci', dateNais: new Date('2002-06-25'), lieuNais: 'Abidjan', bp: 'BP 1009', tel: '+2250509000009', quartier: 'Marcory', ville: 'Abidjan', pere: 'Michel N\'Dri', mere: 'Emma N\'Dri', professionPere: 'Avocat', professionMere: 'Secrétaire', nomPrevenir: 'Michel N\'Dri', telPrevenir: '+2250709000009' },
        { nom: 'Touré', prenoms: 'Moussa Junior', identifiant: 'etudiant10', email: 'moussa.junior@etu.ust.ci', dateNais: new Date('2001-12-01'), lieuNais: 'Odienné', bp: 'BP 1010', tel: '+2250510000010', quartier: 'Plateau', ville: 'Odienné', pere: 'Lamine Touré', mere: 'Kadiatou Touré', professionPere: 'Commerçant', professionMere: 'Ménagère', nomPrevenir: 'Lamine Touré', telPrevenir: '+2250710000010' },
        { nom: 'Guei', prenoms: 'Sarah', identifiant: 'etudiant11', email: 'sarah.guei@etu.ust.ci', dateNais: new Date('2003-09-08'), lieuNais: 'Gagnoa', bp: 'BP 1011', tel: '+2250511000011', quartier: 'Centre Ville', ville: 'Gagnoa', pere: 'Joseph Guei', mere: 'Marie Guei', professionPere: 'Fonctionnaire', professionMere: 'Commerçante', nomPrevenir: 'Joseph Guei', telPrevenir: '+2250711000011' },
        { nom: 'Kouadio', prenoms: 'Arnaud', identifiant: 'etudiant12', email: 'arnaud.kouadio@etu.ust.ci', dateNais: new Date('2002-02-14'), lieuNais: 'Yamoussoukro', bp: 'BP 1012', tel: '+2250512000012', quartier: 'Habitat', ville: 'Yamoussoukro', pere: 'Pierre Kouadio', mere: 'Louise Kouadio', professionPere: 'Ingénieur', professionMere: 'Enseignante', nomPrevenir: 'Pierre Kouadio', telPrevenir: '+2250712000012' },
        { nom: 'Fofana', prenoms: 'Mariam', identifiant: 'etudiant13', email: 'mariam.fofana@etu.ust.ci', dateNais: new Date('2002-08-30'), lieuNais: 'Bouaké', bp: 'BP 1013', tel: '+2250513000013', quartier: 'Koko', ville: 'Bouaké', pere: 'Ousmane Fofana', mere: 'Aïssata Fofana', professionPere: 'Chef d\'entreprise', professionMere: 'Médecin', nomPrevenir: 'Ousmane Fofana', telPrevenir: '+2250713000013' },
        { nom: 'Akéko', prenoms: 'Georges', identifiant: 'etudiant14', email: 'georges.akeko@etu.ust.ci', dateNais: new Date('2001-04-17'), lieuNais: 'Abengourou', bp: 'BP 1014', tel: '+2250514000014', quartier: 'Centre', ville: 'Abengourou', pere: 'Simon Akéko', mere: 'Odette Akéko', professionPere: 'Instituteur', professionMere: 'Ménagère', nomPrevenir: 'Simon Akéko', telPrevenir: '+2250714000014' },
        { nom: 'Soumahoro', prenoms: 'Fatima', identifiant: 'etudiant15', email: 'fatima.soumahoro@etu.ust.ci', dateNais: new Date('2003-12-03'), lieuNais: 'Abidjan', bp: 'BP 1015', tel: '+2250515000015', quartier: 'Treichville', ville: 'Abidjan', pere: 'Mamadou Soumahoro', mere: 'Bintou Soumahoro', professionPere: 'Commerçant', professionMere: 'Coiffeuse', nomPrevenir: 'Mamadou Soumahoro', telPrevenir: '+2250715000015' },
    ];
    console.log('  ✓ 15 étudiants créés');

    for (const a of apprenants) {
        const u = await AutU.create({ nom: a.nom, prenoms: a.prenoms, identifiant: a.identifiant, email: a.email, motDePasse: hash, role: 'apprenant', contact: a.tel, dateVerificationEmail: new Date() });
        const adr = await AutAdrA.create({ pays: 'Côte d\'Ivoire', ville: a.ville, quartier: a.quartier, boitePostale: a.bp, prorietaireBoitePostale: `${a.nom} ${a.prenoms}`, telMobile: a.tel });
        const ident = await AutIdA.create({ nationalite: 'Ivoirienne', ethnie: 'Akan', religion: 'Chrétienne', situationMatrimoniale: 'celibataire', etatPhysique: 'valide' });
        const infoP = await AutInfoP.create({ nomPrenomsPere: a.pere, professionPere: a.professionPere, nomPrenomsMere: a.mere, professionMere: a.professionMere });
        const [nomPrev, ...prenomsPrev] = a.nomPrevenir.split(' ');
        const persP = await AutPersP.create({ nom: nomPrev, prenoms: prenomsPrev.join(' ') || 'Inconnu', telMobile: a.telPrevenir, quartier: a.quartier, ville: a.ville, pays: 'Côte d\'Ivoire' });
        await AutA.create({ photo: a.identifiant + '.jpg', dateNaissance: a.dateNais, lieuNaissance: a.lieuNais, adresseId: adr.id, identiteId: ident.id, informationsParentsId: infoP.id, personnePrevenirId: persP.id, utilisateurId: u.id });
    }

    // ════════════════════════════════════════════════════
    //  ORIENTATION MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── ORIENTATION ──');

    const nivOri1 = await OriNiv.create({ libelle: 'Baccalauréat', description: 'Niveau Bac' });
    const nivOri2 = await OriNiv.create({ libelle: 'Bac+2', description: 'BTS / DUT' });
    const nivOri3 = await OriNiv.create({ libelle: 'Bac+3', description: 'Licence' });
    console.log('  ✓ Niveaux d\'étude (Orientation)');

    const catOri1 = await OriCat.create({ libelle: 'Sciences et Technologies', description: 'Filières scientifiques' });
    const catOri2 = await OriCat.create({ libelle: 'Commerce et Gestion', description: 'Filières de gestion' });
    const catOri3 = await OriCat.create({ libelle: 'Sciences Juridiques', description: 'Filières de droit' });
    console.log('  ✓ Catégories');

    const parcOri1 = await OriPar.create({ titre: 'Informatique de Gestion', contenu: 'Développement et gestion de projets informatiques', categorieId: catOri1.id, niveauEtudeId: nivOri2.id, dureeDeFormation: '2/y' });
    const parcOri2 = await OriPar.create({ titre: 'Réseaux et Télécoms', contenu: 'Infrastructures réseau et télécommunications', categorieId: catOri1.id, niveauEtudeId: nivOri2.id, dureeDeFormation: '2/y' });
    const parcOri3 = await OriPar.create({ titre: 'Comptabilité Finance', contenu: 'Comptabilité et audit financier', categorieId: catOri2.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y' });
    const parcOri4 = await OriPar.create({ titre: 'Marketing Digital', contenu: 'Marketing digital et communication', categorieId: catOri2.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y' });
    const parcOri5 = await OriPar.create({ titre: 'Droit des Affaires', contenu: 'Droit des sociétés et fiscalité', categorieId: catOri3.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y' });
    console.log('  ✓ Parcours (Orientation)');

    for (const p of [parcOri1, parcOri2, parcOri3, parcOri4, parcOri5]) {
        await OriDeb.create({ titre: `Débouchés ${p.titre}`, description: `Métiers liés à ${p.titre}`, parcoursId: p.id });
    }
    console.log('  ✓ Débouchés');

    const matOri1 = await OriMat.create({ libelle: 'Mathématiques' });
    const matOri2 = await OriMat.create({ libelle: 'Français' });
    const matOri3 = await OriMat.create({ libelle: 'Anglais' });
    const matOri4 = await OriMat.create({ libelle: 'Informatique' });
    const matOri5 = await OriMat.create({ libelle: 'Économie' });
    console.log('  ✓ Matières prérequis');

    for (const p of [parcOri1, parcOri2, parcOri3, parcOri4, parcOri5]) {
        await OriPreP.create({ parcoursId: p.id, niveauEtudeId: nivOri1.id, matierePrerequisId: matOri3.id, noteRequise: 12, typeEvaluation: TypesEvaluation.MOY, periodeEvaluation: PeriodesEvaluation.SEM1 });
    }
    console.log('  ✓ Prérequis parcours');

    // ════════════════════════════════════════════════════
    //  INSCRIPTION MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── INSCRIPTION ──');

    const an1 = await InsAn.create({ libelle: '2024-2025' });
    const an2 = await InsAn.create({ libelle: '2025-2026' });
    console.log('  ✓ Années académiques');

    const nivIns1 = await InsNiv.create({ libelle: 'Licence 1', description: 'Première année de Licence' });
    const nivIns2 = await InsNiv.create({ libelle: 'Licence 2', description: 'Deuxième année de Licence' });
    const nivIns3 = await InsNiv.create({ libelle: 'Licence 3', description: 'Troisième année de Licence' });
    console.log('  ✓ Niveaux d\'étude (Inscription)');

    const parcIns1 = await InsPar.create({ titre: 'Informatique', description: 'Génie Logiciel et Intelligence Artificielle', niveauEtudeId: nivIns1.id });
    const parcIns2 = await InsPar.create({ titre: 'Gestion des Entreprises', description: 'Comptabilité et Finance', niveauEtudeId: nivIns1.id });
    const parcIns3 = await InsPar.create({ titre: 'Droit des Affaires', description: 'Droit commercial et fiscal', niveauEtudeId: nivIns1.id });
    const parcIns4 = await InsPar.create({ titre: 'Marketing Digital', description: 'Stratégies marketing et E-commerce', niveauEtudeId: nivIns1.id });
    console.log('  ✓ Parcours (Inscription)');

    const cls1 = await InsClasse.create({ libelle: 'LIC1-A', description: 'Licence 1 Groupe A', niveauEtudeId: nivIns1.id });
    const cls2 = await InsClasse.create({ libelle: 'LIC1-B', description: 'Licence 1 Groupe B', niveauEtudeId: nivIns1.id });
    const cls3 = await InsClasse.create({ libelle: 'LIC2-A', description: 'Licence 2 Groupe A', niveauEtudeId: nivIns2.id });
    console.log('  ✓ Classes');

    const salle1 = await InsSalle.create({ libelle: 'Amphi A', capacite: 150, localisation: 'Bâtiment Principal' });
    const salle2 = await InsSalle.create({ libelle: 'Salle 101', capacite: 50, localisation: 'Bâtiment A' });
    const salle3 = await InsSalle.create({ libelle: 'Labo Info', capacite: 30, localisation: 'Bâtiment B' });
    console.log('  ✓ Salles');

    const sess1 = await InsSess.create({ libelle: 'Session 2024-2025', dateDebut: new Date('2024-10-01'), dateFin: new Date('2025-07-31'), anneeAcademiqueId: an1.id, niveauEtudeId: nivIns1.id, parcoursId: parcIns1.id });
    console.log('  ✓ Session');

    const cours1 = await InsCours.create({ code: 'INF101', intitule: 'Algorithmique et Programmation', credit: 6, estObligatoire: true, description: 'Initiation à la programmation en Python', enseignantId: ens2.id, parcoursId: parcIns1.id, classeId: cls1.id });
    const cours2 = await InsCours.create({ code: 'MATH101', intitule: 'Mathématiques pour l\'Informatique', credit: 4, estObligatoire: true, description: 'Logique mathématique et algèbre', enseignantId: ens1.id, parcoursId: parcIns1.id, classeId: cls1.id });
    const cours3 = await InsCours.create({ code: 'GEST101', intitule: 'Comptabilité Générale', credit: 5, estObligatoire: true, description: 'Principes comptables OHADA', enseignantId: ens3.id, parcoursId: parcIns2.id, classeId: cls1.id });
    const cours4 = await InsCours.create({ code: 'DROIT101', intitule: 'Introduction au Droit', credit: 4, estObligatoire: true, description: 'Fondamentaux du droit', enseignantId: ens4.id, parcoursId: parcIns3.id, classeId: cls1.id });
    const cours5 = await InsCours.create({ code: 'MKT101', intitule: 'Marketing Fondamental', credit: 4, estObligatoire: true, description: 'Concepts marketing', enseignantId: ens3.id, parcoursId: parcIns4.id, classeId: cls1.id });
    const cours6 = await InsCours.create({ code: 'ANG101', intitule: 'Anglais des Affaires', credit: 3, estObligatoire: false, description: 'Business English', enseignantId: ens1.id, parcoursId: parcIns1.id, classeId: cls1.id });
    const cours7 = await InsCours.create({ code: 'INF102', intitule: 'Bases de Données', credit: 5, estObligatoire: true, description: 'SQL et conception de bases de données', enseignantId: ens2.id, parcoursId: parcIns1.id, classeId: cls1.id });
    const cours8 = await InsCours.create({ code: 'ECO101', intitule: 'Économie Générale', credit: 3, estObligatoire: false, description: 'Microéconomie et macroéconomie', enseignantId: ens3.id, parcoursId: parcIns2.id, classeId: cls1.id });
    console.log('  ✓ Cours');

    await InsFrais.create({ titre: 'Frais d\'inscription', montant: 500000, sessionId: sess1.id });
    await InsFrais.create({ titre: 'Frais de scolarité', montant: 1500000, sessionId: sess1.id, fraisDesCours: true });
    await InsFrais.create({ titre: 'Frais de bibliothèque', montant: 50000, sessionId: sess1.id });
    await InsFrais.create({ titre: 'Assurance étudiante', montant: 25000, sessionId: sess1.id });
    console.log('  ✓ Frais');

    await InsFicRes.create({ titre: 'Python - Chapitre 1 PDF', fichier: 'chapitre1.pdf', ressourceId: (await InsRes.create({ titre: 'Python - Chapitre 1', chapitreCoursId: (await InsChap.create({ titre: 'Introduction à Python', description: 'Variables et types', coursId: cours1.id })).id })).id });
    await InsFicRes.create({ titre: 'SQL Cours complet PDF', fichier: 'basesdedonnees.pdf', ressourceId: (await InsRes.create({ titre: 'SQL Cours complet', chapitreCoursId: (await InsChap.create({ titre: 'SQL Fondamentaux', description: 'Requêtes SELECT', coursId: cours7.id })).id })).id });
    await InsFicRes.create({ titre: 'Comptabilité - Chapitre 1 PDF', fichier: 'comptabilite.pdf', ressourceId: (await InsRes.create({ titre: 'Comptabilité - Chapitre 1', chapitreCoursId: (await InsChap.create({ titre: 'Introduction à la Comptabilité', description: 'Bilan et compte de résultat', coursId: cours3.id })).id })).id });
    console.log('  ✓ Chapitres et ressources');

    const appUsers = await AutU.findAll({ where: { role: 'apprenant' }, order: [['id', 'ASC']] });
    const appIds = appUsers.map((u: any) => u.id);

    const etuParcours = [parcIns1, parcIns1, parcIns2, parcIns2, parcIns3, parcIns3, parcIns4, parcIns4, parcIns1, parcIns2, parcIns3, parcIns4, parcIns1, parcIns2, parcIns3];
    const etuCoursMap: Record<string, any[]> = { [parcIns1.id]: [cours1, cours2, cours6, cours7], [parcIns2.id]: [cours3, cours8], [parcIns3.id]: [cours4], [parcIns4.id]: [cours5, cours8] };
    for (const p of [parcIns1, parcIns2, parcIns3, parcIns4]) {
        if (!etuCoursMap[p.id]) etuCoursMap[p.id] = [cours1, cours2];
    }

    for (let i = 0; i < appIds.length; i++) {
        const userId = appIds[i];
        const mat = `UST${String(2024000 + i + 1)}`;
        const demande = await InsDem.create({ matricule: mat, dateDemande: new Date(), sessionId: sess1.id, utilisateurId: userId, etapeInscriptionId: 1 });

        const pc = await InsParCh.create({ etatDeValidation: 'valide', choixFinal: true, parcoursId: etuParcours[i].id, demandeInscriptionId: demande.id });

        await InsPreIns.create({ demandeInscriptionId: demande.id, statut: i < 10 ? 'valide' : 'en_attente', commentaire: i < 10 ? 'Validé par le comité' : null, dateTraitement: i < 10 ? new Date() : null, traiteParId: i < 10 ? uCom1.id : null });

        await InsRep.create({ message: i < 10 ? 'Parcours validé' : 'En attente', dateReponse: new Date(), demandeInscriptionId: demande.id, utilisateurId: userId });

        const coursList = etuCoursMap[etuParcours[i].id] || [];
        for (const c of coursList) {
            await InsDemC.create({ coursId: c.id, demandeInscriptionId: demande.id, etat: 'valide' });
        }

        const paiement = await InsPai.create({ numero: `PAY-${mat}-001`, montant: 2075000, datePaiement: new Date(), type: 'especes' as any, matriculeInscription: mat, utilisateurId: userId });

        await InsDosEt.create({ utilisateurId: userId, matricule: mat, statut: 'actif', fraisScolarite: 2075000, modePaiement: 'mensuel', nbMensualites: 10, demarrageParcours: new Date('2024-10-01') });

        await InsCur.create({ parcoursId: etuParcours[i].id, niveauEtudeId: nivIns1.id, classeId: cls1.id, anneeAcademiqueId: an1.id, utilisateurId: userId, demandeInscriptionId: demande.id, externe: false });

        if (i < 3) {
            for (let m = 1; m <= 5; m++) {
                await InsEch.create({ dossierEtudiantId: (await InsDosEt.findOne({ where: { utilisateurId: userId } }))?.id, type: 'scolarite', numeroEcheance: m, montant: 207500, dateLimite: new Date(2024, 9 + m, 5), statut: m <= 3 ? 'paye' : 'impaye', moisConcerne: ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février'][m - 1] });
            }
        }

        if (i < 8) {
            await InsBor.create({ echeanceId: 1, fichier: 'bordereau.pdf', utilisateurId: userId, montant: 207500, statut: 'valide', dateSoumission: new Date(), dateValidation: new Date() });
        }
    }
    console.log('  ✓ Demandes, préinscriptions, paiements, dossiers, cursus');

    // ════════════════════════════════════════════════════
    //  STAGE MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── STAGES ──');
    const ent1 = await StgEnt.create({ nom: 'Orange Côte d\'Ivoire', secteur: 'Télécommunications', email: 'recrutement@orange.ci', telephone: '+22520202020', ville: 'Abidjan' });
    const ent2 = await StgEnt.create({ nom: 'Ecobank CI', secteur: 'Finance', email: 'rh@ecobank.ci', telephone: '+22520303030', ville: 'Abidjan' });
    const ent3 = await StgEnt.create({ nom: 'Groupe SIFCA', secteur: 'Agro-industrie', email: 'carriere@sifca.ci', telephone: '+22520404040', ville: 'Abidjan' });
    console.log('  ✓ Entreprises');

    const tut1 = await StgTut.create({ nom: 'Kouamé', prenoms: 'Paul', email: 'paul.kouame@orange.ci', telephone: '+22507010101', fonction: 'Responsable RH', entrepriseId: ent1.id });
    const tut2 = await StgTut.create({ nom: 'Koné', prenoms: 'Moussa', email: 'moussa.kone@ecobank.ci', telephone: '+22507020202', fonction: 'Directeur Financier', entrepriseId: ent2.id });
    const tut3 = await StgTut.create({ nom: 'Soro', prenoms: 'Aminata', email: 'aminata.soro@sifca.ci', telephone: '+22507030303', fonction: 'Chef de Projet', entrepriseId: ent3.id });
    console.log('  ✓ Tuteurs');

    await StgOff.create({ titre: 'Stage Développeur Web', description: 'Développement d\'applications web', lieu: 'Abidjan', dateDebut: '2025-01-15', dateFin: '2025-04-15' });
    await StgOff.create({ titre: 'Stage Assistant Comptable', description: 'Comptabilité et reporting', lieu: 'Abidjan', dateDebut: '2025-02-01', dateFin: '2025-05-31' });
    await StgOff.create({ titre: 'Stage Marketing Digital', description: 'Community management et SEO', lieu: 'Abidjan', dateDebut: '2025-03-01', dateFin: '2025-06-01' });
    console.log('  ✓ Offres de stage');

    // ════════════════════════════════════════════════════
    //  STOCK MODULE
    // ════════════════════════════════════════════════════
    console.log('\n── STOCKS ──');
    const catStk1 = await StkCat.create({ nom: 'Fournitures de bureau', description: 'Papeterie et consommables' });
    const catStk2 = await StkCat.create({ nom: 'Matériel informatique', description: 'Ordinateurs et accessoires' });
    console.log('  ✓ Catégories');

    const art1 = await StkArt.create({ nom: 'Ramette de papier A4', reference: 'REF-001', prixUnitaire: 5000, stockActuel: 200, stockMinimum: 20, categorieId: catStk1.id });
    const art2 = await StkArt.create({ nom: 'Stylo bleu (boîte de 50)', reference: 'REF-002', prixUnitaire: 7500, stockActuel: 50, stockMinimum: 10, categorieId: catStk1.id });
    const art3 = await StkArt.create({ nom: 'Clavier USB', reference: 'REF-003', prixUnitaire: 15000, stockActuel: 30, stockMinimum: 5, categorieId: catStk2.id });
    const art4 = await StkArt.create({ nom: 'Souris optique', reference: 'REF-004', prixUnitaire: 10000, stockActuel: 25, stockMinimum: 5, categorieId: catStk2.id });
    const art5 = await StkArt.create({ nom: 'Marqueur tableau (boîte de 10)', reference: 'REF-005', prixUnitaire: 4500, stockActuel: 40, stockMinimum: 10, categorieId: catStk1.id });
    console.log('  ✓ Articles');

    const four1 = await StkFour.create({ nom: 'Bureau Plus', email: 'commandes@bureauplus.ci', telephone: '+22521212121', ville: 'Abidjan' });
    const four2 = await StkFour.create({ nom: 'Informatique Pro', email: 'ventes@infopro.ci', telephone: '+22522222222', ville: 'Abidjan' });
    console.log('  ✓ Fournisseurs');

    await StkMouv.create({ type: 'entree', quantite: 50, dateMouvement: new Date(), articleId: art1.id, fournisseurId: four1.id, utilisateurId: admin.id });
    await StkMouv.create({ type: 'sortie', quantite: 10, dateMouvement: new Date(), articleId: art1.id, utilisateurId: admin.id });
    await StkMouv.create({ type: 'entree', quantite: 20, dateMouvement: new Date(), articleId: art3.id, fournisseurId: four2.id, utilisateurId: admin.id });
    await StkMouv.create({ type: 'sortie', quantite: 5, dateMouvement: new Date(), articleId: art3.id, utilisateurId: admin.id });
    console.log('  ✓ Mouvements de stock');

    // ════════════════════════════════════════════════════
    //  IMMOBILISATIONS
    // ════════════════════════════════════════════════════
    console.log('\n── IMMOBILISATIONS ──');
    const site1 = await ImmSite.create({ nom: 'Campus Principal', description: 'Cocody Angré', ville: 'Abidjan' });
    const site2 = await ImmSite.create({ nom: 'Annexe Marcory', description: 'Bâtiment secondaire', ville: 'Abidjan' });
    console.log('  ✓ Sites');

    const bat1 = await ImmBat.create({ nom: 'Bâtiment A', description: 'Administration et salles de cours', siteId: site1.id });
    const bat2 = await ImmBat.create({ nom: 'Bâtiment B', description: 'Laboratoires et bibliothèque', siteId: site1.id });
    const bat3 = await ImmBat.create({ nom: 'Pavillon Marcory', description: 'Salles de formation', siteId: site2.id });
    console.log('  ✓ Bâtiments');

    await ImmLoc.create({ code: 'SALLE-PROF', capacite: 20, batimentId: bat1.id });
    await ImmLoc.create({ code: 'SALLE-REUNION-1', capacite: 15, batimentId: bat1.id });
    await ImmLoc.create({ code: 'BIBLIOTHEQUE', capacite: 100, batimentId: bat2.id });
    console.log('  ✓ Localisations');

    const immCat1 = await ImmCat.create({ nom: 'Matériel informatique', dureeAmortissement: 5, tauxAmortissement: 20 });
    const immCat2 = await ImmCat.create({ nom: 'Mobilier de bureau', dureeAmortissement: 10, tauxAmortissement: 10 });
    const immCat3 = await ImmCat.create({ nom: 'Véhicules', dureeAmortissement: 5, tauxAmortissement: 20 });
    console.log('  ✓ Catégories d\'immobilisations');

    for (let j = 1; j <= 4; j++) {
        const immo = await ImmImmo.create({ nom: `Ordinateur Portable ${j}`, reference: `SN-UST-00${j}`, dateMiseEnService: new Date(2024, 8 + j, 15), valeurAcquisition: 800000, categorieImmobilisationId: immCat1.id, siteId: site1.id });
        await ImmAcq.create({ dateAcquisition: new Date(2024, 8 + j, 15), montant: 800000, immobilisationId: immo.id, fournisseurNom: 'Informatique Pro' });
        await ImmMaint.create({ type: 'preventive', description: `Maintenance annuelle PC ${j}`, dateMaintenance: new Date(2025, 5, 1), cout: 25000, immobilisationId: immo.id });
    }
    console.log('  ✓ Immobilisations');

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED TERMINÉ — UST');
    console.log('═══════════════════════════════════════════\n');
}

seed().catch((err: any) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
