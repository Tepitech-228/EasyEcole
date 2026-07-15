import * as bcrypt from 'bcrypt';
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function seedChat() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;
    await sequelize.authenticate();

    require('../../modules/auth/models/_associations');
    require('../../modules/elearning/models/_associations');

    const M = (name: string) => sequelize.model(name);

    const AutU = M('AutUtilisateur');
    const ElearnSalon = M('ELearningSalon');
    const ElearnPart = M('ELearningParticipantSalon');
    const ElearnMsg = M('ELearningMessage');

    console.log('── SEED CHAT ──');

    const users = await AutU.findAll({ limit: 30 });
    const admin = users.find((u: any) => u.role === 'admin') || users[0];
    const enseignants = users.filter((u: any) => u.role === 'enseignant');
    const etudiants = users.filter((u: any) => u.role === 'apprenant');

    console.log(`  Found ${users.length} users (${enseignants.length} enseignants, ${etudiants.length} etudiants)`);

    let salons = await ElearnSalon.findAll({ order: [['id', 'ASC']] });

    if (salons.length === 0) {
        const now = new Date();
        const defaultCoursId = 1;

        const salon1 = await ElearnSalon.create({
            coursId: defaultCoursId, titre: 'LIC1-A · Algorithmique', type: 'groupe', codeInvitation: 'ALGO2026',
            createdById: (enseignants[0] || admin).id, icone: 'code',
            description: 'Annonces, ressources et questions sur le cours d\'Algorithmique et Programmation.',
            estPrive: true, dateCreation: new Date(now.getTime() - 86400000 * 3)
        });
        const salon2 = await ElearnSalon.create({
            coursId: defaultCoursId, titre: 'Club Sport Universitaire', type: 'groupe', codeInvitation: 'SPORT2026',
            createdById: (etudiants[0] || admin).id, icone: 'sport',
            description: 'Organisation des activités sportives et compétitions inter-classes.',
            estPrive: false, dateCreation: new Date(now.getTime() - 86400000 * 7)
        });
        const salon3 = await ElearnSalon.create({
            coursId: defaultCoursId, titre: 'Groupe TP3 - Algorithmique', type: 'groupe', codeInvitation: 'TP3ALGO',
            createdById: (enseignants[0] || admin).id, icone: 'book',
            description: 'Groupe de travail pour le TP3 d\'Algorithmique.',
            estPrive: true, dateCreation: new Date(now.getTime() - 86400000)
        });
        salons = [salon1, salon2, salon3];
        console.log('  ✓ 3 salons crees');
    } else {
        console.log(`  ${salons.length} salons existants, ajout des participants si necessaire...`);
    }

    const now = new Date();
    const ens1 = enseignants[0] || admin;
    const etu1 = etudiants[0] || admin;
    const etu2 = etudiants[1] || admin;
    const etu3 = etudiants[2] || admin;

    const partCountS0 = await ElearnPart.count({ where: { salonId: salons[0].id } });
    if (partCountS0 < users.length) {
        const existingIds = (await ElearnPart.findAll({ where: { salonId: salons[0].id }, attributes: ['utilisateurId'] })).map((p: any) => Number(p.utilisateurId));
        const existingSet = new Set(existingIds);
        for (const u of users) {
            if (!existingSet.has(Number(u.id))) {
                await ElearnPart.create({ salonId: salons[0].id, utilisateurId: u.id, role: u.role === 'enseignant' ? 'admin' : 'membre', dateAjout: new Date(now.getTime() - 86400000 * 3), estPresent: false });
            }
        }
    }
    if ((await ElearnPart.count({ where: { salonId: salons[1].id } })) === 0) {
        await ElearnPart.create({ salonId: salons[1].id, utilisateurId: (etudiants[0] || admin).id, role: 'admin', dateAjout: new Date(now.getTime() - 86400000 * 7), estPresent: false });
        for (const u of etudiants.slice(0, 8)) {
            if (u.id !== (etudiants[0] || admin).id) {
                await ElearnPart.create({ salonId: salons[1].id, utilisateurId: u.id, role: 'membre', dateAjout: new Date(now.getTime() - 86400000 * 7), estPresent: false });
            }
        }
    }
    if ((await ElearnPart.count({ where: { salonId: salons[2].id } })) === 0) {
        for (const u of users.slice(0, 6)) {
            await ElearnPart.create({ salonId: salons[2].id, utilisateurId: u.id, role: u.role === 'enseignant' ? 'admin' : 'membre', dateAjout: new Date(now.getTime() - 86400000), estPresent: false });
        }
    }
    console.log('  ✓ Participants ajoutes');

    const msgChecks = [1, 2, 3].map(async (idx) => {
        const s = salons[idx - 1];
        if (!s) return;
        const count = await ElearnMsg.count({ where: { salonId: s.id } });
        return { idx, s, count };
    });
    const msgResults = await Promise.all(msgChecks);
    const needMessages = msgResults.filter(r => r && r.count === 0);

    if (needMessages.length > 0) {
        const adminOrEns = (enseignants[0] || admin);
        const msgsBySalon: Record<number, { salonId: number; utilisateurId: number; message: string; typeMessage: string; date: Date; lu: boolean; estModifie: boolean; estSupprime: boolean }[]> = {
            [salons[0].id]: [
                { salonId: salons[0].id, utilisateurId: adminOrEns.id, message: 'Bonjour à tous ! Bienvenue dans le salon du cours d\'Algorithmique. Le TP3 est reporté à jeudi prochain, salle B204.', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 2), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[0].id, utilisateurId: etu1.id, message: 'Merci professeur ! Est-ce que le rendu du rapport reste à la même date ?', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 2 + 3600000), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[0].id, utilisateurId: adminOrEns.id, message: 'Oui, le rapport est toujours pour le 20 du mois. Bon courage à tous !', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 2 + 7200000), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[0].id, utilisateurId: etu2.id, message: 'Super, merci pour l\'info !', typeMessage: 'text', date: new Date(now.getTime() - 86400000), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[0].id, utilisateurId: etu3.id, message: '🙏', typeMessage: 'sticker', date: new Date(now.getTime() - 86400000 + 1800000), lu: false, estModifie: false, estSupprime: false },
                { salonId: salons[0].id, utilisateurId: adminOrEns.id, message: 'N\'oubliez pas de consulter le module "Fonctions et modules" sur la plateforme e-learning.', typeMessage: 'text', date: new Date(now.getTime() - 3600000), lu: false, estModifie: false, estSupprime: false },
            ],
            [salons[1].id]: [
                { salonId: salons[1].id, utilisateurId: etu1.id, message: 'Salut à tous ! On se retrouve à 17h au gymnase pour l\'entraînement ?', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 5), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[1].id, utilisateurId: etu2.id, message: '🏀', typeMessage: 'sticker', date: new Date(now.getTime() - 86400000 * 5 + 3600000), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[1].id, utilisateurId: etu3.id, message: 'Je ramène le ballon !', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 4), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[1].id, utilisateurId: etu1.id, message: 'Le match inter-classe est prévu pour samedi prochain. Inscrivez-vous vite !', typeMessage: 'text', date: new Date(now.getTime() - 86400000 * 2), lu: false, estModifie: false, estSupprime: false },
            ],
            [salons[2].id]: [
                { salonId: salons[2].id, utilisateurId: adminOrEns.id, message: 'Consignes pour le TP3 : implementer un tri fusion en Python et rediger un rapport d\'analyse de complexite.', typeMessage: 'text', date: new Date(now.getTime() - 43200000), lu: true, estModifie: false, estSupprime: false },
                { salonId: salons[2].id, utilisateurId: etu1.id, message: 'Professeur, est-ce qu\'on peut utiliser une implémentation récursive ?', typeMessage: 'text', date: new Date(now.getTime() - 21600000), lu: false, estModifie: false, estSupprime: false },
                { salonId: salons[2].id, utilisateurId: adminOrEns.id, message: 'Oui, et c\'est même recommandé. Mais attention aux limites de récursion pour de grands tableaux.', typeMessage: 'text', date: new Date(now.getTime() - 10800000), lu: false, estModifie: false, estSupprime: false },
            ],
        };

        for (const [salonId, msgs] of Object.entries(msgsBySalon)) {
            const sid = Number(salonId);
            const existingCount = await ElearnMsg.count({ where: { salonId: sid } });
            if (existingCount === 0) {
                for (const msg of msgs) {
                    await ElearnMsg.create(msg);
                }
            }
        }
        console.log('  ✓ Messages crees');
    }

    for (const salon of salons) {
        const lastMsg = await ElearnMsg.findOne({
            where: { salonId: salon.id },
            order: [['date', 'DESC']]
        });
        if (lastMsg) {
            const preview = lastMsg.typeMessage === 'image' ? '[Photo]'
                : lastMsg.typeMessage === 'video' ? '[Video]'
                : lastMsg.typeMessage === 'sticker' ? '[Sticker]'
                : lastMsg.typeMessage === 'fichier' ? '[Fichier]'
                : lastMsg.message;
            await salon.update({
                dernierMessage: preview?.substring(0, 200),
                dateDernierMessage: lastMsg.date
            });
        }
    }
    console.log('  ✓ Derniers messages mis a jour');

    console.log('\n── SEED CHAT TERMINE ──');
    process.exit(0);
}

seedChat().catch((err: any) => {
    console.error('Seed chat error:', err);
    process.exit(1);
});
