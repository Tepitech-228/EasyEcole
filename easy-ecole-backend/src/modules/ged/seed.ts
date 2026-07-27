import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import Folder from "./models/Folder";
import Domain from "./models/Domain";
import DocumentType from "./models/DocumentType";
import RolePermission from "./models/RolePermission";
import { ProcessusGenerateur } from "./models/ProcessusGenerateur";

async function seedDomains(): Promise<void> {
  const count = await Domain.count();
  if (count > 0) return;

  await Domain.bulkCreate([
    { code: 'SCOL', label: 'Scolarité' },
    { code: 'RH', label: 'Ressources Humaines' },
    { code: 'FIN', label: 'Finances' },
    { code: 'REC', label: 'Recherche' },
    { code: 'GOUV', label: 'Gouvernance' },
    { code: 'PAT', label: 'Patrimoine' },
    { code: 'EXT', label: 'Documents externes' },
  ]);
  console.log("7 Domaines GED créés");
}

async function seedDocumentTypes(): Promise<void> {
  const count = await DocumentType.count();
  if (count > 0) return;

  const domains = await Domain.findAll();
  const byCode = Object.fromEntries(domains.map(d => [d.code, d.id]));

  await DocumentType.bulkCreate([
    { domainId: byCode['SCOL'], code: 'releve_notes', shortCode: 'REL', label: 'Relevé de notes', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['SCOL'], code: 'diplome', shortCode: 'DIPL', label: 'Diplôme', defaultConfidentiality: 'confidentiel', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'pv_jury', shortCode: 'PV', label: 'Procès-verbal de jury', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'fiche_inscription', shortCode: 'FINS', label: "Fiche d'inscription", defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'certificat_scolarite', shortCode: 'CERT', label: 'Certificat de scolarité', defaultConfidentiality: 'public', duaDurationYears: 5 },
    { domainId: byCode['SCOL'], code: 'attestation_reussite', shortCode: 'AR', label: 'Attestation de réussite', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'convention_stage', shortCode: 'CONV', label: 'Convention de stage', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'bulletin', shortCode: 'BULL', label: 'Bulletin de notes', defaultConfidentiality: 'restreint', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'dossier_inscription', shortCode: 'DOSS', label: "Dossier d'inscription", defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'contrat_formation', shortCode: 'CFORM', label: 'Contrat de formation', defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['RH'], code: 'contrat_travail', shortCode: 'CTR', label: 'Contrat de travail', defaultConfidentiality: 'confidentiel', duaDurationYears: 50 },
    { domainId: byCode['RH'], code: 'bulletin_paie', shortCode: 'BULL', label: 'Bulletin de paie', defaultConfidentiality: 'confidentiel', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'cv', shortCode: 'CV', label: 'Curriculum vitae', defaultConfidentiality: 'interne', duaDurationYears: 2 },
    { domainId: byCode['RH'], code: 'attestation_travail', shortCode: 'ATT', label: 'Attestation de travail', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['FIN'], code: 'facture', shortCode: 'FACT', label: 'Facture', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['FIN'], code: 'quitus', shortCode: 'QUIT', label: 'Quitus', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['FIN'], code: 'bordereau', shortCode: 'BORD', label: 'Bordereau', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['REC'], code: 'publication', shortCode: 'PUB', label: 'Publication', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['REC'], code: 'these', shortCode: 'THESE', label: 'Thèse', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['REC'], code: 'rapport_recherche', shortCode: 'RAPR', label: 'Rapport de recherche', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['GOUV'], code: 'deliberation', shortCode: 'DELIB', label: 'Délibération', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['GOUV'], code: 'proces_verbal', shortCode: 'PVRB', label: 'Procès-verbal', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['GOUV'], code: 'reglement_interieur', shortCode: 'REGL', label: 'Règlement intérieur', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['PAT'], code: 'inventaire', shortCode: 'INVT', label: 'Inventaire', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['PAT'], code: 'bon_commande', shortCode: 'BC', label: 'Bon de commande', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['PAT'], code: 'contrat_fournisseur', shortCode: 'CF', label: 'Contrat fournisseur', defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['EXT'], code: 'convention_externe', shortCode: 'CONVX', label: 'Convention externe', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['EXT'], code: 'document_entrant', shortCode: 'DENT', label: 'Document entrant', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['EXT'], code: 'courrier', shortCode: 'COUR', label: 'Courrier', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'pointage', shortCode: 'PTS', label: 'Fiche de pointage', defaultConfidentiality: 'restreint', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'planning', shortCode: 'PLAN', label: 'Planning personnel', defaultConfidentiality: 'interne', duaDurationYears: 2 },
  ]);
  console.log(`${await DocumentType.count()} Types documentaires GED créés`);
}

