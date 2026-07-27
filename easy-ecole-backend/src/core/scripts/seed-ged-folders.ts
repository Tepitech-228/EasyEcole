import { Op } from "sequelize"
import { DatabaseConnection } from "../helpers/DatabaseConnection"
import Domain from "../../modules/ged/models/Domain"
import Folder from "../../modules/ged/models/Folder"
import { Utilisateur } from "../../modules/auth/models/Utilisateur"

async function main() {
  const db = DatabaseConnection.getInstance()
  await db.init()

  const existingCount = await Folder.count()
  if (existingCount > 0) {
    console.log(`[seed-ged-folders] ${existingCount} dossiers existants — aucun ajout`)
    return
  }

  const admin = await Utilisateur.findOne({ where: { identifiant: 'admin' } })
  const adminId = admin?.id ?? 1

  const domains = await Domain.findAll()
  const byCode = Object.fromEntries(domains.map(d => [d.code, d.id]))

  const hierarchy: { nom: string; description: string; domainId: number; children?: { nom: string; description: string }[] }[] = [
    // ── SCOLARITÉ ──
    {
      nom: "Inscriptions", description: "Dossiers et documents liés aux inscriptions", domainId: byCode['SCOL'],
      children: [
        { nom: "Dossiers d'inscription", description: "Dossiers de demande d'inscription" },
        { nom: "Bordereaux de scolarité", description: "Bordereaux de frais de scolarité" },
        { nom: "Autorisations provisoires", description: "Autorisations d'inscription sous condition" },
      ]
    },
    {
      nom: "Scolarité", description: "Documents académiques et de scolarité", domainId: byCode['SCOL'],
      children: [
        { nom: "Bulletins et relevés de notes", description: "Bulletins de notes et relevés académiques" },
        { nom: "Diplômes et attestations", description: "Diplômes et attestations de réussite" },
        { nom: "Certificats de scolarité", description: "Certificats de scolarité" },
        { nom: "Conventions de stage", description: "Conventions de stage" },
        { nom: "Contrats de formation", description: "Contrats de formation" },
      ]
    },
    {
      nom: "Examens et délibérations", description: "Procès-verbaux et délibérations", domainId: byCode['SCOL'],
      children: [
        { nom: "PV de jury", description: "Procès-verbaux de jury d'examen" },
        { nom: "PV de délibération", description: "Procès-verbaux de délibération" },
      ]
    },
    {
      nom: "Cours et ressources", description: "Ressources pédagogiques", domainId: byCode['SCOL'],
      children: [
        { nom: "Ressources pédagogiques", description: "Fichiers de cours, polycopiés" },
        { nom: "Chapitres de cours", description: "Images et documents des chapitres" },
      ]
    },

    // ── FINANCES ──
    {
      nom: "Bordereaux de paiement", description: "Bordereaux de paiement et reçus", domainId: byCode['FIN'],
    },
    {
      nom: "Factures", description: "Factures émises et reçues", domainId: byCode['FIN'],
    },
    {
      nom: "Quitus", description: "Quitus financiers", domainId: byCode['FIN'],
    },

    // ── RESSOURCES HUMAINES ──
    {
      nom: "Personnel", description: "Documents du personnel", domainId: byCode['RH'],
      children: [
        { nom: "Contrats de travail", description: "Contrats de travail du personnel" },
        { nom: "Bulletins de paie", description: "Bulletins de paie mensuels" },
        { nom: "Attestations de travail", description: "Attestations de travail" },
      ]
    },
    {
      nom: "Recrutement", description: "Documents de recrutement", domainId: byCode['RH'],
      children: [
        { nom: "CV et candidatures", description: "CV et lettres de motivation reçus" },
        { nom: "Offres d'emploi", description: "Offres d'emploi publiées" },
      ]
    },

    // ── RECHERCHE ──
    {
      nom: "Publications", description: "Publications scientifiques", domainId: byCode['REC'],
    },
    {
      nom: "Thèses", description: "Thèses et mémoires de recherche", domainId: byCode['REC'],
    },
    {
      nom: "Rapports de recherche", description: "Rapports de recherche", domainId: byCode['REC'],
    },

    // ── GOUVERNANCE ──
    {
      nom: "Délibérations", description: "Délibérations des instances", domainId: byCode['GOUV'],
    },
    {
      nom: "Procès-verbaux", description: "Procès-verbaux de réunions", domainId: byCode['GOUV'],
    },
    {
      nom: "Règlements intérieurs", description: "Règlements intérieurs de l'établissement", domainId: byCode['GOUV'],
    },

    // ── PATRIMOINE ──
    {
      nom: "Inventaires", description: "Inventaires du patrimoine", domainId: byCode['PAT'],
    },
    {
      nom: "Bons de commande et contrats", description: "Achats et fournisseurs", domainId: byCode['PAT'],
      children: [
        { nom: "Bons de commande", description: "Bons de commande fournisseurs" },
        { nom: "Contrats fournisseurs", description: "Contrats avec les fournisseurs" },
      ]
    },

    // ── DOCUMENTS EXTERNES ──
    {
      nom: "Conventions externes", description: "Conventions avec des partenaires extérieurs", domainId: byCode['EXT'],
    },
    {
      nom: "Courriers", description: "Courriers reçus et envoyés", domainId: byCode['EXT'],
    },
    {
      nom: "Documents entrants", description: "Documents en provenance de l'extérieur", domainId: byCode['EXT'],
    },
  ]

  const created: any[] = []

  for (const item of hierarchy) {
    const parent = await Folder.create({
      nom: item.nom,
      description: item.description,
      domainId: item.domainId,
      createdBy: adminId,
    })
    created.push(parent)

    if (item.children) {
      for (const child of item.children) {
        const childFolder = await Folder.create({
          nom: child.nom,
          description: child.description,
          domainId: item.domainId,
          parentId: parent.id,
          createdBy: adminId,
        })
        created.push(childFolder)
      }
    }
  }

  console.log(`[seed-ged-folders] ✓ ${created.length} dossiers GED créés`)

  // Ajouter les 2 dossiers génériques existants si non présents
  const genCount = await Folder.count({ where: { domainId: { [Op.is]: null } as any } })
  if (genCount === 0) {
    await Folder.bulkCreate([
      { nom: "Documents administratifs", description: "Registres, procès-verbaux et documents officiels", createdBy: adminId },
      { nom: "Archives", description: "Archives des années précédentes", createdBy: adminId },
    ])
    console.log('[seed-ged-folders] ✓ 2 dossiers génériques créés')
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
