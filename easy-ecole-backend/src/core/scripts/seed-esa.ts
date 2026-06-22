import { DatabaseConnection } from '../helpers/DatabaseConnection';

async function seedESA() {
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/orientation/models/_associations');
    require('../../modules/inscription/models/_associations');

    const M = (name: string) => sequelize.model(name);

    const OriCat = M('OriCategorie');
    const OriNiv = M('ori_NiveauEtude');
    const OriPar = M('OriParcours');

    const InsNiv = M('InsNiveauEtude');
    const InsPar = M('InsParcours');
    const InsCours = M('InsCours');

    console.log('\n── SEED ESA : FILIÈRES 2026 ──\n');

    const nivBTS: any = await OriNiv.findOrCreate({ where: { libelle: 'BTS' }, defaults: { libelle: 'BTS' } });
    const nivLicence: any = await OriNiv.findOrCreate({ where: { libelle: 'Licence' }, defaults: { libelle: 'Licence' } });
    const nivMaster: any = await OriNiv.findOrCreate({ where: { libelle: 'Master' }, defaults: { libelle: 'Master' } });
    const nivMBA: any = await OriNiv.findOrCreate({ where: { libelle: 'MBA' }, defaults: { libelle: 'MBA' } });
    console.log('  ✓ Niveaux orientation : BTS, Licence, Master, MBA');

    const insNivBTS = (await InsNiv.findOrCreate({ where: { libelle: 'BTS' }, defaults: { libelle: 'BTS' } }))[0] as any;
    const insNivLicence = (await InsNiv.findOrCreate({ where: { libelle: 'Licence' }, defaults: { libelle: 'Licence' } }))[0] as any;
    const insNivMaster = (await InsNiv.findOrCreate({ where: { libelle: 'Master' }, defaults: { libelle: 'Master' } }))[0] as any;
    const insNivMBA = (await InsNiv.findOrCreate({ where: { libelle: 'MBA' }, defaults: { libelle: 'MBA' } }))[0] as any;
    console.log('  ✓ Niveaux inscription : BTS, Licence, Master, MBA');

    const categories = [
        { libelle: 'Gestion et Finance', description: 'Gestion, finance, banque, assurance, comptabilité, audit, fiscalité' },
        { libelle: 'Administration et Management', description: 'Administration, GRH, gestion de projet, marchés publics' },
        { libelle: 'Commerce et Logistique', description: 'Commerce international, transport, logistique' },
        { libelle: 'Développement et Social', description: 'Agro business, développement social, QSE, collectivités' },
        { libelle: 'Marketing et Communication', description: 'Marketing, communication, journalisme, diplomatie' },
        { libelle: 'Tourisme et Sport', description: 'Tourisme, hôtellerie, management sportif' },
        { libelle: 'Informatique et Ingénierie', description: 'Génie logiciel, cybersécurité, réseaux, génies industriels' },
        { libelle: 'Sciences Appliquées', description: 'Économétrie, documentation, aquaculture, technologies alimentaires' },
        { libelle: 'MBA', description: 'MBA en gestion et leadership' },
    ];

    const catRecords: any = {};
    for (const c of categories) {
        const [cat] = await OriCat.findOrCreate({ where: { libelle: c.libelle }, defaults: c });
        catRecords[c.libelle] = cat;
    }
    console.log(`  ✓ ${categories.length} Catégories ESA`);

    interface ParcoursSeed {
        titre: string;
        categorie: string;
        niveaux: string[];
        duree: string;
        contenu: string;
        cours: string[];
    }

    const parcoursData: ParcoursSeed[] = [
        // ── Gestion et Finance ──
        { titre: 'Gestion et Finance', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en gestion financière, analyse financière et management des organisations.', cours: ['Comptabilité générale', 'Comptabilité analytique', 'Mathématiques financières', 'Analyse financière', 'Gestion financière', 'Fiscalité', 'Droit des affaires', 'Économie générale', 'Marketing fondamental', 'Gestion des ressources humaines', 'Statistiques', 'Anglais des affaires', 'Stage professionnel'] },
        { titre: 'Banque et Assurance', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation aux métiers de la banque et de l\'assurance : gestion des risques, produits financiers.', cours: ['Comptabilité bancaire', 'Mathématiques financières', 'Gestion des risques', 'Marchés financiers', 'Produits bancaires', 'Assurance', 'Droit bancaire', 'Fiscalité', 'Analyse financière', 'Stage professionnel'] },
        { titre: 'Banque et Finance', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation spécialisée en banque et finance d\'entreprise.', cours: ['Comptabilité générale', 'Comptabilité bancaire', 'Mathématiques financières', 'Analyse financière', 'Gestion des risques', 'Économie monétaire', 'Marchés financiers', 'Fiscalité', 'Droit bancaire', 'Microfinance', 'Gestion de portefeuille', 'Stage professionnel'] },
        { titre: 'Monnaie et Finance', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en économie monétaire, finance internationale et politique financière.', cours: ['Économie monétaire', 'Politique financière', 'Finance internationale', 'Marchés des capitaux', 'Analyse financière', 'Économétrie', 'Politique budgétaire', 'Système bancaire', 'Stage professionnel'] },
        { titre: 'Sciences Techniques Comptables et Financières', categorie: 'Gestion et Finance', niveaux: ['BTS', 'Licence', 'Master'], duree: '2-5 ans', contenu: 'Formation complète en comptabilité, fiscalité et gestion financière.', cours: ['Comptabilité générale', 'Comptabilité analytique', 'Comptabilité des sociétés', 'Fiscalité', 'Audit', 'Contrôle de gestion', 'Droit des affaires', 'Gestion financière', 'Normes IFRS', 'Stage professionnel'] },
        { titre: 'Audit et Contrôle de Gestion', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation aux techniques d\'audit, contrôle interne et pilotage de la performance.', cours: ['Comptabilité approfondie', 'Audit interne', 'Contrôle budgétaire', 'Contrôle de gestion', 'Fiscalité', 'Droit des affaires', 'Gestion financière', 'Normes comptables', 'Stage professionnel'] },
        { titre: 'Gestion Fiscale des Entreprises', categorie: 'Gestion et Finance', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en fiscalité des entreprises, optimisation et conseil fiscal.', cours: ['Fiscalité des entreprises', 'Fiscalité des particuliers', 'TVA et impôts indirects', 'Impôts directs', 'Contrôle fiscal', 'Optimisation fiscale', 'Comptabilité', 'Droit fiscal', 'Stage professionnel'] },

        // ── Administration et Management ──
        { titre: 'Administration et Gestion des Affaires', categorie: 'Administration et Management', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en administration des affaires, management et stratégie d\'entreprise.', cours: ['Management général', 'Gestion des ressources humaines', 'Comptabilité', 'Marketing', 'Finance d\'entreprise', 'Stratégie d\'entreprise', 'Droit des affaires', 'Anglais des affaires', 'Stage professionnel'] },
        { titre: 'Administration Générale', categorie: 'Administration et Management', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation aux carrières administratives et au management public.', cours: ['Administration publique', 'Droit administratif', 'Gestion des ressources humaines', 'Finances publiques', 'Marchés publics', 'Management', 'Communication', 'Stage professionnel'] },
        { titre: 'Gestion des Ressources Humaines', categorie: 'Administration et Management', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en gestion des RH, droit du travail et management des équipes.', cours: ['Droit du travail', 'Gestion de la paie', 'Recrutement', 'Formation du personnel', 'Gestion des carrières', 'Psychologie du travail', 'Communication interne', 'Système d\'information RH', 'Stage professionnel'] },
        { titre: 'Gestion de Projet et Passation des Marchés', categorie: 'Administration et Management', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en gestion de projet et marchés publics.', cours: ['Gestion de projet (PMI)', 'Passation des marchés publics', 'Planification', 'Gestion des risques', 'Suivi-évaluation', 'Droit des marchés', 'Budgétisation', 'Stage professionnel'] },

        // ── Commerce et Logistique ──
        { titre: 'Commerce International', categorie: 'Commerce et Logistique', niveaux: ['BTS', 'Licence', 'Master'], duree: '2-5 ans', contenu: 'Formation aux techniques du commerce international et de la négociation.', cours: ['Techniques du commerce international', 'Logistique internationale', 'Douane', 'Négociation', 'Droit du commerce international', 'Anglais des affaires', 'Marketing international', 'Finance internationale', 'Stage professionnel'] },
        { titre: 'Transport et Logistique', categorie: 'Commerce et Logistique', niveaux: ['BTS', 'Licence', 'Master'], duree: '2-5 ans', contenu: 'Formation en gestion des transports, supply chain et logistique.', cours: ['Gestion des transports', 'Supply chain', 'Logistique', 'Gestion des stocks', 'Transport maritime et aérien', 'Douane', 'SIG', 'Stage professionnel'] },

        // ── Développement et Social ──
        { titre: 'Agro Business', categorie: 'Développement et Social', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en management des entreprises agroalimentaires.', cours: ['Économie agricole', 'Gestion des entreprises agroalimentaires', 'Marketing agroalimentaire', 'Chaîne de valeur', 'Développement rural', 'Commerce agricole', 'Transformation agroalimentaire', 'Stage professionnel'] },
        { titre: 'Développement Social', categorie: 'Développement et Social', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation aux métiers du développement social et de l\'action humanitaire.', cours: ['Sociologie du développement', 'Projets sociaux', 'Action humanitaire', 'Politiques sociales', 'Évaluation de projets', 'Genre et développement', 'Stage professionnel'] },
        { titre: 'Économie des Transports et Développement Social', categorie: 'Développement et Social', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en économie des transports et développement social.', cours: ['Économie des transports', 'Aménagement du territoire', 'Développement social', 'Politiques de transport', 'Logistique et développement', 'Stage professionnel'] },
        { titre: 'Administration des Collectivités Territoriales', categorie: 'Développement et Social', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en gestion et administration des collectivités locales.', cours: ['Droit des collectivités', 'Finances locales', 'Gestion territoriale', 'Développement local', 'Marchés publics locaux', 'Stage professionnel'] },
        { titre: 'Qualité, Sécurité, Environnement et Responsabilité Sociétale', categorie: 'Développement et Social', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en QSE et responsabilité sociétale des entreprises.', cours: ['Management de la qualité (ISO 9001)', 'Sécurité au travail', 'Environnement (ISO 14001)', 'RSE', 'Audit QSE', 'Systèmes de management intégré', 'Stage professionnel'] },

        // ── Marketing et Communication ──
        { titre: 'Communication et Marketing', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en communication et marketing général.', cours: ['Marketing fondamental', 'Communication d\'entreprise', 'Publicité', 'Relations publiques', 'Études de marché', 'Comportement du consommateur', 'Stage professionnel'] },
        { titre: 'Marketing', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation spécialisée en marketing stratégique et opérationnel.', cours: ['Marketing stratégique', 'Marketing opérationnel', 'Études de marché', 'Comportement du consommateur', 'Distribution', 'Pricing', 'Brand management', 'Stage professionnel'] },
        { titre: 'Marketing-Communication', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation intégrée marketing et communication.', cours: ['Marketing', 'Communication', 'Publicité', 'Relations publiques', 'Brand content', 'Stratégie de marque', 'Événementiel', 'Stage professionnel'] },
        { titre: 'Marketing Digital et E-commerce', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en marketing digital, e-commerce et stratégie digitale.', cours: ['Marketing fondamental', 'Marketing digital', 'Référencement (SEO/SEA)', 'Community management', 'Publicité numérique', 'E-commerce', 'Analyse des données marketing', 'Création de contenu', 'Gestion de marque', 'Stage professionnel'] },
        { titre: 'Communication et Information', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en sciences de l\'information et de la communication.', cours: ['Théories de la communication', 'Médias', 'Journalisme', 'Documentation', 'Production audiovisuelle', 'Communication digitale', 'Stage professionnel'] },
        { titre: 'Journalisme', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation au journalisme multimédia et à la production de contenu.', cours: ['Journalisme d\'investigation', 'Journalisme web', 'Production audiovisuelle', 'Radio', 'Presse écrite', 'Médias sociaux', 'Déontologie', 'Stage professionnel'] },
        { titre: 'Diplomatie, Protocole et Relations Publiques', categorie: 'Marketing et Communication', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en diplomatie, relations internationales et protocole.', cours: ['Relations internationales', 'Diplomatie', 'Protocole', 'Communication publique', 'Négociation', 'Droit international', 'Stage professionnel'] },

        // ── Tourisme et Sport ──
        { titre: 'Management du Tourisme et de l\'Hôtellerie', categorie: 'Tourisme et Sport', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en management hôtelier et tourisme.', cours: ['Gestion hôtelière', 'Tourisme', 'Marketing touristique', 'Gestion des services', 'Droit du tourisme', 'Développement touristique', 'Stage professionnel'] },
        { titre: 'Management Sportif et Gestion des Organisations Sportives', categorie: 'Tourisme et Sport', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en management du sport et gestion des organisations sportives.', cours: ['Management du sport', 'Gestion des clubs', 'Marketing sportif', 'Droit du sport', 'Événementiel sportif', 'Financement du sport', 'Stage professionnel'] },

        // ── Informatique et Ingénierie ──
        { titre: 'Génie Logiciel', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en conception, développement et maintenance de logiciels.', cours: ['Algorithmique', 'Programmation (Java, Python, C#, PHP)', 'Bases de données', 'Développement Web', 'Développement Mobile', 'Génie logiciel', 'UML et modélisation', 'Systèmes d\'exploitation', 'Réseaux informatiques', 'Sécurité informatique', 'Gestion de projet', 'Tests logiciels', 'Intelligence artificielle', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Sécurité Informatique, Cybersécurité et Cybercriminalité', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en sécurité des systèmes d\'information et lutte contre la cybercriminalité.', cours: ['Réseaux avancés', 'Cryptographie', 'Hacking éthique', 'Administration système', 'Sécurité des applications', 'Audit de sécurité', 'Gestion des incidents', 'Investigation numérique', 'Gouvernance SSI', 'Programmation sécurisée', 'Droit du numérique', 'Stage professionnel'] },
        { titre: 'Télécommunications et Réseaux', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en télécommunications, réseaux et infrastructure IT.', cours: ['Électronique', 'Transmission de données', 'Réseaux Cisco', 'Administration réseau', 'Téléphonie IP', 'Systèmes embarqués', 'Sécurité réseau', 'Cloud Computing', 'Fibre optique', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Informatique Industrielle', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en systèmes embarqués, automatisme et informatique industrielle.', cours: ['Automatisme', 'Systèmes embarqués', 'Programmation industrielle', 'Réseaux industriels', 'Capteurs et actionneurs', 'Supervision', 'Robotique', 'IoT', 'Électronique numérique', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Génie Civil', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en conception et réalisation d\'ouvrages de génie civil.', cours: ['Résistance des matériaux', 'Mécanique des sols', 'Béton armé', 'Topographie', 'Hydraulique', 'Routes et ouvrages d\'art', 'Géotechnique', 'DAO/CAO (AutoCAD)', 'Gestion de chantier', 'Marchés publics', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Génie Électrique', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en électricité, électronique et systèmes électriques.', cours: ['Électrotechnique', 'Électronique de puissance', 'Machines électriques', 'Automatique', 'Installations électriques', 'Schémas électriques', 'Habilitation électrique', 'Informatique industrielle', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Génie Mécanique', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en mécanique, conception et fabrication industrielle.', cours: ['Mécanique générale', 'Résistance des matériaux', 'Thermodynamique', 'Mécanique des fluides', 'Conception mécanique (CAO)', 'Fabrication mécanique', 'Matériaux', 'Maintenance', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Génie Industriel', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en optimisation des processus industriels.', cours: ['Gestion de production', 'Logistique industrielle', 'Qualité', 'Maintenance', 'Supply chain', 'Lean management', 'ERP', 'Analyse des processus', 'Stage professionnel', 'Projet tutoré'] },
        { titre: 'Énergies Renouvelables et Efficacité Énergétique', categorie: 'Informatique et Ingénierie', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en énergies renouvelables et efficacité énergétique.', cours: ['Solaire photovoltaïque', 'Solaire thermique', 'Éolien', 'Biomasse', 'Efficacité énergétique', 'Réseaux intelligents', 'Stockage d\'énergie', 'Impact environnemental', 'Stage professionnel', 'Projet tutoré'] },

        // ── Sciences Appliquées ──
        { titre: 'Modélisation Économétrique et Analyse des Données', categorie: 'Sciences Appliquées', niveaux: ['Licence', 'Master'], duree: '3-5 ans', contenu: 'Formation en économétrie, data science et analyse quantitative.', cours: ['Économétrie', 'Statistiques avancées', 'Analyse des données', 'Python/R', 'Machine Learning', 'Data visualisation', 'Big Data', 'Stage professionnel'] },
        { titre: 'Documentation, Archivage et Bibliothèque', categorie: 'Sciences Appliquées', niveaux: ['BTS', 'Licence'], duree: '2-3 ans', contenu: 'Formation en gestion documentaire, archivage et bibliothéconomie.', cours: ['Gestion documentaire', 'Archivistique', 'Bibliothéconomie', 'Numérisation', 'Systèmes d\'information documentaire', 'Stage professionnel'] },
        { titre: 'Aquaculture (Pisciculture)', categorie: 'Sciences Appliquées', niveaux: ['BTS', 'Licence'], duree: '2-3 ans', contenu: 'Formation en aquaculture et pisciculture.', cours: ['Pisciculture', 'Biologie aquatique', 'Gestion des plans d\'eau', 'Alimentation', 'Santé des poissons', 'Transformation', 'Commercialisation', 'Stage professionnel'] },
        { titre: 'Technologies Alimentaires et Biologiques', categorie: 'Sciences Appliquées', niveaux: ['BTS', 'Licence'], duree: '2-3 ans', contenu: 'Formation en technologie alimentaire et biotechnologies.', cours: ['Technologie alimentaire', 'Microbiologie', 'Biochimie', 'Contrôle qualité', 'Transformation des aliments', 'Conditionnement', 'HACCP', 'Stage professionnel'] },

        // ── MBA ──
        { titre: 'MBA en Gestion des Entreprises', categorie: 'MBA', niveaux: ['MBA'], duree: '1-2 ans', contenu: 'MBA en gestion d\'entreprise, stratégie et leadership.', cours: ['Stratégie d\'entreprise', 'Finance d\'entreprise', 'Marketing avancé', 'Leadership', 'Gestion des RH', 'Négociation', 'Innovation', 'Mémoire professionnel'] },
        { titre: 'MBA en Leadership, Gouvernance et Performance des Équipes', categorie: 'MBA', niveaux: ['MBA'], duree: '1-2 ans', contenu: 'MBA en leadership, gouvernance et performance organisationnelle.', cours: ['Leadership', 'Gouvernance d\'entreprise', 'Performance des équipes', 'Change management', 'Éthique', 'Prise de décision', 'Mémoire professionnel'] },
    ];

    const nivMap: any = {
        'BTS': nivBTS[0].id,
        'Licence': nivLicence[0].id,
        'Master': nivMaster[0].id,
        'MBA': nivMBA[0].id,
    };

    const insNivMap: any = {
        'BTS': insNivBTS.id,
        'Licence': insNivLicence.id,
        'Master': insNivMaster.id,
        'MBA': insNivMBA.id,
    };

    let parcoursCount = 0;
    let totalCours = 0;
    let totalInsParcours = 0;

    for (const p of parcoursData) {
        for (const niveau of p.niveaux) {
            const titreUnique = `${p.titre} (${niveau})`;

            const exists = await OriPar.findOne({
                where: { titre: titreUnique, niveauEtudeId: nivMap[niveau] }
            });
            if (!exists) {
                await OriPar.create({
                    titre: titreUnique,
                    dureeDeFormation: p.duree,
                    contenu: p.contenu,
                    categorieId: catRecords[p.categorie].id,
                    niveauEtudeId: nivMap[niveau],
                });
                parcoursCount++;
            }

            const [insPar]: any = await InsPar.findOrCreate({
                where: { titre: titreUnique },
                defaults: { titre: titreUnique, description: p.contenu }
            });
            totalInsParcours++;

            for (let i = 0; i < p.cours.length; i++) {
                const coursName = p.cours[i];
                const sem = (i % 2 === 0) ? 'S1' : 'S2';

                const codePrefix = p.titre.substring(0, 3).toUpperCase().replace(/É|È|Ê|È/, 'E');
                const existsCours = await InsCours.findOne({
                    where: { code: `${codePrefix}-${i + 1}`, parcoursId: insPar.id }
                });

                if (!existsCours) {
                    await InsCours.create({
                        code: `${codePrefix}-${i + 1}`,
                        intitule: coursName,
                        parcoursId: insPar.id,
                        credit: 3,
                        estObligatoire: true,
                        semestre: sem as any,
                    });
                    totalCours++;
                }
            }
        }
    }

    console.log(`  ✓ ${parcoursCount} Parcours orientation créés (${parcoursData.length} filières uniques)`);
    console.log(`  ✓ ${totalInsParcours} Parcours inscription créés/trouvés`);
    console.log(`  ✓ ${totalCours} Cours ajoutés`);
    console.log(`\n── SEED ESA TERMINÉ ──\n`);

    process.exit(0);
}

seedESA().catch((err) => {
    console.error('Seed ESA failed:', err);
    process.exit(1);
});
