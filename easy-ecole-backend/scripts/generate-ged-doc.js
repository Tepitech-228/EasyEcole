const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    PageBreak, TabStopPosition, TabStopType
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'GED_Module_Documentation.docx');

const COLORS = {
    primary: '1F4E79',
    secondary: '2E75B6',
    accent: 'C00000',
    light: 'D6E4F0',
    white: 'FFFFFF',
    dark: '333333',
    green: '548235',
    orange: 'BF8F00'
};

function headerCell(text, width) {
    return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: COLORS.primary },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: COLORS.white, size: 20 })], alignment: AlignmentType.CENTER })]
    });
}

function dataCell(text, width, opts = {}) {
    return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, bold: opts.bold, color: opts.color })], alignment: opts.align || AlignmentType.LEFT })]
    });
}

function section(title) {
    return new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 28, color: COLORS.primary })],
        spacing: { before: 400, after: 200 },
        heading: HeadingLevel.HEADING_1
    });
}

function subsection(title) {
    return new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 24, color: COLORS.secondary })],
        spacing: { before: 300, after: 150 },
        heading: HeadingLevel.HEADING_2
    });
}

function subsubsection(title) {
    return new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 22, color: COLORS.dark })],
        spacing: { before: 200, after: 100 },
        heading: HeadingLevel.HEADING_3
    });
}

function para(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, size: 20, color: opts.color || COLORS.dark, bold: opts.bold })],
        spacing: { after: opts.spacing || 100 },
        alignment: opts.align || AlignmentType.JUSTIFIED
    });
}

function bullet(text, level = 0) {
    return new Paragraph({
        children: [new TextRun({ text, size: 20, color: COLORS.dark })],
        spacing: { after: 60 },
        bullet: { level }
    });
}

function code(text) {
    return new Paragraph({
        children: [new TextRun({ text, size: 18, font: 'Consolas', color: COLORS.accent })],
        spacing: { after: 40 },
        indent: { left: 400 }
    });
}

