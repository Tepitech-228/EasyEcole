/**
 * SEED — Comptes système de production.
 *
 *   Usage (Dokploy ou en local) :
 *     npx ts-node src/core/scripts/seed-comptes-par-role.ts
 *
 *   Mots de passe configurables via variables d'environnement :
 *     SYSTEM_ACCOUNTS_DEFAULT_PASSWORD  → mot de passe par défaut (fallback: Passer@2026!)
 *
 * - Crée le compte s'il manque, sinon met à jour rôle/profil/mot de passe.
 * - Répare les lignes de profil dont `utilisateurId` a été perdu (FK = NULL après re-seed),
 *   notamment `aut_enseignants` (liste déroulante enseignants affichant « null, null »).
 */
import 'dotenv/config'
import * as bcrypt from 'bcrypt';

const MOT_DE_PASSE_DEFAUT = process.env.SYSTEM_ACCOUNTS_DEFAULT_PASSWORD || 'Admin@2026!';

// Mots de passe par rôle (tous = MOT_DE_PASSE_DEFAUT en prod, sauf si surchargés par env)
const MOTS_DE_PASSE: Record<string, string> = {
    admin: MOT_DE_PASSE_DEFAUT,
    institution: MOT_DE_PASSE_DEFAUT,
    enseignant: MOT_DE_PASSE_DEFAUT,
    caissier_banque: MOT_DE_PASSE_DEFAUT,
    comite_orientation: MOT_DE_PASSE_DEFAUT,
    cabinet_comptable: MOT_DE_PASSE_DEFAUT,
    esa_compta: MOT_DE_PASSE_DEFAUT,
    personnel_administratif: MOT_DE_PASSE_DEFAUT,
    secretaire: MOT_DE_PASSE_DEFAUT,
    apprenant: MOT_DE_PASSE_DEFAUT,
    parent: MOT_DE_PASSE_DEFAUT,
};

interface CompteDemo {
    role: string;
    /** Rôle RBAC dans aut_roles (null = pas de mapping RBAC) */
    roleRbac: string | null;
    nom: string;
    prenoms: string;
    identifiant: string;
    email: string;
    contact?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
}

/**
 * Mapping rôle ENUM (aut_utilisateurs.role) → rôle RBAC (aut_roles.nom).
 * Le seed lie chaque compte à son rôle RBAC dans aut_user_roles.
 */
const ROLE_ENUM_TO_RBAC: Record<string, string | null> = {
    admin: 'Super Admin',
    institution: 'Directeur',
    cabinet_comptable: 'Comptable',
    esa_compta: 'Comptable',
    comite_orientation: 'Directeur',
    caissier_banque: 'Comptable',
    personnel_administratif: 'Directeur',
    secretaire: 'Directeur',
    enseignant: 'Enseignant',
    apprenant: 'Apprenant',
    parent: 'Parent',
};

