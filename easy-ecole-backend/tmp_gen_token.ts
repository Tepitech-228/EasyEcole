import jwt from 'jsonwebtoken';
import { DatabaseConnection } from './src/core/helpers/DatabaseConnection';
import { Utilisateur } from './src/modules/auth/models/Utilisateur';
import { JWT_SECRET } from './src/core/config/jwt';

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.init();
    
    // Find an apprenant user
    const apprenant = await Utilisateur.findOne({ 
        where: { role: 'apprenant' },
        attributes: ['id', 'identifiant', 'email', 'role', 'tokenVersion']
    });
    
    if (!apprenant) {
        console.error('No apprenant found');
        process.exit(1);
    }
    
    const payload = {
        id: apprenant.get('id'),
        identifiant: apprenant.get('identifiant'),
        email: apprenant.get('email'),
        role: apprenant.get('role'),
        tokenVersion: apprenant.get('tokenVersion'),
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    console.log(JSON.stringify({ token, userId: apprenant.get('id'), identifiant: apprenant.get('identifiant') }));
    
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
