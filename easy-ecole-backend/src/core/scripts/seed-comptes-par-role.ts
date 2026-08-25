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

const MOT_DE_PASSE_DEFAUT = process.env.SYSTEM_ACCOUNTS_DEFAULT_PASSWORD || 'Passer@2026!';

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
    nom: string;
    prenoms: string;
    identifiant: string;
    email: string;
    contact?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
}

const COMPTES: CompteDemo[] = [
    // ── Comptes administratifs (emails Gmail de prod, recevant les OTP) ──
    // Ces 4 comptes sont créés/mis à jour automatiquement au déploiement (Dokploy post-deploy).
    // L'OTP est envoyé à l'adresse `email` (voir AuthController / OtpService).
    { role: 'admin', nom: 'Admin', prenoms: 'Systeme', identifiant: 'tepitechbuild', email: 'tepitechbuild@gmail.com', contact: '+22890000000' },
    { role: 'cabinet_comptable', nom: 'Cabinet', prenoms: 'Comptable', identifiant: 'tepitechcorp', email: 'tepitechcorp@gmail.com', contact: '+2280106000001', dateNaissance: '1985-01-01', lieuNaissance: 'Lomé' },
    { role: 'esa_compta', nom: 'ESA', prenoms: 'Compta Service', identifiant: 'kakashitogo', email: 'kakashitogo@gmail.com', contact: '+2280110000001' },
    { role: 'comite_orientation', nom: 'Comite', prenoms: 'Orientation', identifiant: 'histoiregede', email: 'histoiregede@gmail.com', contact: '+2280104000003' },
    // ── Comptes système complémentaires (rôles toujours actifs) ──
    { role: 'institution', nom: 'Institution', prenoms: 'Direction', identifiant: 'direction', email: 'direction@easyecole.tg', contact: '+2280101000001', dateNaissance: '1985-01-01', lieuNaissance: 'Lomé' },
    { role: 'secretaire', nom: 'Secretaire', prenoms: 'Systeme', identifiant: 'secretaire1', email: 'secretaire@easyecole.tg', contact: '+2280108000001' },
    { role: 'enseignant', nom: 'Enseignant', prenoms: 'Systeme', identifiant: 'pacetamol362', email: 'pacetamol362@gmail.com', contact: '+2280102000001', dateNaissance: '1980-05-15', lieuNaissance: 'Lomé' },

    // ── Comptes démo additionnels (identifiants easyecole.tg) ──
    { role: 'enseignant', nom: 'Kossi', prenoms: 'Yawo', identifiant: 'prof-maths', email: 'prof.maths@easyecole.tg', contact: '+2280102000002', dateNaissance: '1982-03-10', lieuNaissance: 'Abidjan' },
    { role: 'enseignant', nom: 'Kossi', prenoms: 'Maria', identifiant: 'prof-info', email: 'prof.maria@easyecole.tg', contact: '+2280102000003', dateNaissance: '1985-07-22', lieuNaissance: 'Bouaké' },
    { role: 'enseignant', nom: 'Yawo', prenoms: 'Jean', identifiant: 'prof-gestion', email: 'prof.jean@easyecole.tg', contact: '+2280102000004', dateNaissance: '1980-11-15', lieuNaissance: 'Odienné' },
    { role: 'enseignant', nom: 'Edem', prenoms: 'Ama', identifiant: 'prof-droit', email: 'prof.ama@easyecole.tg', contact: '+2280102000005', dateNaissance: '1988-09-05', lieuNaissance: 'Man' },
    { role: 'caissier_banque', nom: 'Atsu', prenoms: 'Koffi', identifiant: 'caissier1', email: 'caissier.atsu@easyecole.tg', contact: '+2280103000001', dateNaissance: '1992-06-18', lieuNaissance: 'Abidjan' },
    { role: 'caissier_banque', nom: 'Komlan', prenoms: 'Ami', identifiant: 'caissier2', email: 'caissier.ami@easyecole.tg', contact: '+2280103000002', dateNaissance: '1990-01-25', lieuNaissance: 'Korhogo' },
    { role: 'comite_orientation', nom: 'Mensah', prenoms: 'Yao', identifiant: 'comite1', email: 'comite.yao@easyecole.tg', contact: '+2280104000001' },
    { role: 'comite_orientation', nom: 'Kokou', prenoms: 'Adjo', identifiant: 'comite2', email: 'comite.adjo@easyecole.tg', contact: '+2280104000002' },
    { role: 'personnel_administratif', nom: 'Koné', prenoms: 'Aminata', identifiant: 'pers-admin1', email: 'pers.admin@easyecole.tg', contact: '+2280107000001' },
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
    console.log(`  Mot de passe par défaut : ${MOT_DE_PASSE_DEFAUT.substring(0, 3)}***`);
    let created = 0, updated = 0, skipped = 0;

    for (const c of COMPTES) {
        const hash = bcrypt.hashSync(MOTS_DE_PASSE[c.role], 12);
        let u: any = await AutU.findOne({ where: { email: c.email } });
        if (!u) u = await AutU.findOne({ where: { identifiant: c.identifiant } });
        if (u) {
            // Vérifier si le compte est un "apprenant" existant → ne pas écraser
            if (u.role === 'apprenant' && c.role !== 'apprenant') {
                console.log(`  ⚠ SKIP ${c.email} : déjà utilisé par un apprenant (#${u.id}) — utilisez un autre email`);
                skipped++;
                continue;
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

    console.log('\n═══ 2/4 Profils liés ═══');
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

    console.log('\n═══ 3/4 Réparation des profils orphelins ═══');
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

    console.log('\n═══ 4/4 Récapitulatif des comptes ═══');
    console.log(`\n  Mot de passe utilisé : ${MOT_DE_PASSE_DEFAUT}\n`);
    console.log('  Rôle                     Identifiant       Email                              Mot de passe');
    console.log('  ──────────────────────── ───────────────── ────────────────────────────────── ──────────────');
    for (const c of COMPTES) {
        console.log(`  ${c.role.padEnd(24)} ${c.identifiant.padEnd(16)} ${c.email.padEnd(34)} ${MOTS_DE_PASSE[c.role]}`);
    }
    console.log('');
    await seq.close();
    process.exit(0);
}

main().catch(err => { console.error('Erreur seed:', err); process.exit(1); });
