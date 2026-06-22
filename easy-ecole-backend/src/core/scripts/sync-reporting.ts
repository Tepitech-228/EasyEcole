import { Sequelize, Op, fn, col } from "sequelize";
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function syncReporting() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();
    console.log('Connected to database');

    // Load all source module models
    require('../../modules/auth/models/_associations');
    require('../../modules/orientation/models/_associations');
    require('../../modules/inscription/models/_associations');
    require('../../modules/stage/models/_associations');
    require('../../modules/stock/models/_associations');
    require('../../modules/immobilisation/models/_associations');
    require('../../modules/bulletins/models/_associations');
    require('../../modules/elearning/models/_associations');

    // Load reporting models
    require('../../modules/reporting/models/_associations');

    // Register reporting models for sync
    const RptEffectif = sequelize.model('RptEffectif');
    const RptInscription = sequelize.model('RptInscription');
    const RptNoteMoyenne = sequelize.model('RptNoteMoyenne');
    const RptPresence = sequelize.model('RptPresence');
    const RptReussite = sequelize.model('RptReussite');
    const RptDocumentAcademique = sequelize.model('RptDocumentAcademique');
    const RptPaiement = sequelize.model('RptPaiement');
    const RptBudgetVsReel = sequelize.model('RptBudgetVsReel');
    const RptFacture = sequelize.model('RptFacture');
    const RptEffectifRh = sequelize.model('RptEffectifRh');
    const RptPaie = sequelize.model('RptPaie');
    const RptFormationRh = sequelize.model('RptFormationRh');
    const RptEvaluation = sequelize.model('RptEvaluation');
    const RptAchat = sequelize.model('RptAchat');
    const RptStock = sequelize.model('RptStock');
    const RptImmobilisation = sequelize.model('RptImmobilisation');

    console.log('Clearing existing reporting data...');
    const rptModels = [
        RptEffectif, RptInscription, RptNoteMoyenne, RptPresence, RptReussite,
        RptDocumentAcademique, RptPaiement, RptBudgetVsReel, RptFacture,
        RptEffectifRh, RptPaie, RptFormationRh, RptEvaluation, RptAchat,
        RptStock, RptImmobilisation
    ];
    for (const m of rptModels) {
        await m.destroy({ where: {}, truncate: true });
    }
    console.log('Done clearing');

    // ── SOURCE MODELS ──
    const AutUtilisateur = sequelize.model('AutUtilisateur');
    const InsDemandeInscription = sequelize.model('InsDemandeInscription');
    const InsCursusApprenant = sequelize.model('InsCursusApprenant');
    const InsClasse = sequelize.model('InsClasse');
    const InsCours = sequelize.model('InsCours');
    const InsSeance = sequelize.model('InsSeance');
    const InsPresence = sequelize.model('InsPresence');
    const InsListePresence = sequelize.model('InsListePresence');
    const InsCoursParticipant = sequelize.model('InsCoursParticipant');
    const InsPaiementInscription = sequelize.model('InsPaiementInscription');
    const InsSession = sequelize.model('InsSession');
    const InsNoteEvaluation = sequelize.model('InsNoteEvaluation');
    const InsListeNoteEvaluation = sequelize.model('InsListeNoteEvaluation');
    const InsAnneeAcademique = sequelize.model('InsAnneeAcademique');
    const Bulletin = sequelize.model('Bulletin');
    const StkArticle = sequelize.model('StkArticle');
    const StkBonCommande = sequelize.model('StkBonCommande');
    const StkCategorieArticle = sequelize.model('StkCategorieArticle');
    const ImmImmobilisation = sequelize.model('ImmImmobilisation');
    const ImmCategorieImmobilisation = sequelize.model('ImmCategorieImmobilisation');
    const ImmAcquisition = sequelize.model('ImmAcquisition');
    const ImmAmortissement = sequelize.model('ImmAmortissement');

    try {
        // ═══════════════════════════════════════════
        //  rpt_effectifs
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_effectifs...');
        const curSus = await InsCursusApprenant.findAll({
            include: [
                { association: 'classe' },
                { association: 'anneeAcademique' },
                { association: 'utilisateur' }
            ]
        });
        const effectifMap = new Map<string, any>();
        for (const cur of curSus) {
            const classe: any = (cur as any).classe;
            const annee: any = (cur as any).anneeAcademique;
            const user: any = (cur as any).utilisateur;
            const key = `${(classe as any)?.id || 'null'}_${(annee as any)?.libelle || 'inconnu'}`;
            if (!effectifMap.has(key)) {
                effectifMap.set(key, {
                    classeId: (classe as any)?.id || null,
                    periode: (annee as any)?.libelle || 'inconnu',
                    nbInscrits: 0,
                    nbActifs: 0,
                    nbHommes: 0,
                    nbFemmes: 0
                });
            }
            const entry = effectifMap.get(key)!;
            entry.nbInscrits++;
            // Consider "actif" = not deleted (paranoid)
            entry.nbActifs++;
            // Basic gender inference from prenoms (approximate)
            const prenoms = (user as any)?.prenoms || '';
            const lastChar = prenoms.slice(-1).toLowerCase();
            if (['a', 'e', 'i', 'o', 'u', 'y'].includes(lastChar) && prenoms.length > 0) {
                entry.nbFemmes++;
            } else {
                entry.nbHommes++;
            }
        }
        for (const entry of effectifMap.values()) {
            await RptEffectif.create(entry);
        }
        console.log(`  Inserted ${effectifMap.size} rows`);

        // ═══════════════════════════════════════════
        //  rpt_inscriptions
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_inscriptions...');
        const demandes = await InsDemandeInscription.findAll({
            include: [
                { association: 'session' },
                { association: 'paiementsInscription' }
            ]
        });
        const inscMap = new Map<string, any>();
        for (const d of demandes) {
            const session: any = (d as any).session;
            const sessionId = (session as any)?.id || null;
            const dateKey = d.createdAt ? d.createdAt.toISOString().split('T')[0] : 'inconnu';
            const key = `${sessionId}_${dateKey}`;
            if (!inscMap.has(key)) {
                inscMap.set(key, {
                    sessionId,
                    date: d.createdAt || new Date(),
                    nbInscrits: 0,
                    montantTotal: 0,
                    statut: 'validee'
                });
            }
            const entry = inscMap.get(key)!;
            entry.nbInscrits++;
            const paiements: any[] = (d as any).paiementsInscription || [];
            for (const p of paiements) {
                entry.montantTotal += Number((p as any).montant) || 0;
            }
        }
        for (const entry of inscMap.values()) {
            await RptInscription.create(entry);
        }
        console.log(`  Inserted ${inscMap.size} rows`);

        // ═══════════════════════════════════════════
        //  rpt_notes_moyennes
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_notes_moyennes...');
        const listesNotes = await InsListeNoteEvaluation.findAll({
            include: [
                { association: 'cours' },
                { association: 'anneeAcademique' },
                { association: 'notesEvaluation' },
                { association: 'coursParticipant' }
            ]
        });
        for (const ln of listesNotes) {
            const notes: any[] = (ln as any).notesEvaluation || [];
            if (notes.length === 0) continue;
            const cours: any = (ln as any).cours;
            const annee: any = (ln as any).anneeAcademique;
            const valeurs = notes.map(n => Number(n.note) || 0);
            const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            await RptNoteMoyenne.create({
                classeId: (cours as any)?.classeId || null,
                matiereId: null,
                periode: (annee as any)?.libelle || 'inconnu',
                moyenneClasse: Math.round(moyenne * 100) / 100,
                min: Math.min(...valeurs),
                max: Math.max(...valeurs),
                nbEtudiants: valeurs.length
            });
        }
        console.log(`  Inserted ${listesNotes.length > 0 ? listesNotes.length : 0} rows`);

        // ═══════════════════════════════════════════
        //  rpt_presences
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_presences...');
        const listesPres = await InsListePresence.findAll({
            include: [
                { association: 'cours' },
                { association: 'presences' }
            ]
        });
        for (const lp of listesPres) {
            const cours: any = (lp as any).cours;
            const presences: any[] = (lp as any).presences || [];
            const nbPresent = presences.filter(p => !p.estAbsent).length;
            const nbAbsent = presences.filter(p => p.estAbsent).length;
            const total = nbPresent + nbAbsent;
            await RptPresence.create({
                coursId: (cours as any)?.id || null,
                seanceId: null,
                date: lp.createdAt || new Date(),
                nbPresent,
                nbAbsent,
                taux: total > 0 ? Math.round((nbPresent / total) * 10000) / 100 : 0
            });
        }
        console.log(`  Inserted ${listesPres.length} rows`);

        // ═══════════════════════════════════════════
        //  rpt_reussite
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_reussite...');
        const bulletins = await Bulletin.findAll({
            include: [
                { association: 'classe' },
                { association: 'anneeAcademique' }
            ]
        });
        const reussiteMap = new Map<string, { nbAdmis: number; nbEchoues: number; classeId: number | null; semestre: string; annee: string }>();
        for (const b of bulletins) {
            const bAny = b as any;
            const classe: any = bAny.classe;
            const annee: any = bAny.anneeAcademique;
            const key = `${(classe as any)?.id || 'null'}_${bAny.semestre}_${(annee as any)?.libelle || 'inconnu'}`;
            if (!reussiteMap.has(key)) {
                reussiteMap.set(key, {
                    classeId: (classe as any)?.id || null,
                    semestre: bAny.semestre,
                    annee: (annee as any)?.libelle || 'inconnu',
                    nbAdmis: 0,
                    nbEchoues: 0
                });
            }
            const entry = reussiteMap.get(key)!;
            if (bAny.statut === 'publie' && bAny.moyenneGenerale !== null) {
                if (Number(bAny.moyenneGenerale) >= 10) {
                    entry.nbAdmis++;
                } else {
                    entry.nbEchoues++;
                }
            }
        }
        for (const [key, val] of reussiteMap.entries()) {
            const total = val.nbAdmis + val.nbEchoues;
            await RptReussite.create({
                classeId: val.classeId,
                semestre: val.semestre,
                annee: val.annee,
                nbAdmis: val.nbAdmis,
                nbEchoues: val.nbEchoues,
                tauxReussite: total > 0 ? Math.round((val.nbAdmis / total) * 10000) / 100 : 0
            });
        }
        console.log(`  Inserted ${reussiteMap.size} rows`);

        // ═══════════════════════════════════════════
        //  rpt_documents_academiques
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_documents_academiques...');
        const DemandeInscriptionDossier = sequelize.model('InsDemandeInscriptionDossier');
        const DossierInscription = sequelize.model('InsDossierInscription');
        const dossiersCount = await DossierInscription.count();
        const dossiersDemandeCount = await DemandeInscriptionDossier.count();
        await RptDocumentAcademique.create({
            typeDocument: 'dossier_inscription',
            periode: new Date().toISOString().slice(0, 7),
            nbDemandes: dossiersDemandeCount,
            nbDelivres: dossiersCount
        });
        console.log('  Inserted 1 row');

        // ═══════════════════════════════════════════
        //  rpt_paiements
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_paiements...');
        const paiements = await InsPaiementInscription.findAll();
        const paiementMap = new Map<string, any>();
        for (const p of paiements) {
            const pAny = p as any;
            const dateKey = pAny.datePaiement ? new Date(pAny.datePaiement).toISOString().split('T')[0] : 'inconnu';
            const mode = pAny.type || 'espece';
            const key = `${dateKey}_${mode}`;
            if (!paiementMap.has(key)) {
                paiementMap.set(key, {
                    date: pAny.datePaiement || new Date(),
                    modePaiement: mode,
                    montantTotal: 0,
                    nbTransactions: 0
                });
            }
            const entry = paiementMap.get(key)!;
            entry.montantTotal += Number(pAny.montant) || 0;
            entry.nbTransactions++;
        }
        for (const entry of paiementMap.values()) {
            await RptPaiement.create(entry);
        }
        console.log(`  Inserted ${paiementMap.size} rows`);

        // ═══════════════════════════════════════════
        //  rpt_factures
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_factures...');
        const paiementsByMonth = await InsPaiementInscription.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('datePaiement'), '%Y-%m'), 'mois'],
                [fn('COUNT', col('id')), 'nbFactures'],
                [fn('SUM', col('montant')), 'montantTotal']
            ],
            group: ['mois'],
            raw: true
        });
        for (const row of paiementsByMonth) {
            await RptFacture.create({
                mois: (row as any).mois,
                nbFactures: Number((row as any).nbFactures) || 0,
                montantTotal: Number((row as any).montantTotal) || 0,
                statut: 'paye'
            });
        }
        console.log(`  Inserted ${paiementsByMonth.length} rows`);

        // ═══════════════════════════════════════════
        //  rpt_budget_vs_reel
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_budget_vs_reel...');
        // No budget table exists yet - insert placeholder
        await RptBudgetVsReel.create({
            departementId: null,
            periode: new Date().toISOString().slice(0, 7),
            budgetPrevu: 0,
            budgetReel: 0,
            ecart: 0
        });
        console.log('  Inserted placeholder row');

        // ═══════════════════════════════════════════
        //  rpt_stocks
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_stocks...');
        const articles = await StkArticle.findAll({
            include: [{ association: 'categorie' }]
        });
        for (const a of articles) {
            const aAny = a as any;
            await RptStock.create({
                articleId: Number(aAny.id) || null,
                stockActuel: Number(aAny.stockActuel) || 0,
                stockAlerte: Number(aAny.stockMinimum) || 0,
                valeurStock: (Number(aAny.stockActuel) || 0) * (Number(aAny.prixUnitaire) || 0)
            });
        }
        console.log(`  Inserted ${articles.length} rows`);

        // ═══════════════════════════════════════════
        //  rpt_achats
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_achats...');
        const bonsCommandes = await StkBonCommande.findAll({
            include: [{ association: 'fournisseur' }]
        });
        const achatMap = new Map<string, any>();
        for (const bc of bonsCommandes) {
            const bcAny = bc as any;
            const mois = bcAny.dateCommande ? new Date(bcAny.dateCommande).toISOString().slice(0, 7) : 'inconnu';
            const key = mois;
            if (!achatMap.has(key)) {
                achatMap.set(key, {
                    categorieId: null,
                    periode: mois,
                    nbDemandes: 0,
                    nbCommandes: 0,
                    montantTotal: 0
                });
            }
            const entry = achatMap.get(key)!;
            entry.nbCommandes++;
            entry.montantTotal += Number(bcAny.montantTotal) || 0;
        }
        for (const entry of achatMap.values()) {
            await RptAchat.create(entry);
        }
        console.log(`  Inserted ${achatMap.size} rows`);

        // ═══════════════════════════════════════════
        //  rpt_immobilisations
        // ═══════════════════════════════════════════
        console.log('Aggregating rpt_immobilisations...');
        const immobilisations = await ImmImmobilisation.findAll({
            include: [
                { association: 'categorie' },
                { association: 'acquisitions' },
                { association: 'amortissements' }
            ]
        });
        const immoMap = new Map<number | null, any>();
        for (const im of immobilisations) {
            const imAny = im as any;
            const cat: any = imAny.categorie;
            const catId = (cat as any)?.id || null;
            if (!immoMap.has(catId)) {
                immoMap.set(catId, {
                    categorieId: catId,
                    nbActifs: 0,
                    valeurAcquisition: 0,
                    amortissementTotal: 0,
                    valeurNet: 0
                });
            }
            const entry = immoMap.get(catId)!;
            entry.nbActifs++;
            const acqs: any[] = imAny.acquisitions || [];
            for (const a of acqs) {
                entry.valeurAcquisition += Number(a.valeurAcquisition) || 0;
            }
            const amorts: any[] = imAny.amortissements || [];
            for (const a of amorts) {
                entry.amortissementTotal += Number(a.montant) || 0;
            }
        }
        for (const entry of immoMap.values()) {
            entry.valeurNet = entry.valeurAcquisition - entry.amortissementTotal;
            await RptImmobilisation.create(entry);
        }
        console.log(`  Inserted ${immoMap.size} rows`);

        console.log('\n✅ Reporting sync completed successfully');
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncReporting();
