/**
 * Seed Bulletins — Prépare les données pour générer des bulletins de notes
 *
 * Ce script :
 * 1. Crée les types d'évaluation avec les bonnes catégories (CC, Devoir, Examen)
 * 2. Crée des sessions d'évaluation pour chaque cours
 * 3. Ajoute des notes individuelles pour chaque étudiant
 *
 * Usage : npx babel-node src/core/scripts/seed-bulletins.ts
 */

async function seedBulletins() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/auth/models/_associations');
    require('../../modules/inscription/models/_associations');
    require('../../modules/bulletins/models/_associations');

    const M = (name: string) => sequelize.model(name);

    const InsTNE = M('InsTypeNoteEvaluation');
    const InsLNE = M('InsListeNoteEvaluation');
    const InsNE = M('InsNoteEvaluation');
    const InsCourP = M('InsCoursParticipant');
    const InsCours = M('InsCours');
    const InsAn = M('InsAnneeAcademique');
    const InsClasse = M('InsClasse');
    const InsBulletin = M('Bulletin');
    const InsLigneBulletin = M('LigneBulletin');

    const an = await InsAn.findOne({ where: { libelle: '2025-2026' } });
    if (!an) throw new Error('Année académique 2025-2026 introuvable. Lancer le seed principal d\'abord.');

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED BULLETINS');
    console.log('═══════════════════════════════════════════\n');

    // ── 1. Créer/Mettre à jour les types d'évaluation ──
    console.log('── Types d\'évaluation ──');

    const [tneCC] = await InsTNE.findOrCreate({
        where: { libelle: 'Contrôle Continu' },
        defaults: { libelle: 'Contrôle Continu', description: 'Évaluations continues en cours de semestre', categorie: 'controle_continu', poids: 20 }
    });
    if (tneCC.categorie !== 'controle_continu') { tneCC.categorie = 'controle_continu'; await tneCC.save(); }
    console.log('  ✓ Contrôle Continu');

    const [tneDevoir] = await InsTNE.findOrCreate({
        where: { libelle: 'Devoir' },
        defaults: { libelle: 'Devoir', description: 'Devoirs surveillés', categorie: 'devoir', poids: 30 }
    });
    if (tneDevoir.categorie !== 'devoir') { tneDevoir.categorie = 'devoir'; await tneDevoir.save(); }
    console.log('  ✓ Devoir');

    const [tneExamen] = await InsTNE.findOrCreate({
        where: { libelle: 'Examen Final' },
        defaults: { libelle: 'Examen Final', description: 'Examens de fin de semestre', categorie: 'examen', poids: 50 }
    });
    if (tneExamen.categorie !== 'examen') { tneExamen.categorie = 'examen'; await tneExamen.save(); }
    console.log('  ✓ Examen Final');

    const [tneDS] = await InsTNE.findOrCreate({
        where: { libelle: 'Devoir Surveillé N°1' },
        defaults: { libelle: 'Devoir Surveillé N°1', description: 'Premier devoir surveillé du semestre', categorie: 'devoir', poids: 15 }
    });
    if (tneDS.categorie !== 'devoir') { tneDS.categorie = 'devoir'; await tneDS.save(); }
    console.log('  ✓ Devoir Surveillé N°1');

    const [tneCC2] = await InsTNE.findOrCreate({
        where: { libelle: 'Contrôle Continu N°2' },
        defaults: { libelle: 'Contrôle Continu N°2', description: 'Deuxième contrôle continu', categorie: 'controle_continu', poids: 15 }
    });
    if (tneCC2.categorie !== 'controle_continu') { tneCC2.categorie = 'controle_continu'; await tneCC2.save(); }
    console.log('  ✓ Contrôle Continu N°2');

    // ── 2. Nettoyer les anciennes listes/notes d'évaluation pour les recréer propres ──
    console.log('\n── Nettoyage des anciennes données ──');

    const anciennesNotes = await InsNE.findAll({ include: [{ association: InsNE.associations.listeNoteEvaluation }] });
    const lignesBulletin = await InsLigneBulletin.findAll();
    if (lignesBulletin.length > 0) {
        console.log('  ⚠ Des bulletins existent déjà. Suppression des lignes et bulletins...');
        await InsLigneBulletin.destroy({ where: {} });
        await InsBulletin.destroy({ where: {} });
        console.log('  ✓ Anciens bulletins supprimés');
    }

    for (const note of anciennesNotes) {
        const lne = (note as any).listeNoteEvaluation;
        if (lne) {
            await note.destroy();
        }
    }
    const lnes = await InsLNE.findAll();
    for (const lne of lnes) await lne.destroy();
    console.log('  ✓ Anciennes évaluations et notes supprimées');

    // ── 3. Créer les évaluations et notes ──
    console.log('\n── Évaluations et notes ──');

    const coursList = await InsCours.findAll({ include: [{ association: InsCours.associations.classe }] });
    const semestreMapping: Record<number, string> = {};

    for (const cours of coursList) {
        const sem = (cours as any).semestre;
        coursList.forEach((c: any, i: number) => {
            if (c.id === cours.id) semestreMapping[Number(cours.id)] = sem || (i < 8 ? 'semestre_1' : 'semestre_2');
        });
    }

    let totalNotes = 0;

    for (const cours of coursList) {
        const participants = await InsCourP.findAll({ where: { coursId: cours.id } });
        if (participants.length === 0) continue;

        const sem = (cours as any).semestre || 'semestre_1';
        const isSemestre1 = sem === 'semestre_1';

        // CC1 - Contrôle Continu (poids 20)
        const lneCC1 = await InsLNE.create({
            date: new Date('2025-11-15'),
            heureDebut: '08:00',
            heureFin: '10:00',
            commentaire: 'Contrôle continuation - mi semestre',
            poidsTypeNoteEvaluation: 20,
            typeNoteEvaluationId: tneCC.id,
            coursId: cours.id,
            anneeAcademiqueId: an.id
        });
        for (const p of participants) {
            const note = +(12 + Math.random() * 7).toFixed(1);
            if (note > 20) continue;
            await InsNE.create({ note, listeNoteEvaluationId: lneCC1.id, coursParticipantId: p.id });
            totalNotes++;
        }

        // DS1 - Devoir Surveillé (poids 15)
        const lneDS1 = await InsLNE.create({
            date: new Date('2025-12-10'),
            heureDebut: '08:00',
            heureFin: '12:00',
            commentaire: 'Devoir surveillé N°1',
            poidsTypeNoteEvaluation: 15,
            typeNoteEvaluationId: tneDS.id,
            coursId: cours.id,
            anneeAcademiqueId: an.id
        });
        for (const p of participants) {
            const note = +(10 + Math.random() * 8).toFixed(1);
            if (note > 20) continue;
            await InsNE.create({ note, listeNoteEvaluationId: lneDS1.id, coursParticipantId: p.id });
            totalNotes++;
        }

        // CC2 - Contrôle Continu N°2 (poids 15) - semestre 1 only
        if (isSemestre1) {
            const lneCC2 = await InsLNE.create({
                date: new Date('2026-01-15'),
                heureDebut: '08:00',
                heureFin: '10:00',
                commentaire: 'Contrôle continuation N°2',
                poidsTypeNoteEvaluation: 15,
                typeNoteEvaluationId: tneCC2.id,
                coursId: cours.id,
                anneeAcademiqueId: an.id
            });
            for (const p of participants) {
                const note = +(11 + Math.random() * 8).toFixed(1);
                if (note > 20) continue;
                await InsNE.create({ note, listeNoteEvaluationId: lneCC2.id, coursParticipantId: p.id });
                totalNotes++;
            }
        }

        // Examen Final (poids 50)
        const lneExamen = await InsLNE.create({
            date: isSemestre1 ? new Date('2026-02-01') : new Date('2026-06-15'),
            heureDebut: '08:00',
            heureFin: '12:00',
            commentaire: 'Examen final',
            poidsTypeNoteEvaluation: 50,
            typeNoteEvaluationId: tneExamen.id,
            coursId: cours.id,
            anneeAcademiqueId: an.id
        });
        for (const p of participants) {
            const note = +(8 + Math.random() * 10).toFixed(1);
            if (note > 20) continue;
            await InsNE.create({ note, listeNoteEvaluationId: lneExamen.id, coursParticipantId: p.id });
            totalNotes++;
        }
    }

    console.log(`  ✓ ${totalNotes} notes créées pour ${coursList.length} cours`);

    // ── 4. Résumé ──
    const classes = await InsClasse.findAll();
    const totalParticipants = await InsCourP.count();
    const totalListes = await InsLNE.count();

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED BULLETINS COMPLETED');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 RÉSUMÉ :');
    console.log('───────────────────────────────────────────');
    console.log(`  🏫 ${classes.length} classes`);
    console.log(`  📚 ${coursList.length} cours`);
    console.log(`  👨‍🎓 ${totalParticipants} inscriptions aux cours`);
    console.log(`  📝 ${totalListes} sessions d'évaluation`);
    console.log(`  📊 ${totalNotes} notes individuelles`);
    console.log('───────────────────────────────────────────');
    console.log('\n🚀 Prochaine étape :');
    console.log('   1. Connectez-vous en tant qu\'institution (institution1 / password123)');
    console.log('   2. Allez dans Bulletins > Générer');
    console.log('   3. Sélectionnez : Année 2025-2026, Semestre 1, une classe');
    console.log('   4. Cliquez sur Générer');
    console.log('───────────────────────────────────────────\n');
}

seedBulletins().catch((err: any) => {
    console.error('Seed bulletins failed:', err);
    process.exit(1);
});

