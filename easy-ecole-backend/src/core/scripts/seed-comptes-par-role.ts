/**
 * SEED — Un compte de démonstration par type d'utilisateur (+ réparation des profils orphelins).
 *
 *   Usage : npx ts-node src/core/scripts/seed-comptes-par-role.ts
 *
 * - Crée le compte s'il manque, sinon met à jour rôle/profil/mot de passe de démo.
 * - Répare les lignes de profil dont `utilisateurId` a été perdu (FK = NULL après re-seed),
 *   notamment `aut_enseignants` (liste déroulante enseignants affichant « null, null »).
 * - Les mots de passe de démo sont normalisés et documentés dans COMPTES.md à la racine.
 */
import 'dotenv/config'
import * as bcrypt from 'bcrypt';

const MOTS_DE_PASSE: Record<string, string> = {
    admin: 'Admin@2026!',
    institution: 'Inst@2026!',
    enseignant: 'Prof@2026!',
    caissier_banque: 'Caissier@2026!',
    comite_orientation: 'Comite@2026!',
    cabinet_comptable: 'Comptable@2026!',
    esa_compta: 'Compta@2026!',
    personnel_administratif: 'Personnel@2026!',
    secretaire: 'Secretaire@2026!',
    apprenant: 'Etudiant@2026!',
    parent: 'Parent@2026!',
};

interface CompteDemo {
    role: string;
    nom: string;
    prenoms: string;
    identifiant: string;
    email: string;
    contact?: string;
    // Rapprochement d'un profil orphelin existant (date de naissance posée par le seed initial)
    dateNaissance?: string;
    lieuNaissance?: string;
}