async function seedRolePermissions(): Promise<void> {
  const count = await RolePermission.count();
  if (count > 0) return;

  const allRoles = ['apprenant', 'institution', 'admin', 'enseignant', 'ressources_humaines', 'caissier_banque', 'cabinet_comptable', 'comite_orientation'];

  const permissions: { confidentialityLevel: string; role: string }[] = [];

  // PUBLIC: tous les rôles
  for (const role of allRoles) {
    permissions.push({ confidentialityLevel: 'public', role });
  }

  // INTERNE: tous sauf apprenant
  for (const role of allRoles.filter(r => r !== 'apprenant')) {
    permissions.push({ confidentialityLevel: 'interne', role });
  }

  // RESTREINT: institution, admin
  permissions.push({ confidentialityLevel: 'restreint', role: 'institution' });
  permissions.push({ confidentialityLevel: 'restreint', role: 'admin' });

  // CONFIDENTIEL: admin seulement
  permissions.push({ confidentialityLevel: 'confidentiel', role: 'admin' });

  await RolePermission.bulkCreate(permissions);
  console.log(`${permissions.length} permissions de confidentialité GED créées`);
}

async function seedProcessus(): Promise<void> {
  const count = await ProcessusGenerateur.count();
  if (count > 0) return;

  await ProcessusGenerateur.bulkCreate([
    { code: 'PAIE', libelle: 'Paie', description: 'Bulletins de paie et documents salariaux', moduleSource: 'rh', isActif: true },
    { code: 'POINTAGE', libelle: 'Pointage', description: 'Fiches de pointage et relevés horaires', moduleSource: 'rh', isActif: true },
    { code: 'CONTRAT_ENSEIGNANT', libelle: 'Contrat enseignant', description: 'Contrats des enseignants', moduleSource: 'rh', isActif: true },
    { code: 'FACTURE', libelle: 'Facture fournisseur', description: 'Factures des fournisseurs', moduleSource: 'comptabilite', isActif: true },
    { code: 'BON_COMMANDE', libelle: 'Bon de commande', description: 'Bons de commande fournisseurs', moduleSource: 'achats', isActif: true },
    { code: 'RECEPTION', libelle: 'Bon de réception', description: 'Bons de réception marchandises', moduleSource: 'stock', isActif: true },
  ]);
  console.log(`${await ProcessusGenerateur.count()} Processus générateurs GED créés`);
}

export async function seedGed(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const folderCount = await Folder.count();
  if (folderCount === 0) {
    const admin = await db.sequelize.model('AutUtilisateur').findOne({ where: { identifiant: 'admin' } }) as { id: number } | null;
    const adminId = admin?.id ?? 1;
    await Folder.bulkCreate([
      { nom: "Documents administratifs", description: "Registres, procès-verbaux et documents officiels", createdBy: adminId },
      { nom: "Archives", description: "Archives des années précédentes", createdBy: adminId },
    ]);
    console.log("2 Folders créés");
  }

  await seedDomains();
  await seedDocumentTypes();
  await seedProcessus();
  await seedRolePermissions();
}

if (require.main === module) {
  seedGed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
