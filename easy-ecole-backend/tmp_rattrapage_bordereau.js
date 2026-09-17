// Rattrapage : rattache le bordereau de paiement comme document requis de la demande.
// Contexte : le wizard excluait le bordereau de ins_dossiers_demandes (bug fixé dans le code
// Angular) ; les demandes déjà soumises sont donc incomplètes et bloquent la saisie ESCA
// (400 « Tous les documents requis doivent être téléversés » — BordereauDossierService).
//
// Règle de couplage (identique au backend) : le bordereau est relié à la demande par
// utilisateurId → demande la plus récente de l'utilisateur ; les documents requis sont
// ceux de la session de cette demande (ins_dossiers_inscription.sessionId).
//
// Usage :
//   node tmp_rattrapage_bordereau.js            # dry-run : liste sans modifier
//   node tmp_rattrapage_bordereau.js --apply    # applique copies + inserts
//
// Idempotent : ne copie/s'attache que les (demandeId, dossierId) manquants.
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const APPLY = process.argv.includes('--apply');
const BORDEREAUX_DIR = path.resolve('public/inscription/bordereaux');
const DOSSIERS_DIR = path.resolve('public/inscription/dossiers');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // 1) Tous les bordereaux d'inscription actifs (ceux du wizard portent type='inscription').
  const [bordereaux] = await c.execute(
    `SELECT id, utilisateurId, fichier, type, statut, statutPaiement, createdAt
     FROM ins_bordereaux WHERE deletedAt IS NULL AND type = 'inscription' ORDER BY createdAt ASC`
  );
  console.log(`Bordereaux type 'inscription' actifs : ${bordereaux.length}\n`);

  const traites = new Map(); // key `${userId}|${demandeId}` pour ne pas dupliquer quand un user a plusieurs bordereaux
  let aFaire = 0;
  let dejaOk = 0;
  let sansDemande = 0;

  for (const b of bordereaux) {
    // 2) Demande la plus récente de l'utilisateur (même règle que BordereauDossierService).
    const [demandes] = await c.execute(
      `SELECT id, sessionId FROM ins_demandes_inscription
       WHERE utilisateurId = ? AND deletedAt IS NULL
       ORDER BY createdAt DESC LIMIT 1`, [b.utilisateurId]
    );
    if (!demandes.length) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}) : AUCUNE demande active -> ignoré`);
      sansDemande++;
      continue;
    }
    const demande = demandes[0];
    const key = `${b.utilisateurId}|${demande.id}`;
    if (traites.has(key)) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}) : demande #${demande.id} déjà traitée via un autre bordereau -> ignoré`);
      continue;
    }
    traites.set(key, true);

    // 3) Documents requis de la session de la demande.
    const [requis] = await c.execute(
      `SELECT id, titre FROM ins_dossiers_inscription WHERE sessionId = ? AND deletedAt IS NULL ORDER BY id`,
      [demande.sessionId]
    );
    if (!requis.length) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}, demande #${demande.id}) : session ${demande.sessionId} sans document requis -> ignoré`);
      continue;
    }

    // 4) Le document « bordereau » parmi les requis.
    const requisBordereau = requis.find((r) => /bordereau/i.test(r.titre));
    if (!requisBordereau) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}, demande #${demande.id}) : aucun requis « bordereau » dans la session -> ignoré`);
      continue;
    }

    // 5) Déjà téléversé sur la demande ?
    const [upl] = await c.execute(
      `SELECT dossierId FROM ins_dossiers_demandes WHERE demandeId = ? AND dossierId = ? AND deletedAt IS NULL`,
      [demande.id, requisBordereau.id]
    );
    if (upl.length) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}, demande #${demande.id}) : document requis #${requisBordereau.id} « ${requisBordereau.titre} » DÉJÀ rattaché -> rien à faire`);
      dejaOk++;
      continue;
    }

    // 6) Fichier source du bordereau.
    const srcPath = path.join(BORDEREAUX_DIR, b.fichier);
    if (!fs.existsSync(srcPath)) {
      console.log(`Bordereau #${b.id} (user ${b.utilisateurId}, demande #${demande.id}) : FICHIER INTROUVABLE ${srcPath} -> ignoré`);
      continue;
    }

    aFaire++;
    const ext = path.extname(b.fichier) || '.pdf';
    const nomFinal = crypto.randomBytes(16).toString('hex') + ext;
    const destPath = path.join(DOSSIERS_DIR, nomFinal);

    if (APPLY) {
      if (!fs.existsSync(DOSSIERS_DIR)) fs.mkdirSync(DOSSIERS_DIR, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      const now = new Date();
      await c.execute(
        `INSERT INTO ins_dossiers_demandes (nomFichier, demandeId, dossierId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [nomFinal, demande.id, requisBordereau.id, now, now]
      );
      console.log(`[APPLIQUÉ] Bordereau #${b.id} -> demande #${demande.id} : ${BORDEREAUX_DIR}\\${b.fichier} copié en ${DOSSIERS_DIR}\\${nomFinal}, ligne ins_dossiers_demandes (demande ${demande.id}, dossier ${requisBordereau.id}) créée`);
    } else {
      console.log(`[À FAIRE] Bordereau #${b.id} (user ${b.utilisateurId}, demande #${demande.id}) : copier ${BORDEREAUX_DIR}\\${b.fichier} vers ${DOSSIERS_DIR}\\${nomFinal} + insert (demande ${demande.id}, dossier ${requisBordereau.id} « ${requisBordereau.titre} »)`);
    }
  }

  await c.end();
  console.log(`\n=== BILAN ${APPLY ? '(APPLIQUÉ)' : '(DRY-RUN — relancer avec --apply pour exécuter)'} ===`);
  console.log(`  Bordereaux examinés        : ${bordereaux.length}`);
  console.log(`  Déjà en ordre              : ${dejaOk}`);
  console.log(`  Sans demande active        : ${sansDemande}`);
  console.log(`  Rattachements à effectuer  : ${aFaire}`);
})().catch((e) => { console.error(e); process.exit(1); });