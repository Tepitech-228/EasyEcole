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
    require('../../modules/inscription/models/UniteEnseignement');
    require('../../modules/inscription/models/Mcc');
    require('../../modules/inscription/models/RegleEvaluation');
    require('../../modules/inscription/models/SessionExamen');
    require('../../modules/inscription/models/Absence');
    require('../../modules/inscription/models/Equivalence');
    require('../../modules/inscription/models/Dispense');
    require('../../modules/stage/models/_associations');
    require('../../modules/stock/models/_associations');
    require('../../modules/immobilisation/models/_associations');
    require('../../modules/bulletins/models/_associations');
    require('../../modules/bulletins/models/EchelleNote');
    require('../../modules/bulletins/models/AuditNote');
    require('../../modules/bulletins/models/JuryMembre');
    require('../../modules/scolarite/models/_associations');
    require('../../modules/scolarite/models/SanctionDiscipline');
    require('../../modules/scolarite/models/RegistreAcademique');
    require('../../modules/scolarite/models/EvenementCalendrier');
    require('../../modules/rh/models/_associations');
    require('../../modules/achats/models/_associations');
    require('../../modules/comptabilite/models/_associations');
    require('../../modules/communication/models/_associations');
    require('../../modules/communication/models/Communication');
    require('../../modules/communication/models/Actualite');
    require('../../modules/elearning/models/_associations');
    require('../../modules/elearning/models/Notification');
    require('../../modules/reporting/models/_associations');

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

    const InsTypeNote = M('InsTypeNoteEvaluation');
    const InsListeNote = M('InsListeNoteEvaluation');
    const InsNoteEval = M('InsNoteEvaluation');
    const InsUE = M('InsUniteEnseignement');
    const InsMcc = M('InsMcc');
    const InsSession = M('InsSessionExamen');
    const InsAbsence = M('InsAbsence');
    const InsEquiv = M('InsEquivalence');
    const InsDisp = M('InsDispense');
    const EchelleNote = M('EchelleNote');
    const JuryMembre = M('JuryMembre');

    const Bulletin = M('Bulletin');
    const LigneBulletin = M('LigneBulletin');
    const Deliberation = M('Deliberation');
    const ResultatDelib = M('ResultatDeliberation');

    const StgNoteSt = M('StgNoteStage');
    const StgDem = M('StgDemandeStage');
    const StgConv = M('StgConventionStage');
    const StgRap = M('StgRapportStage');

    const ScolTypeDoc = M('ScolTypeDocument');
    const ScolDemDoc = M('ScolDemandeDocument');
    const ScolDocDel = M('ScolDocumentDelivre');
    const ScolRecl = M('ScolReclamation');
    const ScolRepRecl = M('ScolReponseReclamation');
    const ScolSanction = M('ScolSanctionDiscipline');
    const ScolRegAcad = M('ScolRegistreAcademique');
    const ScolEven = M('ScolEvenementCalendrier');
    const ScolConseil = M('ScolConseilClasse');
    const ScolDecision = M('ScolDecisionConseil');

    const RhDep = M('RhDepartement');
    const RhPoste = M('RhPoste');
    const RhTypeContrat = M('RhTypeContrat');
    const RhEmploye = M('RhEmploye');
    const RhOffre = M('RhOffreEmploi');
    const RhCandidature = M('RhCandidature');
    const RhEntretien = M('RhEntretien');
    const RhFormation = M('RhFormation');
    const RhPartForm = M('RhParticipationFormation');
    const RhCritEval = M('RhCritereEvaluation');
    const RhFicheEval = M('RhFicheEvaluation');
    const RhEvalCrit = M('RhEvaluationCritere');
    const RhRubPaie = M('RhRubriquePaie');
    const RhPerPaie = M('RhPeriodePaie');
    const RhBulPaie = M('RhBulletinPaie');
    const RhLigBul = M('RhLigneBulletin');
    const RhPresEns = M('RhPrestationEnseignant');

    const AchCat = M('AchCategorieAchat');
    const AchFour = M('AchFournisseur');
    const AchDem = M('AchDemande');
    const AchLigDem = M('AchLigneDemande');
    const AchBud = M('AchBudget');
    const AchLigBud = M('AchLigneBudget');
    const AchEng = M('AchEngagement');
    const AchCmd = M('AchCommande');
    const AchLigCmd = M('AchLigneCommande');
    const AchRec = M('AchReception');
    const AchLigRec = M('AchLigneReception');
    const AchFact = M('AchFactureProforma');
    const AchLigFact = M('AchLigneFacture');
    const AchVal = M('AchValidateur');
    const AchValid = M('AchValidation');

    const CptCompte = M('CptCompte');
    const CptJournal = M('CptJournalComptable');
    const CptEcriture = M('CptEcritureComptable');

    const ComCom = M('ComCommunication');
    const ComActu = M('ComActualite');
    const ComSug = M('ComSuggestion');
    const ComRepSug = M('ComReponseSuggestion');

    require('../../modules/elearning/models/Notification');
    const ElearnCours = M('ELearningCoursEnLigne');
    const ElearnModule = M('ELearningModule');
    const ElearnSupport = M('ELearningSupport');
    const ElearnSalon = M('ELearningSalon');
    const ElearnPart = M('ELearningParticipantSalon');
    const ElearnMsg = M('ELearningMessage');
    const ElearnNotif = M('ELearningNotification');
    const ElearnComment = M('ELearningCommentaire');
    const ElearnMail = M('ELearningCouplageMail');

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

    const parcOri1 = await OriPar.create({ titre: 'Informatique de Gestion', contenu: 'Développement et gestion de projets informatiques', categorieId: catOri1.id, niveauEtudeId: nivOri2.id, dureeDeFormation: '2/y', type: 'LICENCE' });
    const parcOri2 = await OriPar.create({ titre: 'Réseaux et Télécoms', contenu: 'Infrastructures réseau et télécommunications', categorieId: catOri1.id, niveauEtudeId: nivOri2.id, dureeDeFormation: '2/y', type: 'LICENCE' });
    const parcOri3 = await OriPar.create({ titre: 'Comptabilité Finance', contenu: 'Comptabilité et audit financier', categorieId: catOri2.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y', type: 'LICENCE' });
    const parcOri4 = await OriPar.create({ titre: 'Marketing Digital', contenu: 'Marketing digital et communication', categorieId: catOri2.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y', type: 'LICENCE' });
    const parcOri5 = await OriPar.create({ titre: 'Droit des Affaires', contenu: 'Droit des sociétés et fiscalité', categorieId: catOri3.id, niveauEtudeId: nivOri3.id, dureeDeFormation: '3/y', type: 'LICENCE' });
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
    const nivIns4 = await InsNiv.create({ libelle: 'Master 1', description: 'Première année de Master' });
    const nivIns5 = await InsNiv.create({ libelle: 'Master 2', description: 'Deuxième année de Master' });
    console.log('  ✓ Niveaux d\'étude (Inscription)');

    const parcIns1 = await InsPar.create({ titre: 'Informatique', description: 'Génie Logiciel et Intelligence Artificielle', niveauEtudeId: nivIns1.id, type: 'LICENCE' });
    const parcIns2 = await InsPar.create({ titre: 'Gestion des Entreprises', description: 'Comptabilité et Finance', niveauEtudeId: nivIns1.id, type: 'LICENCE' });
    const parcIns3 = await InsPar.create({ titre: 'Droit des Affaires', description: 'Droit commercial et fiscal', niveauEtudeId: nivIns1.id, type: 'LICENCE' });
    const parcIns4 = await InsPar.create({ titre: 'Marketing Digital', description: 'Stratégies marketing et E-commerce', niveauEtudeId: nivIns1.id, type: 'LICENCE' });
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

        const cur = await InsCur.create({ parcoursId: etuParcours[i].id, niveauEtudeId: nivIns1.id, classeId: cls1.id, anneeAcademiqueId: an1.id, utilisateurId: userId, demandeInscriptionId: demande.id, externe: false });

        for (const c of coursList) {
            await InsCourP.create({ utilisateurId: userId, coursId: c.id, cursusApprenantId: cur.id });
        }

        if (i < 3) {
            for (let m = 1; m <= 5; m++) {
                await InsEch.create({ dossierEtudiantId: (await InsDosEt.findOne({ where: { utilisateurId: userId } }))?.id, type: 'scolarite', numeroEcheance: m, montant: 207500, dateLimite: new Date(2024, 9 + m, 5), statut: m <= 3 ? 'paye' : 'impaye', moisConcerne: ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février'][m - 1] });
            }
        }

        if (i < 8) {
            await InsBor.create({ echeanceId: 1, fichier: 'bordereau.pdf', type: 'inscription', utilisateurId: userId, montant: 207500, statut: 'valide', dateSoumission: new Date(), dateValidation: new Date() });
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

    // ════════════════════════════════════════════════════
    //  ÉCHELLES DE NOTES & RÈGLES
    // ════════════════════════════════════════════════════
    console.log('\n── ÉCHELLES DE NOTES ──');

    const echelles = [
        { libelle: 'Excellent', noteMin: 18, noteMax: 20, mention: 'Très Bien', ordre: 1 },
        { libelle: 'Très Bien', noteMin: 16, noteMax: 17.99, mention: 'Très Bien', ordre: 2 },
        { libelle: 'Bien', noteMin: 14, noteMax: 15.99, mention: 'Bien', ordre: 3 },
        { libelle: 'Assez Bien', noteMin: 12, noteMax: 13.99, mention: 'Assez Bien', ordre: 4 },
        { libelle: 'Passable', noteMin: 10, noteMax: 11.99, mention: 'Passable', ordre: 5 },
        { libelle: 'Insuffisant', noteMin: 8, noteMax: 9.99, mention: 'Insuffisant', ordre: 6 },
        { libelle: 'Faible', noteMin: 6, noteMax: 7.99, mention: 'Faible', ordre: 7 },
        { libelle: 'Très Faible', noteMin: 0, noteMax: 5.99, mention: 'Très Faible', ordre: 8 },
    ];
    for (const e of echelles) {
        await EchelleNote.create(e);
    }
    console.log('  ✓ Échelles de notes (0-20, 8 niveaux)');

    const RegleEval = M('InsRegleEvaluation');
    await RegleEval.create({ type: 'compensation', valeur: 'true', description: 'Compensation autorisée entre EC d\'une même UE', actif: true });
    await RegleEval.create({ type: 'seuil_eliminatoire', valeur: '7', description: 'Note éliminatoire en-dessous de 7/20', actif: true });
    await RegleEval.create({ type: 'note_minimale', valeur: '10', description: 'Note minimale de validation d\'une UE', actif: true });
    await RegleEval.create({ type: 'validation_credit', valeur: '60', description: 'Crédits ECTS minimum par année', actif: true });
    await RegleEval.create({ type: 'regle_passage', valeur: 'moyenne>=10', description: 'Moyenne générale ≥ 10 pour passer', actif: true });
    console.log('  ✓ Règles d\'évaluation LMD (5 règles)');

    // ════════════════════════════════════════════════════
    //  UNITÉS D'ENSEIGNEMENT (UE) — LMD
    // ════════════════════════════════════════════════════
    console.log('\n── UNITÉS D\'ENSEIGNEMENT ──');

    const ueMapping: Record<number, { code: string; libelle: string; semestre: string; creditEcts: number }[]> = {
        [parcIns1.id]: [
            { code: 'UE1-INFO', libelle: 'Fondamentaux Informatique', semestre: 'semestre1', creditEcts: 12 },
            { code: 'UE2-INFO', libelle: 'Mathématiques et Algorithmique', semestre: 'semestre1', creditEcts: 10 },
            { code: 'UE3-INFO', libelle: 'Langues et Communication', semestre: 'semestre1', creditEcts: 8 },
        ],
        [parcIns2.id]: [
            { code: 'UE1-GEST', libelle: 'Comptabilité Fondamentale', semestre: 'semestre1', creditEcts: 12 },
            { code: 'UE2-GEST', libelle: 'Économie et Gestion', semestre: 'semestre1', creditEcts: 10 },
            { code: 'UE3-GEST', libelle: 'Langues et Communication', semestre: 'semestre1', creditEcts: 8 },
        ],
    };
    for (const [parcId, ues] of Object.entries(ueMapping)) {
        for (const ue of ues) {
            await InsUE.create({ code: ue.code, libelle: ue.libelle, semestre: ue.semestre, parcoursId: +parcId, creditEcts: ue.creditEcts, objectifs: ue.libelle });
        }
    }
    console.log('  ✓ Unités d\'Enseignement (6 UEs)');

    // ════════════════════════════════════════════════════
    //  MCC (Matrice des Coefficients)
    // ════════════════════════════════════════════════════
    console.log('\n── MCC ──');
    const allUEs = await InsUE.findAll();
    for (const ue of allUEs) {
        const parcCours = await InsCours.findAll({ where: { parcoursId: ue.parcoursId }, limit: 2 });
        for (const cours of parcCours) {
            await InsMcc.create({ ueId: ue.id, coursId: cours.id, coefficient: 1, creditEcts: ue.creditEcts ?? 0 / Math.max(parcCours.length, 1) });
        }
    }
    console.log('  ✓ Lignes MCC (UE ↔ Cours)');

    // ════════════════════════════════════════════════════
    //  SESSIONS D'EXAMEN
    // ════════════════════════════════════════════════════
    console.log('\n── SESSIONS D\'EXAMEN ──');
    await InsSession.create({ libelle: 'Session normale S1 2024-2025', type: 'normale', classeId: cls1.id, anneeAcademiqueId: an1.id, semestre: 'semestre1', dateDebut: new Date('2025-06-15'), dateFin: new Date('2025-06-30'), statut: 'cloturee', observations: 'Session normale du semestre 1' });
    await InsSession.create({ libelle: 'Session rattrapage S1 2024-2025', type: 'rattrapage', classeId: cls1.id, anneeAcademiqueId: an1.id, semestre: 'semestre1', dateDebut: new Date('2025-07-15'), dateFin: new Date('2025-07-25'), statut: 'terminee', observations: 'Rattrapage pour les étudiants en échec' });
    console.log('  ✓ Sessions d\'examen (normale + rattrapage)');

    // ════════════════════════════════════════════════════
    //  ABSENCES
    // ════════════════════════════════════════════════════
    console.log('\n── ABSENCES ──');
    const notesWithZero = await InsNoteEval.findAll({ where: { note: 0 }, limit: 3 });
    for (const n of notesWithZero) {
        await InsAbsence.create({ noteEvaluationId: n.id, type: 'justifiee', motif: 'Médical (certificat fourni)', justifieLe: new Date(), justifieParId: admin.id });
    }
    if (notesWithZero.length === 0) {
        const someNotes = await InsNoteEval.findAll({ limit: 2 });
        for (const n of someNotes) {
            await InsAbsence.create({ noteEvaluationId: n.id, type: 'non_justifiee', motif: null });
        }
    }
    console.log('  ✓ Absences');

    // ════════════════════════════════════════════════════
    //  NOTES / EVALUATIONS
    // ════════════════════════════════════════════════════
    console.log('\n── NOTES / EVALUATIONS ──');

    const typeCC = await InsTypeNote.create({ libelle: 'Contrôle Continu', description: 'Évaluation continue en cours de semestre', poids: 40, categorie: 'controle_continu' });
    const typeDevoir = await InsTypeNote.create({ libelle: 'Devoir', description: 'Devoir surveillé de mi-semestre', poids: 30, categorie: 'devoir' });
    const typeExamen = await InsTypeNote.create({ libelle: 'Examen', description: 'Examen de fin de semestre', poids: 30, categorie: 'examen' });
    console.log('  ✓ Types d\'évaluation (CC 40%, Devoir 30%, Examen 30%)');

    const allCours = [cours1, cours2, cours3, cours4, cours5, cours6, cours7, cours8];
    const allListes: any[] = [];
    for (const c of allCours) {
        const l1 = await InsListeNote.create({ poidsTypeNoteEvaluation: 40, date: new Date('2025-02-15'), heureDebut: '08:00', heureFin: '10:00', commentaire: `CC ${c.code}`, typeNoteEvaluationId: typeCC.id, coursId: c.id, enseignantId: c.enseignantId, anneeAcademiqueId: an1.id });
        const l2 = await InsListeNote.create({ poidsTypeNoteEvaluation: 30, date: new Date('2025-04-10'), heureDebut: '08:00', heureFin: '10:00', commentaire: `Devoir ${c.code}`, typeNoteEvaluationId: typeDevoir.id, coursId: c.id, enseignantId: c.enseignantId, anneeAcademiqueId: an1.id });
        const l3 = await InsListeNote.create({ poidsTypeNoteEvaluation: 30, date: new Date('2025-06-20'), heureDebut: '14:00', heureFin: '17:00', commentaire: `Examen ${c.code}`, typeNoteEvaluationId: typeExamen.id, coursId: c.id, enseignantId: c.enseignantId, anneeAcademiqueId: an1.id });
        allListes.push(l1, l2, l3);
    }
    console.log('  ✓ Listes d\'évaluation (3 par cours)');

    const allCoursParts = await InsCourP.findAll();
    for (const cp of allCoursParts) {
        for (const liste of allListes) {
            if (String(liste.coursId) === String(cp.coursId)) {
                const note = +(8 + Math.random() * 11).toFixed(2);
                await InsNoteEval.create({ note, listeNoteEvaluationId: liste.id, coursParticipantId: cp.id });
            }
        }
    }
    console.log('  ✓ Notes individuelles saisies');

    // ════════════════════════════════════════════════════
    //  BULLETINS
    // ════════════════════════════════════════════════════
    console.log('\n── BULLETINS ──');

    const allCursus = await InsCur.findAll({ include: [{ association: 'utilisateur' }] });
    const createdBulletins: any[] = [];
    for (const cur of allCursus) {
        const coursParts = await InsCourP.findAll({ where: { cursusApprenantId: cur.id, utilisateurId: cur.utilisateurId } });
        let totalMoy = 0;
        let totalCredits = 0;
        let count = 0;
        const lignes: { coursId: number; cc: number; dev: number; exam: number; credits: number }[] = [];

        for (const cp of coursParts) {
            const notes = await InsNoteEval.findAll({
                where: { coursParticipantId: cp.id },
                include: [{ association: 'listeNoteEvaluation' }]
            });
            if (notes.length < 3) continue;
            const nCC = notes.find((n: any) => n.listeNoteEvaluation.typeNoteEvaluationId === typeCC.id);
            const nDev = notes.find((n: any) => n.listeNoteEvaluation.typeNoteEvaluationId === typeDevoir.id);
            const nExam = notes.find((n: any) => n.listeNoteEvaluation.typeNoteEvaluationId === typeExamen.id);
            const cc = nCC?.note ?? 0;
            const dev = nDev?.note ?? 0;
            const exam = nExam?.note ?? 0;
            const moy = cc * 0.4 + dev * 0.3 + exam * 0.3;
            const crs = await InsCours.findByPk(cp.coursId);
            const credits = crs?.credit ?? 0;
            totalMoy += moy;
            totalCredits += credits;
            count++;
            lignes.push({ coursId: cp.coursId, cc: +cc.toFixed(2), dev: +dev.toFixed(2), exam: +exam.toFixed(2), credits });
        }

        if (count === 0) continue;
        const moyenneGen = +(totalMoy / count).toFixed(2);
        const mention = moyenneGen >= 16 ? 'Très Bien' : moyenneGen >= 14 ? 'Bien' : moyenneGen >= 12 ? 'Assez Bien' : moyenneGen >= 10 ? 'Passable' : 'Insuffisant';

        const bull = await Bulletin.create({
            anneeAcademiqueId: an1.id, semestre: 'semestre1',
            cursusApprenantId: cur.id, utilisateurId: cur.utilisateurId,
            classeId: cls1.id, parcoursId: cur.parcoursId, niveauEtudeId: cur.niveauEtudeId,
            moyenneGenerale: moyenneGen, totalCredits: totalCredits, creditsValides: Math.floor(totalCredits * (moyenneGen >= 10 ? 0.8 : 0.3)),
            rang: 0, effectifClasse: allCursus.length, mention, appreciation: mention,
            statut: 'publie', dateGeneration: new Date(), datePublication: new Date()
        });

        for (let idx = 0; idx < lignes.length; idx++) {
            const l = lignes[idx];
            const moyLigne = +(l.cc * 0.4 + l.dev * 0.3 + l.exam * 0.3).toFixed(2);
            await LigneBulletin.create({
                bulletinId: bull.id, coursId: l.coursId,
                moyenneCC: l.cc, noteDevoir: l.dev, noteExamen: l.exam,
                moyenne: moyLigne, coefficient: 1, rang: idx + 1,
                appreciation: moyLigne >= 10 ? 'Acquis' : 'Non acquis'
            });
        }
        createdBulletins.push(bull);
    }
    console.log(`  ✓ ${createdBulletins.length} bulletins générés avec lignes`);

    // Délibération
    const delib = await Deliberation.create({
        libelle: 'Semestre 1 - 2024-2025', classeId: cls1.id,
        anneeAcademiqueId: an1.id, periode: 'Semestre 1', date: new Date('2025-07-15'),
        statut: 'cloturee', effectif: allCursus.length,
        admis: createdBulletins.filter((b: any) => (b.moyenneGenerale ?? 0) >= 10).length
    });

    createdBulletins.sort((a: any, b: any) => (b.moyenneGenerale ?? 0) - (a.moyenneGenerale ?? 0));
    for (let r = 0; r < createdBulletins.length; r++) {
        const b = createdBulletins[r];
        const user = await AutU.findByPk(b.utilisateurId);
        await Bulletin.update({ rang: r + 1 }, { where: { id: b.id } });
        await ResultatDelib.create({
            deliberationId: delib.id, cursusApprenantId: b.cursusApprenantId,
            nom: user?.nom ?? '', prenoms: user?.prenoms ?? '',
            matricule: `UST${String(2024000 + r + 1)}`,
            moyenne: b.moyenneGenerale, mention: b.mention, rang: r + 1,
            decision: b.moyenneGenerale >= 10 ? 'admis' : b.moyenneGenerale >= 8 ? 'rattrapage' : 'redouble'
        });
    }
    console.log('  ✓ Délibérations et résultats');

    // ════════════════════════════════════════════════════
    //  STAGE — Notes de stage
    // ════════════════════════════════════════════════════
    console.log('\n── STAGES : NOTES ──');
    const stages = await StgDem.findAll().catch(() => []);
    if (stages.length > 0) {
        for (let si = 0; si < Math.min(stages.length, 5); si++) {
            await StgNoteSt.create({ demandeStageId: stages[si].id, enseignantId: ens2.id, note: +(12 + Math.random() * 7).toFixed(2), appreciation: 'Bon travail' });
        }
        console.log(`  ✓ ${Math.min(stages.length, 5)} notes de stage`);
    } else {
        const stgApprenants = await AutU.findAll({ where: { role: 'apprenant' }, limit: 3, order: [['id', 'ASC']] });
        for (let si = 0; si < stgApprenants.length; si++) {
            const dem = await StgDem.create({ utilisateurId: stgApprenants[si].id, entrepriseId: ent1.id, tuteurId: tut1.id, dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-08-31'), statut: 'valide' });
            await StgNoteSt.create({ demandeStageId: dem.id, enseignantId: ens2.id, note: +(12 + Math.random() * 7).toFixed(2), appreciation: 'Bon travail' });
        }
        console.log('  ✓ Demandes de stage + notes créées');
    }

    // ════════════════════════════════════════════════════
    //  SCOLARITÉ
    // ════════════════════════════════════════════════════
    console.log('\n── SCOLARITÉ ──');

    const docCertif = await ScolTypeDoc.create({ libelle: 'Certificat de scolarité', frais: 5000, format: 'PDF' });
    const docReleve = await ScolTypeDoc.create({ libelle: 'Relevé de notes', frais: 3000, format: 'PDF' });
    const docAttest = await ScolTypeDoc.create({ libelle: 'Attestation de réussite', frais: 0, format: 'PDF' });
    const docDiplome = await ScolTypeDoc.create({ libelle: 'Diplôme', frais: 15000, format: 'PDF' });
    console.log('  ✓ Types de documents');

    const etuUsers = await AutU.findAll({ where: { role: 'apprenant' }, order: [['id', 'ASC']], limit: 5 });
    for (let ei = 0; ei < etuUsers.length; ei++) {
        const doc = await ScolDemDoc.create({ etudiantId: etuUsers[ei].id, typeDocumentId: ei < 2 ? docCertif.id : docReleve.id, statut: ei < 3 ? 'delivree' : 'soumise', date: new Date(), fraisPayes: ei < 3 });
        if (ei < 3) {
            await ScolDocDel.create({ demandeId: doc.id, fichierPDF: `${ei < 2 ? 'certificat' : 'releve'}_${etuUsers[ei].id}.pdf`, dateDelivrance: new Date() });
        }
    }
    console.log('  ✓ Demandes de documents');

    for (let ri = 0; ri < 3; ri++) {
        const recl = await ScolRecl.create({ etudiantId: etuUsers[ri].id, motif: ri === 0 ? 'Erreur sur mon relevé de notes' : ri === 1 ? 'Demande de révision de note' : 'Problème d\'emploi du temps', statut: ri < 2 ? 'traitee' : 'ouverte', date: new Date() });
        if (ri < 2) {
            await ScolRepRecl.create({ reclamationId: recl.id, repondeurId: admin.id, reponse: ri === 0 ? 'La note a été vérifiée et est correcte.' : 'La demande de révision a été transmise au professeur.', date: new Date() });
        }
    }
    console.log('  ✓ Réclamations');

    await ScolSanction.create({ etudiant: 'Traoré Aminata', matricule: 'UST2024001', classe: 'LIC1-A', date: new Date('2025-03-10'), motif: 'Absences répétées', sanction: 'Avertissement écrit', statut: 'notifiée' });
    await ScolSanction.create({ etudiant: 'Kouamé Jean', matricule: 'UST2024002', classe: 'LIC1-A', date: new Date('2025-04-05'), motif: 'Retards fréquents', sanction: 'Blâme', statut: 'notifiée' });
    console.log('  ✓ Sanctions disciplinaires');

    await ScolConseil.create({ classe: 'LIC1-A', date: new Date('2025-07-10'), trimestre: 1, president: 'Konan Yves', statut: 'cloturé' });
    await ScolDecision.create({ conseilClasseId: 1, theme: 'Validation du semestre 1', description: 'Tous les étudiants ayant une moyenne ≥ 10 sont admis en LIC2' });
    console.log('  ✓ Conseil de classe');

    await ScolEven.create({ titre: 'Début des cours', date: new Date('2024-10-01'), description: 'Rentrée académique 2024-2025', type: 'academique' });
    await ScolEven.create({ titre: 'Examens semestre 1', date: new Date('2025-06-15'), description: 'Période des examens', type: 'examen' });
    await ScolEven.create({ titre: 'Vacances de Noël', date: new Date('2024-12-23'), description: 'Fermeture de l\'université', type: 'vacance' });
    console.log('  ✓ Événements calendrier');

    const allNotesEval = await InsNoteEval.findAll({
        include: [{ association: 'coursParticipant' }, { association: 'listeNoteEvaluation' }]
    });
    const notesByCoursParticipant: Record<string, number[]> = {};
    for (const n of allNotesEval) {
        const key = String(n.coursParticipantId);
        if (!notesByCoursParticipant[key]) notesByCoursParticipant[key] = [];
        notesByCoursParticipant[key].push(n.note);
    }
    for (const cur of allCursus) {
        const cp = await InsCourP.findOne({ where: { cursusApprenantId: cur.id } });
        if (!cp) continue;
        const key = String(cp.id);
        const notes = notesByCoursParticipant[key] || [];
        const moy = notes.length > 0 ? +(notes.reduce((a: number, b: number) => a + b, 0) / notes.length).toFixed(2) : 0;
        const allMoyennes = allCursus.map((c: any) => {
            const p = notesByCoursParticipant[String(c.id)] || [];
            return p.length > 0 ? p.reduce((a: number, b: number) => a + b, 0) / p.length : 0;
        });
        allMoyennes.sort((a: number, b: number) => b - a);
        const rang = allMoyennes.indexOf(moy) + 1;
        await ScolRegAcad.create({ etudiant: `${cp.utilisateur?.prenoms ?? ''} ${cp.utilisateur?.nom ?? ''}`, matricule: `UST${String(2024000 + 1)}`, classe: 'LIC1-A', moyenne: moy, rang: rang || 1, decision: moy >= 10 ? 'Admis' : 'Rattrapage', anneeScolaire: '2024-2025' });
    }
    console.log('  ✓ Registres académiques');

    // ════════════════════════════════════════════════════
    //  RH
    // ════════════════════════════════════════════════════
    console.log('\n── RH ──');

    const depEns = await RhDep.create({ nom: 'Enseignement et Recherche', description: 'Département pédagogique' });
    const depFin = await RhDep.create({ nom: 'Finance et Comptabilité', description: 'Gestion financière' });
    const depRh = await RhDep.create({ nom: 'Ressources Humaines', description: 'Gestion du personnel' });
    const depScol = await RhDep.create({ nom: 'Scolarité', description: 'Gestion des inscriptions et dossiers' });
    const depTech = await RhDep.create({ nom: 'Services Techniques', description: 'Maintenance et logistique' });
    console.log('  ✓ Départements');

    const postes = [
        { titre: 'Professeur', dep: depEns.id }, { titre: 'Maître de Conférences', dep: depEns.id },
        { titre: 'Comptable', dep: depFin.id }, { titre: 'Chef comptable', dep: depFin.id },
        { titre: 'Responsable RH', dep: depRh.id }, { titre: 'Assistant RH', dep: depRh.id },
        { titre: 'Agent de scolarité', dep: depScol.id }, { titre: 'Chef de service scolarité', dep: depScol.id },
        { titre: 'Technicien de maintenance', dep: depTech.id }, { titre: 'Chef de service technique', dep: depTech.id }
    ];
    const createdPostes: any[] = [];
    for (const p of postes) {
        createdPostes.push(await RhPoste.create({ titre: p.titre, description: `Poste de ${p.titre}`, departementId: p.dep }));
    }
    console.log('  ✓ Postes');

    const cdi = await RhTypeContrat.create({ code: 'CDI', libelle: 'Contrat à Durée Indéterminée' });
    const cdd = await RhTypeContrat.create({ code: 'CDD', libelle: 'Contrat à Durée Déterminée' });
    const vac = await RhTypeContrat.create({ code: 'VAC', libelle: 'Vacataire' });
    console.log('  ✓ Types de contrat');

    const ensUsers = await AutU.findAll({ where: { role: 'enseignant' }, order: [['id', 'ASC']] });
    for (let ei = 0; ei < ensUsers.length; ei++) {
        await RhEmploye.create({ utilisateurId: ensUsers[ei].id, posteId: createdPostes[ei].id, departementId: depEns.id, dateEmbauche: new Date('2020-09-01'), typeContratId: cdi.id, salaireBase: 800000 + ei * 200000, statut: 'actif' });
    }
    const adminUser = await AutU.findOne({ where: { identifiant: 'admin' } });
    await RhEmploye.create({ utilisateurId: adminUser?.id ?? admin.id, posteId: createdPostes[4].id, departementId: depRh.id, dateEmbauche: new Date('2019-01-15'), typeContratId: cdi.id, salaireBase: 1200000, statut: 'actif' });
    console.log('  ✓ Employés');

    const rubSalaire = await RhRubPaie.create({ code: 'SAL', libelle: 'Salaire de base', type: 'gain', modeCalcul: 'fixe', valeur: 0, imposable: true });
    const rubLogement = await RhRubPaie.create({ code: 'LOG', libelle: 'Indemnité logement', type: 'gain', modeCalcul: 'pourcentage', valeur: 15, imposable: false });
    const rubTransport = await RhRubPaie.create({ code: 'TRANS', libelle: 'Indemnité transport', type: 'gain', modeCalcul: 'fixe', valeur: 50000, imposable: false });
    const rubIR = await RhRubPaie.create({ code: 'IR', libelle: 'Impôt sur le revenu', type: 'retenue', modeCalcul: 'pourcentage', valeur: 5, imposable: false });
    const rubCNPS = await RhRubPaie.create({ code: 'CNPS', libelle: 'Cotisation CNPS', type: 'cotisation', modeCalcul: 'pourcentage', valeur: 4, imposable: false });
    console.log('  ✓ Rubriques paie');

    const perPaie = await RhPerPaie.create({ mois: 6, annee: 2025, dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-06-30'), statut: 'ouverte' });
    const allRhEmployes = await RhEmploye.findAll();
    for (const emp of allRhEmployes) {
        const salBase = emp.salaireBase ?? 0;
        const logement = salBase * 0.15;
        const transport = 50000;
        const ir = (salBase + logement + transport) * 0.05;
        const cnps = salBase * 0.04;
        const totalGains = salBase + logement + transport;
        const totalRetenues = ir + cnps;
        const net = totalGains - totalRetenues;

        const bp = await RhBulPaie.create({ employeId: emp.id, periodeId: perPaie.id, totalGains, totalRetenues, netAPayer: net, statut: 'validé' });

        await RhLigBul.create({ bulletinId: bp.id, rubriqueId: rubSalaire.id, libelle: 'Salaire de base', base: salBase, taux: 0, montant: salBase });
        await RhLigBul.create({ bulletinId: bp.id, rubriqueId: rubLogement.id, libelle: 'Indemnité logement', base: salBase, taux: 15, montant: logement });
        await RhLigBul.create({ bulletinId: bp.id, rubriqueId: rubTransport.id, libelle: 'Indemnité transport', base: 0, taux: 0, montant: transport });
        await RhLigBul.create({ bulletinId: bp.id, rubriqueId: rubIR.id, libelle: 'Impôt sur le revenu', base: totalGains, taux: 5, montant: ir });
        await RhLigBul.create({ bulletinId: bp.id, rubriqueId: rubCNPS.id, libelle: 'Cotisation CNPS', base: salBase, taux: 4, montant: cnps });
    }
    console.log('  ✓ Bulletins de paie');

    const rhEns = await RhEmploye.findAll({ include: [{ association: 'poste' }] });
    for (let pi = 0; pi < Math.min(rhEns.length, 8); pi++) {
        await RhPresEns.create({ enseignantId: rhEns[pi].id, coursId: allCours[pi % allCours.length].id, mois: 6, annee: 2025, nombreHeures: 20 + pi * 4, tauxHoraire: 5000, montant: (20 + pi * 4) * 5000, statut: 'validée' });
    }
    console.log('  ✓ Prestations enseignants');

    const form1 = await RhFormation.create({ titre: 'Pédagogie universitaire', description: 'Formation aux méthodes pédagogiques', dateDebut: new Date('2025-04-01'), dateFin: new Date('2025-04-05'), formateur: 'Dr. Kouamé Paul', type: 'interne' });
    const form2 = await RhFormation.create({ titre: 'Excel avancé', description: 'Tableaux de bord et reporting', dateDebut: new Date('2025-05-10'), dateFin: new Date('2025-05-12'), formateur: 'Bureau Plus Formation', type: 'externe' });
    console.log('  ✓ Formations');

    for (let fi = 0; fi < Math.min(rhEns.length, 3); fi++) {
        await RhPartForm.create({ formationId: form1.id, employeId: rhEns[fi].id, statut: 'terminé' });
    }
    for (let fi = 0; fi < Math.min(rhEns.length, 2); fi++) {
        await RhPartForm.create({ formationId: form2.id, employeId: rhEns[fi].id, statut: 'terminé' });
    }
    console.log('  ✓ Participations formations');

    const poste1 = createdPostes[0];
    const offre1 = await RhOffre.create({ posteId: poste1.id, description: 'Recherche professeur d\'informatique', datePublication: new Date('2025-01-15'), dateCloture: new Date('2025-03-15'), statut: 'fermée' });
    const offre2 = await RhOffre.create({ posteId: createdPostes[2].id, description: 'Recherche comptable expérimenté', datePublication: new Date('2025-06-01'), dateCloture: new Date('2025-08-01'), statut: 'publiée' });
    console.log('  ✓ Offres d\'emploi');

    const cand1 = await RhCandidature.create({ offreId: offre1.id, nom: 'Koné Moussa', email: 'moussa.kone@email.ci', telephone: '+22507010101', cv: 'cv_kone.pdf', lettreMotivation: 'lm_kone.pdf', statut: 'retenue' });
    const cand2 = await RhCandidature.create({ offreId: offre1.id, nom: 'Diallo Aïcha', email: 'aicha.diallo@email.ci', telephone: '+22507020202', cv: 'cv_diallo.pdf', lettreMotivation: 'lm_diallo.pdf', statut: 'soumise' });
    await RhCandidature.create({ offreId: offre2.id, nom: 'Tano Jean', email: 'jean.tano@email.ci', cv: 'cv_tano.pdf', statut: 'soumise' });
    console.log('  ✓ Candidatures');

    await RhEntretien.create({ candidatureId: cand1.id, date: new Date('2025-02-20'), heure: '10:00', lieu: 'Bureau RH', commentaire: 'Candidat très compétent', statut: 'retenu' });
    await RhEntretien.create({ candidatureId: cand2.id, date: new Date('2025-02-21'), heure: '14:00', lieu: 'Salle 101', commentaire: 'À recontacter', statut: 'en_attente' });
    console.log('  ✓ Entretiens');

    const critPonctualite = await RhCritEval.create({ nom: 'Ponctualité', description: 'Respect des horaires', poids: 20 });
    const critCompetence = await RhCritEval.create({ nom: 'Compétence technique', description: 'Maîtrise des outils', poids: 30 });
    const critRelation = await RhCritEval.create({ nom: 'Relationnel', description: 'Travail en équipe', poids: 20 });
    const critProductivite = await RhCritEval.create({ nom: 'Productivité', description: 'Efficacité au travail', poids: 30 });
    console.log('  ✓ Critères d\'évaluation');

    for (let ei = 0; ei < Math.min(rhEns.length, 3); ei++) {
        const fiche = await RhFicheEval.create({ employeId: rhEns[ei].id, evaluateurId: admin.id, dateEvaluation: new Date('2025-06-15'), noteGlobale: 14 + ei, commentaire: 'Bon travail' });
        await RhEvalCrit.create({ ficheId: fiche.id, critereId: critPonctualite.id, note: 14 + ei });
        await RhEvalCrit.create({ ficheId: fiche.id, critereId: critCompetence.id, note: 15 + ei });
        await RhEvalCrit.create({ ficheId: fiche.id, critereId: critRelation.id, note: 13 + ei });
        await RhEvalCrit.create({ ficheId: fiche.id, critereId: critProductivite.id, note: 14 + ei });
    }
    console.log('  ✓ Fiches d\'évaluation');

    // ════════════════════════════════════════════════════
    //  ACHATS
    // ════════════════════════════════════════════════════
    console.log('\n── ACHATS ──');

    const achCat1 = await AchCat.create({ nom: 'Fournitures de bureau', description: 'Papeterie et consommables' });
    const achCat2 = await AchCat.create({ nom: 'Matériel pédagogique', description: 'Équipements pour salles de classe' });
    const achCat3 = await AchCat.create({ nom: 'Informatique', description: 'Matériel et logiciels' });
    console.log('  ✓ Catégories');

    const achFour1 = await AchFour.create({ nom: 'Bureau Plus CI', contact: 'Kouamé Paul', email: 'commandes@bureauplus.ci', telephone: '+22521212121', adresse: 'Abidjan Plateau' });
    const achFour2 = await AchFour.create({ nom: 'Techno Shop', contact: 'Koné Moussa', email: 'ventes@technoshop.ci', telephone: '+22522222222', adresse: 'Abidjan Cocody' });
    console.log('  ✓ Fournisseurs');

    const immDepEns = await M('ImmDepartement').create({ nom: 'Enseignement et Recherche' });
    const immDepFin = await M('ImmDepartement').create({ nom: 'Finance' });
    const achBud = await AchBud.create({ departementId: immDepEns.id, periode: '2025', montantAlloue: 50000000, montantUtilise: 2350000 });
    await AchLigBud.create({ budgetId: achBud.id, categorieAchatId: achCat1.id, montantAlloue: 10000000, montantUtilise: 500000 });
    await AchLigBud.create({ budgetId: achBud.id, categorieAchatId: achCat2.id, montantAlloue: 20000000, montantUtilise: 1200000 });
    await AchLigBud.create({ budgetId: achBud.id, categorieAchatId: achCat3.id, montantAlloue: 20000000, montantUtilise: 650000 });
    console.log('  ✓ Budgets');

    const achDem1 = await AchDem.create({ soumisParId: admin.id, description: 'Fournitures pour le département', statut: 'validee', dateSoumission: new Date('2025-01-10'), validateurChoisiId: admin.id });
    await AchLigDem.create({ demandeId: achDem1.id, designation: 'Ramettes de papier A4 (10 cartons)', quantite: 10, prixEstime: 50000, unite: 'carton' });
    await AchLigDem.create({ demandeId: achDem1.id, designation: 'Stylos bleus (20 boîtes)', quantite: 20, prixEstime: 7500, unite: 'boîte' });
    console.log('  ✓ Demandes d\'achat');

    await AchVal.create({ utilisateurId: admin.id, niveau: 1, montantMax: 5000000, actif: true });
    await AchVal.create({ utilisateurId: admin.id, niveau: 2, montantMax: 20000000, actif: true });
    console.log('  ✓ Validateurs');

    const achCmd1 = await AchCmd.create({ demandeId: achDem1.id, fournisseurId: achFour1.id, dateCommande: new Date('2025-01-15'), statut: 'livree' });
    const ligCmd1 = await AchLigCmd.create({ commandeId: achCmd1.id, designation: 'Ramettes de papier A4 (10 cartons)', quantite: 10, prixUnitaire: 45000, total: 450000, gereEnStock: true });
    const ligCmd2 = await AchLigCmd.create({ commandeId: achCmd1.id, designation: 'Stylos bleus (20 boîtes)', quantite: 20, prixUnitaire: 7000, total: 140000, gereEnStock: true });
    console.log('  ✓ Commandes');

    const rec1 = await AchRec.create({ commandeId: achCmd1.id, date: new Date('2025-01-20'), statut: 'totale', notes: 'Livraison complète' });
    await AchLigRec.create({ receptionId: rec1.id, ligneCommandeId: ligCmd1.id, quantiteRecue: 10 });
    await AchLigRec.create({ receptionId: rec1.id, ligneCommandeId: ligCmd2.id, quantiteRecue: 20 });
    console.log('  ✓ Réceptions');

    const fact1 = await AchFact.create({ commandeId: achCmd1.id, dateEmission: new Date('2025-01-22'), montantTotal: 590000, statut: 'payee' });
    await AchLigFact.create({ factureId: fact1.id, ligneCommandeId: ligCmd1.id, designation: 'Ramettes de papier', quantite: 10, prixUnitaire: 45000, total: 450000 });
    await AchLigFact.create({ factureId: fact1.id, ligneCommandeId: ligCmd2.id, designation: 'Stylos bleus', quantite: 20, prixUnitaire: 7000, total: 140000 });
    console.log('  ✓ Factures');

    await AchEng.create({ budgetId: achBud.id, demandeId: achDem1.id, montant: 590000, date: new Date('2025-01-16'), statut: 'actif' });
    console.log('  ✓ Engagements');

    // ════════════════════════════════════════════════════
    //  COMPTABILITÉ
    // ════════════════════════════════════════════════════
    console.log('\n── COMPTABILITÉ ──');

    const comptes = [
        { numero: '101', libelle: 'Capital social', classe: '1', sousClasse: '10', nature: 'Crédit', categorie: 'Capitaux propres' },
        { numero: '164', libelle: 'Emprunts', classe: '1', sousClasse: '16', nature: 'Crédit', categorie: 'Dettes financières' },
        { numero: '211', libelle: 'Terrains', classe: '2', sousClasse: '21', nature: 'Débit', categorie: 'Immobilisations corporelles' },
        { numero: '2183', libelle: 'Matériel informatique', classe: '2', sousClasse: '21', nature: 'Débit', categorie: 'Immobilisations corporelles' },
        { numero: '281', libelle: 'Amortissements', classe: '2', sousClasse: '28', nature: 'Crédit', categorie: 'Amortissements' },
        { numero: '401', libelle: 'Fournisseurs', classe: '4', sousClasse: '40', nature: 'Crédit', categorie: 'Dettes' },
        { numero: '411', libelle: 'Clients', classe: '4', sousClasse: '41', nature: 'Débit', categorie: 'Créances' },
        { numero: '512', libelle: 'Banque', classe: '5', sousClasse: '51', nature: 'Débit/Crédit', categorie: 'Trésorerie' },
        { numero: '531', libelle: 'Caisse', classe: '5', sousClasse: '53', nature: 'Débit', categorie: 'Trésorerie' },
        { numero: '601', libelle: 'Achats', classe: '6', sousClasse: '60', nature: 'Débit', categorie: 'Charges' },
        { numero: '606', libelle: 'Fournitures', classe: '6', sousClasse: '60', nature: 'Débit', categorie: 'Charges' },
        { numero: '641', libelle: 'Salaires', classe: '6', sousClasse: '64', nature: 'Débit', categorie: 'Charges' },
        { numero: '645', libelle: 'Charges sociales', classe: '6', sousClasse: '64', nature: 'Débit', categorie: 'Charges' },
        { numero: '701', libelle: 'Ventes', classe: '7', sousClasse: '70', nature: 'Crédit', categorie: 'Produits' },
        { numero: '706', libelle: 'Prestations de services', classe: '7', sousClasse: '70', nature: 'Crédit', categorie: 'Produits' },
    ];
    const createdComptes: any[] = [];
    for (const c of comptes) {
        createdComptes.push(await CptCompte.create({
            numero: c.numero, libelle: c.libelle, classe: c.classe as any,
            sousClasse: c.sousClasse, nature: c.nature as any,
            categorie: c.categorie, description: `Compte ${c.libelle}`, actif: true, moduleSource: 'seed'
        }));
    }
    console.log('  ✓ Plan comptable');

    const jrnAch = await CptJournal.create({ code: 'AC', libelle: 'Journal des achats', type: 'Achat', description: 'Saisie des factures fournisseurs', actif: true });
    const jrnBan = await CptJournal.create({ code: 'BQ', libelle: 'Journal de banque', type: 'Banque', description: 'Opérations bancaires', actif: true });
    const jrnOD = await CptJournal.create({ code: 'OD', libelle: 'Journal des opérations diverses', type: 'OD', description: 'OD de clôture et diverses', actif: true });
    console.log('  ✓ Journaux comptables');

    const cptAchat = createdComptes.find((c: any) => c.numero === '601');
    const cptFour = createdComptes.find((c: any) => c.numero === '401');
    const cptBanque = createdComptes.find((c: any) => c.numero === '512');
    const cptVentes = createdComptes.find((c: any) => c.numero === '701');
    const cptSal = createdComptes.find((c: any) => c.numero === '641');

    await CptEcriture.create({ journalId: jrnAch.id, numeroEcriture: 'AC-001', dateEcriture: new Date('2025-01-22'), dateComptable: new Date('2025-01-22'), compteDebitId: cptAchat.id, compteCreditId: cptFour.id, montant: 590000, libelle: 'Achat fournitures bureau', reference: 'FACT-001', moduleSource: 'achats', utilisateurSaisieId: admin.id, validee: true, utilisateurValidationId: admin.id, dateValidation: new Date('2025-01-22') });
    await CptEcriture.create({ journalId: jrnBan.id, numeroEcriture: 'BQ-001', dateEcriture: new Date('2025-01-25'), dateComptable: new Date('2025-01-25'), compteDebitId: cptFour.id, compteCreditId: cptBanque.id, montant: 590000, libelle: 'Paiement facture fournitures', moduleSource: 'achats', utilisateurSaisieId: admin.id, validee: true });
    await CptEcriture.create({ journalId: jrnBan.id, numeroEcriture: 'BQ-002', dateEcriture: new Date('2025-06-30'), dateComptable: new Date('2025-06-30'), compteDebitId: cptSal.id, compteCreditId: cptBanque.id, montant: 8000000, libelle: 'Paie juin 2025', moduleSource: 'rh', utilisateurSaisieId: admin.id, validee: true });
    console.log('  ✓ Écritures comptables');

    // ════════════════════════════════════════════════════
    //  COMMUNICATION
    // ════════════════════════════════════════════════════
    console.log('\n── COMMUNICATION ──');

    await ComCom.create({ titre: 'Rentrée universitaire 2025-2026', contenu: 'Les inscriptions pour la rentrée 2025-2026 sont ouvertes du 1er septembre au 31 octobre 2025.', datePublication: new Date('2025-08-15'), statut: 'publiee' });
    await ComCom.create({ titre: 'Calendrier des examens', contenu: 'Les examens du semestre 1 auront lieu du 15 au 30 juin 2025.', datePublication: new Date('2025-05-01'), statut: 'publiee' });
    await ComCom.create({ titre: 'Note de service', contenu: 'Réunion pédagogique obligatoire le 10 septembre 2025 à 9h.', datePublication: new Date('2025-09-01'), statut: 'brouillon' });
    console.log('  ✓ Communications');

    await ComActu.create({ titre: 'L\'UST célèbre ses 10 ans', contenu: 'L\'Université des Sciences et Technologies fête sa première décennie d\'excellence.', date: new Date('2025-03-20'), categorie: 'Événement' });
    await ComActu.create({ titre: 'Partenariat avec Orange CI', contenu: 'L\'UST signe un partenariat avec Orange Côte d\'Ivoire pour la formation aux métiers du numérique.', date: new Date('2025-04-10'), categorie: 'Partenariat' });
    console.log('  ✓ Actualités');

    const sug1 = await ComSug.create({ utilisateurId: etuUsers[0]?.id ?? admin.id, type: 'Amélioration', message: 'Suggestion d\'ajouter un laboratoire de langues', statut: 'traitee', date: new Date() });
    await ComRepSug.create({ suggestionId: sug1.id, utilisateurId: admin.id, message: 'Merci pour votre suggestion. Elle sera étudiée par la direction.', date: new Date() });
    await ComSug.create({ utilisateurId: etuUsers[1]?.id ?? admin.id, type: 'Réclamation', message: 'Horaires d\'ouverture de la bibliothèque trop restrictifs', statut: 'ouverte', date: new Date() });
    console.log('  ✓ Suggestions');

    // ════════════════════════════════════════════════════
    //  E-LEARNING
    // ════════════════════════════════════════════════════
    console.log('\n── E-LEARNING ──');

    const elearnC1 = await ElearnCours.create({ coursId: String(cours1.id), titre: 'Algorithmique et Programmation', description: 'Cours en ligne d\'initiation à la programmation', statut: 'actif' });
    const elearnC2 = await ElearnCours.create({ coursId: String(cours7.id), titre: 'Bases de données', description: 'Cours en ligne de SQL et conception BD', statut: 'actif' });
    console.log('  ✓ Cours en ligne');

    const mod1 = await ElearnModule.create({ coursId: elearnC1.id, titre: 'Introduction à Python', description: 'Variables, types et structures de contrôle', ordre: 1 });
    const mod2 = await ElearnModule.create({ coursId: elearnC1.id, titre: 'Fonctions et modules', description: 'Définition de fonctions et import de modules', ordre: 2 });
    const mod3 = await ElearnModule.create({ coursId: elearnC2.id, titre: 'SQL Fondamentaux', description: 'Requêtes SELECT, INSERT, UPDATE', ordre: 1 });
    console.log('  ✓ Modules');

    const sup1 = await ElearnSupport.create({ moduleId: mod1.id, type: 'PDF', fichierOriginal: 'python_intro.pdf', fichierCompresse: 'python_intro_comp.pdf', taille: '2.5 MB' });
    const sup2 = await ElearnSupport.create({ moduleId: mod1.id, type: 'VIDEO', fichierOriginal: 'python_video.mp4', dureeVideo: '45:30', taille: '120 MB' });
    const sup3 = await ElearnSupport.create({ moduleId: mod3.id, type: 'PDF', fichierOriginal: 'sql_fundamentals.pdf', taille: '1.8 MB' });
    console.log('  ✓ Supports');

    const sal1 = await ElearnSalon.create({ coursId: elearnC1.id, titre: 'Chat Programmation', type: 'cours' });
    const sal2 = await ElearnSalon.create({ coursId: elearnC2.id, titre: 'Chat Base de données', type: 'cours' });
    console.log('  ✓ Salons');

    for (const u of etuUsers) {
        await ElearnPart.create({ salonId: sal1.id, utilisateurId: u.id as any });
        await ElearnPart.create({ salonId: sal2.id, utilisateurId: u.id as any });
    }
    console.log('  ✓ Participants salons');

    await ElearnMsg.create({ salonId: sal1.id, utilisateurId: etuUsers[0]?.id as any ?? admin.id, message: 'Bonjour à tous !', date: new Date(), lu: false });
    await ElearnMsg.create({ salonId: sal1.id, utilisateurId: ens2.id as any, message: 'Bonjour ! Le cours commence cette semaine.', date: new Date(), lu: true });
    await ElearnMsg.create({ salonId: sal1.id, utilisateurId: etuUsers[1]?.id as any ?? admin.id, message: 'Merci professeur !', date: new Date(), lu: false });
    await ElearnMsg.create({ salonId: sal2.id, utilisateurId: ens2.id as any, message: 'Nouveau module SQL disponible.', date: new Date(), lu: false });
    await ElearnMsg.create({ salonId: sal2.id, utilisateurId: etuUsers[0]?.id as any ?? admin.id, message: 'Super, merci !', date: new Date(), lu: false });
    console.log('  ✓ Messages');

    for (const u of etuUsers.slice(0, 3)) {
        await ElearnNotif.create({ utilisateurId: u.id as any, type: 'cours', message: 'Nouveau cours disponible : Algorithmique', lu: false, date: new Date() });
    }
    await ElearnNotif.create({ utilisateurId: admin.id as any, type: 'system', message: 'Mise à jour système effectuée', lu: true, date: new Date() });
    console.log('  ✓ Notifications');

    for (const sup of [sup1, sup2, sup3]) {
        await ElearnComment.create({ supportId: sup.id, utilisateurId: etuUsers[0]?.id as any ?? admin.id, message: 'Très bon support !', date: new Date() });
    }
    console.log('  ✓ Commentaires');

    await ElearnMail.create({ supportId: sup1.id, emailEnvoye: 'etudiant1@etu.ust.ci', dateEnvoi: new Date() });
    await ElearnMail.create({ supportId: sup3.id, emailEnvoye: 'etudiant2@etu.ust.ci', dateEnvoi: new Date() });
    console.log('  ✓ Couplages mail');

    // ════════════════════════════════════════════════════
    //  REPORTING
    // ════════════════════════════════════════════════════
    console.log('\n── REPORTING ──');
    console.log('  ⚡ Lancer après: npm run db:sync-reporting');

    // ════════════════════════════════════════════════════
    //  ÉQUIVALENCES & DISPENSES
    // ════════════════════════════════════════════════════
    console.log('\n── ÉQUIVALENCES & DISPENSES ──');
    const cursusList = await InsCur.findAll({ limit: 2 });
    for (let ci = 0; ci < cursusList.length; ci++) {
        const cur = cursusList[ci];
        await InsEquiv.create({ cursusApprenantId: cur.id, coursSource: 'MATH101 - Université Félix Houphouët-Boigny', coursDestinationId: cours2.id, institutionOrigine: 'Université Félix Houphouët-Boigny', creditEcts: 4, validePar: admin.id, dateValidation: new Date(), documentJustificatif: 'releve_ufhb.pdf' });
        await InsDisp.create({ cursusApprenantId: cur.id, ueId: allUEs[0]?.id ?? 1, motif: 'Étudiant déjà certifié dans cette UE (diplôme obtenu)', validePar: admin.id, dateValidation: new Date(), statut: 'validee' });
    }
    console.log('  ✓ Équivalences et dispenses');

    // ════════════════════════════════════════════════════
    //  JURY
    // ════════════════════════════════════════════════════
    console.log('\n── JURY ──');
    const delibs = await Deliberation.findAll({ limit: 1 });
    for (const d of delibs) {
        await JuryMembre.create({ deliberationId: d.id, utilisateurId: admin.id, role: 'president', presence: true });
        await JuryMembre.create({ deliberationId: d.id, utilisateurId: uEns1.id, role: 'membre', presence: true });
        await JuryMembre.create({ deliberationId: d.id, utilisateurId: uEns2.id, role: 'secretaire', presence: true });
    }
    console.log('  ✓ Membres du jury');

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED TERMINÉ — UST');
    console.log('═══════════════════════════════════════════\n');
}

seed().catch((err: any) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
