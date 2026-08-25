/**
 * TEST E2E — Processus d'inscription complet
 * Scénario : bordereau authentifié → ESA-COMPTA saisit 200 000 F
 *            (inscription 50 000 + échéances 45 000/mois) → Comité valide
 */
const jwt = require('jsonwebtoken');
const { DatabaseConnection } = require('../helpers/DatabaseConnection');

const API = 'http://localhost:3000/api/v1';
let results: string[] = [];

function ok(label: string, detail: string = '') {
    results.push(`✅ ${label}${detail ? ' — ' + detail : ''}`);
    console.log(`✅ ${label}${detail ? ' — ' + detail : ''}`);
}
function fail(label: string, detail: string = '') {
    results.push(`❌ ${label}${detail ? ' — ' + detail : ''}`);
    console.log(`❌ ${label}${detail ? ' — ' + detail : ''}`);
}
function step(msg: string) {
    console.log(`\n────────── ${msg} ──────────`);
}

(async () => {
    require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq = db.sequelize;
    await seq.authenticate();
    console.log('DB:', seq.config.database, '@', seq.config.host + ':' + seq.config.port);

    // ────────────────────────────────────────────────
    // ÉTAPE A — Choix du candidat (sans dossier existant)
    // ────────────────────────────────────────────────
    step('A. SÉLECTION DU CANDIDAT');
    const [candidats]: any[] = await seq.query(`
        SELECT d.id AS demandeId, d.utilisateurId, d.sessionId, d.matricule,
               pc.parcoursId, p.niveauEtudeId, s.anneeAcademiqueId,
               u.nom, u.prenoms, u.email,
               a.periode, a.id AS apprenantId
        FROM ins_demandes_inscription d
        JOIN ins_parcours_choisis pc ON pc.demandeInscriptionId = d.id
             AND (pc.choixFinal = 1 OR pc.choixFinal = '1' OR pc.choixFinal = true)
        JOIN ins_parcours p ON p.id = pc.parcoursId
        JOIN ins_sessions s ON s.id = d.sessionId
        JOIN aut_utilisateurs u ON u.id = d.utilisateurId
        LEFT JOIN aut_apprenants a ON a.utilisateurId = d.utilisateurId
        LEFT JOIN ins_dossiers_etudiants de ON de.utilisateurId = d.utilisateurId AND de.deletedAt IS NULL
        WHERE d.deletedAt IS NULL AND de.id IS NULL
          AND EXISTS (SELECT 1 FROM ins_pre_inscriptions pi
                      WHERE pi.demandeInscriptionId = d.id AND pi.statut LIKE '%alide%')
        ORDER BY d.createdAt DESC LIMIT 1`);

    if (!candidats.length) {
        fail('Aucun candidat éligible trouvé (demande + préinscription validée + parcours final, sans dossier)');
        printAndExit();
        return;
    }
    const C = candidats[0];
    ok('Candidat sélectionné', `${C.nom} ${C.prenoms} (utilisateurId=${C.utilisateurId}, demande=${C.demandeId})`);

    // Période obligatoire pour la finalisation comité
    if (C.periode !== 'matin' && C.periode !== 'soir') {
        await seq.query(`UPDATE aut_apprenants SET periode = 'soir' WHERE id = :id`, { replacements: { id: C.apprenantId } });
        console.log("   ⚙️  Période renseignée à 'soir' (prérequis finalisation)");
    }

    // ────────────────────────────────────────────────
    // ÉTAPE B — Grille tarifaire : inscription 50 000 / scolarité 450 000 en 10×(45 000)
    // ────────────────────────────────────────────────
    step('B. GRILLE TARIFAIRE (50 000 inscription · 45 000 × 10)');
    await seq.query(`
        INSERT INTO ins_frais_parcours
            (parcoursId, niveauEtudeId, anneeAcademiqueId, montantInscription, montantScolarite,
             nbMensualites, fraisBibliotheque, fraisAssurance, fraisLogement, autresFrais, createdAt, updatedAt)
        VALUES (:parcoursId, :niveauEtudeId, :anneeId, 50000, 450000, 10, 0, 0, 0, NULL, NOW(), NOW())
        ON DUPLICATE KEY UPDATE montantInscription = 50000, montantScolarite = 450000, nbMensualites = 10`,
        { replacements: { parcoursId: C.parcoursId, niveauEtudeId: C.niveauEtudeId, anneeId: C.anneeAcademiqueId } });

    await seq.query(`
        INSERT INTO ins_frais_scolarites (sessionId, montant, modalite, actif, createdAt, updatedAt)
        VALUES (:sessionId, 450000, '10x', 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE montant = 450000, modalite = '10x', actif = 1`,
        { replacements: { sessionId: C.sessionId } }).catch(async () => {
            // colonnes différentes ? tenter version minimale
            await seq.query(`
                UPDATE ins_frais_scolarites SET montant = 450000, modalite = '10x', actif = 1
                WHERE sessionId = :sessionId AND deletedAt IS NULL`, { replacements: { sessionId: C.sessionId } });
        });
    ok('Grille posée', 'Inscription=50 000 · Scolarité=450 000 (10 mensualités de 45 000)');

    // ────────────────────────────────────────────────
    // ÉTAPE C — Bordereau "authentifié par le cabinet"
    // ────────────────────────────────────────────────
    step('C. BORDEREAU AUTHENTIFIÉ (simule validation cabinet)');
    const [existing]: any[] = await seq.query(`
        SELECT id FROM ins_bordereaux
        WHERE utilisateurId = :uid AND statut = 'valide' AND deletedAt IS NULL LIMIT 1`,
        { replacements: { uid: C.utilisateurId } });

    let bordereauId: number;
    if (existing.length) {
        bordereauId = existing[0].id;
        console.log(`   Réutilisation du bordereau existant #${bordereauId}`);
    } else {
        const [ins]: any[] = await seq.query(`
            INSERT INTO ins_bordereaux (utilisateurId, fichier, montant, modalite, referenceBancaire,
                 statut, dateSoumission, dateValidation, createdAt, updatedAt)
            VALUES (:uid, 'test-e2e-bordereau.pdf', NULL, '1x', NULL, 'valide', NOW(), NOW(), NOW(), NOW())`,
            { replacements: { uid: C.utilisateurId } });
        bordereauId = ins.insertId ?? ins[0]?.insertId ?? ins;
        ok('Bordereau créé & authentifié', `#${bordereauId} (statut='valide')`);
    }

    // Pipeline : la demande passe à transmis_comite après saisie ; on la met 'authentifie' avant l'appel
    await seq.query(`UPDATE ins_demandes_inscription SET statutPipeline = 'authentifie' WHERE id = :did`, { replacements: { did: C.demandeId } });

    // ────────────────────────────────────────────────
    // Tokens
    // ────────────────────────────────────────────────
    const sign = async (role: string) => {
        const [rows]: any[] = await seq.query(`SELECT id, identifiant, email, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role = :role ORDER BY id LIMIT 1`, { replacements: { role } });
        const u = rows[0];
        return jwt.sign({ id: u.id, identifiant: u.identifiant, email: u.email, role: u.role, tokenVersion: u.tokenVersion || 0, etablissementId: u.etablissementId || null }, process.env.JWT_SECRET, { expiresIn: '2h' });
    };
    const tokenEsacompta = await sign('esa_compta');

    // ────────────────────────────────────────────────
    // ÉTAPE D — SAISIE ESA-COMPTA : 200 000 FCFA
    // ────────────────────────────────────────────────
    step('D. SAISIE ESA-COMPTA — montantPaiement = 200 000 FCFA');
    const resSaisie = await fetch(`${API}/inscription/finance/bordereaux/${bordereauId}/saisir`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEsacompta}` },
        body: JSON.stringify({
            montantPaiement: 200000,
            referenceBancaire: 'E2E-REF-001',
            numeroBordereau: 'BQ-2026-TEST',
            moyenPaiement: 'virement',
            datePaiement: new Date().toISOString().split('T')[0],
            commentaire: 'Test E2E bout-en-bout'
        })
    });
    const saisie: any = await resSaisie.json().catch(() => ({}));
    if (!resSaisie.ok) {
        fail('Appel saisir', `HTTP ${resSaisie.status} — ${saisie.message || JSON.stringify(saisie).substring(0, 300)}`);
        printAndExit(); return;
    }
    ok('Saisie acceptée', `bordereau #${bordereauId} → statut '${saisie.data?.statut}'`);

    const lignes = saisie.lettrage?.lignes || [];
    console.log('\n   Lettrage FIFO retourné :');
    for (const l of lignes) {
        console.log(`   • [${l.type}] Échéance ${l.numeroEcheance} : dû ${l.montantDu} → imputé ${l.montantImpute} → ${l.statutApres} (reste ${l.resteApres})`);
    }
    console.log(`   Surplus portefeuille : ${saisie.lettrage?.surplus}`);

    // Vérifications FIFO attendues
    const li = lignes.find((l: any) => l.type === 'inscription');
    if (li && li.statutApres === 'paye' && li.montantImpute === 50000) ok('Frais d\'inscription 50 000 SOLDÉS');
    else fail('Frais d\'inscription', `attendu paye/50000, obtenu ${li ? li.statutApres + '/' + li.montantImpute : 'absent'}`);

    const scolaires = lignes.filter((l: any) => l.type === 'scolarite');
    const e1 = scolaires.find((l: any) => l.numeroEcheance === 1);
    const e2 = scolaires.find((l: any) => l.numeroEcheance === 2);
    const e3 = scolaires.find((l: any) => l.numeroEcheance === 3);
    if (e1?.statutApres === 'paye') ok('Échéance scolarité n°1 (45 000) SOLDÉE'); else fail('Échéance n°1', JSON.stringify(e1));
    if (e2?.statutApres === 'paye') ok('Échéance scolarité n°2 (45 000) SOLDÉE'); else fail('Échéance n°2', JSON.stringify(e2));
    if (e3?.statutApres === 'partiel' && e3.montantImpute === 15000) ok('Échéance scolarité n°3 PARTIELLE — 15 000 restants'); else fail('Échéance n°3 partielle', JSON.stringify(e3));

    // Montants en base
    const [echDb]: any[] = await seq.query(`
        SELECT e.numeroEcheance, e.type, e.montant, e.montantPaye, e.statut
        FROM ins_echeances e
        JOIN ins_dossiers_etudiants de ON de.id = e.dossierEtudiantId
        WHERE de.utilisateurId = :uid ORDER BY e.type DESC, e.numeroEcheance ASC`, { replacements: { uid: C.utilisateurId } });
    console.log('\n   Échéances en base :');
    for (const e of echDb) {
        console.log(`   • [${e.type}] n°${e.numeroEcheance} : ${Number(e.montant)} F | payé ${Number(e.montantPaye)} | ${e.statut}`);
    }
    const insDb = echDb.find((e: any) => e.type === 'inscription');
    if (insDb && Number(insDb.montant) === 50000) ok('Échéance inscription présente en base (50 000)'); else fail('Échéance inscription en base', JSON.stringify(insDb));

    const [paiement]: any[] = await seq.query(`
        SELECT numero, montant, matriculeInscription FROM ins_paiements_inscription
        WHERE utilisateurId = :uid ORDER BY id DESC LIMIT 1`, { replacements: { uid: C.utilisateurId } });
    if (paiement.length && Number(paiement[0].montant) === 200000) ok('PaiementInscription enregistré', `${paiement[0].numero} = 200 000 F`);
    else fail('PaiementInscription', JSON.stringify(paiement));

    // ────────────────────────────────────────────────
    // ÉTAPE E — VALIDATION FINALE PAR LE COMITÉ
    // ────────────────────────────────────────────────
    step('E. COMITÉ — décision VALIDE');
    const tokenComite = await sign('comite_orientation');
    const resComite = await fetch(`${API}/inscription/comite-validations/dossiers/${C.demandeId}/decider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenComite}` },
        body: JSON.stringify({ decision: 'valide' })
    });
    const comite: any = await resComite.json().catch(() => ({}));
    if (!resComite.ok) {
        fail('Décision comité', `HTTP ${resComite.status} — ${comite.message || ''}`);
        printAndExit(); return;
    }
    const matriculeFinal = comite.data?.matricule;
    ok('Comité a validé', `matricule définitif = ${matriculeFinal}`);

    // ────────────────────────────────────────────────
    // ÉTAPE F — Vérifications finales en base
    // ────────────────────────────────────────────────
    step('F. VÉRIFICATIONS FINALES EN BASE');
    const [dem]: any[] = await seq.query(`SELECT statutPipeline, matricule, dateValidation FROM ins_demandes_inscription WHERE id = :did`, { replacements: { did: C.demandeId } });
    if (dem[0]?.statutPipeline === 'valide') ok('Pipeline demande = valide'); else fail('Pipeline', dem[0]?.statutPipeline);
    if (dem[0]?.matricule === matriculeFinal) ok('Matricule propagé sur la demande', matriculeFinal);

    const [dossier]: any[] = await seq.query(`SELECT id, matricule, statut, carteGeneree FROM ins_dossiers_etudiants WHERE utilisateurId = :uid AND deletedAt IS NULL`, { replacements: { uid: C.utilisateurId } });
    if (dossier.length && dossier[0].matricule === matriculeFinal) ok('Dossier étudiant au matricule définitif', `#${dossier[0].id}`);
    else fail('Dossier étudiant', JSON.stringify(dossier));

    const [cursus]: any[] = await seq.query(`SELECT id, parcoursId, classeId FROM ins_cursus_apprenants WHERE demandeInscriptionId = :did AND deletedAt IS NULL`, { replacements: { did: C.demandeId } });
    if (cursus.length) ok('Cursus apprenant créé', `#${cursus[0].id}`); else fail('Cursus apprenant absent');

    const [parts]: any[] = await seq.query(`SELECT COUNT(*) AS n FROM ins_cours_participants cp
        JOIN ins_cursus_apprenants ca ON ca.id = cp.cursusApprenantId
        WHERE ca.demandeInscriptionId = :did AND cp.deletedAt IS NULL`, { replacements: { did: C.demandeId } });
    if (parts[0].n > 0) ok('Cours affectés à l\'étudiant', `${parts[0].n} cours`); else fail('Aucun cours participant');

    // ────────────────────────────────────────────────
    printAndExit();
})();

function printAndExit() {
    console.log('\n══════════════ RÉCAPITULATIF DU TEST ══════════════');
    const passed = results.filter(r => r.startsWith('✅')).length;
    const failed = results.filter(r => r.startsWith('❌')).length;
    console.log(`${passed} succès / ${failed} échecs`);
    process.exit(failed > 0 ? 1 : 0);
}

export {}
