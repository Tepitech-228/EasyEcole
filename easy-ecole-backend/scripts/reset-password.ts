import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DatabaseConnection } from '../src/core/helpers/DatabaseConnection';

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();
    console.log('✓ Connecté à la base');

    require('../src/modules/auth/models/_associations');
    const AutU = db.sequelize.model('AutUtilisateur');

    const user = await AutU.findOne({ where: { email: 'remiawetom@gmail.com' } });
    if (!user) {
        console.error('Utilisateur remiawetom@gmail.com introuvable');
        process.exit(1);
    }

    const newPassword = 'password123';
    const hash = bcrypt.hashSync(newPassword, 12);

    await user.update({ motDePasse: hash });
    console.log(`✓ Mot de passe réinitialisé pour ${user.email}`);
    console.log(`  Nouveau mot de passe : ${newPassword}`);

    process.exit(0);
}

main().catch(e => {
    console.error('ERREUR:', e);
    process.exit(1);
});