const COMPTES: CompteDemo[] = [
    // ── Comptes administratifs (emails Gmail de prod, recevant les OTP) ──
    // Ces 4 comptes sont créés/mis à jour automatiquement au déploiement (Dokploy post-deploy).
    // L'OTP est envoyé à l'adresse `email` (voir AuthController / OtpService).
    { role: 'admin', roleRbac: ROLE_ENUM_TO_RBAC['admin'], nom: 'Admin', prenoms: 'Systeme', identifiant: 'tepitechbuild', email: 'tepitechbuild@gmail.com', contact: '+22890000000' },
    { role: 'cabinet_comptable', roleRbac: ROLE_ENUM_TO_RBAC['cabinet_comptable'], nom: 'Cabinet', prenoms: 'Comptable', identifiant: 'tepitechcorp', email: 'tepitechcorp@gmail.com', contact: '+2280106000001', dateNaissance: '1985-01-01', lieuNaissance: 'Lomé' },
    { role: 'esa_compta', roleRbac: ROLE_ENUM_TO_RBAC['esa_compta'], nom: 'ESA', prenoms: 'Compta Service', identifiant: 'kakashitogo', email: 'kakashitogo@gmail.com', contact: '+2280110000001' },
    { role: 'comite_orientation', roleRbac: ROLE_ENUM_TO_RBAC['comite_orientation'], nom: 'Comite', prenoms: 'Orientation', identifiant: 'histoiregede', email: 'histoiregede@gmail.com', contact: '+2280104000003' },
    // ── Comptes système complémentaires (rôles toujours actifs) ──
    { role: 'institution', roleRbac: ROLE_ENUM_TO_RBAC['institution'], nom: 'Institution', prenoms: 'Direction', identifiant: 'direction', email: 'direction@easyecole.tg', contact: '+2280101000001', dateNaissance: '1985-01-01', lieuNaissance: 'Lomé' },
    { role: 'secretaire', roleRbac: ROLE_ENUM_TO_RBAC['secretaire'], nom: 'Secretaire', prenoms: 'Systeme', identifiant: 'secretaire1', email: 'secretaire@easyecole.tg', contact: '+2280108000001' },
    { role: 'enseignant', roleRbac: ROLE_ENUM_TO_RBAC['enseignant'], nom: 'Enseignant', prenoms: 'Systeme', identifiant: 'pacetamol362', email: 'pacetamol362@gmail.com', contact: '+2280102000001', dateNaissance: '1980-05-15', lieuNaissance: 'Lomé' },

    // ── Comptes démo additionnels (identifiants easyecole.tg) ──
    { role: 'enseignant', roleRbac: ROLE_ENUM_TO_RBAC['enseignant'], nom: 'Kossi', prenoms: 'Yawo', identifiant: 'prof-maths', email: 'prof.maths@easyecole.tg', contact: '+2280102000002', dateNaissance: '1982-03-10', lieuNaissance: 'Abidjan' },
    { role: 'enseignant', roleRbac: ROLE_ENUM_TO_RBAC['enseignant'], nom: 'Kossi', prenoms: 'Maria', identifiant: 'prof-info', email: 'prof.maria@easyecole.tg', contact: '+2280102000003', dateNaissance: '1985-07-22', lieuNaissance: 'Bouaké' },
    { role: 'enseignant', roleRbac: ROLE_ENUM_TO_RBAC['enseignant'], nom: 'Yawo', prenoms: 'Jean', identifiant: 'prof-gestion', email: 'prof.jean@easyecole.tg', contact: '+2280102000004', dateNaissance: '1980-11-15', lieuNaissance: 'Odienné' },
    { role: 'enseignant', roleRbac: ROLE_ENUM_TO_RBAC['enseignant'], nom: 'Edem', prenoms: 'Ama', identifiant: 'prof-droit', email: 'prof.ama@easyecole.tg', contact: '+2280102000005', dateNaissance: '1988-09-05', lieuNaissance: 'Man' },
    { role: 'caissier_banque', roleRbac: ROLE_ENUM_TO_RBAC['caissier_banque'], nom: 'Atsu', prenoms: 'Koffi', identifiant: 'caissier1', email: 'caissier.atsu@easyecole.tg', contact: '+2280103000001', dateNaissance: '1992-06-18', lieuNaissance: 'Abidjan' },
    { role: 'caissier_banque', roleRbac: ROLE_ENUM_TO_RBAC['caissier_banque'], nom: 'Komlan', prenoms: 'Ami', identifiant: 'caissier2', email: 'caissier.ami@easyecole.tg', contact: '+2280103000002', dateNaissance: '1990-01-25', lieuNaissance: 'Korhogo' },
    { role: 'comite_orientation', roleRbac: ROLE_ENUM_TO_RBAC['comite_orientation'], nom: 'Mensah', prenoms: 'Yao', identifiant: 'comite1', email: 'comite.yao@easyecole.tg', contact: '+2280104000001' },
    { role: 'comite_orientation', roleRbac: ROLE_ENUM_TO_RBAC['comite_orientation'], nom: 'Kokou', prenoms: 'Adjo', identifiant: 'comite2', email: 'comite.adjo@easyecole.tg', contact: '+2280104000002' },
    { role: 'personnel_administratif', roleRbac: ROLE_ENUM_TO_RBAC['personnel_administratif'], nom: 'Koné', prenoms: 'Aminata', identifiant: 'pers-admin1', email: 'pers.admin@easyecole.tg', contact: '+2280107000001' },
    { role: 'apprenant', roleRbac: ROLE_ENUM_TO_RBAC['apprenant'], nom: 'Tay', prenoms: 'Adjo', identifiant: 'etudiant-demo', email: 'etudiant.demo@etu.ust.ci', contact: '+2280501000001' },
    { role: 'parent', roleRbac: ROLE_ENUM_TO_RBAC['parent'], nom: 'Tchala', prenoms: 'Bassirou', identifiant: 'parent1', email: 'parent.tchala@easyecole.tg', contact: '+2280120000001' },
];

