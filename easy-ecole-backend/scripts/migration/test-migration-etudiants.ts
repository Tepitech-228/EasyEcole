/**
 * TEST DE MIGRATION Ã‰TUDIANTS â€” 10 par parcours (LICENCE, MASTER, MBA)
 * ====================================================================
 * Script simple qui gÃ©nÃ¨re 30 Ã©tudiants de test et les insÃ¨re dans la base.
 * Utilise des requÃªtes SQL directes sans marqueurs positionnels.
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { Sequelize } from 'sequelize';
import { DatabaseConnection } from '../../src/core/helpers/DatabaseConnection';

const PARCOURS = ['LICENCE', 'MASTER', 'MBA'] as const;
const NB_ETUDIANTS_PAR_PARCOURS = 10;

const NOMS = ['DIALLO', 'KOUASSI', 'MENSAH', 'ADJEI', 'KOUAME', 'N\'GUESSAN', 'BROU', 'KOFFI', 'YAO', 'KOUAKOU', 'SANOGO', 'TRAORE', 'OUATTARA', 'KONE', 'BAMBA'];
const PRENOMS = ['Aminata', 'Kwame', 'Fatou', 'Jean', 'Marie', 'Aya', 'Kofi', 'Awa', 'Yao', 'Nadia', 'Issouf', 'Aminata', 'Koffi', 'Aya', 'Moussa'];
const NATIONALITES = ['Ivoirienne', 'Togolaise', 'BÃ©ninoise', 'GhanÃ©enne', 'BurkinabÃ¨'];

function generateEtudiants() {
    const etudiants: any[] = [];
    const cursus: any[] = [];
    const notes: any[] = [];
    let idCounter = 1;

    for (const parcours of PARCOURS) {
        for (let i = 0; i < NB_ETUDIANTS_PAR_PARCOURS; i++) {
            const identifiant = `TEST-${parcours.substring(0, 3)}-${String(idCounter).padStart(3, '0')}`;
            const nom = NOMS[Math.floor(Math.random() * NOMS.length)];
            const prenoms = PRENOMS[Math.floor(Math.random() * PRENOMS.length)] + idCounter;
            const nationalite = NATIONALITES[Math.floor(Math.random() * NATIONALITES.length)];
            const anneeBac = 2015 + Math.floor(Math.random() * 8);
            const jour = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
            const mois = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
            const anneeNaissance = anneeBac - 18;

            etudiants.push({
                identifiant,
                nom,
                prenoms,
                email: `${prenoms.toLowerCase().replace(/[^a-z]/g, '')}.${nom.toLowerCase().replace(/[^a-z]/g, '')}${idCounter}@test.local`,
                contact: `+228${String(90000000 + Math.floor(Math.random() * 9999999))}`,
                dateNaissance: `${jour}/${mois}/${anneeNaissance}`,
                lieuNaissance: 'LomÃ©',
                sexe: Math.random() > 0.5 ? 'M' : 'F',
                nationalite,
                numeroPiece: `CNI${String(10000000 + Math.floor(Math.random() * 89999999))}`,
                typePiece: 'CNI',
                anneeBac,
                serieBac: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
                anneePremiereInscription: anneeBac
            });

            cursus.push({
                identifiantEtudiant: identifiant,
                parcours: `${parcours} - Test Migration`,
                niveau: parcours === 'LICENCE' ? 'L1' : parcours === 'MASTER' ? 'M1' : 'MBA1',
                classe: `${parcours}-TEST`,
                anneeAcademique: '2024-2025',
                statut: 'confirme'
            });

            for (let n = 0; n < 3; n++) {
                notes.push({
                    identifiantEtudiant: identifiant,
                    cours: `COURS${n + 1}`,
                    note: Math.round((8 + Math.random() * 12) * 100) / 100,
                    typeNote: n === 0 ? 'Devoir' : n === 1 ? 'Examen' : 'ContrÃ´le Continue',
                    anneeAcademique: '2024-2025',
                    semestre: 'semestre1'
                });
            }
            idCounter++;
        }
    }
    return { etudiants, cursus, notes };
}

function escapeSQL(str: string): string {
    if (!str) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
}

async function testMigrationSQL(sequelize: Sequelize, data: ReturnType<typeof generateEtudiants>) {
    console.log('\n' + '='.repeat(70));
    console.log('MÃ‰THODE 1 : MIGRATION SQL DIRECTE');
    console.log('='.repeat(70));
    const debut = Date.now();

    await sequelize.query("DELETE FROM aut_apprenants WHERE utilisateurId IN (SELECT id FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%')");
    await sequelize.query("DELETE FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%'");

    const [etablissement] = await sequelize.query('SELECT COALESCE(MIN(id), 1) as id FROM eta_etablissements');
    const etablissementId = (etablissement as any)[0]?.id || 1;

    const [etapeSoumis] = await sequelize.query("SELECT COALESCE((SELECT id FROM ins_etapes_inscription WHERE libelle = 'soumis' LIMIT 1), 1) as id");
    const etapeSoumisId = (etapeSoumis as any)[0]?.id || 1;

    await sequelize.query("INSERT IGNORE INTO ins_annees_academiques (libelle, description, createdAt, updatedAt) VALUES ('2024-2025', 'AnnÃ©e de test', NOW(), NOW())");
    const [annee] = await sequelize.query("SELECT COALESCE((SELECT id FROM ins_annees_academiques WHERE libelle = '2024-2025' LIMIT 1), 1) as id");
    const anneeId = (annee as any)[0]?.id || 1;

    const transaction = await sequelize.transaction();
    let countEtudiants = 0, countApprenants = 0, countCursus = 0, countNotes = 0;

    try {
        for (const etu of data.etudiants) {
            const dateNaiss = etu.dateNaissance ? `STR_TO_DATE('${etu.dateNaissance}', '%d/%m/%Y')` : 'NULL';
            await sequelize.query(
                `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
                 VALUES (${escapeSQL(etu.nom)}, ${escapeSQL(etu.prenoms)}, ${escapeSQL(etu.identifiant)}, ${escapeSQL(etu.email)}, '$2b$10$testhash', 'APPRENANT', ${escapeSQL(etu.contact)}, 0, ${etablissementId}, NOW(), NOW())`,
                { transaction }
            );
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(etu.identifiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;
            countEtudiants++;

            await sequelize.query(
                `INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, anneeObtentionBac, serieBac, anneePremiereInscription, statutEtudiant, nombreInscriptions, createdAt, updatedAt)
                 VALUES (${userId}, ${dateNaiss}, ${escapeSQL(etu.lieuNaissance)}, ${escapeSQL(etu.sexe)}, ${escapeSQL(etu.nationalite)}, ${escapeSQL(etu.numeroPiece)}, ${escapeSQL(etu.typePiece)}, ${etu.anneeBac}, ${escapeSQL(etu.serieBac)}, ${etu.anneePremiereInscription}, 'ancien', 1, NOW(), NOW())`,
                { transaction }
            );
            countApprenants++;
        }

        for (const cur of data.cursus) {
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(cur.identifiantEtudiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;

            await sequelize.query(`INSERT IGNORE INTO ins_parcours (titre, description, type, createdAt, updatedAt) VALUES (${escapeSQL(cur.parcours)}, ${escapeSQL('Parcours de test')}, ${escapeSQL(cur.parcours)}, NOW(), NOW())`, { transaction });
            const [pRes] = await sequelize.query(`SELECT id FROM ins_parcours WHERE titre = ${escapeSQL(cur.parcours)}`, { transaction });
            const parcoursId = (pRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_niveaux_etudes (libelle, createdAt, updatedAt) VALUES (${escapeSQL(cur.niveau)}, NOW(), NOW())`, { transaction });
            const [nRes] = await sequelize.query(`SELECT id FROM ins_niveaux_etudes WHERE libelle = ${escapeSQL(cur.niveau)}`, { transaction });
            const niveauId = (nRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_classes (libelle, description, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt) VALUES (${escapeSQL(cur.classe)}, ${escapeSQL('Classe de test')}, ${niveauId}, ${parcoursId}, ${etablissementId}, NOW(), NOW())`, { transaction });
            const [cRes] = await sequelize.query(`SELECT id FROM ins_classes WHERE libelle = ${escapeSQL(cur.classe)}`, { transaction });
            const classeId = (cRes as any[])[0]?.id;

            const matricule = `TEST-SQL-${cur.identifiantEtudiant}`;
            await sequelize.query(
                `INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, etapeInscriptionId, utilisateurId, etablissementId, createdAt, updatedAt)
                 VALUES (${escapeSQL(matricule)}, 'inscription', 'valide', NOW(), ${etapeSoumisId}, ${userId}, ${etablissementId}, NOW(), NOW())`,
                { transaction }
            );
            const [dRes] = await sequelize.query(`SELECT id FROM ins_demandes_inscription WHERE matricule = ${escapeSQL(matricule)}`, { transaction });
            const demandeId = (dRes as any[])[0]?.id;

            await sequelize.query(
                `INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
                 VALUES (${escapeSQL(cur.statut)}, ${escapeSQL(cur.parcours)}, ${parcoursId}, ${niveauId}, ${classeId}, ${anneeId}, ${demandeId}, ${userId}, NOW(), NOW(), NOW())`,
                { transaction }
            );
            countCursus++;
        }

        for (const note of data.notes) {
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(note.identifiantEtudiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;

            await sequelize.query(`INSERT IGNORE INTO ins_cours (code, intitule, credit, creditEcts, estObligatoire, description, semestre, categorieUe, createdAt, updatedAt) VALUES (${escapeSQL(note.cours)}, ${escapeSQL(note.cours)}, 3, 3, true, ${escapeSQL('Cours de test')}, 'semestre1', 'MAJEURE', NOW(), NOW())`, { transaction });
            const [cRes] = await sequelize.query(`SELECT id FROM ins_cours WHERE code = ${escapeSQL(note.cours)}`, { transaction });
            const coursId = (cRes as any[])[0]?.id;

            const [caRes] = await sequelize.query(`SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} ORDER BY id DESC LIMIT 1`, { transaction });
            const cursusApprenantId = (caRes as any[])[0]?.id;
            if (!cursusApprenantId) continue;

            await sequelize.query(`INSERT INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) VALUES (${userId}, ${coursId}, ${cursusApprenantId}, NOW(), NOW())`, { transaction });
            const [cpRes] = await sequelize.query(`SELECT LAST_INSERT_ID() as id`, { transaction });
            const cpId = (cpRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, anneeAcademiqueId, createdAt, updatedAt) VALUES (CURDATE(), '08:00:00', '12:00:00', 100, 3, ${coursId}, ${anneeId}, NOW(), NOW())`, { transaction });
            const [lnRes] = await sequelize.query(`SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ${coursId} AND anneeAcademiqueId = ${anneeId} LIMIT 1`, { transaction });
            const listeNotesId = (lnRes as any[])[0]?.id;

            await sequelize.query(`INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt) VALUES (${note.note}, 'publie', ${listeNotesId}, ${cpId}, NOW(), NOW())`, { transaction });
            countNotes++;
        }

        await transaction.commit();
        const duree = Date.now() - debut;
        console.log(`\nâœ… Migration SQL terminÃ©e en ${duree}ms`);
        console.log(`   - ${countEtudiants} utilisateurs crÃ©Ã©s`);
        console.log(`   - ${countApprenants} apprenants crÃ©Ã©s`);
        console.log(`   - ${countCursus} cursus crÃ©Ã©s`);
        console.log(`   - ${countNotes} notes crÃ©Ã©es`);
        return { etudiants: countEtudiants, apprenants: countApprenants, cursus: countCursus, notes: countNotes, duree };

    } catch (error) {
        await transaction.rollback();
        console.error('\nâŒ Erreur migration SQL:', error);
        throw error;
    }
}

async function testMigrationXLSX(sequelize: Sequelize, data: ReturnType<typeof generateEtudiants>) {
    console.log('\n' + '='.repeat(70));
    console.log('MÃ‰THODE 2 : MIGRATION VIA XLSX');
    console.log('='.repeat(70));
    const debut = Date.now();

    const cheminFichier = path.join(process.cwd(), 'test-migration-etudiants.xlsx');
    const workbook = new ExcelJS.Workbook();

    const wsEtudiants = workbook.addWorksheet('Etudiants');
    wsEtudiants.columns = [
        { header: 'identifiant', key: 'identifiant', width: 15 },
        { header: 'nom', key: 'nom', width: 20 },
        { header: 'prenoms', key: 'prenoms', width: 20 },
        { header: 'email', key: 'email', width: 30 },
        { header: 'contact', key: 'contact', width: 15 },
        { header: 'dateNaissance', key: 'dateNaissance', width: 15 },
        { header: 'lieuNaissance', key: 'lieuNaissance', width: 15 },
        { header: 'sexe', key: 'sexe', width: 5 },
        { header: 'nationalite', key: 'nationalite', width: 15 },
        { header: 'numeroPiece', key: 'numeroPiece', width: 15 },
        { header: 'typePiece', key: 'typePiece', width: 10 },
        { header: 'anneeBac', key: 'anneeBac', width: 10 },
        { header: 'serieBac', key: 'serieBac', width: 10 },
        { header: 'anneePremiereInscription', key: 'anneePremiereInscription', width: 15 },
    ];
    data.etudiants.forEach(e => wsEtudiants.addRow(e));

    const wsCursus = workbook.addWorksheet('Cursus');
    wsCursus.columns = [
        { header: 'identifiantEtudiant', key: 'identifiantEtudiant', width: 20 },
        { header: 'parcours', key: 'parcours', width: 30 },
        { header: 'niveau', key: 'niveau', width: 10 },
        { header: 'classe', key: 'classe', width: 15 },
        { header: 'anneeAcademique', key: 'anneeAcademique', width: 15 },
        { header: 'statut', key: 'statut', width: 10 },
    ];
    data.cursus.forEach(c => wsCursus.addRow(c));

    const wsNotes = workbook.addWorksheet('Notes');
    wsNotes.columns = [
        { header: 'identifiantEtudiant', key: 'identifiantEtudiant', width: 20 },
        { header: 'cours', key: 'cours', width: 15 },
        { header: 'note', key: 'note', width: 10 },
        { header: 'typeNote', key: 'typeNote', width: 15 },
        { header: 'anneeAcademique', key: 'anneeAcademique', width: 15 },
        { header: 'semestre', key: 'semestre', width: 10 },
    ];
    data.notes.forEach(n => wsNotes.addRow(n));

    await workbook.xlsx.writeFile(cheminFichier);
    console.log(`\nðŸ“„ Fichier XLSX gÃ©nÃ©rÃ©: ${cheminFichier}`);

    const workbookLu = new ExcelJS.Workbook();
    await workbookLu.xlsx.readFile(cheminFichier);

    const etudiants: any[] = [];
    const cursus: any[] = [];
    const notes: any[] = [];

    const wsE = workbookLu.getWorksheet('Etudiants');
    wsE?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        etudiants.push({
            identifiant: row.getCell(1).value, nom: row.getCell(2).value, prenoms: row.getCell(3).value,
            email: row.getCell(4).value, contact: row.getCell(5).value, dateNaissance: row.getCell(6).value,
            lieuNaissance: row.getCell(7).value, sexe: row.getCell(8).value, nationalite: row.getCell(9).value,
            numeroPiece: row.getCell(10).value, typePiece: row.getCell(11).value, anneeBac: row.getCell(12).value,
            serieBac: row.getCell(13).value, anneePremiereInscription: row.getCell(14).value,
        });
    });

    const wsC = workbookLu.getWorksheet('Cursus');
    wsC?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        cursus.push({ identifiantEtudiant: row.getCell(1).value, parcours: row.getCell(2).value, niveau: row.getCell(3).value, classe: row.getCell(4).value, anneeAcademique: row.getCell(5).value, statut: row.getCell(6).value });
    });

    const wsN = workbookLu.getWorksheet('Notes');
    wsN?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        notes.push({ identifiantEtudiant: row.getCell(1).value, cours: row.getCell(2).value, note: row.getCell(3).value, typeNote: row.getCell(4).value, anneeAcademique: row.getCell(5).value, semestre: row.getCell(6).value });
    });

    // Nettoyer et importer
    await sequelize.query("DELETE FROM aut_apprenants WHERE utilisateurId IN (SELECT id FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%')");
    await sequelize.query("DELETE FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%'");

    const [etablissement] = await sequelize.query('SELECT COALESCE(MIN(id), 1) as id FROM eta_etablissements');
    const etablissementId = (etablissement as any)[0]?.id || 1;

    const [etapeSoumis] = await sequelize.query("SELECT COALESCE((SELECT id FROM ins_etapes_inscription WHERE libelle = 'soumis' LIMIT 1), 1) as id");
    const etapeSoumisId = (etapeSoumis as any)[0]?.id || 1;

    const [annee] = await sequelize.query("SELECT COALESCE((SELECT id FROM ins_annees_academiques WHERE libelle = '2024-2025' LIMIT 1), 1) as id");
    const anneeId = (annee as any)[0]?.id || 1;

    const transaction = await sequelize.transaction();
    let countEtudiants = 0, countApprenants = 0, countCursus = 0, countNotes = 0;

    try {
        for (const etu of etudiants) {
            const dateNaiss = etu.dateNaissance ? `STR_TO_DATE('${etu.dateNaissance}', '%d/%m/%Y')` : 'NULL';
            await sequelize.query(
                `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
                 VALUES (${escapeSQL(etu.nom)}, ${escapeSQL(etu.prenoms)}, ${escapeSQL(etu.identifiant)}, ${escapeSQL(etu.email)}, '$2b$10$testhash', 'APPRENANT', ${escapeSQL(etu.contact)}, 0, ${etablissementId}, NOW(), NOW())`,
                { transaction }
            );
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(etu.identifiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;
            countEtudiants++;

            await sequelize.query(
                `INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, anneeObtentionBac, serieBac, anneePremiereInscription, statutEtudiant, nombreInscriptions, createdAt, updatedAt)
                 VALUES (${userId}, ${dateNaiss}, ${escapeSQL(etu.lieuNaissance)}, ${escapeSQL(etu.sexe)}, ${escapeSQL(etu.nationalite)}, ${escapeSQL(etu.numeroPiece)}, ${escapeSQL(etu.typePiece)}, ${etu.anneeBac}, ${escapeSQL(etu.serieBac)}, ${etu.anneePremiereInscription}, 'ancien', 1, NOW(), NOW())`,
                { transaction }
            );
            countApprenants++;
        }

        for (const cur of cursus) {
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(cur.identifiantEtudiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;

            await sequelize.query(`INSERT IGNORE INTO ins_parcours (titre, description, type, createdAt, updatedAt) VALUES (${escapeSQL(cur.parcours)}, ${escapeSQL('Parcours de test')}, ${escapeSQL(cur.parcours)}, NOW(), NOW())`, { transaction });
            const [pRes] = await sequelize.query(`SELECT id FROM ins_parcours WHERE titre = ${escapeSQL(cur.parcours)}`, { transaction });
            const parcoursId = (pRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_niveaux_etudes (libelle, createdAt, updatedAt) VALUES (${escapeSQL(cur.niveau)}, NOW(), NOW())`, { transaction });
            const [nRes] = await sequelize.query(`SELECT id FROM ins_niveaux_etudes WHERE libelle = ${escapeSQL(cur.niveau)}`, { transaction });
            const niveauId = (nRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_classes (libelle, description, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt) VALUES (${escapeSQL(cur.classe)}, ${escapeSQL('Classe de test')}, ${niveauId}, ${parcoursId}, ${etablissementId}, NOW(), NOW())`, { transaction });
            const [cRes] = await sequelize.query(`SELECT id FROM ins_classes WHERE libelle = ${escapeSQL(cur.classe)}`, { transaction });
            const classeId = (cRes as any[])[0]?.id;

            const matricule = `TEST-XLSX-${cur.identifiantEtudiant}`;
            await sequelize.query(
                `INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, etapeInscriptionId, utilisateurId, etablissementId, createdAt, updatedAt)
                 VALUES (${escapeSQL(matricule)}, 'inscription', 'valide', NOW(), ${etapeSoumisId}, ${userId}, ${etablissementId}, NOW(), NOW())`,
                { transaction }
            );
            const [dRes] = await sequelize.query(`SELECT id FROM ins_demandes_inscription WHERE matricule = ${escapeSQL(matricule)}`, { transaction });
            const demandeId = (dRes as any[])[0]?.id;

            await sequelize.query(
                `INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
                 VALUES (${escapeSQL(cur.statut)}, ${escapeSQL(cur.parcours)}, ${parcoursId}, ${niveauId}, ${classeId}, ${anneeId}, ${demandeId}, ${userId}, NOW(), NOW(), NOW())`,
                { transaction }
            );
            countCursus++;
        }

        for (const note of notes) {
            const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(note.identifiantEtudiant)}`, { transaction });
            const userId = (userRes as any[])[0]?.id;
            if (!userId) continue;

            await sequelize.query(`INSERT IGNORE INTO ins_cours (code, intitule, credit, creditEcts, estObligatoire, description, semestre, categorieUe, createdAt, updatedAt) VALUES (${escapeSQL(note.cours)}, ${escapeSQL(note.cours)}, 3, 3, true, ${escapeSQL('Cours de test')}, 'semestre1', 'MAJEURE', NOW(), NOW())`, { transaction });
            const [cRes] = await sequelize.query(`SELECT id FROM ins_cours WHERE code = ${escapeSQL(note.cours)}`, { transaction });
            const coursId = (cRes as any[])[0]?.id;

            const [caRes] = await sequelize.query(`SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} ORDER BY id DESC LIMIT 1`, { transaction });
            const cursusApprenantId = (caRes as any[])[0]?.id;
            if (!cursusApprenantId) continue;

            await sequelize.query(`INSERT INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) VALUES (${userId}, ${coursId}, ${cursusApprenantId}, NOW(), NOW())`, { transaction });
            const [cpRes] = await sequelize.query(`SELECT LAST_INSERT_ID() as id`, { transaction });
            const cpId = (cpRes as any[])[0]?.id;

            await sequelize.query(`INSERT IGNORE INTO ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, anneeAcademiqueId, createdAt, updatedAt) VALUES (CURDATE(), '08:00:00', '12:00:00', 100, 3, ${coursId}, ${anneeId}, NOW(), NOW())`, { transaction });
            const [lnRes] = await sequelize.query(`SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ${coursId} AND anneeAcademiqueId = ${anneeId} LIMIT 1`, { transaction });
            const listeNotesId = (lnRes as any[])[0]?.id;

            await sequelize.query(`INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt) VALUES (${note.note}, 'publie', ${listeNotesId}, ${cpId}, NOW(), NOW())`, { transaction });
            countNotes++;
        }

        await transaction.commit();
        const duree = Date.now() - debut;
        console.log(`\nâœ… Migration XLSX terminÃ©e en ${duree}ms`);
        console.log(`   - ${countEtudiants} utilisateurs crÃ©Ã©s`);
        console.log(`   - ${countApprenants} apprenants crÃ©Ã©s`);
        console.log(`   - ${countCursus} cursus crÃ©Ã©s`);
        console.log(`   - ${countNotes} notes crÃ©Ã©es`);

        fs.unlinkSync(cheminFichier);
        return { etudiants: countEtudiants, apprenants: countApprenants, cursus: countCursus, notes: countNotes, duree };

    } catch (error) {
        await transaction.rollback();
        console.error('\nâŒ Erreur migration XLSX:', error);
        throw error;
    }
}

function comparerResultats(sql: any, xlsx: any) {
    console.log('\n' + '='.repeat(70));
    console.log('COMPARAISON DES MÃ‰THODES');
    console.log('='.repeat(70));
    console.log('\nâ”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”');
    console.log('â”‚ MÃ©trique        â”‚ SQL Direct   â”‚ XLSX         â”‚ DiffÃ©rence   â”‚');
    console.log('â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤');
    console.log(`â”‚ Utilisateurs    â”‚ ${String(sql.etudiants).padStart(12)} â”‚ ${String(xlsx.etudiants).padStart(12)} â”‚ ${String(xlsx.etudiants - sql.etudiants).padStart(12)} â”‚`);
    console.log(`â”‚ Apprenants      â”‚ ${String(sql.apprenants).padStart(12)} â”‚ ${String(xlsx.apprenants).padStart(12)} â”‚ ${String(xlsx.apprenants - sql.apprenants).padStart(12)} â”‚`);
    console.log(`â”‚ Cursus          â”‚ ${String(sql.cursus).padStart(12)} â”‚ ${String(xlsx.cursus).padStart(12)} â”‚ ${String(xlsx.cursus - sql.cursus).padStart(12)} â”‚`);
    console.log(`â”‚ Notes           â”‚ ${String(sql.notes).padStart(12)} â”‚ ${String(xlsx.notes).padStart(12)} â”‚ ${String(xlsx.notes - sql.notes).padStart(12)} â”‚`);
    console.log(`â”‚ DurÃ©e (ms)      â”‚ ${String(sql.duree).padStart(12)} â”‚ ${String(xlsx.duree).padStart(12)} â”‚ ${String(xlsx.duree - sql.duree).padStart(12)} â”‚`);
    console.log('â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜');

    const totalSQL = sql.etudiants + sql.apprenants + sql.cursus + sql.notes;
    const totalXLSX = xlsx.etudiants + xlsx.apprenants + xlsx.cursus + xlsx.notes;
    console.log(`\nTotal Ã©lÃ©ments crÃ©Ã©s: SQL=${totalSQL}, XLSX=${totalXLSX}`);
    if (totalSQL === totalXLSX) {
        console.log('âœ… Les deux mÃ©thodes produisent les mÃªmes rÃ©sultats !');
    } else {
        console.log('âš ï¸  DiffÃ©rence dÃ©tectÃ©e entre les mÃ©thodes');
    }
}

async function main() {
    console.log('â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘         TEST DE MIGRATION Ã‰TUDIANTS â€” 30 Ã©tudiants                  â•‘');
    console.log('â•‘         (10 LICENCE + 10 MASTER + 10 MBA)                           â•‘');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

    const data = generateEtudiants();
    console.log(`\nðŸ“Š DonnÃ©es gÃ©nÃ©rÃ©es: ${data.etudiants.length} Ã©tudiants, ${data.cursus.length} cursus, ${data.notes.length} notes`);

    const db = DatabaseConnection.getInstance();
    const sequelize: Sequelize = db.sequelize;

    try {
        await sequelize.authenticate();
        console.log('âœ… Connexion Ã  la base de donnÃ©es Ã©tablie');

        const resultatSQL = await testMigrationSQL(sequelize, data);
        const resultatXLSX = await testMigrationXLSX(sequelize, data);
        comparerResultats(resultatSQL, resultatXLSX);

        console.log('\n' + '='.repeat(70));
        console.log('âœ… TESTS TERMINÃ‰S AVEC SUCCÃˆS');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\nâŒ Erreur lors des tests:', error);
        process.exit(1);
    }
}

main();

