import 'dotenv/config';
import { DatabaseConnection } from '../src/core/helpers/DatabaseConnection';

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();
    console.log('DB connected');
    
    require('../src/modules/auth/models/_associations');
    const AutU = db.sequelize.model('AutUtilisateur');
    
    const user = await AutU.findOne({ 
        where: { email: 'remiawetom@gmail.com' },
        attributes: ['email', 'motDePasse', 'role', 'nom', 'prenoms']
    });
    
    if (user) {
        console.log('=== UTILISATEUR TROUVÉ ===');
        console.log(JSON.stringify(user.toJSON(), null, 2));
    } else {
        console.log('Aucun utilisateur trouvé avec remiawetom@gmail.com');
        
        // Show all users
        const all = await AutU.findAll({ attributes: ['email', 'role'] });
        console.log('Tous les utilisateurs:', all.map((u: any) => u.email));
    }
    
    process.exit(0);
}

main().catch(e => {
    console.error('ERROR:', e);
    process.exit(1);
});
