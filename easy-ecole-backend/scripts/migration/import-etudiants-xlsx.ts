/**
 * IMPORT ÉTUDIANTS VIA FICHIER XLSX
 * =================================
 * Objectif : Importer les étudiants depuis un fichier Excel vers la nouvelle base.
 *            Le fichier doit être structuré avec les colonnes définies ci-dessous.
 *
 * Utilisation :
 *   npx ts-node scripts/migration/import-etudiants-xlsx.ts <chemin_du_fichier.xlsx>
 *
 * Format du fichier XLSX attendu :
 *   - Feuille 1 "Etudiants" : Données des étudiants
 *   - Feuille 2 "Cursus" (optionnel) : Parcours/cursus des étudiants
 *   - Feuille 3 "Notes" (optionnel) : Notes d'évaluation
 *
 * Colonnes attendues dans la feuille "Etudiants" :
 *   - identifiant (obligatoire) : Identifiant unique de l'étudiant
 *   - nom (obligatoire) : Nom de famille
 *   - prenoms (obligatoire) : Prénoms
 *   - email (optionnel) : Adresse email
 *   - contact (optionnel) : Numéro de téléphone
 *   - dateNaissance (optionnel) : Date de naissance (format JJ/MM/AAAA)
 *   - lieuNaissance (optionnel) : Lieu de naissance
 *   - sexe (optionnel) : M ou F
 *   - nationalite (optionnal) : Nationalité
 *   - numeroPiece (optionnel) : Numéro de pièce d'identité
 *   - typePiece (optionnel) : Type de pièce (CNI, Passeport, etc.)
 *   - anneeBac (optionnel) : Année d'obtention du bac
 *   - serieBac (optionnel) : Série du bac
 *   - anneePremiereInscription (optionnel) : Année de première inscription
 *
 * Colonnes attendues dans la feuille "Cursus" :
 *   - identifiantEtudiant (obligatoire) : Identifiant de l'étudiant (doit exister dans la feuille Etudiants)
 *   - parcours (obligatoire) : Nom du parcours/filière
 *   - niveau (obligatoire) : Niveau d'études (L1, L2, L3, M1, M2, etc.)
 *   - classe (obligatoire) : Classe
 *   - anneeAcademique (obligatoire) : Année académique (ex: 2024-2025)
 *   - statut (optionnel) : Statut du cursus (confirme, en_attente, etc.)
 *
 * Colonnes attendues dans la feuille "Notes" :
 *   - identifiantEtudiant (obligatoire) : Identifiant de l'étudiant
 *   - cours (obligatoire) : Code ou intitulé du cours
 *   - note (obligatoire) : Note obtenue
 *   - typeNote (optionnel) : Type de note (Devoir, Examen, etc.)
 *   - anneeAcademique (obligatoire) : Année académique
 *   - semestre (optionnel) : Semestre (semestre1, semestre2, etc.)
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import { Sequelize } from 'sequelize';
import { DatabaseConnection } from '../../src/core/helpers/DatabaseConnection';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ImportOptions {
    skipValidation: boolean;
    dryRun: boolean;
    verbose: boolean;
}

interface ImportResult {
    total: number;
    success: number;
    errors: number;
    warnings: number;
    details: {
        created: string[];
        updated: string[];
        skipped: string[];
        errors: { row: number; message: string }[];
    };
}

// ============================================================================
// VALIDATION DES DONNÉES
// ============================================================================

function validateEtudiant(row: any, rowIndex: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.identifiant || typeof row.identifiant !== 'string') {
        errors.push(`Ligne ${rowIndex}: identifiant manquant ou invalide`);
    }
    if (!row.nom || typeof row.nom !== 'string') {
        errors.push(`Ligne ${rowIndex}: nom manquant ou invalide`);
    }
    if (!row.prenoms || typeof row.prenoms !== 'string') {
        errors.push(`Ligne ${rowIndex}: prenoms manquant ou invalide`);
    }

    // Validation email si présent
    if (row.email && typeof row.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
            errors.push(`Ligne ${rowIndex}: email invalide (${row.email})`);
        }
    }

    // Validation date de naissance si présente
    if (row.dateNaissance && typeof row.dateNaissance === 'string') {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(row.dateNaissance)) {
            errors.push(`Ligne ${rowIndex}: dateNaissance invalide (format attendu: JJ/MM/AAAA)`);
        }
    }

    // Validation sexe si présent
    if (row.sexe && !['M', 'F', 'm', 'f'].includes(row.sexe)) {
        errors.push(`Ligne ${rowIndex}: sexe invalide (attendu: M ou F)`);
    }

    return { valid: errors.length === 0, errors };
}

function validateCursus(row: any, rowIndex: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.identifiantEtudiant || typeof row.identifiantEtudiant !== 'string') {
        errors.push(`Ligne ${rowIndex}: identifiantEtudiant manquant ou invalide`);
    }
    if (!row.parcours || typeof row.parcours !== 'string') {
        errors.push(`Ligne ${rowIndex}: parcours manquant ou invalide`);
    }
    if (!row.niveau || typeof row.niveau !== 'string') {
        errors.push(`Ligne ${rowIndex}: niveau manquant ou invalide`);
    }
    if (!row.classe || typeof row.classe !== 'string') {
        errors.push(`Ligne ${rowIndex}: classe manquant ou invalide`);
    }
    if (!row.anneeAcademique || typeof row.anneeAcademique !== 'string') {
        errors.push(`Ligne ${rowIndex}: anneeAcademique manquant ou invalide`);
    }

    return { valid: errors.length === 0, errors };
}

function validateNote(row: any, rowIndex: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.identifiantEtudiant || typeof row.identifiantEtudiant !== 'string') {
        errors.push(`Ligne ${rowIndex}: identifiantEtudiant manquant ou invalide`);
    }
    if (!row.cours || typeof row.cours !== 'string') {
        errors.push(`Ligne ${rowIndex}: cours manquant ou invalide`);
    }
    if (row.note === undefined || row.note === null || isNaN(Number(row.note))) {
        errors.push(`Ligne ${rowIndex}: note manquante ou invalide`);
    }
    if (!row.anneeAcademique || typeof row.anneeAcademique !== 'string') {
        errors.push(`Ligne ${rowIndex}: anneeAcademique manquant ou invalide`);
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month - 1, day);
}

function normalizeKey(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ============================================================================
// IMPORT PRINCIPAL
// ============================================================================

async function importEtudiants(filePath: string, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
        total: 0,
        success: 0,
        errors: 0,
        warnings: 0,
        details: {
            created: [],
            updated: [],
            skipped: [],
            errors: []
        }
    };

    // Lire le fichier XLSX
    const workbook = XLSX.readFile(filePath);
    const sheetEtudiants = workbook.Sheets['Etudiants'];
    const sheetCursus = workbook.Sheets['Cursus'];
    const sheetNotes = workbook.Sheets['Notes'];

    if (!sheetEtudiants) {
        throw new Error('Feuille "Etudiants" non trouvée dans le fichier');
    }

    // Convertir en JSON
    const etudiants = XLSX.utils.sheet_to_json(sheetEtudiants);
    const cursus = sheetCursus ? XLSX.utils.sheet_to_json(sheetCursus) : [];
    const notes = sheetNotes ? XLSX.utils.sheet_to_json(sheetNotes) : [];

    result.total = etudiants.length;

    if (options.verbose) {
        console.log(`\n📊 ${etudiants.length} étudiants trouvés dans le fichier`);
        console.log(`📊 ${cursus.length} cursus trouvés`);
        console.log(`📊 ${notes.length} notes trouvées\n`);
    }

    // Connexion à la base de données
    const db = DatabaseConnection.getInstance();
    const sequelize: Sequelize = db.sequelize;

    // Récupérer l'établissement par défaut
    const [etablissement] = await sequelize.query('SELECT MIN(id) as id FROM etablissements');
    const etablissementId = (etablissement as any)[0]?.id || 1;

    // Récupérer l'année académique courante
    const [anneeAcademique] = await sequelize.query(
        'SELECT id FROM ins_annees_academiques ORDER BY id DESC LIMIT 1'
    );
    const anneeAcademiqueId = (anneeAcademique as any)[0]?.id || 1;

    // Récupérer l'étape d'inscription "soumis"
    const [etapeSoumis] = await sequelize.query(
        "SELECT id FROM ins_etapes_inscription WHERE libelle = 'soumis' LIMIT 1"
    );
    const etapeSoumisId = (etapeSoumis as any)[0]?.id || 1;

    // Transaction pour l'import
    const transaction = await sequelize.transaction();

    try {
        // ====================================================================
        // ÉTAPE 1 : Importer les étudiants
        // ====================================================================
        if (options.verbose) console.log('\n🔄 Étape 1/3 : Import des étudiants...');

        const idMapping = new Map<string, { userId: number; apprenantId: number }>();

        for (let i = 0; i < etudiants.length; i++) {
            const row = etudiants[i] as any;
            const rowNum = i + 2; // +2 car la ligne 1 est l'en-tête

            // Validation
            if (!options.skipValidation) {
                const validation = validateEtudiant(row, rowNum);
                if (!validation.valid) {
                    result.errors++;
                    result.details.errors.push(...validation.errors.map(e => ({ row: rowNum, message: e })));
                    if (options.verbose) console.log(`  ❌ Ligne ${rowNum}: ${validation.errors.join(', ')}`);
                    continue;
                }
            }

            // Vérifier les doublons
            const [existingUser] = await sequelize.query(
                'SELECT id FROM aut_utilisateurs WHERE identifiant = ? OR email = ?',
                { replacements: [row.identifiant, row.email || ''], transaction }
            );

            if ((existingUser as any[]).length > 0) {
                result.warnings++;
                result.details.skipped.push(`Ligne ${rowNum}: étudiant déjà existant (${row.identifiant})`);
                if (options.verbose) console.log(`  ⚠️  Ligne ${rowNum}: étudiant déjà existant, ignoré`);
                continue;
            }

            // Créer l'utilisateur
            const [userId] = await sequelize.query(
                `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, 'APPRENANT', ?, 0, ?, NOW(), NOW())`,
                {
                    replacements: [
                        row.nom,
                        row.prenoms,
                        row.identifiant,
                        row.email || `migrated_${row.identifiant}@temp.local`,
                        '$2b$10$placeholderhashmustbechanged',
                        row.contact || null,
                        etablissementId
                    ],
                    transaction
                }
            );

            const newUserId = (userId as any).insertId;

            // Créer l'apprenant
            const [apprenantId] = await sequelize.query(
                `INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, anneeObtentionBac, serieBac, anneePremiereInscription, statutEtudiant, nombreInscriptions, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ancien', 1, NOW(), NOW())`,
                {
                    replacements: [
                        newUserId,
                        parseDate(row.dateNaissance) || null,
                        row.lieuNaissance || null,
                        row.sexe || 'M',
                        row.nationalite || 'Ivoirienne',
                        row.numeroPiece || null,
                        row.typePiece || null,
                        row.anneeBac || null,
                        row.serieBac || null,
                        row.anneePremiereInscription || null
                    ],
                    transaction
                }
            );

            const newApprenantId = (apprenantId as any).insertId;

            idMapping.set(normalizeKey(row.identifiant), { userId: newUserId, apprenantId: newApprenantId });

            result.success++;
            result.details.created.push(`Ligne ${rowNum}: ${row.nom} ${row.prenoms} (${row.identifiant})`);
            if (options.verbose) console.log(`  ✅ Ligne ${rowNum}: ${row.nom} ${row.prenoms} créé`);
        }

        // ====================================================================
        // ÉTAPE 2 : Importer les cursus
        // ====================================================================
        if (cursus.length > 0) {
            if (options.verbose) console.log('\n🔄 Étape 2/3 : Import des cursus...');

            for (let i = 0; i < cursus.length; i++) {
                const row = cursus[i] as any;
                const rowNum = i + 2;

                if (!options.skipValidation) {
                    const validation = validateCursus(row, rowNum);
                    if (!validation.valid) {
                        result.errors++;
                        result.details.errors.push(...validation.errors.map(e => ({ row: rowNum, message: e })));
                        if (options.verbose) console.log(`  ❌ Ligne ${rowNum}: ${validation.errors.join(', ')}`);
                        continue;
                    }
                }

                const mapping = idMapping.get(normalizeKey(row.identifiantEtudiant));
                if (!mapping) {
                    result.warnings++;
                    result.details.skipped.push(`Ligne ${rowNum}: étudiant ${row.identifiantEtudiant} non trouvé`);
                    if (options.verbose) console.log(`  ⚠️  Ligne ${rowNum}: étudiant non trouvé, cursus ignoré`);
                    continue;
                }

                // Récupérer ou créer le parcours
                const [parcours] = await sequelize.query(
                    'SELECT id FROM ins_parcours WHERE titre = ?',
                    { replacements: [row.parcours], transaction }
                );
                let parcoursId = (parcours as any[])[0]?.id;

                if (!parcoursId) {
                    const [newParcours] = await sequelize.query(
                        `INSERT INTO ins_parcours (titre, description, type, createdAt, updatedAt)
                         VALUES (?, ?, 'LICENCE', NOW(), NOW())`,
                        { replacements: [row.parcours, `Parcours migré: ${row.parcours}`], transaction }
                    );
                    parcoursId = (newParcours as any).insertId;
                }

                // Récupérer ou créer le niveau
                const [niveau] = await sequelize.query(
                    'SELECT id FROM ins_niveaux_etudes WHERE libelle = ?',
                    { replacements: [row.niveau], transaction }
                );
                let niveauId = (niveau as any[])[0]?.id;

                if (!niveauId) {
                    const [newNiveau] = await sequelize.query(
                        `INSERT INTO ins_niveaux_etudes (libelle, createdAt, updatedAt)
                         VALUES (?, NOW(), NOW())`,
                        { replacements: [row.niveau], transaction }
                    );
                    niveauId = (newNiveau as any).insertId;
                }

                // Récupérer ou créer la classe
                const [classe] = await sequelize.query(
                    'SELECT id FROM ins_classes WHERE libelle = ?',
                    { replacements: [row.classe], transaction }
                );
                let classeId = (classe as any[])[0]?.id;

                if (!classeId) {
                    const [newClasse] = await sequelize.query(
                        `INSERT INTO ins_classes (libelle, description, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt)
                         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                        { replacements: [row.classe, `Classe migrée: ${row.classe}`, niveauId, parcoursId, etablissementId], transaction }
                    );
                    classeId = (newClasse as any).insertId;
                }

                // Récupérer ou créer l'année académique
                const [annee] = await sequelize.query(
                    'SELECT id FROM ins_annees_academiques WHERE libelle = ?',
                    { replacements: [row.anneeAcademique], transaction }
                );
                let anneeId = (annee as any[])[0]?.id;

                if (!anneeId) {
                    const [newAnnee] = await sequelize.query(
                        `INSERT INTO ins_annees_academiques (libelle, description, createdAt, updatedAt)
                         VALUES (?, 'Année académique migrée', NOW(), NOW())`,
                        { replacements: [row.anneeAcademique], transaction }
                    );
                    anneeId = (newAnnee as any).insertId;
                }

                // Créer la demande d'inscription
                const matricule = `MIGR-${Date.now()}-${i}`;
                const [demandeId] = await sequelize.query(
                    `INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, etapeInscriptionId, utilisateurId, etablissementId, createdAt, updatedAt)
                     VALUES (?, 'inscription', 'valide', NOW(), ?, ?, ?, NOW(), NOW())`,
                    { replacements: [matricule, etapeSoumisId, mapping.userId, etablissementId], transaction }
                );

                const newDemandeId = (demandeId as any).insertId;

                // Créer le cursus apprenant
                await sequelize.query(
                    `INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
                    {
                        replacements: [
                            row.statut || 'confirme',
                            row.parcours,
                            parcoursId,
                            niveauId,
                            classeId,
                            anneeId,
                            newDemandeId,
                            mapping.userId
                        ],
                        transaction
                    }
                );

                if (options.verbose) console.log(`  ✅ Ligne ${rowNum}: cursus ${row.parcours} créé pour ${row.identifiantEtudiant}`);
            }
        }

        // ====================================================================
        // ÉTAPE 3 : Importer les notes
        // ====================================================================
        if (notes.length > 0) {
            if (options.verbose) console.log('\n🔄 Étape 3/3 : Import des notes...');

            for (let i = 0; i < notes.length; i++) {
                const row = notes[i] as any;
                const rowNum = i + 2;

                if (!options.skipValidation) {
                    const validation = validateNote(row, rowNum);
                    if (!validation.valid) {
                        result.errors++;
                        result.details.errors.push(...validation.errors.map(e => ({ row: rowNum, message: e })));
                        if (options.verbose) console.log(`  ❌ Ligne ${rowNum}: ${validation.errors.join(', ')}`);
                        continue;
                    }
                }

                const mapping = idMapping.get(normalizeKey(row.identifiantEtudiant));
                if (!mapping) {
                    result.warnings++;
                    result.details.skipped.push(`Ligne ${rowNum}: étudiant ${row.identifiantEtudiant} non trouvé`);
                    if (options.verbose) console.log(`  ⚠️  Ligne ${rowNum}: étudiant non trouvé, note ignorée`);
                    continue;
                }

                // Récupérer ou créer le cours
                const [cours] = await sequelize.query(
                    'SELECT id FROM ins_cours WHERE code = ? OR intitule = ?',
                    { replacements: [row.cours, row.cours], transaction }
                );
                let coursId = (cours as any[])[0]?.id;

                if (!coursId) {
                    const [newCours] = await sequelize.query(
                        `INSERT INTO ins_cours (code, intitule, credit, creditEcts, estObligatoire, description, semestre, categorieUe, createdAt, updatedAt)
                         VALUES (?, ?, 3, 3, true, ?, 'semestre1', 'MAJEURE', NOW(), NOW())`,
                        { replacements: [row.cours, row.cours, `Cours migré: ${row.cours}`], transaction }
                    );
                    coursId = (newCours as any).insertId;
                }

                // Récupérer le cursus apprenant de l'étudiant
                const [cursusApprenant] = await sequelize.query(
                    'SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ? ORDER BY id DESC LIMIT 1',
                    { replacements: [mapping.userId], transaction }
                );
                const cursusApprenantId = (cursusApprenant as any[])[0]?.id;

                if (!cursusApprenantId) {
                    result.warnings++;
                    result.details.skipped.push(`Ligne ${rowNum}: aucun cursus trouvé pour ${row.identifiantEtudiant}`);
                    if (options.verbose) console.log(`  ⚠️  Ligne ${rowNum}: aucun cursus trouvé, note ignorée`);
                    continue;
                }

                // Créer le cours participant
                const [coursParticipantId] = await sequelize.query(
                    `INSERT INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt)
                     VALUES (?, ?, ?, NOW(), NOW())`,
                    { replacements: [mapping.userId, coursId, cursusApprenantId], transaction }
                );

                const newCoursParticipantId = (coursParticipantId as any).insertId;

                // Créer la liste de notes si nécessaire
                const [listeNotes] = await sequelize.query(
                    `SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ? AND anneeAcademiqueId = ? LIMIT 1`,
                    { replacements: [coursId, anneeAcademiqueId], transaction }
                );
                let listeNotesId = (listeNotes as any[])[0]?.id;

                if (!listeNotesId) {
                    const [newListeNotes] = await sequelize.query(
                        `INSERT INTO ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, anneeAcademiqueId, createdAt, updatedAt)
                         VALUES (CURDATE(), '08:00:00', '12:00:00', 100, 3, ?, ?, NOW(), NOW())`,
                        { replacements: [coursId, anneeAcademiqueId], transaction }
                    );
                    listeNotesId = (newListeNotes as any).insertId;
                }

                // Créer la note
                await sequelize.query(
                    `INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt)
                     VALUES (?, 'publie', ?, ?, NOW(), NOW())`,
                    { replacements: [Number(row.note), listeNotesId, newCoursParticipantId], transaction }
                );

                if (options.verbose) console.log(`  ✅ Ligne ${rowNum}: note ${row.note} créée pour ${row.identifiantEtudiant}`);
            }
        }

        // Valider la transaction
        await transaction.commit();

        if (options.verbose) {
            console.log('\n✅ Import terminé avec succès !');
            console.log(`   - ${result.success} étudiants créés`);
            console.log(`   - ${result.warnings} avertissements`);
            console.log(`   - ${result.errors} erreurs`);
        }

    } catch (error) {
        await transaction.rollback();
        console.error('\n❌ Erreur lors de l\'import, transaction annulée:', error);
        throw error;
    }

    return result;
}

// ============================================================================
// GÉNÉRATION DU TEMPLATE XLSX
// ============================================================================

async function generateTemplate(outputPath: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Feuille Etudiants
    const etudiantsData = [
        {
            identifiant: 'ETU001',
            nom: 'DIALLO',
            prenoms: 'Aminata',
            email: 'aminata.diallo@email.com',
            contact: '+22890123456',
            dateNaissance: '15/03/2000',
            lieuNaissance: 'Lomé',
            sexe: 'F',
            nationalite: 'Togolaise',
            numeroPiece: 'CNI123456',
            typePiece: 'CNI',
            anneeBac: 2018,
            serieBac: 'C',
            anneePremiereInscription: 2018
        }
    ];
    const wsEtudiants = XLSX.utils.json_to_sheet(etudiantsData);
    XLSX.utils.book_append_sheet(workbook, wsEtudiants, 'Etudiants');

    // Feuille Cursus
    const cursusData = [
        {
            identifiantEtudiant: 'ETU001',
            parcours: 'Informatique',
            niveau: 'L1',
            classe: 'L1-INFO',
            anneeAcademique: '2024-2025',
            statut: 'confirme'
        }
    ];
    const wsCursus = XLSX.utils.json_to_sheet(cursusData);
    XLSX.utils.book_append_sheet(workbook, wsCursus, 'Cursus');

    // Feuille Notes
    const notesData = [
        {
            identifiantEtudiant: 'ETU001',
            cours: 'INFO101',
            note: 15.5,
            typeNote: 'Examen',
            anneeAcademique: '2024-2025',
            semestre: 'semestre1'
        }
    ];
    const wsNotes = XLSX.utils.json_to_sheet(notesData);
    XLSX.utils.book_append_sheet(workbook, wsNotes, 'Notes');

    XLSX.writeFile(workbook, outputPath);
    console.log(`✅ Template généré: ${outputPath}`);
}

// ============================================================================
// POINT D'ENTRÉE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    IMPORT ÉTUDIANTS VIA XLSX                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Utilisation :                                                               ║
║    npx ts-node scripts/migration/import-etudiants-xlsx.ts <fichier.xlsx>    ║
║    npx ts-node scripts/migration/import-etudiants-xlsx.ts --template        ║
║                                                                              ║
║  Options :                                                                   ║
║    --template    Génère un fichier template.xlsx                             ║
║    --skip-validation  Ignore la validation des données                       ║
║    --dry-run     Simule l'import sans modifier la base                      ║
║    --verbose     Affiche les détails de l'import                            ║
║                                                                              ║
║  Format du fichier :                                                         ║
║    - Feuille "Etudiants" : Données des étudiants (obligatoire)               ║
║    - Feuille "Cursus" : Parcours des étudiants (optionnel)                   ║
║    - Feuille "Notes" : Notes d'évaluation (optionnel)                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        `);
        return;
    }

    if (args.includes('--template')) {
        const templatePath = path.join(process.cwd(), 'template-import-etudiants.xlsx');
        await generateTemplate(templatePath);
        return;
    }

    const filePath = args.find(a => !a.startsWith('--'));
    if (!filePath) {
        console.error('❌ Erreur: chemin du fichier XLSX manquant');
        process.exit(1);
    }

    const options: ImportOptions = {
        skipValidation: args.includes('--skip-validation'),
        dryRun: args.includes('--dry-run'),
        verbose: args.includes('--verbose') || args.includes('-v')
    };

    console.log(`\n📂 Import du fichier: ${filePath}`);
    console.log(`   Options: ${JSON.stringify(options)}\n`);

    try {
        const result = await importEtudiants(filePath, options);

        console.log('\n' + '='.repeat(70));
        console.log('RÉSULTAT DE L\'IMPORT');
        console.log('='.repeat(70));
        console.log(`Total étudiants dans le fichier : ${result.total}`);
        console.log(`Importés avec succès           : ${result.success}`);
        console.log(`Avertissements                 : ${result.warnings}`);
        console.log(`Erreurs                        : ${result.errors}`);
        console.log('='.repeat(70));

        if (result.details.errors.length > 0) {
            console.log('\n❌ Erreurs détaillées:');
            result.details.errors.forEach(e => console.log(`   - Ligne ${e.row}: ${e.message}`));
        }

        if (result.details.skipped.length > 0) {
            console.log('\n⚠️  Éléments ignorés:');
            result.details.skipped.forEach(s => console.log(`   - ${s}`));
        }

        process.exit(result.errors > 0 ? 1 : 0);

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    }
}

main();
