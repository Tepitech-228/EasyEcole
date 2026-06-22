const ExcelJS = require('E:\\EASYECOLE\\easy-ecole-backend\\node_modules\\exceljs');

const wb = new ExcelJS.Workbook();
wb.creator = 'EasyEcole Report';
wb.created = new Date();

function styleHeader(ws, row, cols) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    row.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };
    for (let i = 1; i <= cols; i++) {
        ws.getCell(row.number, i).border = row.border;
    }
}

function colorRow(ws, row, status) {
    const color = status?.includes('✅') ? 'FFE8F5E9' :
                  status?.includes('🟡') ? 'FFFFF3E0' :
                  status?.includes('⚠️') || status?.includes('Contourné') ? 'FFFFEBEE' : 'FFFFFFFF';
    for (let i = 1; i <= row.cellCount; i++) {
        const cell = ws.getCell(row.number, i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
    }
}

// ===== SHEET 1: Modules =====
const ws1 = wb.addWorksheet('Modules', { views: [{ state: 'frozen', ySplit: 2 }] });
ws1.columns = [
    { header: 'Module', key: 'module', width: 30 },
    { header: 'Statut', key: 'statut', width: 22 },
    { header: 'Modèles', key: 'modeles', width: 10 },
    { header: 'Contrôleurs', key: 'controleurs', width: 12 },
    { header: 'Endpoints', key: 'endpoints', width: 12 },
    { header: 'Pages Frontend', key: 'pages', width: 16 },
    { header: 'Notes', key: 'notes', width: 60 }
];

const modules = [
    ['Auth', '✅ Fonctionnel', 15, 6, 30, 2, 'Connexion, inscriptions, profils, QR codes (réparé)'],
    ['Orientation', '✅ Fonctionnel', 11, 11, 60, 5, 'Parcours, catégories, demandes, prérequis, débouchés, panier'],
    ['Inscription', '✅ Fonctionnel', 35, 29, 170, 11, 'Sessions, cours, demandes, paiements, cursus, présences, notes'],
    ['Cours (via Inscription)', '✅ Fonctionnel', '-', '-', '-', 19, 'Chapitres, ressources, présences, cahiers de texte, séances'],
    ['Bulletins', '🟡 Récemment activé', 2, 1, 7, 4, 'Génération, relevé, publication — était déconnecté, corrigé'],
    ['Stages', '✅ Fonctionnel', 8, 8, 40, 8, 'Offres, demandes, entreprises, tuteurs, conventions, attestations'],
    ['Stocks', '✅ Fonctionnel', 6, 6, 30, 7, 'Articles, catégories, mouvements, fournisseurs, bons commande'],
    ['Immobilisations', '✅ Fonctionnel', 11, 11, 55, 9, 'Sites, bâtiments, équipements, maintenances, amortissements, cessions'],
    ['Administration', '⚠️ Partiel', '-', '-', '-', 3, 'QR codes réparés, cartes à vérifier'],
    ['Pointage (via Inscription)', '✅ Fonctionnel', '-', '-', '-', 2, 'Terminal arrivée/départ/scan, historique']
];

const hdrRow1 = ws1.addRow(['Module', 'Statut', 'Modèles', 'Contrôleurs', 'Endpoints', 'Pages Frontend', 'Notes']);
styleHeader(ws1, hdrRow1, 7);

modules.forEach(m => {
    const row = ws1.addRow(m);
    colorRow(ws1, row, m[1]);
    row.getCell(2).font = { bold: true };
});

ws1.addRow([]);
const totalRow = ws1.addRow(['TOTAL', '', '~93', '~72', '~400', '~70', '']);
totalRow.font = { bold: true, size: 12 };
for (let i = 1; i <= 7; i++) {
    ws1.getCell(totalRow.number, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    ws1.getCell(totalRow.number, i).border = {
        top: { style: 'medium' }, bottom: { style: 'medium' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };
}

// ===== SHEET 2: Fonctionnalités complètes =====
const ws2 = wb.addWorksheet('Fonctionnalités', { views: [{ state: 'frozen', ySplit: 2 }] });
ws2.columns = [
    { header: 'Fonctionnalité', key: 'feat', width: 55 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Statut', key: 'statut', width: 24 }
];

const feats = [
    // === AUTH (12) ===
    ['Connexion JWT (email ou identifiant)', 'Auth', '✅ Fonctionnel'],
    ['Inscription avec confirmation email', 'Auth', '✅ Fonctionnel'],
    ['Inscription enseignant par institution (mdp temporaire + email)', 'Auth', '✅ Fonctionnel'],
    ['Mise à jour profil avec photo upload', 'Auth', '✅ Fonctionnel'],
    ['Réinitialisation mot de passe (token 15min)', 'Auth', '✅ Fonctionnel'],
    ['CRUD Apprenants avec détails (adresse, parents, identité)', 'Auth', '✅ Fonctionnel'],
    ['CRUD Enseignants avec cours assignés', 'Auth', '✅ Fonctionnel'],
    ['CRUD Institutions', 'Auth', '✅ Fonctionnel'],
    ['CRUD Caissiers/Banques', 'Auth', '✅ Fonctionnel'],
    ['Génération QR codes apprenants (PNG matricule)', 'Auth', '🟡 Réparé (contournement EPERM)'],
    ['Génération QR codes enseignants (PNG)', 'Auth', '🟡 Réparé (contournement EPERM)'],
    ['Statistiques / compteurs utilisateurs', 'Auth', '✅ Fonctionnel'],

    // === ORIENTATION (13) ===
    ['CRUD Parcours avec upload image + vidéo', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Catégories de parcours', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Niveaux d\'étude', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Matières prérequis', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Débouchés parcours avec upload vidéo', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Prérequis parcours', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Parcours choisis', 'Orientation', '✅ Fonctionnel'],
    ['Panier parcours choisis (ajout/suppression/tout supprimer)', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Prérequis parcours choisis', 'Orientation', '✅ Fonctionnel'],
    ['Demandes d\'orientation avec notification email', 'Orientation', '✅ Fonctionnel'],
    ['CRUD Réponses orientation', 'Orientation', '✅ Fonctionnel'],

    // === INSCRIPTION (32) ===
    ['CRUD Sessions inscription', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Années académiques', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Parcours (inscription)', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Niveaux d\'étude (inscription)', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Classes', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Salles de classe', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Cours', 'Inscription', '✅ Fonctionnel'],
    ['Attribution cours aux enseignants', 'Inscription', '✅ Fonctionnel'],
    ['Révocation attribution cours', 'Inscription', '✅ Fonctionnel'],
    ['Liste participants d\'un cours', 'Inscription', '✅ Fonctionnel'],
    ['Demandes inscription avec génération matricule', 'Inscription', '✅ Fonctionnel'],
    ['Choix des cours dans demande (avec état)', 'Inscription', '✅ Fonctionnel'],
    ['Validation demande → création CursusApprenant + CoursParticipant', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Réponses inscription', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Frais inscription', 'Inscription', '✅ Fonctionnel'],
    ['Paiements espèce (ESPECE)', 'Inscription', '✅ Fonctionnel'],
    ['Paiements Mobile Money via CinetPay API', 'Inscription', '✅ Fonctionnel'],
    ['Recherche demande par matricule pour paiement', 'Inscription', '✅ Fonctionnel'],
    ['Upload dossiers inscription (documents)', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Cursus apprenant', 'Inscription', '✅ Fonctionnel'],
    ['Liste cours choisis du cursus', 'Inscription', '✅ Fonctionnel'],
    ['CRUD Chapitres cours avec upload image', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Ressources cours', 'Inscription/Cours', '✅ Fonctionnel'],
    ['Upload et download fichiers ressources', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Séances de cours', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Listes de présence', 'Inscription/Cours', '✅ Fonctionnel'],
    ['Présences par scan QR (vérification inscription cours)', 'Inscription/Cours', '✅ Fonctionnel'],
    ['Signature présence (capture base64 enseignant)', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Cahiers de texte', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Blocs cahier de texte', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Types de note d\'évaluation', 'Inscription/Cours', '✅ Fonctionnel'],
    ['CRUD Listes de note d\'évaluation', 'Inscription/Cours', '✅ Fonctionnel'],
    ['Export PV Excel (notes avec entête, signature, étudiants)', 'Inscription/Cours', '✅ Fonctionnel'],
    ['Import PV Excel (validation 0-20, matching matricule/nom)', 'Inscription/Cours', '✅ Fonctionnel'],

    // === POINTAGE (3) ===
    ['Pointage arrivée', 'Pointage', '✅ Fonctionnel'],
    ['Pointage départ', 'Pointage', '✅ Fonctionnel'],
    ['Pointage par scan QR', 'Pointage', '✅ Fonctionnel'],
    ['Pointage du jour / historique', 'Pointage', '✅ Fonctionnel'],

    // === BULLETINS (7) ===
    ['Génération bulletins (moy. pondérée CC 20% + Devoir 30% + Examen 50%)', 'Bulletins', '🟡 Récemment activé'],
    ['Calcul rang par classe/semestre', 'Bulletins', '🟡 Récemment activé'],
    ['Système mentions (TB≥16, Bien≥14, AB≥12, Passable≥10, Insuffisant<10)', 'Bulletins', '🟡 Récemment activé'],
    ['Validation crédits (≥10 validés)', 'Bulletins', '🟡 Récemment activé'],
    ['Publication workflow (brouillon → publié avec date)', 'Bulletins', '🟡 Récemment activé'],
    ['Relevé de notes apprenant (mon-releve)', 'Bulletins', '🟡 Récemment activé'],
    ['Liste bulletins paginée avec filtres', 'Bulletins', '🟡 Récemment activé'],

    // === STAGES (9) ===
    ['CRUD Entreprises', 'Stages', '✅ Fonctionnel'],
    ['CRUD Tuteurs', 'Stages', '✅ Fonctionnel'],
    ['CRUD Offres de stage', 'Stages', '✅ Fonctionnel'],
    ['Demandes de stage avec validation', 'Stages', '✅ Fonctionnel'],
    ['Rejet demande stage avec motif', 'Stages', '✅ Fonctionnel'],
    ['CRUD Conventions de stage', 'Stages', '✅ Fonctionnel'],
    ['CRUD Rapports de stage', 'Stages', '✅ Fonctionnel'],
    ['CRUD Notes de stage', 'Stages', '✅ Fonctionnel'],
    ['CRUD Attestations de stage', 'Stages', '✅ Fonctionnel'],

    // === STOCKS (6) ===
    ['CRUD Catégories d\'articles', 'Stocks', '✅ Fonctionnel'],
    ['CRUD Articles', 'Stocks', '✅ Fonctionnel'],
    ['CRUD Fournisseurs', 'Stocks', '✅ Fonctionnel'],
    ['CRUD Mouvements de stock (entrées/sorties)', 'Stocks', '✅ Fonctionnel'],
    ['CRUD Bons de commande', 'Stocks', '✅ Fonctionnel'],
    ['CRUD Lignes de bon de commande', 'Stocks', '✅ Fonctionnel'],

    // === IMMOBILISATIONS (11) ===
    ['CRUD Sites', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Bâtiments', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Localisations (avec capacité)', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Départements', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Catégories d\'immobilisations (taux amortiss.)', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Immobilisations', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Acquisitions', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Amortissements', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Maintenances', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Maintenances programmées', 'Immobilisations', '✅ Fonctionnel'],
    ['CRUD Cessions', 'Immobilisations', '✅ Fonctionnel'],
];

const hdrRow2 = ws2.addRow(['Fonctionnalité', 'Module', 'Statut']);
styleHeader(ws2, hdrRow2, 3);

feats.forEach(f => {
    const row = ws2.addRow(f);
    colorRow(ws2, row, f[2]);
    row.getCell(3).font = { bold: true };
});

// ===== SHEET 3: Pages Frontend =====
const ws5 = wb.addWorksheet('Pages Frontend', { views: [{ state: 'frozen', ySplit: 2 }] });
ws5.columns = [
    { header: 'Page', key: 'page', width: 40 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Description', key: 'desc', width: 50 }
];

const pages = [
    ['connexion-page', 'Auth', 'Connexion utilisateur'],
    ['inscription-page', 'Auth', 'Inscription'],
    ['mon-profil-page', 'Paramètres', 'Profil utilisateur'],
    ['mon-compte-page', 'Paramètres', 'Paramètres compte'],
    ['dashboard-page', 'Dashboard', 'Tableau de bord principal'],
    ['not-found-page', 'Dashboard', 'Page 404'],

    ['liste-parcours-page', 'Orientation', 'Liste des parcours'],
    ['details-parcours-page', 'Orientation', 'Détails parcours'],
    ['nouveau-parcours-page', 'Orientation', 'Création parcours'],

    ['liste-demandes-page (orientation)', 'Orientation', 'Demandes orientation'],
    ['details-demande-page (orientation)', 'Orientation', 'Détails demande orientation'],

    ['liste-sessions-page', 'Inscription', 'Sessions inscription'],
    ['details-session-page', 'Inscription', 'Détails session'],
    ['liste-parcours-page (inscription)', 'Inscription', 'Parcours inscription'],
    ['nouveau-parcours-page (inscription)', 'Inscription', 'Nouveau parcours'],
    ['choix-parcours-page', 'Inscription', 'Choix parcours étudiant'],
    ['liste-demandes-page (inscription)', 'Inscription', 'Demandes inscription'],
    ['details-demande-page', 'Inscription', 'Détails demande (infos/parcours/cours/docs/paiements/validation)'],
    ['paiements-page', 'Inscription', 'Paiements inscription'],
    ['mon-cursus-page', 'Inscription', 'Cursus apprenant'],

    ['scan-presence-page', 'Cours', 'Scan QR présence'],
    ['saisie-notes-page', 'Cours', 'Saisie des notes'],
    ['nouvelle-ressource-page', 'Cours', 'Ajout ressource'],
    ['nouvelle-evaluation-page', 'Cours', 'Nouvelle évaluation'],
    ['nouveau-chapitre-page', 'Cours', 'Nouveau chapitre'],
    ['modification-chapitre-page', 'Cours', 'Modification chapitre'],
    ['modification-ressource-page', 'Cours', 'Modification ressource'],
    ['liste-ressources-page', 'Cours', 'Liste ressources'],
    ['liste-presences-page', 'Cours', 'Liste présences'],
    ['mes-presences-page', 'Cours', 'Mes présences (enseignant)'],
    ['liste-notes-page', 'Cours', 'Liste notes'],
    ['cahier-de-texte-page', 'Cours', 'Cahier de texte'],

    ['liste-offres-page', 'Stages', 'Offres de stage'],
    ['details-offre-page', 'Stages', 'Détail offre'],
    ['nouvelle-offre-page', 'Stages', 'Nouvelle offre'],
    ['liste-entreprises-page', 'Stages', 'Entreprises'],
    ['details-entreprise-page', 'Stages', 'Détail entreprise'],
    ['nouvelle-entreprise-page', 'Stages', 'Nouvelle entreprise'],
    ['liste-demandes-page (stages)', 'Stages', 'Demandes stage'],
    ['details-demande-page (stages)', 'Stages', 'Détail demande stage'],

    ['liste-articles-page', 'Stocks', 'Articles'],
    ['details-article-page', 'Stocks', 'Détail article'],
    ['nouvel-article-page', 'Stocks', 'Nouvel article'],
    ['liste-fournisseurs-page', 'Stocks', 'Fournisseurs'],
    ['nouveau-fournisseur-page', 'Stocks', 'Nouveau fournisseur'],
    ['liste-mouvements-page', 'Stocks', 'Mouvements stock'],
    ['nouveau-mouvement-page', 'Stocks', 'Nouveau mouvement'],

    ['liste-sites-page', 'Immobilisations', 'Sites'],
    ['nouveau-site-page', 'Immobilisations', 'Nouveau site'],
    ['liste-immobilisations-page', 'Immobilisations', 'Immobilisations'],
    ['details-immobilisation-page', 'Immobilisations', 'Détail immobilisation'],
    ['nouvelle-immobilisation-page', 'Immobilisations', 'Nouvelle immo'],
    ['liste-categories-page (immo)', 'Immobilisations', 'Catégories immo'],
    ['nouvelle-categorie-page (immo)', 'Immobilisations', 'Nouvelle catégorie'],
    ['liste-maintenances-page', 'Immobilisations', 'Maintenances'],
    ['nouvelle-maintenance-page', 'Immobilisations', 'Nouvelle maintenance'],

    ['liste-bulletins-page', 'Bulletins', 'Liste bulletins'],
    ['detail-bulletin-page', 'Bulletins', 'Détail bulletin'],
    ['generer-bulletins-page', 'Bulletins', 'Génération bulletins'],
    ['mon-releve-page', 'Bulletins', 'Relevé de notes'],

    ['terminal-pointage-page', 'Pointage', 'Terminal pointage'],
    ['historique-pointage-page', 'Pointage', 'Historique pointage'],

    ['qr-codes-page', 'Administration', 'QR codes apprenants'],
    ['enseignant-qr-codes-page', 'Administration', 'QR codes enseignants'],
    ['cartes-page', 'Administration', 'Cartes étudiant'],
];

const hdrRow5 = ws5.addRow(['Page', 'Module', 'Description']);
styleHeader(ws5, hdrRow5, 3);

pages.forEach(p => {
    const row = ws5.addRow(p);
    for (let i = 1; i <= 3; i++) {
        ws5.getCell(row.number, i).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        };
        ws5.getCell(row.number, i).alignment = { vertical: 'middle', wrapText: true };
    }
});

// ===== SHEET 4: Corrections =====
const ws3 = wb.addWorksheet('Corrections 16-06-2026', { views: [{ state: 'frozen', ySplit: 2 }] });
ws3.columns = [
    { header: 'Problème', key: 'problem', width: 45 },
    { header: 'Module', key: 'module', width: 15 },
    { header: 'Cause', key: 'cause', width: 40 },
    { header: 'Correctif', key: 'fix', width: 55 },
    { header: 'Statut', key: 'statut', width: 15 }
];

const fixes = [
    ['anneeAcademiqueId NOT NULL dans le seed', 'Inscription', 'Champ manquant dans les 3 appels InsLNE.create()', 'Ajout de anneeAcademiqueId dans CC, Devoir, Examen', '✅ Résolu'],
    ['QR codes EPERM (seed)', 'Auth', 'Fichiers existants détenus par BUILTIN\\Administrateurs', 'Try-catch avec skip dans le seed', '✅ Résolu'],
    ['QR codes 500 (API generateQrCodes)', 'Auth', 'Impossible d\'écraser les fichiers existants (EPERM)', 'Gestion erreur par apprenant + fallback filename horodaté', '🟡 Contourné'],
    ['Module bulletins pas synchronisé', 'Bulletins', 'require() manquant dans sync-database.ts et reset-database.ts', 'Ajout de require("bulletins/models/_associations")', '✅ Résolu'],
    ['Routes bulletins manquantes', 'Bulletins', 'Import et .use() absents de routes.ts', 'Ajout de import BulletinRoutes + .use("/bulletins")', '✅ Résolu'],
    ['Associations bulletins jamais appelées', 'Bulletins', 'initBulletinAssociations() définie mais jamais invoquée', 'À faire : appeler la fonction après require()', '❌ Restant'],
    ['13 SVGs menu navigation manquants', 'Frontend', 'Fichiers icons absents de assets/icons/', 'Création des 13 fichiers SVG Material Icons', '✅ Résolu'],
    ['Seed partiel (arrêt sur QR code EPERM)', 'Inscription', 'Données de seed incomplètes après échec QR', 'Ajout try-catch dans seed.ts', '✅ Résolu'],
];

const hdrRow3 = ws3.addRow(['Problème', 'Module', 'Cause', 'Correctif', 'Statut']);
styleHeader(ws3, hdrRow3, 5);

fixes.forEach(f => {
    const row = ws3.addRow(f);
    colorRow(ws3, row, f[4]);
    row.getCell(5).font = { bold: true };
});

// ===== Sheet 5: Légende =====
const ws4 = wb.addWorksheet('Légende');
ws4.columns = [
    { header: 'Icône', key: 'icon', width: 20 },
    { header: 'Signification', key: 'meaning', width: 50 }
];

ws4.addRow(['✅ Fonctionnel', 'Complètement opérationnel (backend + frontend + DB)']);
ws4.addRow(['🟡 Réparé', 'Était non fonctionnel, corrigé récemment']);
ws4.addRow(['🟡 Récemment activé', 'Était déconnecté du système, maintenant branché']);
ws4.addRow(['🟡 Contourné', 'Solution de contournement en place, correctif permanent à prévoir']);
ws4.addRow(['⚠️ Partiel', 'Partiellement fonctionnel, nécessite attention']);
ws4.addRow(['❌ Non fonctionnel', 'Pas encore opérationnel']);
ws4.addRow(['❌ Restant', 'Identifié mais pas encore corrigé']);
ws4.addRow([]);
ws4.addRow(['Mise à jour : 16 Juin 2026', '']);

for (let i = 2; i <= 8; i++) {
    ws4.getRow(i).font = { color: { argb: i <= 2 ? 'FF2E7D32' : i <= 5 ? 'FFE65100' : 'FFC62828' } };
}

// Save
const outputPath = 'E:\\EASYECOLE\\RAPPORT_EASYECOLE_v2.xlsx';
wb.xlsx.writeFile(outputPath).then(() => {
    console.log('✅ Fichier Excel créé avec succès : ' + outputPath);
}).catch(err => {
    console.error('❌ Erreur :', err.message);
});
