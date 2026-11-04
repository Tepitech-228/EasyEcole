/**
 * Générateur de guides d'utilisation par profil.
 *
 * Usage :
 *   node scripts/guide/generer-guides.cjs                 # tous les profils, Markdown
 *   node scripts/guide/generer-guides.cjs --pdf           # + PDF par profil
 *   node scripts/guide/generer-guides.cjs --profil=audit  # un seul profil
 *   node scripts/guide/generer-guides.cjs --profil audit --pdf
 *
 * Sources : captures valides de docs/guide/images-nouveau/ en priorité,
 *           avec repli sur docs/guide/images/<dossier>/<fichier>.png
 * Sorties : docs/guide/profils/GUIDE-<cle>.md
 *           docs/guide/pdf/GUIDE-<cle>.pdf   (avec --pdf)
 *           docs/guide/README.md             (index)
 */
const fs = require('fs');
const path = require('path');
const { PROFILS } = require('./profils.cjs');
const { ECRANS } = require('./ecrans.cjs');

const RACINE = path.resolve(__dirname, '..', '..', '..');
const IMAGES = path.join(RACINE, 'docs', 'guide', 'images');
const IMAGES_NOUVEAU = path.join(RACINE, 'docs', 'guide', 'images-nouveau');
const RAPPORT_CAPTURE = path.join(__dirname, 'recapture-report.json');
const SORTIE_MD = path.join(RACINE, 'docs', 'guide', 'profils');
const SORTIE_PDF = path.join(RACINE, 'docs', 'guide', 'pdf');
const INDEX = path.join(RACINE, 'docs', 'guide', 'README.md');
const CAPTURES_VALIDES = fs.existsSync(RAPPORT_CAPTURE)
  ? new Set(
    JSON.parse(fs.readFileSync(RAPPORT_CAPTURE, 'utf8')).entries
      .filter(capture => capture.ok && !(capture.warnings || []).length)
      .map(capture => `${capture.dossier}/${capture.fichier}`)
  )
  : new Set();

const args = process.argv.slice(2);
const avecPdf = args.includes('--pdf');
let filtreProfil = null;
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--profil=')) filtreProfil = args[i].split('=')[1];
  else if (args[i] === '--profil' && args[i + 1]) filtreProfil = args[++i];
}