const doc = new Document({
    styles: {
        default: {
            document: {
                run: { size: 20, font: 'Calibri' },
                paragraph: { spacing: { after: 100 } }
            }
        }
    },
    sections: [
        // ===== PAGE DE GARDE =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                new Paragraph({ spacing: { before: 3000 } }),
                new Paragraph({
                    children: [new TextRun({ text: 'EasyEcole', size: 52, bold: true, color: COLORS.primary })],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Module GED', size: 44, bold: true, color: COLORS.secondary })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Gestion Électronique de Documents', size: 32, color: COLORS.secondary })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Documentation Technique', size: 24, color: COLORS.dark, italics: true })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 2000 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Version 2.0 — Juillet 2026', size: 22, color: COLORS.dark })],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'EasyEcole - Tous droits réservés', size: 20, color: '888888' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 }
                })
            ]
        },

        // ===== 1. APERÇU GÉNÉRAL =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('1. Aperçu Général'),
                para('Le module GED (Gestion Électronique de Documents) d\'EasyEcole est un système complet de gestion documentaire conçu pour répondre aux besoins d\'une université. Il couvre l\'intégralité du cycle de vie des documents : création, stockage, classification, versioning, contrôle d\'accès, validation, archivage, audit et destruction.'),
                para('Le module GED a été développé pour gérer les documents académiques et administratifs tels que les bulletins de notes, relevés de notes, diplômes, certificats, décisions de délibération, bordereaux de paiement, quitus, procès-verbaux, et tout autre document produit par l\'établissement.'),

                subsection('1.1 Principes Fondamentaux'),
                bullet('Sécurité : Chaque document est protégé par un niveau de confidentialité (public, interne, restreint, confidentiel) avec un contrôle d\'accès basé sur les rôles et des autorisations ad-hoc.'),
                bullet('Intégrité : Empreinte SHA-256 calculée à l\'upload et vérifiable à tout moment.'),
                bullet('Traçabilité : Toute action sur un document est enregistrée dans une piste d\'audit horodatée.'),
                bullet('Cycle de vie : Les documents suivent un cycle de vie formel : courant → intermédiaire → définitif → à détruire.'),
                bullet('Versioning : Support des versions majeures et mineures avec conservation de l\'historique complet.'),

                subsection('1.2 Architecture Générale'),
                para('Le module GED suit une architecture Express en couches :'),
                bullet('Couche Route : Multer pour l\'upload, middleware d\'authentification et d\'autorisation'),
                bullet('Couche Contrôleur : Logique métier (CRUD, validation, versioning, cycle de vie)'),
                bullet('Couche Service : Services OCR, génération de référence, audit, cache'),
                bullet('Couche Modèle : Sequelize avec 10 modèles, relations, soft-delete'),

                new Paragraph({
                    children: [new TextRun({ text: 'Emplacement dans le projet :', bold: true, size: 20, color: COLORS.dark })],
                    spacing: { before: 200, after: 60 }
                }),
                code('src/modules/ged/'),
                code('├── controllers/   (7 contrôleurs)'),
                code('├── models/        (10 modèles + associations)'),
                code('├── routers/       (4 routeurs)'),
                code('├── scripts/       (migration SQL)'),
                code('├── seed.ts        (seed production)'),
                code('├── seed-ged-demo.ts (seed démo)'),
                code('└── GedModule.ts   (constantes)'),
            ]
        },

        // ===== 2. MODÈLES DE DONNÉES =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('2. Modèles de Données'),
                para('Le module GED contient 10 modèles Sequelize. Tous les modèles principaux utilisent le soft-delete (paranoid). Les tables sont préfixées par ged_.'),

                subsection('2.1 DocumentGed (ged_documents)'),
                para('Modèle principal représentant un document. 50+ champs répartis en catégories :'),

                subsubsection('Champs d\'identification'),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            headerCell('Champ', 25), headerCell('Type', 20), headerCell('Description', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('id', 25), dataCell('INTEGER PK', 20), dataCell('Identifiant unique auto-incrémenté', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('titre', 25), dataCell('STRING', 20), dataCell('Titre du document', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('reference', 25), dataCell('STRING', 20), dataCell('Référence unique auto-générée (ex: SCOL-REL-2026-00042)', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('fichier', 25), dataCell('STRING', 20), dataCell('Chemin relatif du fichier sur le disque', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('taille', 25), dataCell('STRING', 20), dataCell('Taille lisible (ex: 245.3 Ko)', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('integrityHash', 25), dataCell('STRING(64)', 20), dataCell('Empreinte SHA-256 du fichier', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('type', 25), dataCell('STRING', 20), dataCell('Type de fichier (PDF/TIFF)', 55)
                        ]}),
                    ]
                }),
                new Paragraph({ spacing: { after: 120 } }),

                subsubsection('Champs de cycle de vie'),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            headerCell('Champ', 25), headerCell('Type', 20), headerCell('Description', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('lifecycleStatus', 25), dataCell('ENUM', 20), dataCell('courant | intermediaire | definitif | a_detruire', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('confidentialityLevel', 25), dataCell('ENUM', 20), dataCell('public | interne | restreint | confidentiel', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('versionMajor', 25), dataCell('INTEGER', 20), dataCell('Version majeure', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('versionMinor', 25), dataCell('INTEGER', 20), dataCell('Version mineure', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('isCurrentVersion', 25), dataCell('BOOLEAN', 20), dataCell('Version active ?', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('isLocked', 25), dataCell('BOOLEAN', 20), dataCell('Document verrouillé ?', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('duaEndDate', 25), dataCell('DATEONLY', 20), dataCell('Fin de Durée d\'Utilisation Administrative', 55)
                        ]}),
                    ]
                }),
                new Paragraph({ spacing: { after: 120 } }),

                subsubsection('Champs OCR'),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            headerCell('Champ', 25), headerCell('Type', 20), headerCell('Description', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('nbPages', 25), dataCell('INTEGER', 20), dataCell('Nombre de pages', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('auteur', 25), dataCell('STRING', 20), dataCell('Auteur extrait des métadonnées PDF', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('contenuTexte', 25), dataCell('TEXT', 20), dataCell('Texte extrait (10 000 premiers caractères)', 55)
                        ]}),
                        new TableRow({ children: [
                            dataCell('dateDocument', 25), dataCell('DATEONLY', 20), dataCell('Date de création du document', 55)
                        ]}),
                    ]
                }),
                new Paragraph({ spacing: { after: 120 } }),

                subsubsection('Clés étrangères académiques'),
                para('Le modèle DocumentGed peut être lié aux entités académiques suivantes : anneeAcademiqueId, parcoursId, niveauEtudeId, semestre, classeId, salleId, cursusApprenantId, inscriptionDossierId, bulletinId, bordereauId.'),
                para('Ces liaisons permettent de classer les documents par contexte académique.', { spacing: 200 }),

                subsection('2.2 Modèles Secondaires'),
                para('Les autres modèles du module GED sont :'),
                bullet('Folder (ged_folders) : Dossiers organisés en arbre (parentId récursif) pour le classement des documents.'),
                bullet('DocumentType (ged_document_types) : Types de documents avec code court unique (ex: REL pour relevé), durée de conservation (DUA), et niveau de confidentialité par défaut.'),
                bullet('Domain (ged_domains) : Domaines documentaires (SCOL, RH, FIN, REC, GOUV, PAT, EXT).'),
                bullet('SessionGed (ged_sessions) : Sessions de collecte documentaire (ex: une campagne de numérisation).'),
                bullet('RolePermission (ged_role_permissions) : Mappage entre rôles utilisateur et niveaux de confidentialité accessibles.'),
                bullet('ReferenceCounter (ged_reference_counters) : Compteur atomique pour la génération de références uniques.'),
                bullet('DocumentAuditLog (ged_audit_logs) : Piste d\'audit complète de toutes les actions.'),
                bullet('DocumentAccessGrant (ged_document_access_grants) : Autorisations ad-hoc pour déroger aux niveaux de confidentialité.'),
                bullet('DisposalRecord (ged_disposal_records) : Demandes de destruction avec workflow validation/rejet.'),
            ]
        },

        // ===== 3. FONCTIONNEMENT DES FICHIERS =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('3. Fonctionnement des Fichiers'),
                para('Cette section détaille le cycle de vie complet d\'un fichier dans le module GED, de l\'upload à la destruction.'),

                subsection('3.1 Upload'),
                para('L\'upload est géré par Multer avec une configuration spécifique :'),
                bullet('Stockage : diskStorage vers le répertoire public/ged/'),
                bullet('Nom de fichier : {timestamp}-{nombre aléatoire}.{extension} (unicité garantie)'),
                bullet('Filtrage : seuls les fichiers PDF (application/pdf) et TIFF (image/tiff, image/x-tiff) sont acceptés'),
                bullet('Taille maximale : 50 Mo par fichier'),
                bullet('Type d\'upload : single (DocumentGedController.upload) ou array de 20 fichiers max (SessionGedController.uploadBatch)'),
                new Paragraph({ spacing: { after: 120 } }),

                para('Après l\'upload initial, plusieurs traitements sont exécutés :'),
                bullet('Déplacement dans un sous-dossier si un folderId est fourni'),
                bullet('Extraction OCR via OcrService (pages, auteur, date, mots-clés, texte intégral)'),
                bullet('Calcul de l\'empreinte SHA-256 du fichier pour garantir l\'intégrité'),
                bullet('Génération automatique d\'une référence si le domaine et le type de document sont fournis (format : DOMAINE-CODE-ANNÉE-SÉQUENCE)'),
                bullet('Construction d\'un chemin de classification à partir des références académiques'),
                bullet('Enregistrement de l\'action dans la piste d\'audit'),

                subsection('3.2 Stockage'),
                para('La structure des fichiers sur le disque est organisée comme suit :'),
                code('public/ged/'),
                code('├── {timestamp}-{random}.pdf          (fichier à la racine)'),
                code('├── {folderId}/'),
                code('│   └── {timestamp}-{random}.pdf      (dans un dossier)'),
                code('├── versions/'),
                code('│   └── v{maj}.{min}_{docId}.ext      (archives de versions)'),
                code('├── pdf/'),
                code('│   └── ged_document_{id}.pdf         (résumés exportés)'),
                code('└── seed_demo/'),
                code('    └── seed_*.pdf                     (fichiers de démo)'),
                new Paragraph({ spacing: { after: 120 } }),

                para('Le champ fichier dans la base de données stocke le chemin relatif avec des séparateurs / (forward slashes), garantissant la compatibilité cross-platform.', { spacing: 200 }),

                subsection('3.3 Téléchargement'),
                para('Le téléchargement d\'un fichier se fait via le endpoint GET /download/:id :'),
                bullet('Le contrôleur lit le document en base, récupère le chemin du fichier'),
                bullet('Le type MIME est déterminé par l\'extension (.pdf → application/pdf, .tiff → image/tiff)'),
                bullet('Le fichier est diffusé via fs.createReadStream (streaming, pas de chargement en mémoire)'),
                bullet('Content-Disposition est défini sur inline pour un affichage dans le navigateur'),
                bullet('L\'action est enregistrée dans la piste d\'audit'),

                subsection('3.4 Mise à jour et Remplacement'),
                para('La modification d\'un document (PUT /:id) permet de remplacer le fichier :'),
                bullet('L\'ancien fichier est supprimé physiquement du disque (fs.unlinkSync)'),
                bullet('Le nouveau fichier est traité comme un upload (OCR, hash, déplacement)'),
                bullet('Les métadonnées OCR sont mises à jour dans la base'),

                subsection('3.5 Versioning'),
                para('Le versioning permet de conserver l\'historique des modifications d\'un document :'),
                bullet('Le endpoint POST /:id/new-version crée une nouvelle version'),
                bullet('Le fichier actuel est copié dans public/ged/versions/v{maj}.{min}_{docId}.ext'),
                bullet('L\'incrémentation des versions :'),
                bullet('  mineur → versionMinor += 1', 1),
                bullet('  majeur → versionMajor += 1, versionMinor = 0', 1),
                bullet('Un nouvel enregistrement DocumentGed est créé avec isCurrentVersion = true'),
                bullet('L\'ancien enregistrement passe à isCurrentVersion = false'),
                bullet('Le nouveau document pointe vers l\'archive dans versions/'),

                subsection('3.6 Destruction'),
                para('Le processus de destruction suit un workflow en deux étapes :'),
                subsubsection('Étape 1 : Marquage'),
                bullet('Le endpoint PUT /:id/mark-for-deletion change le lifecycleStatus à a_detruire'),
                bullet('Un enregistrement DisposalRecord est créé avec le statut en_attente'),
                bullet('La raison de la destruction est requise'),
                subsubsection('Étape 2 : Confirmation'),
                bullet('Le endpoint POST /:id/confirm-deletion supprime physiquement le fichier du disque'),
                bullet('L\'enregistrement DocumentGed est soft-deleté (paranoid)'),
                bullet('Le DisposalRecord passe à validee'),
                bullet('Alternative : rejet de la demande → le document repasse à intermediaire'),
            ]
        },

        // ===== 4. CYCLE DE VIE =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('4. Cycle de Vie d\'un Document'),
                para('Le cycle de vie formel d\'un document dans le module GED suit le schéma suivant :'),

                subsubsection('États du cycle de vie'),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            headerCell('Statut', 20), headerCell('Description', 50), headerCell('Actions possibles', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('courant', 20), dataCell('Document actif, modifiable', 50), dataCell('Consulter, modifier, verrouiller, versionner, valider', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('intermediaire', 20, { shading: COLORS.light }), dataCell('Document validé, verrouillé', 50, { shading: COLORS.light }), dataCell('Consulter, télécharger, marquer pour destruction', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('definitif', 20), dataCell('Document archivé, non modifiable', 50), dataCell('Consulter uniquement', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('a_detruire', 20, { shading: COLORS.light }), dataCell('En attente de destruction', 50, { shading: COLORS.light }), dataCell('Confirmer destruction ou rejeter', 30, { shading: COLORS.light })
                        ]}),
                    ]
                }),
                new Paragraph({ spacing: { after: 200 } }),

                para('Le parcours typique est : Upload (courant) → Validation (intermediaire) → Marquage destruction (a_detruire) → Confirmation destruction (supprimé). Une restauration est possible après soft-delete.', { spacing: 200 }),

                subsection('4.1 Verrouillage'),
                para('Le verrouillage empêche les modifications concurrentes :'),
                bullet('Automatique lors de la validation (validate)'),
                bullet('Manuel via les endpoints lock/unlock'),
                bullet('Un document verrouillé par un utilisateur ne peut pas être modifié par un autre'),
                bullet('Le déverrouillage est possible par le propriétaire du verrou, un ADMIN ou INSTITUTION'),

                subsection('4.2 Confidentialité et Contrôle d\'Accès'),
                para('Quatre niveaux de confidentialité sont disponibles :'),
                bullet('public : Accessible à tous les utilisateurs authentifiés'),
                bullet('interne : Accessible selon les permissions de rôle'),
                bullet('restreint : Accessible selon les permissions de rôle + autorisation ad-hoc ou propriétaire'),
                bullet('confidentiel : Accessible uniquement sur autorisation ad-hoc'),
                para('Le middleware AuthConfidentiality vérifie à chaque consultation : le niveau de confidentialité du document, les permissions du rôle dans la table RolePermission, et les autorisations ad-hoc dans DocumentAccessGrant.', { spacing: 200 }),

                subsection('4.3 Piste d\'Audit'),
                para('13 types d\'actions sont tracés dans DocumentAuditLog : consultation, téléchargement, création, modification, validation, archivage, marquage_destruction, suppression_effective, restauration, nouvelle_version, verrouillage, deverrouillage, verification_integrite.'),
                para('Chaque entrée contient : documentId, userId, action, actionDate, et details (JSON).'),
            ]
        },

        // ===== 5. API ENDPOINTS =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('5. API Endpoints'),
                para('Tous les endpoints sont préfixés par /api/v1/ged. L\'authentification JWT est requise sur toutes les routes.'),

                subsection('5.1 Documents'),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            headerCell('Méthode', 12), headerCell('Route', 33), headerCell('Middleware', 25), headerCell('Description', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('GET', 12), dataCell('/documents', 33), dataCell('Authenticate', 25), dataCell('Liste paginée avec filtres', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('GET', 12, { shading: COLORS.light }), dataCell('/documents/:id', 33, { shading: COLORS.light }), dataCell('+ AuthConfidentiality', 25, { shading: COLORS.light }), dataCell('Détail d\'un document', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12), dataCell('/documents', 33), dataCell('+ AuthInstitution, multer', 25), dataCell('Upload d\'un document', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('PUT', 12, { shading: COLORS.light }), dataCell('/documents/:id', 33, { shading: COLORS.light }), dataCell('+ AuthInstitution, multer', 25, { shading: COLORS.light }), dataCell('Mettre à jour un document', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('GET', 12), dataCell('/documents/download/:id', 33), dataCell('+ AuthConfidentiality', 25), dataCell('Télécharger le fichier', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('GET', 12, { shading: COLORS.light }), dataCell('/documents/:id/pdf', 33, { shading: COLORS.light }), dataCell('+ AuthConfidentiality', 25, { shading: COLORS.light }), dataCell('Exporter le résumé PDF', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12), dataCell('/documents/:id/validate', 33), dataCell('+ AuthInstitution', 25), dataCell('Valider (courant → intermediaire)', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12, { shading: COLORS.light }), dataCell('/documents/:id/new-version', 33, { shading: COLORS.light }), dataCell('+ AuthInstitution', 25, { shading: COLORS.light }), dataCell('Créer une nouvelle version', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12), dataCell('/documents/:id/lock', 33), dataCell('+ AuthInstitution', 25), dataCell('Verrouiller', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12, { shading: COLORS.light }), dataCell('/documents/:id/unlock', 33, { shading: COLORS.light }), dataCell('+ AuthInstitution', 25, { shading: COLORS.light }), dataCell('Déverrouiller', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('PUT', 12), dataCell('/documents/:id/mark-for-deletion', 33), dataCell('ADMIN requis', 25), dataCell('Marquer pour destruction', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12, { shading: COLORS.light }), dataCell('/documents/:id/confirm-deletion', 33, { shading: COLORS.light }), dataCell('ADMIN requis', 25, { shading: COLORS.light }), dataCell('Confirmer la destruction', 30, { shading: COLORS.light })
                        ]}),
                        new TableRow({ children: [
                            dataCell('POST', 12), dataCell('/documents/:id/restore', 33), dataCell('ADMIN requis', 25), dataCell('Restaurer un document supprimé', 30)
                        ]}),
                        new TableRow({ children: [
                            dataCell('GET', 12, { shading: COLORS.light }), dataCell('/documents/:id/audit-trail', 33, { shading: COLORS.light }), dataCell('+ AuthConfidentiality', 25, { shading: COLORS.light }), dataCell('Piste d\'audit du document', 30, { shading: COLORS.light })
                        ]}),
                    ]
                }),
                new Paragraph({ spacing: { after: 200 } }),

                subsection('5.2 Sessions, Dossiers et Administration'),
                para('Les autres endpoints sont organisés comme suit :', { bold: true }),
                bullet('GET/POST /sessions — Liste et création de sessions de collecte'),
                bullet('GET/PUT /sessions/:id — Détail et modification d\'une session'),
                bullet('POST /sessions/batch-upload — Upload par lot (max 20 fichiers) dans une session'),
                bullet('GET /sessions/:id/share-link — Génération d\'un lien de partage chiffré (AES-256-CBC)'),
                bullet('GET/POST /folders — Liste et création de dossiers'),
                bullet('PUT/DELETE /folders/:id — Modification et suppression de dossier'),
                bullet('GET /admin/domains — Liste des domaines documentaires (avec cache 60s)'),
                bullet('GET /admin/document-types — Liste des types de documents'),
                bullet('GET/PUT /admin/confidentiality-roles — Gestion des permissions par niveau de confidentialité'),
                bullet('GET /admin/disposal — Liste des demandes de destruction'),
                bullet('POST /admin/disposal/:id/reject — Rejet d\'une demande de destruction'),
            ]
        },

        // ===== 6. SERVICES =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('6. Services Utilisés'),
                para('Le module GED s\'appuie sur plusieurs services spécialisés :'),

                subsubsection('6.1 OcrService'),
                para('Localisation : src/core/services/OcrService.ts'),
                para('Fonction : Extraction des métadonnées des fichiers PDF uploadés.'),
                bullet('Nombre de pages'),
                bullet('Auteur (métadonnées PDF)'),
                bullet('Date de création du document'),
                bullet('Mots-clés (20 termes les plus fréquents)'),
                bullet('Texte intégral (10 000 premiers caractères pour l\'indexation)'),
                para('Utilise la bibliothèque pdf-parse. Les fichiers non-PDF retournent des métadonnées vides.', { spacing: 100 }),

                subsubsection('6.2 ReferenceService'),
                para('Localisation : src/core/services/ReferenceService.ts'),
                para('Fonction : Génération atomique de références uniques au format DOMAINE-CODE-ANNÉE-SÉQUENCE.'),
                bullet('Exemple : SCOL-REL-2026-00147'),
                bullet('Utilise ReferenceCounter avec un compteur atomique (increment) pour éviter les doublons'),
                bullet('Le format est configurable via les codes courts des DocumentType'),

                subsubsection('6.3 AuditService'),
                para('Localisation : src/core/services/AuditService.ts'),
                para('Fonction : Enregistrement systématique de toutes les actions dans DocumentAuditLog.'),

                subsubsection('6.4 Cache (cacheged.ts)'),
                para('Localisation : src/modules/ged/controllers/cacheged.ts'),
                para('Fonction : Cache deux niveaux (mémoire in-process + Redis) utilisé par DomainController.list avec un TTL de 60 secondes.'),
            ]
        },

        // ===== 7. SÉCURITÉ =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('7. Sécurité'),
                para('Le module GED implémente plusieurs couches de sécurité :'),

                subsubsection('7.1 Authentification'),
                para('JWT (JSON Web Token) requis sur toutes les routes. Le token est passé dans le header Authorization: Bearer {token}. La vérification inclut le tokenVersion pour invalider les sessions.'),

                subsubsection('7.2 Autorisation'),
                para('Trois niveaux d\'autorisation sont disponibles :'),
                bullet('AuthInstitution : Accès réservé aux rôles INSTITUTION et ADMIN (opérations d\'écriture)'),
                bullet('AuthAdmin : Accès réservé au rôle ADMIN (opérations sensibles : destruction, permissions)'),
                bullet('AuthConfidentiality : Vérification du niveau de confidentialité du document avant accès'),

                subsubsection('7.3 Intégrité des Fichiers'),
                para('Chaque fichier uploadé reçoit une empreinte SHA-256 stockée dans integrityHash. Cette empreinte permet de vérifier à tout moment que le fichier n\'a pas été altéré.'),

                subsubsection('7.4 Piste d\'Audit'),
                para('Toutes les actions sont horodatées et liées à un utilisateur. La piste d\'audit est consultable document par document et permet une traçabilité complète.'),

                subsubsection('7.5 Sécurité des Fichiers Uploadés'),
                para('Les mesures suivantes sont en place :'),
                bullet('Filtrage par type MIME (PDF et TIFF uniquement)'),
                bullet('Limite de taille à 50 Mo'),
                bullet('Noms de fichiers générés (timestamp + aléatoire) pour éviter les injections path'),
                bullet('Stockage hors du répertoire public racine (dans public/ged/)'),
            ]
        },

        // ===== 8. GESTION DES ERREURS =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('8. Gestion des Erreurs'),
                para('Le module GED gère les erreurs de manière cohérente :'),
                bullet('404 : Document, dossier, session, ou type non trouvé → { success: false, message: "..." }'),
                bullet('403 : Accès refusé (rôle insuffisant ou niveau de confidentialité) → { success: false, message: "..." }'),
                bullet('400 : Erreur de validation (champs requis, statut incorrect) → { success: false, message: "..." }'),
                bullet('423 : Document verrouillé par un autre utilisateur → message explicite'),
                bullet('500 : Erreur serveur → { success: false, error: ... }'),
                para('Toutes les réponses d\'erreur incluent success: false et un message explicite en français.', { spacing: 200 }),
            ]
        },

        // ===== 9. BONNES PRATIQUES =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('9. Bonnes Pratiques et Recommandations'),
                para('Pour une utilisation optimale du module GED :'),

                subsubsection('9.1 Upload'),
                bullet('Toujours fournir un domainId et documentTypeId pour bénéficier de la génération automatique de référence'),
                bullet('Utiliser les dossiers (folderId) pour organiser les documents par contexte'),
                bullet('Pour les uploads massifs, privilégier le batch upload des sessions'),

                subsubsection('9.2 Versioning'),
                bullet('Utiliser les versions mineures pour les corrections mineures (typo, métadonnées)'),
                bullet('Utiliser les versions majeures pour les changements substantiels du contenu'),
                bullet('Le versioning conserve l\'historique complet mais augmente l\'utilisation du disque'),

                subsubsection('9.3 Cycle de Vie'),
                bullet('Valider les documents dès qu\'ils sont finalisés (passage en intermediaire)'),
                bullet('Le verrouillage automatique après validation empêche les modifications non autorisées'),
                bullet('Utiliser le marquage pour destruction avec une raison clairement documentée'),

                subsubsection('9.4 Performance'),
                bullet('Utiliser les filtres de la liste paginée pour limiter les résultats'),
                bullet('Les index FULLTEXT sur le champ contenuTexte permettent une recherche textuelle rapide'),
                bullet('Le cache des domaines (60s) réduit les accès base de données pour les données de référence'),
                bullet('Pour de très gros documents, le téléchargement en streaming évite la saturation mémoire'),
            ]
        },

        // ===== ANNEXE =====
        {
            properties: {
                page: {
                    margin: { top: 1500, bottom: 1500, left: 1500, right: 1500 }
                }
            },
            children: [
                section('Annexe : Liste des Fichiers du Module GED'),
                code('src/modules/ged/'),
                code('├── GedModule.ts'),
                code('├── GedRoutes.ts'),
                code('├── seed.ts'),
                code('├── seed-ged-demo.ts'),
                code('├── controllers/'),
                code('│   ├── DocumentGedController.ts'),
                code('│   ├── SessionGedController.ts'),
                code('│   ├── FolderController.ts'),
                code('│   ├── DomainController.ts'),
                code('│   ├── DocumentTypeController.ts'),
                code('│   ├── RolePermissionController.ts'),
                code('│   ├── DisposalController.ts'),
                code('│   └── cacheged.ts'),
                code('├── models/'),
                code('│   ├── _associations.ts'),
                code('│   ├── DocumentGed.ts'),
                code('│   ├── Folder.ts'),
                code('│   ├── SessionGed.ts'),
                code('│   ├── Domain.ts'),
                code('│   ├── DocumentType.ts'),
                code('│   ├── RolePermission.ts'),
                code('│   ├── ReferenceCounter.ts'),
                code('│   ├── DocumentAuditLog.ts'),
                code('│   ├── DocumentAccessGrant.ts'),
                code('│   └── DisposalRecord.ts'),
                code('├── routers/'),
                code('│   ├── DocumentGedRouter.ts'),
                code('│   ├── FolderRouter.ts'),
                code('│   ├── SessionGedRouter.ts'),
                code('│   └── AdminGedRouter.ts'),
                code('└── scripts/'),
                code('    └── migration-v2.sql'),
            ]
        }
    ]
});

async function main() {
    const docsDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(OUTPUT_PATH, buffer);
    console.log(`Documentation GED générée : ${OUTPUT_PATH}`);
}

main().catch(console.error);
