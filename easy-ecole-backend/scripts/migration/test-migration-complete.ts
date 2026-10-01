/**
 * TEST DE MIGRATION COMPLET — ETUDIANTS + NOTES + UE VALIDÉES
 * ============================================================
 * Lit le fichier migration-etudiants-complete.xlsx (3 feuilles)
 * et importe tout dans la base.
 *
 * Utilisation :
 *   npx ts-node scripts/migration/test-migration-complete.ts
 */

import * as ExcelJS from 'exceljs';
import { Sequelize } from 'sequelize';
import { DatabaseConnection } from '../../src/core/helpers/DatabaseConnection';

const FICHIER = 'D:/EasyEcole/easy-ecole-backend/scripts/migration/migration-etudiants-complete.xlsx';

function escapeSQL(str: string | null | undefined): string {
    if (!str) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║    TEST DE MIGRATION COMPLET — ETUDIANTS + NOTES + UE VALIDÉES      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

    // Lire le fichier Excel
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(FICHIER);

    // Feuille Etudiants
    const wsEtudiants = wb.getWorksheet('Etudiants');
    const etudiants: any[] = [];
    wsEtudiants?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        etudiants.push({
            matricule: String(matricule),
            nom: String(row.getCell(2).value || ''),
            prenoms: String(row.getCell(3).value || ''),
            email: String(row.getCell(4).value || ''),
            contact: String(row.getCell(5).value || ''),
            sexe: String(row.getCell(6).value || 'M'),
            parcours: String(row.getCell(7).value || ''),
            classe: String(row.getCell(9).value || ''),
            niveau: String(row.getCell(10).value || ''),
            promotion: String(row.getCell(11).value || ''),
            dateNaissance: row.getCell(13).value ? new Date(row.getCell(13).value as string) : null,
            lieuNaissance: String(row.getCell(14).value || ''),
            nationalite: String(row.getCell(15).value || ''),
            anneeBac: row.getCell(20).value ? Number(row.getCell(20).value) : null,
            serieBac: String(row.getCell(21).value || ''),
        });
    });

    // Feuille Notes
    const wsNotes = wb.getWorksheet('Notes');
    const notes: any[] = [];
    wsNotes?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        notes.push({
            matricule: String(matricule),
            codeEcue: String(row.getCell(2).value || ''),
            intituleEcue: String(row.getCell(3).value || ''),
            note: Number(row.getCell(4).value) || 0,
            typeEval: String(row.getCell(5).value || 'Examen'),
            semestre: String(row.getCell(6).value || 'S1'),
            annee: String(row.getCell(7).value || ''),
        });
    });

    // Feuille UE Validees
    const wsUE = wb.getWorksheet('UE_Validees');
    const ueValidees: any[] = [];
    wsUE?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        ueValidees.push({
            matricule: String(matricule),
            codeUe: String(row.getCell(2).value || ''),
            intituleUe: String(row.getCell(3).value || ''),
            credits: Number(row.getCell(4).value) || 0,
            validee: String(row.getCell(5).value || 'OUI'),
            annee: String(row.getCell(6).value || ''),
        });
    });

    // Feuille Bordereaux
    const wsBordereaux = wb.getWorksheet('Bordereaux');
    const bordereaux: any[] = [];
    wsBordereaux?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        bordereaux.push({
            matricule: String(matricule),
            reference: String(row.getCell(2).value || ''),
            type: String(row.getCell(3).value || ''),
            montant: Number(row.getCell(4).value) || 0,
            dateEmission: row.getCell(5).value ? new Date(row.getCell(5).value as string) : null,
            statut: String(row.getCell(6).value || ''),
            annee: String(row.getCell(7).value || ''),
        });
    });

    // Feuille Paiements
    const wsPaiements = wb.getWorksheet('Paiements');
    const paiements: any[] = [];
    wsPaiements?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        paiements.push({
            matricule: String(matricule),
            reference: String(row.getCell(2).value || ''),
            montant: Number(row.getCell(3).value) || 0,
            datePaiement: row.getCell(4).value ? new Date(row.getCell(4).value as string) : null,
            mode: String(row.getCell(5).value || ''),
            statut: String(row.getCell(6).value || ''),
        });
    });

    // Feuille Demandes Documents
    const wsDocs = wb.getWorksheet('Demandes_Documents');
    const demandesDocs: any[] = [];
    wsDocs?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const matricule = row.getCell(1).value;
        if (!matricule) return;
        demandesDocs.push({
            matricule: String(matricule),
            typeDoc: String(row.getCell(2).value || ''),
            dateDemande: row.getCell(3).value ? new Date(row.getCell(3).value as string) : null,
            statut: String(row.getCell(4).value || ''),
            dateTraitement: row.getCell(5).value ? new Date(row.getCell(5).value as string) : null,
        });
    });

    console.log(`\n📊 Données lues depuis le fichier Excel:`);
    console.log(`   - ${etudiants.length} étudiants`);
    console.log(`   - ${notes.length} notes`);
    console.log(`   - ${ueValidees.length} UE validées`);
    console.log(`   - ${bordereaux.length} bordereaux`);
    console.log(`   - ${paiements.length} paiements`);
    console.log(`   - ${demandesDocs.length} demandes documents`);

    // Connexion à la base
    const db = DatabaseConnection.getInstance();
    const sequelize: Sequelize = db.sequelize;

    try {
        await sequelize.authenticate();
        console.log('\n✅ Connexion à la base de données établie');

        // Récupérer les IDs de référence
        const [etablissement] = await sequelize.query('SELECT COALESCE(MIN(id), 1) as id FROM eta_etablissements');
        const etablissementId = (etablissement as any)[0]?.id || 1;

        const [etapeSoumis] = await sequelize.query("SELECT COALESCE((SELECT id FROM ins_etapes_inscription WHERE libelle = 'soumis' LIMIT 1), 1) as id");
        const etapeSoumisId = (etapeSoumis as any)[0]?.id || 1;

        // Nettoyer les données de test existantes
        await sequelize.query("DELETE FROM aut_apprenants WHERE utilisateurId IN (SELECT id FROM aut_utilisateurs WHERE identifiant LIKE 'MIGR-%')");
        await sequelize.query("DELETE FROM aut_utilisateurs WHERE identifiant LIKE 'MIGR-%'");

        const transaction = await sequelize.transaction();
        let countEtudiants = 0, countCursus = 0, countNotes = 0, countUE = 0;

        try {
            // === ÉTAPE 1 : Importer les étudiants ===
            console.log('\n🔄 Étape 1/3 : Import des étudiants...');
            for (const etu of etudiants) {
                // Vérifier si l'utilisateur existe déjà
                const [existing] = await sequelize.query(
                    `SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(etu.matricule)}`,
                    { transaction }
                );
                let userId: number;

                if ((existing as any[]).length > 0) {
                    userId = (existing as any[])[0].id;
                } else {
                    // Gérer les doublons d'email
                    let emailUnique = etu.email;
                    let emailSuffix = 1;
                    while (true) {
                        const [emailCheck] = await sequelize.query(
                            `SELECT id FROM aut_utilisateurs WHERE email = ${escapeSQL(emailUnique)}`,
                            { transaction }
                        );
                        if ((emailCheck as any[]).length === 0) break;
                        emailUnique = etu.email.replace('@', `+${emailSuffix}@`);
                        emailSuffix++;
                    }

                    // Créer l'utilisateur
                    await sequelize.query(
                        `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
                         VALUES (${escapeSQL(etu.nom)}, ${escapeSQL(etu.prenoms)}, ${escapeSQL(etu.matricule)}, ${escapeSQL(emailUnique)}, '$2b$10$placeholderhashmustbechanged', 'APPRENANT', ${escapeSQL(etu.contact)}, 0, ${etablissementId}, NOW(), NOW())`,
                        { transaction }
                    );
                    const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(etu.matricule)}`, { transaction });
                    userId = (userRes as any[])[0]?.id;
                    if (!userId) continue;
                    countEtudiants++;

                    // Créer l'apprenant
                    let dateNaiss = 'NULL';
                    if (etu.dateNaissance && !isNaN(etu.dateNaissance.getTime())) {
                        const d = etu.dateNaissance;
                        const jour = String(d.getDate()).padStart(2, '0');
                        const mois = String(d.getMonth() + 1).padStart(2, '0');
                        const annee = d.getFullYear();
                        dateNaiss = `STR_TO_DATE('${jour}/${mois}/${annee}', '%d/%m/%Y')`;
                    }
                    await sequelize.query(
                        `INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, anneeObtentionBac, serieBac, anneePremiereInscription, statutEtudiant, nombreInscriptions, createdAt, updatedAt)
                         VALUES (${userId}, ${dateNaiss}, ${escapeSQL(etu.lieuNaissance)}, ${escapeSQL(etu.sexe)}, ${escapeSQL(etu.nationalite)}, NULL, NULL, ${etu.anneeBac || 'NULL'}, ${escapeSQL(etu.serieBac)}, YEAR(${dateNaiss}), 'ancien', 1, NOW(), NOW())`,
                        { transaction }
                    );
                }

                // Créer ou récupérer le parcours
                await sequelize.query(`INSERT IGNORE INTO ins_parcours (titre, description, type, createdAt, updatedAt) VALUES (${escapeSQL(etu.parcours)}, ${escapeSQL('Parcours migré')}, 'LICENCE', NOW(), NOW())`, { transaction });
                const [pRes] = await sequelize.query(`SELECT id FROM ins_parcours WHERE titre = ${escapeSQL(etu.parcours)}`, { transaction });
                const parcoursId = (pRes as any[])[0]?.id;

                // Créer ou récupérer le niveau
                await sequelize.query(`INSERT IGNORE INTO ins_niveaux_etudes (libelle, createdAt, updatedAt) VALUES (${escapeSQL(etu.niveau)}, NOW(), NOW())`, { transaction });
                const [nRes] = await sequelize.query(`SELECT id FROM ins_niveaux_etudes WHERE libelle = ${escapeSQL(etu.niveau)}`, { transaction });
                const niveauId = (nRes as any[])[0]?.id;

                // Créer ou récupérer la classe
                if (niveauId && parcoursId) {
                    await sequelize.query(`INSERT IGNORE INTO ins_classes (libelle, description, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt) VALUES (${escapeSQL(etu.classe)}, ${escapeSQL('Classe migrée')}, ${niveauId}, ${parcoursId}, ${etablissementId}, NOW(), NOW())`, { transaction });
                }
                const [cRes] = await sequelize.query(`SELECT id FROM ins_classes WHERE libelle = ${escapeSQL(etu.classe)} LIMIT 1`, { transaction });
                const classeId = (cRes as any[])[0]?.id || 1;

                // Créer une session unique
                await sequelize.query(
                    `INSERT INTO ins_sessions (dateDebut, dateFin, description, statut, niveauEtudeId, etablissementId, anneeAcademiqueId, createdAt, updatedAt)
                     VALUES (NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), ${escapeSQL('Session migrée')}, 'ouverte', ${niveauId}, ${etablissementId}, 1, NOW(), NOW())`,
                    { transaction }
                );
                const [sRes] = await sequelize.query('SELECT LAST_INSERT_ID() as id', { transaction });
                const sessionId = (sRes as any[])[0]?.id;

                // Créer la demande d'inscription
                const matriculeDemande = `MIGR-${etu.matricule}-${Date.now()}`;
                await sequelize.query(
                    `INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, etapeInscriptionId, utilisateurId, etablissementId, sessionId, createdAt, updatedAt)
                     VALUES (${escapeSQL(matriculeDemande)}, 'inscription', 'valide', NOW(), ${etapeSoumisId}, ${userId}, ${etablissementId}, ${sessionId}, NOW(), NOW())`,
                    { transaction }
                );
                const [dRes] = await sequelize.query(`SELECT id FROM ins_demandes_inscription WHERE matricule = ${escapeSQL(matriculeDemande)}`, { transaction });
                const demandeId = (dRes as any[])[0]?.id;

                // Créer le cursus apprenant
                await sequelize.query(
                    `INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
                     VALUES ('confirme', ${escapeSQL(etu.parcours)}, ${parcoursId}, ${niveauId}, ${classeId}, 1, ${demandeId}, ${userId}, NOW(), NOW(), NOW())`,
                    { transaction }
                );
                countCursus++;
            }
            console.log(`   ✅ ${countEtudiants} utilisateurs créés, ${countCursus} cursus créés`);

            // === ÉTAPE 2 : Importer les notes ===
            console.log('\n🔄 Étape 2/3 : Import des notes...');
            for (const note of notes) {
                const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(note.matricule)}`, { transaction });
                const userId = (userRes as any[])[0]?.id;
                if (!userId) continue;

                // Récupérer le parcoursId de l'étudiant
                const [caResNotes] = await sequelize.query(`SELECT parcoursId FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} LIMIT 1`, { transaction });
                const parcoursId = (caResNotes as any[])[0]?.parcoursId || 1;

                // Créer ou récupérer l'ECUE
                await sequelize.query(`INSERT IGNORE INTO ins_cours (code, parcoursId, intitule, credit, creditEcts, estObligatoire, description, semestre, categorieUe, createdAt, updatedAt) VALUES (${escapeSQL(note.codeEcue)}, ${parcoursId}, ${escapeSQL(note.intituleEcue)}, 3, 3, true, ${escapeSQL('Cours migré')}, ${escapeSQL(note.semestre)}, 'MAJEURE', NOW(), NOW())`, { transaction });
                const [cRes] = await sequelize.query(`SELECT id FROM ins_cours WHERE code = ${escapeSQL(note.codeEcue)} LIMIT 1`, { transaction });
                const coursId = (cRes as any[])[0]?.id;
                if (!coursId) {
                    console.log(`  ⚠️  Cours ${note.codeEcue} non trouvé, ignoré`);
                    continue;
                }

                // Récupérer le cursus apprenant
                const [caRes] = await sequelize.query(`SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} ORDER BY id DESC LIMIT 1`, { transaction });
                const cursusApprenantId = (caRes as any[])[0]?.id;
                if (!cursusApprenantId) continue;

                // Créer le cours participant
                await sequelize.query(`INSERT INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) VALUES (${userId}, ${coursId}, ${cursusApprenantId}, NOW(), NOW())`, { transaction });
                const [cpRes] = await sequelize.query('SELECT LAST_INSERT_ID() as id', { transaction });
                const cpId = (cpRes as any[])[0]?.id;

                // Créer la liste de notes
                await sequelize.query(`INSERT IGNORE INTO ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, anneeAcademiqueId, createdAt, updatedAt) VALUES (CURDATE(), '08:00:00', '12:00:00', 100, 3, ${coursId}, 1, NOW(), NOW())`, { transaction });
                const [lnRes] = await sequelize.query(`SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ${coursId} LIMIT 1`, { transaction });
                const listeNotesId = (lnRes as any[])[0]?.id;

                // Créer la note
                await sequelize.query(`INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt) VALUES (${note.note}, 'publie', ${listeNotesId}, ${cpId}, NOW(), NOW())`, { transaction });
                countNotes++;
            }
            console.log(`   ✅ ${countNotes} notes créées`);

            // === ÉTAPE 3 : Importer les UE validées ===
            console.log('\n🔄 Étape 3/3 : Import des UE validées...');
            for (const ue of ueValidees) {
                const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(ue.matricule)}`, { transaction });
                const userId = (userRes as any[])[0]?.id;
                if (!userId) continue;

                // Récupérer le parcoursId
                const [caResUe] = await sequelize.query(`SELECT parcoursId FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} LIMIT 1`, { transaction });
                const parcoursIdUe = (caResUe as any[])[0]?.parcoursId || 1;

                // Créer ou récupérer l'UE
                await sequelize.query(`INSERT IGNORE INTO ins_cours (code, parcoursId, intitule, credit, creditEcts, estObligatoire, description, semestre, categorieUe, createdAt, updatedAt) VALUES (${escapeSQL(ue.codeUe)}, ${parcoursIdUe}, ${escapeSQL(ue.intituleUe)}, ${ue.credits}, ${ue.credits}, true, ${escapeSQL('UE migrée')}, 'S1', 'MAJEURE', NOW(), NOW())`, { transaction });
                const [cResUe] = await sequelize.query(`SELECT id FROM ins_cours WHERE code = ${escapeSQL(ue.codeUe)} LIMIT 1`, { transaction });
                const coursId = (cResUe as any[])[0]?.id;
                if (!coursId) {
                    console.log(`  ⚠️  UE ${ue.codeUe} non trouvée, ignorée`);
                    continue;
                }

                // Récupérer le cursus apprenant
                const [caResUe2] = await sequelize.query(`SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ${userId} ORDER BY id DESC LIMIT 1`, { transaction });
                const cursusApprenantId = (caResUe2 as any[])[0]?.id;
                if (!cursusApprenantId) continue;

                // Créer le cours participant
                await sequelize.query(`INSERT INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) VALUES (${userId}, ${coursId}, ${cursusApprenantId}, NOW(), NOW())`, { transaction });
                const [cpResUe] = await sequelize.query('SELECT LAST_INSERT_ID() as id', { transaction });
                const cpId = (cpResUe as any[])[0]?.id;

                // Note de validation
                const noteValidation = ue.validee === 'OUI' ? 12 : 8;
                await sequelize.query(`INSERT INTO ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, anneeAcademiqueId, createdAt, updatedAt) VALUES (CURDATE(), '08:00:00', '12:00:00', 100, 3, ${coursId}, 1, NOW(), NOW())`, { transaction });
                const [lnResUe] = await sequelize.query(`SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ${coursId} LIMIT 1`, { transaction });
                const listeNotesId = (lnResUe as any[])[0]?.id;

                await sequelize.query(`INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt) VALUES (${noteValidation}, 'publie', ${listeNotesId}, ${cpId}, NOW(), NOW())`, { transaction });
                countUE++;
            }
            console.log(`   ✅ ${countUE} UE validées`);

            // === ÉTAPE 4 : Importer les bordereaux ===
            console.log('\n🔄 Étape 4/6 : Import des bordereaux...');
            let countBordereaux = 0;
            for (const bord of bordereaux) {
                const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(bord.matricule)}`, { transaction });
                const userId = (userRes as any[])[0]?.id;
                if (!userId) continue;

                const dateEmission = bord.dateEmission ? `STR_TO_DATE('${bord.dateEmission.toLocaleDateString('fr-FR')}', '%d/%m/%Y')` : 'NOW()';
                await sequelize.query(
                    `INSERT INTO ins_bordereaux (numeroBordereau, type, montant, fichier, dateSoumission, statut, utilisateurId, createdAt, updatedAt)
                     VALUES (${escapeSQL(bord.reference)}, 'scolarite', ${bord.montant}, ${escapeSQL('migré.pdf')}, ${dateEmission}, 'valide', ${userId}, NOW(), NOW())`,
                    { transaction }
                );
                countBordereaux++;
            }
            console.log(`   ✅ ${countBordereaux} bordereaux créés`);

            // === ÉTAPE 5 : Importer les paiements ===
            console.log('\n🔄 Étape 5/6 : Import des paiements...');
            let countPaiements = 0;
            for (const pay of paiements) {
                const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(pay.matricule)}`, { transaction });
                const userId = (userRes as any[])[0]?.id;
                if (!userId) continue;

                // Récupérer le matricule de la demande d'inscription existante
                const [demandeRes] = await sequelize.query(
                    `SELECT matricule FROM ins_demandes_inscription WHERE utilisateurId = ${userId} LIMIT 1`,
                    { transaction }
                );
                const matriculeInscription = (demandeRes as any[])[0]?.matricule;
                if (!matriculeInscription) {
                    console.log(`  ⚠️  Pas de demande d'inscription pour ${pay.matricule}, paiement ignoré`);
                    continue;
                }

                const datePaiement = pay.datePaiement ? `STR_TO_DATE('${pay.datePaiement.toLocaleDateString('fr-FR')}', '%d/%m/%Y')` : 'NOW()';
                await sequelize.query(
                    `INSERT INTO ins_paiements_inscription (numero, montant, matriculeInscription, datePaiement, type, utilisateurId, createdAt, updatedAt)
                     VALUES (${escapeSQL(pay.reference)}, ${pay.montant}, ${escapeSQL(matriculeInscription)}, ${datePaiement}, 'mobile_money', ${userId}, NOW(), NOW())`,
                    { transaction }
                );
                countPaiements++;
            }
            console.log(`   ✅ ${countPaiements} paiements créés`);

            // === ÉTAPE 6 : Importer les demandes documents ===
            console.log('\n🔄 Étape 6/6 : Import des demandes documents...');
            let countDemandesDocs = 0;
            for (const doc of demandesDocs) {
                const [userRes] = await sequelize.query(`SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(doc.matricule)}`, { transaction });
                const userId = (userRes as any[])[0]?.id;
                if (!userId) continue;

                const dateDemande = doc.dateDemande ? `STR_TO_DATE('${doc.dateDemande.toLocaleDateString('fr-FR')}', '%d/%m/%Y')` : 'NOW()';
                await sequelize.query(
                    `INSERT INTO scol_demandes_document (typeDocumentId, statut, date, etudiantId, createdAt, updatedAt)
                     VALUES (1, 'soumise', ${dateDemande}, ${userId}, NOW(), NOW())`,
                    { transaction }
                );
                countDemandesDocs++;
            }
            console.log(`   ✅ ${countDemandesDocs} demandes documents créées`);

            await transaction.commit();

            console.log('\n' + '='.repeat(70));
            console.log('✅ MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS');
            console.log('='.repeat(70));
            console.log(`   - ${countEtudiants} utilisateurs créés`);
            console.log(`   - ${countCursus} cursus créés`);
            console.log(`   - ${countNotes} notes créées`);
            console.log(`   - ${countUE} UE validées`);
            console.log('\n⚠️  Les étudiants devront utiliser "Mot de passe oublié" pour se connecter.');

        } catch (error) {
            await transaction.rollback();
            console.error('\n❌ Erreur lors de la migration, transaction annulée:', error);
            throw error;
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    }
}

main();
