/**
 * IMPORT ÉTUDIANTS DEPUIS FICHIER EXCEL — ANCIENNE BASE
 * ======================================================
 * Lit le fichier export-etudiants-2026-09-25-17-43-42.xlsx
 * et importe les étudiants dans la nouvelle base EasyEcole.
 *
 * Utilisation :
 *   npx ts-node scripts/migration/import-etudiants-excel.ts
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { Sequelize } from 'sequelize';
import { DatabaseConnection } from '../../src/core/helpers/DatabaseConnection';

const FICHIER_SOURCE = 'C:/Users/User/Downloads/export-etudiants-2026-09-25-17-43-42.xlsx';

function escapeSQL(str: string | null | undefined): string {
    if (!str) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║         IMPORT ÉTUDIANTS DEPUIS EXCEL — ANCIENNE BASE               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

    // Lire le fichier Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(FICHIER_SOURCE);

    const ws = workbook.getWorksheet('Apprenants');
    if (!ws) {
        console.error('❌ Feuille "Apprenants" non trouvée');
        process.exit(1);
    }

    // Lire les données (ligne 1 = en-tête, lignes 2+ = données)
    const etudiants: any[] = [];
    ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const matricule = row.getCell(1).value;
        if (!matricule) return;

        etudiants.push({
            matricule: String(row.getCell(1).value || ''),
            nom: String(row.getCell(2).value || ''),
            prenoms: String(row.getCell(3).value || ''),
            email: String(row.getCell(4).value || ''),
            contact: String(row.getCell(5).value || ''),
            sexe: String(row.getCell(6).value || 'M'),
            parcours: String(row.getCell(7).value || ''),
            filiere: String(row.getCell(8).value || ''),
            classe: String(row.getCell(9).value || ''),
            niveau: String(row.getCell(10).value || ''),
            promotion: String(row.getCell(11).value || ''),
            dateNaissance: row.getCell(14).value ? new Date(row.getCell(14).value as string) : null,
            lieuNaissance: String(row.getCell(15).value || ''),
            nationalite: String(row.getCell(16).value || ''),
            typePiece: String(row.getCell(17).value || ''),
            numeroPiece: String(row.getCell(18).value || ''),
            anneeBac: row.getCell(21).value ? Number(row.getCell(21).value) : null,
            serieBac: String(row.getCell(22).value || ''),
        });
    });

    console.log(`\n📊 ${etudiants.length} étudiants lus depuis le fichier Excel`);
    console.log('\n📋 Aperçu des 5 premiers:');
    etudiants.slice(0, 5).forEach(e => {
        console.log(`   - ${e.matricule}: ${e.nom} ${e.prenoms} (${e.parcours})`);
    });

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

        // Récupérer un sessionId valide
        const [session] = await sequelize.query('SELECT COALESCE((SELECT id FROM ins_sessions LIMIT 1), 1) as id');
        const sessionIdValide = (session as any)[0]?.id || 1;

        // Créer l'année académique si nécessaire
        const promotion = etudiants[0]?.promotion || '2025-2026';
        await sequelize.query(`INSERT IGNORE INTO ins_annees_academiques (libelle, description, createdAt, updatedAt) VALUES (${escapeSQL(promotion)}, 'Année migrée', NOW(), NOW())`);
        const [annee] = await sequelize.query(`SELECT id FROM ins_annees_academiques WHERE libelle = ${escapeSQL(promotion)} LIMIT 1`);
        const anneeId = (annee as any[])[0]?.id || 1;

        // Nettoyer les données de test existantes
        await sequelize.query("DELETE FROM aut_apprenants WHERE utilisateurId IN (SELECT id FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%' OR identifiant LIKE 'MIGR-%')");
        await sequelize.query("DELETE FROM aut_utilisateurs WHERE identifiant LIKE 'TEST-%' OR identifiant LIKE 'MIGR-%'");

        const transaction = await sequelize.transaction();
        let countEtudiants = 0, countApprenants = 0, countCursus = 0;

        try {
            for (const etu of etudiants) {
                // Vérifier si l'utilisateur existe déjà
                const [existing] = await sequelize.query(
                    `SELECT id FROM aut_utilisateurs WHERE identifiant = ${escapeSQL(etu.matricule)}`,
                    { transaction }
                );
                let userId: number;

                if ((existing as any[]).length > 0) {
                    // Utilisateur existe déjà, récupérer son ID
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

                    // Gérer les doublons nom/prénoms
                    let prenomsUnique = etu.prenoms;
                    let nomPrenomsSuffix = 1;
                    while (true) {
                        const [nomPrenomsCheck] = await sequelize.query(
                            `SELECT id FROM aut_utilisateurs WHERE nom = ${escapeSQL(etu.nom)} AND prenoms = ${escapeSQL(prenomsUnique)}`,
                            { transaction }
                        );
                        if ((nomPrenomsCheck as any[]).length === 0) break;
                        prenomsUnique = `${etu.prenoms}-${nomPrenomsSuffix}`;
                        nomPrenomsSuffix++;
                    }

                    // Créer l'utilisateur
                    await sequelize.query(
                        `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
                         VALUES (${escapeSQL(etu.nom)}, ${escapeSQL(prenomsUnique)}, ${escapeSQL(etu.matricule)}, ${escapeSQL(emailUnique)}, '$2b$10$placeholderhashmustbechanged', 'APPRENANT', ${escapeSQL(etu.contact)}, 0, ${etablissementId}, NOW(), NOW())`,
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
                         VALUES (${userId}, ${dateNaiss}, ${escapeSQL(etu.lieuNaissance)}, ${escapeSQL(etu.sexe)}, ${escapeSQL(etu.nationalite)}, ${escapeSQL(etu.numeroPiece)}, ${escapeSQL(etu.typePiece)}, ${etu.anneeBac || 'NULL'}, ${escapeSQL(etu.serieBac)}, YEAR(${dateNaiss}), 'ancien', 1, NOW(), NOW())`,
                        { transaction }
                    );
                    countApprenants++;
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

                // Créer une session unique pour chaque demande (contraire UNIQUE sessionId-utilisateurId)
                await sequelize.query(
                    `INSERT INTO ins_sessions (dateDebut, dateFin, description, statut, niveauEtudeId, etablissementId, anneeAcademiqueId, createdAt, updatedAt)
                     VALUES (NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), ${escapeSQL('Session migrée')}, 'ouverte', ${niveauId}, ${etablissementId}, ${anneeId}, NOW(), NOW())`,
                    { transaction }
                );
                const [sRes] = await sequelize.query('SELECT LAST_INSERT_ID() as id', { transaction });
                const sessionIdUnique = (sRes as any[])[0]?.id;

                // Créer la demande d'inscription
                const matriculeDemande = `MIGR-${etu.matricule}-${Date.now()}`;
                await sequelize.query(
                    `INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, etapeInscriptionId, utilisateurId, etablissementId, sessionId, createdAt, updatedAt)
                     VALUES (${escapeSQL(matriculeDemande)}, 'inscription', 'valide', NOW(), ${etapeSoumisId}, ${userId}, ${etablissementId}, ${sessionIdUnique}, NOW(), NOW())`,
                    { transaction }
                );
                const [dRes] = await sequelize.query(`SELECT id FROM ins_demandes_inscription WHERE matricule = ${escapeSQL(matriculeDemande)}`, { transaction });
                const demandeId = (dRes as any[])[0]?.id;

                // Créer le cursus apprenant (un cursus par ligne)
                await sequelize.query(
                    `INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
                     VALUES ('confirme', ${escapeSQL(etu.parcours)}, ${parcoursId}, ${niveauId}, ${classeId}, ${anneeId}, ${demandeId}, ${userId}, NOW(), NOW(), NOW())`,
                    { transaction }
                );
                countCursus++;
            }

            await transaction.commit();

            console.log('\n' + '='.repeat(70));
            console.log('✅ IMPORT TERMINÉ AVEC SUCCÈS');
            console.log('='.repeat(70));
            console.log(`   - ${countEtudiants} utilisateurs créés`);
            console.log(`   - ${countApprenants} apprenants créés`);
            console.log(`   - ${countCursus} cursus créés`);
            console.log('\n⚠️  Les étudiants devront utiliser "Mot de passe oublié" pour se connecter.');

        } catch (error) {
            await transaction.rollback();
            console.error('\n❌ Erreur lors de l\'import, transaction annulée:', error);
            throw error;
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    }
}

main();