function slugify(value) {
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function humaniser(value) {
  const texte = String(value).replace(/^\d+[_-]/, '').replace(/[-_]+/g, ' ').trim();
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function sansPrefixe(fichier) {
  return path.basename(fichier, path.extname(fichier)).replace(/^\d+[_-]/, '');
}

const FAMILLES = [
  { motif: /bordereau|paiement|echeance|finance|comptab|caisse|immobil|inventaire|cession|rebut|assurance|maintenance|site|categorie|affectation|sortie|banque|releve|rapprochement|budget|facture|fournisseur|commande|achat|reception|besoin|prix|avenant|ami$|prestation|planification|encaisse|situation|tarif|recouvrement/, module: 'financier' },
  { motif: /note|bulletin|moyenne|deliberation|examen|rattrapage|absence|conseil|sanction|evaluation|equivalence|dispense|emploi|presence|cahier|unite|salle|classe|parcours|session|inscription|scolarite|diplome|registre|reorientation|decision|notation|jury|etudiant|apprenant|preinscription|orientation/, module: 'pédagogique' },
  { motif: /employe|paie|conge|contrat|prestataire|salaire|formation|candidature|recrutement|horaire|shift|personnel|rh$/, module: 'ressources humaines' },
  { motif: /document|ged|archive|conservation|signature|cachet|qr|modele|workflow|transfert|cycle|correction|generer/, module: 'documentaire' },
  { motif: /cours|quiz|progression|certificat|devoir|elearning|e-learning/, module: 'e-learning' },
  { motif: /annonce|discussion|notification|suggestion|reclamation|vie-estudiantine|communication|message/, module: 'communication' },
  { motif: /audit|journal|sauvegarde|systeme|configuration|utilisateur|profil|notification|securite|permission/, module: 'administration et sécurité' },
];

function fallbackEcran(slug) {
  const famille = FAMILLES.find(item => item.motif.test(slug));
  const titre = humaniser(slug);
  const module = famille ? famille.module : 'gestion';
  return {
    titre,
    description: `Écran « ${titre} » du module ${module}. Il permet de consulter et de traiter les données de ce module selon les droits du profil connecté.`,
    workflow: [
      'Consulter la liste et utiliser les filtres',
      'Ouvrir un élément pour vérifier son détail',
      'Appliquer l’action autorisée par votre profil',
    ],
    generique: true,
  };
}

function fichiersDossier(dossier) {
  const fichiers = new Set();
  for (const racine of [IMAGES, IMAGES_NOUVEAU]) {
    const chemin = path.join(racine, dossier);
    if (!fs.existsSync(chemin)) continue;
    fs.readdirSync(chemin)
      .filter(fichier => /\.png$/i.test(fichier))
      .forEach(fichier => fichiers.add(fichier));
  }
  return [...fichiers].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
}

function collecterEcrans(profil) {
  const sources = profil.sources || [{ dossier: profil.dossier }];
  const ecrans = [];
  const vus = new Map();

  for (const source of sources) {
    const fichiers = source.fichiers && source.fichiers.length
      ? [...source.fichiers]
      : fichiersDossier(source.dossier);
    for (const fichier of fichiers) {
      const cheminOriginal = path.join(IMAGES, source.dossier, fichier);
      const cheminNouveau = path.join(IMAGES_NOUVEAU, source.dossier, fichier);
      const utiliserNouveau = CAPTURES_VALIDES.has(`${source.dossier}/${fichier}`)
        && fs.existsSync(cheminNouveau)
        && fs.statSync(cheminNouveau).size > 5000;
      const chemin = utiliserNouveau ? cheminNouveau : cheminOriginal;
      if (!fs.existsSync(chemin)) {
        console.warn(`  ! image manquante : ${source.dossier}/${fichier}`);
        continue;
      }
      const slug = sansPrefixe(fichier);
      const occurrence = (vus.get(slug) || 0) + 1;
      vus.set(slug, occurrence);
      const base = ECRANS[slug] || fallbackEcran(slug);
      ecrans.push({
        dossier: source.dossier,
        fichier,
        slug,
        occurrence,
        titre: occurrence === 1 ? base.titre : `${base.titre} — vue ${occurrence}`,
        description: base.description,
        workflow: base.workflow,
        generique: Boolean(base.generique),
        dossierImages: utiliserNouveau ? 'images-nouveau' : 'images',
        chemin,
      });
    }
  }
  return ecrans;
}

function lienImage(ecran) {
  return `../${ecran.dossierImages}/${ecran.dossier}/${ecran.fichier}`.replace(/ /g, '%20');
}

function construireMarkdown(profil, ecrans) {
  const lignes = [];
  lignes.push(`# Guide d'utilisation — ${profil.titre}`);
  lignes.push('');
  lignes.push(`> ${profil.resume}`);
  lignes.push('');
  lignes.push(`**Profil :** ${profil.titre}  `);
  lignes.push(`**Nombre d'écrans :** ${ecrans.length}  `);
  lignes.push(`**Généré le :** ${new Date().toLocaleDateString('fr-FR')}`);
  lignes.push('');
  lignes.push("Ce guide présente les écrans du profil dans l'ordre d'utilisation conseillé. Chaque section contient une capture, l'objectif de l'écran et les actions principales.");
  lignes.push('');
  lignes.push('## Sommaire');
  lignes.push('');
  ecrans.forEach((ecran, index) => {
    const ancre = slugify(`${index + 1}-${ecran.titre}`);
    lignes.push(`${index + 1}. [${ecran.titre}](#${ancre})`);
  });
  lignes.push('');

  ecrans.forEach((ecran, index) => {
    lignes.push(`## ${index + 1}. ${ecran.titre}`);
    lignes.push('');
    lignes.push(`![${ecran.titre}](${lienImage(ecran)})`);
    lignes.push('');
    lignes.push(`**Objectif :** ${ecran.description}`);
    lignes.push('');
    lignes.push('**Actions principales :**');
    lignes.push('');
    (ecran.workflow || []).forEach((etape, i) => lignes.push(`${i + 1}. ${etape}`));
    lignes.push('');
    if (ecran.generique) {
      lignes.push('> Description générique : compléter cette fiche dans `scripts/guide/ecrans.cjs` pour l’adapter au métier.');
      lignes.push('');
    }
    lignes.push('---');
    lignes.push('');
  });

  lignes.push(`*Guide généré par \`scripts/guide/generer-guides.cjs\`. Les captures valides les plus récentes sont utilisées, avec repli sur les captures historiques.*`);
  lignes.push('');
  return lignes.join('\n');
}

async function construirePdf(profil, ecrans, cheminSortie) {
  let PDFDocument;
  try {
    PDFDocument = require('pdfkit');
  } catch (error) {
    throw new Error("Le module pdfkit est requis pour --pdf. Installez-le dans easy-ecole-backend.");
  }
  const BLEU = '#1F3C75';
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
  });
  const flux = fs.createWriteStream(cheminSortie);
  doc.pipe(flux);
  const largeur = doc.page.width - 100;

  doc.moveDown(4);
  doc.fontSize(32).fillColor(BLEU).font('Helvetica-Bold').text("Guide d'utilisation", { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(36).text(profil.titre, { align: 'center' });
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor('#555555').font('Helvetica')
    .text(profil.resume, { align: 'center' });
  doc.moveDown(0.8);
  doc.fontSize(10).fillColor('#888888')
    .text(`${ecrans.length} écrans — généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

  doc.addPage();
  doc.fontSize(20).fillColor(BLEU).font('Helvetica-Bold').text('Sommaire');
  doc.moveDown(0.6);
  ecrans.forEach((ecran, index) => {
    doc.fontSize(10).fillColor('#222222').font('Helvetica')
      .text(`${index + 1}. ${ecran.titre}`, { lineGap: 2 });
  });

  for (let index = 0; index < ecrans.length; index++) {
    const ecran = ecrans[index];
    doc.addPage();
    doc.fontSize(19).fillColor(BLEU).font('Helvetica-Bold').text(`${index + 1}. ${ecran.titre}`);
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#666666').font('Helvetica').text(`Profil : ${profil.titre}`);
    doc.moveDown(0.35);
    doc.fontSize(10).fillColor('#222222').text(ecran.description, { align: 'justify' });
    doc.moveDown(0.35);
    doc.fontSize(11).fillColor(BLEU).font('Helvetica-Bold').text('Actions principales');
    doc.fontSize(10).fillColor('#222222').font('Helvetica');
    (ecran.workflow || []).forEach((etape, i) => doc.text(`${i + 1}) ${etape}`, { indent: 14 }));
    doc.moveDown(0.35);
    const y = doc.y;
    const maxH = doc.page.height - y - 45;
    try {
      doc.image(ecran.chemin, 50, y, { fit: [largeur, maxH], align: 'center' });
    } catch (error) {
      doc.fontSize(10).fillColor('#aa0000').text("Capture indisponible pour cet écran.");
    }
  }

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    // La marge basse est neutralisée pour que le pied de page ne déclenche
    // pas l'ajout automatique d'une page par pdfkit.
    doc.page.margins.bottom = 0;
    doc.fontSize(8).fillColor('#999999')
      .text(`Guide ${profil.titre} — page ${i + 1}/${pages.count}`, 50, doc.page.height - 32, {
        align: 'center',
        width: largeur,
        lineBreak: false,
      });
  }

  doc.end();
  await new Promise((resolve, reject) => {
    flux.on('finish', resolve);
    flux.on('error', reject);
  });
}

function ecrireIndex(resultats) {
  const lignes = [];
  lignes.push('# Guides d\'utilisation EasyEcole');
  lignes.push('');
  lignes.push('Guides générés automatiquement à partir des captures d\'écran de `docs/guide/images/`.');
  lignes.push('');
  lignes.push('```bash');
  lignes.push('cd easy-ecole-backend');
  lignes.push('node scripts/guide/generer-guides.cjs --pdf');
  lignes.push('```');
  lignes.push('');
  lignes.push('| Ordre | Profil | Guide Markdown | PDF | Écrans |');
  lignes.push('|-------|--------|----------------|-----|--------|');
  resultats.forEach((resultat, index) => {
    const cheminMd = path.join(SORTIE_MD, `GUIDE-${resultat.profil.cle}.md`);
    const cheminPdf = path.join(SORTIE_PDF, `GUIDE-${resultat.profil.cle}.pdf`);
    const md = fs.existsSync(cheminMd) ? `[Ouvrir](profils/GUIDE-${resultat.profil.cle}.md)` : '—';
    const pdf = fs.existsSync(cheminPdf) ? `[Ouvrir](pdf/GUIDE-${resultat.profil.cle}.pdf)` : '—';
    lignes.push(`| ${index + 1} | ${resultat.profil.titre} | ${md} | ${pdf} | ${resultat.ecrans.length} |`);
  });
  lignes.push('');
  lignes.push('> Les guides sont régénérés par le script ; ne pas modifier les fichiers générés à la main.');
  lignes.push('');
  fs.writeFileSync(INDEX, lignes.join('\n'), 'utf8');
}

(async () => {
  fs.mkdirSync(SORTIE_MD, { recursive: true });
  if (avecPdf) fs.mkdirSync(SORTIE_PDF, { recursive: true });

  const profils = filtreProfil
    ? PROFILS.filter(profil => profil.cle === filtreProfil)
    : PROFILS;
  if (!profils.length) {
    console.error(`Profil inconnu : ${filtreProfil}`);
    console.error(`Profils disponibles : ${PROFILS.map(profil => profil.cle).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const resultats = [];
  const generiques = new Set();

  for (const profil of profils) {
    const ecrans = collecterEcrans(profil);
    ecrans.filter(ecran => ecran.generique).forEach(ecran => generiques.add(ecran.slug));

    const fichierMd = path.join(SORTIE_MD, `GUIDE-${profil.cle}.md`);
    fs.writeFileSync(fichierMd, construireMarkdown(profil, ecrans), 'utf8');

    let fichierPdf = null;
    if (avecPdf) {
      fichierPdf = path.join(SORTIE_PDF, `GUIDE-${profil.cle}.pdf`);
      await construirePdf(profil, ecrans, fichierPdf);
    }

    console.log(`${profil.titre} : ${ecrans.length} écran(s)${avecPdf ? ' + PDF' : ''}`);
    resultats.push({ profil, ecrans, md: fichierMd, pdf: fichierPdf });
  }

  if (!filtreProfil) ecrireIndex(resultats);

  if (generiques.size) {
    console.log(`\n${generiques.size} écran(s) sans fiche dédiée (description générique) :`);
    console.log(`  ${[...generiques].sort().join(', ')}`);
  }
  console.log(`\nTerminé. Guides Markdown : ${SORTIE_MD}`);
  if (avecPdf) console.log(`PDF : ${SORTIE_PDF}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