export async function seedComptesParRole(seqIn?: any): Promise<void> {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const seq = seqIn || DatabaseConnection.getInstance().sequelize;
    require('../../modules/auth/models/_associations');

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

    console.log('\n═══ 1/5 Comptes utilisateurs (upsert) ═══');
    console.log(`  Mot de passe par défaut : ${MOT_DE_PASSE_DEFAUT.substring(0, 3)}***`);
    let created = 0, updated = 0, skipped = 0;

    for (const c of COMPTES) {
        const hash = bcrypt.hashSync(MOTS_DE_PASSE[c.role], 12);
        let u: any = await AutU.findOne({ where: { email: c.email } });
        if (!u) u = await AutU.findOne({ where: { identifiant: c.identifiant } });
        if (u) {
            // Si le compte existant est déjà le bon rôle → mise à jour classique
            // Si le compte était apprenant et est reclassé → on met à jour (pas de skip)
            if (u.role === 'apprenant' && c.role !== 'apprenant') {
                console.log(`  ↻ Reclassification : ${c.email} de apprenant → ${c.role} (#${u.id})`);
            }
            await u.update({
                nom: c.nom, prenoms: c.prenoms, identifiant: c.identifiant,
                role: c.role, motDePasse: hash, contact: c.contact || u.contact,
                dateVerificationEmail: new Date(),
            });
            console.log(`  ↻ Mis à jour : ${c.identifiant} (${c.role}) — ${c.email}`);
            updated++;
        } else {
            u = await AutU.create({
                nom: c.nom, prenoms: c.prenoms, identifiant: c.identifiant, email: c.email,
                motDePasse: hash, role: c.role, contact: c.contact || '+228000000000',
                dateVerificationEmail: new Date(),
            });
            console.log(`  ✓ Créé : ${c.identifiant} (${c.role}) — ${c.email}`);
            created++;
        }
        (c as any)._u = u;
    }

    console.log(`\n  Total : ${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s)`);

    console.log('\n═══ 2/5 Profils liés ═══');
    const ensureAdresseE = async () => (await AutAdrE.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 100', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrE.findAll())[0].id;
    const ensureAdresseI = async () => (await AutAdrI.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 1500', prorietaireBoitePostale: 'UST', telMobile: '+2280101000001' })).id ?? (await AutAdrI.findAll())[0].id;
    const ensureAdresseC = async () => (await AutAdrC.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Centre', boitePostale: 'BP 105', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrC.findAll())[0].id;
    const ensureAdresseA = async () => (await AutAdrA.create({ pays: 'Togo', ville: 'Lomé', quartier: 'Bè', boitePostale: 'BP 123', prorietaireBoitePostale: 'Démo', telMobile: '+228000000000' })).id ?? (await AutAdrA.findAll())[0].id;

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
        const u = (c as any)._u;
        if (!u) continue;
        const uid = u.id;
        switch (c.role) {
            case 'institution':
                await lierOuCreer(AutI, uid, async () => AutI.create({ dateNaissance: new Date('1985-01-01'), lieuNaissance: 'Lomé', fonction: 'Directeur Général', adresseId: await ensureAdresseI(), utilisateurId: uid }), 'institution');
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

    console.log('\n═══ 3/5 Réparation des profils orphelins ═══');
    const ensOrphelins: any[] = await seq.query(
        `SELECT e.id, e.dateNaissance FROM aut_enseignants e
         LEFT JOIN aut_utilisateurs u ON u.id = e.utilisateurId
         WHERE e.utilisateurId IS NULL OR u.id IS NULL`, { type: 'SELECT' as any }) as any[];
    for (const e of ensOrphelins) {
        const d = new Date(e.dateNaissance);
        const cle = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
        const compte = COMPTES.find(x => x.role === 'enseignant' && x.dateNaissance === cle);
        let uid: number | null = compte ? (compte as any)._u?.id ?? null : null;
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

    const [tables]: any[] = await seq.query(`SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (:tables)`, { replacements: { tables: ['aut_institutions', 'aut_caissier_banque', 'aut_caissier_banques', 'aut_comite_orientations', 'aut_personnel_administratif', 'aut_apprenants'] } });
    for (const { t } of tables) {
        const n: any[] = await seq.query(
            `SELECT COUNT(*) AS n FROM \`${t}\` p
             LEFT JOIN aut_utilisateurs u ON u.id = p.utilisateurId
             WHERE p.utilisateurId IS NULL OR u.id IS NULL`, { type: 'SELECT' as any }) as any[];
        if (Number(n[0]?.n) > 0) console.log(`  ⚠ ${n[0].n} profil(s) orphelin(s) dans ${t}`);
    }

    console.log('\n═══ 4/5 Liaison RBAC (aut_user_roles + aut_user_permissions) ═══');
    // Résolution des IDs rôles RBAC
    const [rbacRoleRows]: any[] = await seq.query("SELECT id, nom FROM `aut_roles` WHERE deletedAt IS NULL");
    const rbacRoleIdByName = new Map<string, number>((rbacRoleRows as any[]).map(r => [r.nom, r.id]));
    // Résolution des IDs permissions
    const [permRows]: any[] = await seq.query("SELECT id, `key` FROM `aut_permissions` WHERE deletedAt IS NULL");
    const permIdByKey = new Map<string, number>((permRows as any[]).map(p => [p.key, p.id]));
    // Résolution des liaisons rôle↔permission
    const [rpRows]: any[] = await seq.query("SELECT roleId, permissionId FROM `aut_role_permissions` WHERE deletedAt IS NULL");
    const permsByRoleId = new Map<number, Set<number>>();
    for (const rp of rpRows as any[]) {
        if (!permsByRoleId.has(rp.roleId)) permsByRoleId.set(rp.roleId, new Set());
        permsByRoleId.get(rp.roleId)!.add(rp.permissionId);
    }

    let rbacLinked = 0, rbacSkipped = 0, permsApplied = 0;
    for (const c of COMPTES) {
        const u = (c as any)._u;
        if (!u) continue;
        const uid = u.id;
        if (!c.roleRbac) {
            rbacSkipped++;
            continue;
        }
        const rbacRoleId = rbacRoleIdByName.get(c.roleRbac);
        if (!rbacRoleId) {
            console.log(`  ⚠ Rôle RBAC "${c.roleRbac}" introuvable pour ${c.identifiant}`);
            rbacSkipped++;
            continue;
        }

        // 1. Lier l'utilisateur au rôle RBAC (upsert)
        const [urRes]: any = await seq.query(
            "INSERT INTO `aut_user_roles` (`utilisateurId`, `roleId`, `createdAt`, `updatedAt`) " +
            "VALUES (:uid, :roleId, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE `deletedAt` = NULL",
            { replacements: { uid, roleId: rbacRoleId } }
        );
        if (urRes && (urRes.affectedRows ?? 0) > 0) {
            rbacLinked++;
            console.log(`  ✓ ${c.identifiant} → rôle RBAC "${c.roleRbac}"`);
        }

        // 2. Appliquer les permissions du rôle RBAC dans aut_user_permissions
        const rolePerms = permsByRoleId.get(rbacRoleId);
        if (rolePerms) {
            for (const permissionId of rolePerms) {
                const [upRes]: any = await seq.query(
                    "INSERT INTO `aut_user_permissions` (`utilisateurId`, `permissionId`, `estActif`, `createdAt`, `updatedAt`) " +
                    "VALUES (:uid, :permissionId, 1, NOW(), NOW()) " +
                    "ON DUPLICATE KEY UPDATE `estActif` = 1, `deletedAt` = NULL",
                    { replacements: { uid, permissionId } }
                );
                if (upRes && (upRes.affectedRows ?? 0) > 0) permsApplied++;
            }
        }
    }
    console.log(`\n  RBAC : ${rbacLinked} liaison(s) utilisateur→rôle, ${permsApplied} permission(s) appliquée(s), ${rbacSkipped} ignoré(s)`);

    console.log('\n═══ 5/5 Récapitulatif des comptes ═══');
    console.log(`\n  Mot de passe utilisé : ${MOT_DE_PASSE_DEFAUT}\n`);
    console.log('  Rôle                     Identifiant       Email                              Mot de passe');
    console.log('  ──────────────────────── ───────────────── ────────────────────────────────── ──────────────');
    for (const c of COMPTES) {
        console.log(`  ${c.role.padEnd(24)} ${c.identifiant.padEnd(16)} ${c.email.padEnd(34)} ${MOTS_DE_PASSE[c.role]}`);
    }
    console.log('');
}

// Exécution CLI directe : npx ts-node src/core/scripts/seed-comptes-par-role.ts
// (invoquée manuellement ou en post-deploy Dokploy). Ne se déclenche PAS quand
// le module est importé par DatabaseConnection.init().
if (process.argv[1] && process.argv[1].includes('seed-comptes-par-role')) {
    (async () => {
        const { DatabaseConnection } = require('../helpers/DatabaseConnection');
        const db = DatabaseConnection.getInstance();
        await db.init();
        const seq = db.sequelize;
        await seq.authenticate();
        await seedComptesParRole(seq);
        await seq.close();
        process.exit(0);
    })().catch(err => { console.error('Erreur seed:', err); process.exit(1); });
}
