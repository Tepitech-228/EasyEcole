import * as bcrypt from 'bcrypt';

async function seedAccounts() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/auth/models/_associations');
    await sequelize.sync();

    const AutU = sequelize.model('AutUtilisateur');
    const AutI = sequelize.model('AutInstitution');
    const AutAdrI = sequelize.model('AutAdresseInstitution');
    const AutE = sequelize.model('AutEnseignant');
    const AutAdrE = sequelize.model('AutAdresseEnseignant');

    const accounts = [
        {
            nom: 'TETE',
            prenoms: 'Ekue Patrice',
            identifiant: 'admin',
            email: 'tepitechbuild@gmail.com',
            password: 'Admin@2026!',
            role: 'admin',
            contact: '+22890000000',
        },
        {
            nom: 'TEPITECH',
            prenoms: 'Corporation',
            identifiant: 'institution',
            email: 'tepitechcorp@gmail.com',
            password: 'Inst@2026!',
            role: 'institution',
            contact: '+2280101000001',
            institutionData: {
                dateNaissance: new Date('1985-01-01'),
                lieuNaissance: 'Lomé',
                fonction: 'Directeur Général',
                adresse: { pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 1500', prorietaireBoitePostale: 'TEPITECH', telMobile: '+2280101000001' },
            },
        },
        {
            nom: 'Histoire',
            prenoms: 'Gédéon',
            identifiant: 'prof-histoire',
            email: 'histoiregede@gmail.com',
            password: 'Prof@2026!',
            role: 'enseignant',
            contact: '+2280102000001',
            enseignantData: {
                dateNaissance: new Date('1980-05-15'),
                lieuNaissance: 'Kara',
                fonction: "Professeur d'Histoire",
                adresse: { pays: 'Togo', ville: 'Lomé', quartier: 'Tokoin', boitePostale: 'BP 200', prorietaireBoitePostale: 'Gédéon Histoire', telMobile: '+2280102000001' },
            },
        },
    ];

    for (const acc of accounts) {
        const hash = bcrypt.hashSync(acc.password, 10);

        let utilisateur = await AutU.findOne({ where: { email: acc.email } });
        if (utilisateur) {
            await utilisateur.update({
                nom: acc.nom,
                prenoms: acc.prenoms,
                identifiant: acc.identifiant,
                motDePasse: hash,
                role: acc.role,
                contact: acc.contact,
                dateVerificationEmail: new Date(),
            });
            console.log(`  ✓ Mis à jour: ${acc.email} (${acc.role})`);
        } else {
            utilisateur = await AutU.create({
                nom: acc.nom,
                prenoms: acc.prenoms,
                identifiant: acc.identifiant,
                email: acc.email,
                motDePasse: hash,
                role: acc.role,
                contact: acc.contact,
                dateVerificationEmail: new Date(),
            });
            console.log(`  ✓ Créé: ${acc.email} (${acc.role})`);
        }

        if (acc.role === 'institution' && acc.institutionData) {
            const existing = await AutI.findOne({ where: { utilisateurId: utilisateur.id } });
            if (!existing) {
                const adr = await AutAdrI.create(acc.institutionData.adresse);
                await AutI.create({
                    dateNaissance: acc.institutionData.dateNaissance,
                    lieuNaissance: acc.institutionData.lieuNaissance,
                    fonction: acc.institutionData.fonction,
                    adresseId: adr.id,
                    utilisateurId: utilisateur.id,
                });
                console.log(`    → Profil institution créé`);
            }
        }

        if (acc.role === 'enseignant' && acc.enseignantData) {
            const existing = await AutE.findOne({ where: { utilisateurId: utilisateur.id } });
            if (!existing) {
                const adr = await AutAdrE.create(acc.enseignantData.adresse);
                await AutE.create({
                    dateNaissance: acc.enseignantData.dateNaissance,
                    lieuNaissance: acc.enseignantData.lieuNaissance,
                    fonction: acc.enseignantData.fonction,
                    adresseId: adr.id,
                    utilisateurId: utilisateur.id,
                });
                console.log(`    → Profil enseignant créé`);
            }
        }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✓ Seed terminé — 3 comptes prêts');
    console.log('  Voir comptes.md pour les identifiants');
    console.log('═══════════════════════════════════════════');
    process.exit(0);
}

seedAccounts().catch((err) => {
    console.error('Erreur seed:', err);
    process.exit(1);
});
