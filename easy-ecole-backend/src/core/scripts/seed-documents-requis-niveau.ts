import 'dotenv/config'

/**
 * Seed du référentiel des documents obligatoires PAR NIVEAU d'inscription.
 *
 * Le référentiel est gérable (CRUD) : cette liste initiale peut être allongée
 * ou modifiée plus tard via l'API /inscription/documents-requis-niveau sans
 * toucher au code.
 *
 * Tronc commun (tous niveaux) + suppléments par niveau (années antérieures,
 * attestation de réussite pour le Master…), conformément à la procédure de
 * l'école.
 *
 * Idempotent : les documents déjà présents ne sont pas dupliqués.
 */
async function seedDocumentsRequisNiveau() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();
    const { DocumentRequisNiveau } = require('../../modules/inscription/models/DocumentRequisNiveau');
    require('../../modules/inscription/models/_associations');
    await sequelize.sync();

    const Model = DocumentRequisNiveau;

    // Tronc commun demandé à TOUS les niveaux.
    const TRONC_COMMUN: Array<{ code: string; libelle: string }> = [
        { code: 'demande_dg', libelle: 'Demande adressée au Directeur Général' },
        { code: 'bac_attestation_simple', libelle: 'Copie simple de l’attestation du Baccalauréat' },
        { code: 'bac_attestation_legalisee', libelle: 'Copie légalisée de l’attestation du Baccalauréat' },
        { code: 'bac_releve_simple', libelle: 'Copie simple du relevé de notes du Baccalauréat' },
        { code: 'bac_releve_legalise', libelle: 'Copie légalisée du relevé de notes du Baccalauréat' },
        { code: 'naissance_legalisee', libelle: 'Copie légalisée de l’acte de naissance' },
        { code: 'duplicata_nationalite', libelle: 'Duplicata de la nationalité' },
        { code: 'cni', libelle: 'Copie simple de la carte d’identité nationale' },
        { code: 'bordereau_inscription', libelle: 'Copie du bordereau d’inscription' },
        { code: 'photo_identite', libelle: 'Photo d’identité' },
        { code: 'recu_frais_dossier', libelle: 'Reçu des frais de dossier (2000 FCFA)' },
    ];

    const SUPPLEMENTS: Record<string, Array<{ code: string; libelle: string }>> = {
        '2e': [
            { code: 'releves_1ere', libelle: 'Copie simple et légalisée des relevés de notes de la 1ère année' },
        ],
        '3e': [
            { code: 'releves_1ere', libelle: 'Copie simple et légalisée des relevés de notes de la 1ère année' },
            { code: 'releves_2eme', libelle: 'Copie simple et légalisée des relevés de notes de la 1ère et 2ème année' },
        ],
        master: [
            { code: 'attestation_reussite', libelle: 'Attestation de réussite de la Licence' },
            { code: 'releves_licence', libelle: 'Relevés des notes des 3 années de Licence' },
        ],
    };

    // Niveau -> liste complète (tronc + suppléments éventuels).
    const niveaux: Record<string, Array<{ code: string; libelle: string }>> = {
        'LICENCE 1': TRONC_COMMUN,
        'LICENCE 2': [...TRONC_COMMUN, ...SUPPLEMENTS['2e']],
        'LICENCE 3': [...TRONC_COMMUN, ...SUPPLEMENTS['3e']],
        'MASTER 1': [...TRONC_COMMUN, ...SUPPLEMENTS.master],
        'MASTER 2': [...TRONC_COMMUN, ...SUPPLEMENTS.master],
        'DOCTORAT 1': TRONC_COMMUN,
        'DOCTORAT 2': TRONC_COMMUN,
        'DOCTORAT 3': TRONC_COMMUN,
        'MBA 1': TRONC_COMMUN,
        'MBA 2': TRONC_COMMUN,
        // BTS : par année pour coïncider avec les grades "BTS 1"/"BTS 2" des parcours.
        'BTS 1': TRONC_COMMUN,
        'BTS 2': TRONC_COMMUN,
        // Ancien niveau générique (conservé pour l'historique / compatibilité).
        'BTS': TRONC_COMMUN,
    };

    let created = 0;
    for (const [niveau, docs] of Object.entries(niveaux)) {
        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const [row] = await Model.findOrCreate({
                where: { niveau, code: doc.code },
                defaults: { libelle: doc.libelle, ordre: i, obligatoire: true },
            });
            // Mise à jour du libellé / ordre si le document existait déjà
            if (row.libelle !== doc.libelle || row.ordre !== i) {
                row.libelle = doc.libelle;
                row.ordre = i;
                await row.save();
            } else {
                created++;
            }
        }
    }

    const total = await Model.count();
    console.log(`[seed-documents-requis-niveau] Terminé. Total en base : ${total}.`);
    process.exit(0);
}

seedDocumentsRequisNiveau().catch((e: any) => {
    console.error('[seed-documents-requis-niveau] Erreur :', e);
    process.exit(1);
});