const COMPTES: CompteDemo[] = [
    { role: 'admin', nom: 'TETE', prenoms: 'Ekue Patrice', identifiant: 'admin', email: 'tepitechbuild@gmail.com', contact: '+22890000000' },
    { role: 'institution', nom: 'Kodjo', prenoms: 'Mensah', identifiant: 'institution', email: 'direction@easyecole.tg', contact: '+2280101000001', dateNaissance: '1970-05-20', lieuNaissance: 'Abidjan' },
    { role: 'enseignant', nom: 'Kossi', prenoms: 'Yawo', identifiant: 'prof-maths', email: 'prof.maths@easyecole.tg', contact: '+2280102000001', dateNaissance: '1982-03-10', lieuNaissance: 'Abidjan' },
    { role: 'enseignant', nom: 'Kossi', prenoms: 'Maria', identifiant: 'prof-info', email: 'prof.maria@easyecole.tg', contact: '+2280102000002', dateNaissance: '1985-07-22', lieuNaissance: 'Bouaké' },
    { role: 'enseignant', nom: 'Yawo', prenoms: 'Jean', identifiant: 'prof-gestion', email: 'prof.jean@easyecole.tg', contact: '+2280102000003', dateNaissance: '1980-11-15', lieuNaissance: 'Odienné' },
    { role: 'enseignant', nom: 'Edem', prenoms: 'Ama', identifiant: 'prof-droit', email: 'prof.ama@easyecole.tg', contact: '+2280102000004', dateNaissance: '1988-09-05', lieuNaissance: 'Man' },
    { role: 'caissier_banque', nom: 'Atsu', prenoms: 'Koffi', identifiant: 'caissier1', email: 'caissier.atsu@easyecole.tg', contact: '+2280103000001', dateNaissance: '1992-06-18', lieuNaissance: 'Abidjan' },
    { role: 'caissier_banque', nom: 'Komlan', prenoms: 'Ami', identifiant: 'caissier2', email: 'caissier.ami@easyecole.tg', contact: '+2280103000002', dateNaissance: '1990-01-25', lieuNaissance: 'Korhogo' },
    { role: 'comite_orientation', nom: 'Mensah', prenoms: 'Yao', identifiant: 'comite1', email: 'comite.yao@easyecole.tg', contact: '+2280104000001' },
    { role: 'comite_orientation', nom: 'Kokou', prenoms: 'Adjo', identifiant: 'comite2', email: 'comite.adjo@easyecole.tg', contact: '+2280104000002' },
    { role: 'cabinet_comptable', nom: 'Amavi', prenoms: 'Kossiwa', identifiant: 'comptable1', email: 'comptable.kossiwa@easyecole.tg', contact: '+2280106000001' },
    { role: 'esa_compta', nom: 'ESA', prenoms: 'Compta Service Comptabilite', identifiant: 'esa-compta', email: 'esa-compta@easyecole.tg', contact: '+2280110000001' },
    { role: 'personnel_administratif', nom: 'Koné', prenoms: 'Aminata', identifiant: 'pers-admin1', email: 'pers.admin@easyecole.tg', contact: '+2280107000001' },
    { role: 'secretaire', nom: 'Adjovi', prenoms: 'Sika', identifiant: 'secretaire1', email: 'pacetamol362@gmail.com', contact: '+2280108000001' },
    { role: 'apprenant', nom: 'Tay', prenoms: 'Adjo', identifiant: 'etudiant-demo', email: 'etudiant.demo@etu.ust.ci', contact: '+2280501000001' },
    { role: 'parent', nom: 'Tchala', prenoms: 'Bassirou', identifiant: 'parent1', email: 'parent.tchala@easyecole.tg', contact: '+2280120000001' },
];

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq = db.sequelize;
    await seq.authenticate();
    require('../../modules/auth/models/_associations');
    const seqSync = await import('../../modules/auth/models/_associations');

    const AutU = seq.model('AutUtilisateur');
    const AutI = seq.model('AutInstitution');
    const AutAdrI = seq.model('AutAdresseInstitution');
    const AutE = seq.model('AutEnseignant');
    const AutAdrE = seq.model('AutAdresseEnseignant');
    const AutC = seq.model('AutCaissierBanque');
    const AutAdrC = seq.model('AutAdresseCaissierBanque');
    const AutCO = seq.model('AutComiteOrientation');
    const AutPA = seq.model('AutPersonnelAdministratif');
    const AutA = seq.model('AutApprenant');
    const AutAdrA = seq.model('AutAdresseApprenant');

    console.log('\n═══ 1/4 Comptes utilisateurs (upsert) ═══');
    for (const c of COMPTES) {
        const hash = bcrypt.hashSync(MOTS_DE_PASSE[c.role], 10);
        let u: any = await AutU.findOne({ where: { email: c.email } });
        if (!u) u = await AutU.findOne({ where: { identifiant: c.identifiant } });
        if (u) {
            await u.update({
                nom: c.nom, prenoms: c.prenoms, identifiant: c.identifiant,
                role: c.role, motDePasse: hash, contact: c.contact || u.contact,
                dateVerificationEmail: new Date(),
            });
            console.log(`  ↻ Mis à jour : ${c.identifiant} (${c.role})`);
        } else {
            u = await AutU.create({
                nom: c.nom, prenoms: c.prenoms, identifiant: c.identifiant, email: c.email,
                motDePasse: hash, role: c.role, contact: c.contact || '+228000000000',
                dateVerificationEmail: new Date(),
            });
            console.log(`  ✓ Créé : ${c.identifiant} (${c.role})`);
        }
        (c as any)._u = u;
    }

    console.log('\n═══ 2/4 Profils liés ═══');
    const ensureAdresseE = async () => (await AutAdrE.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 100', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrE.findAll())[0].id;
    const ensureAdresseI = async () => (await AutAdrI.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 1500', prorietaireBoitePostale: 'UST', telMobile: '+2280101000001' })).id ?? (await AutAdrI.findAll())[0].id;
    const ensureAdresseC = async () => (await AutAdrC.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 105', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrC.findAll())[0].id;
    const ensureAdresseA = async () => (await AutAdrA.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Bè', boitePostale: 'BP 123', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrA.findAll())[0].id;

    // Lier OU créer : si l'utilisateur n'a pas encore de profil, on réclame d'abord une
    // ligne orpheline existante (utilisateurId NULL) au lieu d'en créer un doublon.
    const tableName = (m: any) => m.getTableName().toString().replace(/`/g, '');
    async function lierOuCreer(model: any, uid: number, creer: () => Promise<any>, label: string): Promise<void> {
        if (await model.findOne({ where: { utilisateurId: uid } })) return;
        const [res]: any = await seq.query(
            `UPDATE \`${tableName(model)}\` SET utilisateurId=:uid WHERE utilisateurId IS NULL LIMIT 1`,
            { replacements: { uid } });
        if ((res?.affectedRows ?? res) > 0) {
            console.log(`  🔧 Profil ${label} orphelin relié — #${uid}`);
        } else {
            await creer();
            console.log(`  ✓ Profil ${label} créé — #${uid}`);
        }
    }

    for (const c of COMPTES) {
        const uid = (c as any)._u.id;
        switch (c.role) {
            case 'institution':
                await lierOuCreer(AutI, uid, async () => AutI.create({ dateNaissance: new Date('1970-05-20'), lieuNaissance: 'Lomé', fonction: 'Directeur Général', adresseId: await ensureAdresseI(), utilisateurId: uid }), 'institution');
                break;
            case 'enseignant':
                await lierOuCreer(AutE, uid, async () => AutE.create({ statut: 'Permanent', specialite: null, adresseId: await ensureAdresseE(), utilisateurId: uid }), 'enseignant');
                break;
            case 'caissier_banque':
                await lierOuCreer(AutC, uid, async () => AutC.create({ dateNaissance: new Date('1992-06-18'), lieuNaissance: 'Lomé', fonction: 'Caissier', adresseId: await ensureAdresseC(), utilisateurId: uid }), 'caissier');
                break;
            case 'comite_orientation':
                await lierOuCreer(AutCO, uid, async () => AutCO.create({ fonction: 'Membre du Comité', utilisateurId: uid }), 'comité');
                break;
            case 'personnel_administratif':
                await lierOuCreer(AutPA, uid, async () => AutPA.create({ fonction: 'Agent administratif', utilisateurId: uid }), 'personnel administratif');
                break;
            case 'apprenant':
                await lierOuCreer(AutA, uid, async () => AutA.create({
                    dateNaissance: new Date('2004-05-12'), lieuNaissance: 'Lomé',
                    sexe: 'M', nationalite: 'Togolaise', periode: 'soir', statutEtudiant: 'nouveau',
                    adresseId: await ensureAdresseA(), utilisateurId: uid,
                }), 'apprenant');
                break;
        }
    }

    console.log('\n═══ 3/4 Réparation des profils orphelins ═══');
    // Enseignants : rattachement certain par dateNaissance (données du seed initial), sinon comptes libres du même rôle
    const ensOrphelins: any[] = await seq.query(
        `SELECT e.id, e.dateNaissance FROM aut_enseignants e
         LEFT JOIN aut_utilisateurs u ON u.id = e.utilisateurId
         WHERE e.utilisateurId IS NULL OR u.id IS NULL`, { type: 'SELECT' as any }) as any[];
    for (const e of ensOrphelins) {
        const d = new Date(e.dateNaissance);
        const cle = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
        const compte = COMPTES.find(x => x.role === 'enseignant' && x.dateNaissance === cle);
        let uid: number | null = compte ? (compte as any)._u.id : null;
        if (!uid) {
            const libre: any[] = await seq.query(
                `SELECT u.id FROM aut_utilisateurs u
                 LEFT JOIN aut_enseignants e ON e.utilisateurId = u.id
                 WHERE u.role='enseignant' AND u.deletedAt IS NULL AND e.id IS NULL LIMIT 1`,
                { type: 'SELECT' as any }) as any[];
            uid = libre[0]?.id ?? null;
        }
        if (uid) {
            await seq.query(`UPDATE aut_enseignants SET utilisateurId=:uid WHERE id=:id`, { replacements: { uid, id: e.id } });
            const u: any = await AutU.findByPk(uid);
            console.log(`  🔧 aut_enseignants #${e.id} relié à ${u?.identifiant} (#${uid})`);
        } else {
            console.log(`  ⚠ aut_enseignants #${e.id} : aucun compte disponible pour le lien`);
        }
    }

    // Même contrôle sur les autres tables de profil
    const [tables]: any[] = await seq.query(`SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (:tables)`, { replacements: { tables: ['aut_institutions', 'aut_caissier_banque', 'aut_caissier_banques', 'aut_comite_orientations', 'aut_personnel_administratif', 'aut_apprenants'] } });
    for (const { t } of tables) {
        const n: any[] = await seq.query(
            `SELECT COUNT(*) AS n FROM \`${t}\` p
             LEFT JOIN aut_utilisateurs u ON u.id = p.utilisateurId
             WHERE p.utilisateurId IS NULL OR u.id IS NULL`, { type: 'SELECT' as any }) as any[];
        if (Number(n[0]?.n) > 0) console.log(`  ⚠ ${n[0].n} profil(s) orphelin(s) dans ${t}`);
    }

    console.log('\n═══ 4/4 Récapitulatif des comptes de démonstration ═══');
    for (const c of COMPTES) {
        console.log(`  ${c.role.padEnd(24)} ${c.identifiant.padEnd(16)} ${c.email.padEnd(34)} ${MOTS_DE_PASSE[c.role]}`);
    }
    await seq.close();
    process.exit(0);
}

main().catch(err => { console.error('Erreur seed:', err); process.exit(1); });
