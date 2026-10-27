/**
 * Test fonctionnel du flux rôles/permissions (RoleController).
 * Exécute la vraie logique : création rôle → assignation permissions → relecture.
 * Usage: npx ts-node --project tsconfig.json <ce fichier>   (depuis easy-ecole-backend)
 */
import '../src/modules/auth/models/_associations';
import RoleController from '../src/modules/auth/controllers/RoleController';
import { Role } from '../src/modules/auth/models/Role';
import { RolePermission } from '../src/modules/auth/models/RolePermission';
import { Permission } from '../src/modules/auth/models/Permission';
import { DatabaseConnection } from '../src/core/helpers/DatabaseConnection';

type MockRes = {
    statusCode: number;
    body: any;
    status(c: number): MockRes;
    send(b: any): MockRes;
    json(b: any): MockRes;
};

function mockRes(): MockRes {
    const res: MockRes = {
        statusCode: 200,
        body: null,
        status(c: number) { this.statusCode = c; return this; },
        send(b: any) { this.body = b; return this; },
        json(b: any) { this.body = b; return this; },
    };
    return res;
}

function show(label: string, res: MockRes): void {
    const bodyStr = JSON.stringify(res.body);
    console.log(`  [${label}] HTTP ${res.statusCode} -> ${bodyStr.length > 400 ? bodyStr.slice(0, 400) + '…' : bodyStr}`);
}

async function call(controllerFn: any, params: any, body: any): Promise<MockRes> {
    const req: any = { params, body, query: {} };
    const res = mockRes();
    await controllerFn(req, res);
    return res;
}

async function main(): Promise<void> {
    await DatabaseConnection.getInstance().sequelize.authenticate();
    console.log('DB connectée.\n');

    // ------------------------------------------------------------------
    // ÉTAPE 1 — Permissions réellement présentes en base
    // ------------------------------------------------------------------
    const allPerms = await Permission.findAll({ attributes: ['id', 'key'], limit: 100 });
    console.log(`ÉTAPE 1 : ${await Permission.count()} permissions en base (extrait: ${allPerms.slice(0, 3).map(p => p.key).join(', ')})`);
    if (allPerms.length < 3) {
        console.log('ABORT : moins de 3 permissions disponibles.');
        process.exit(1);
    }
    const sampleIds = allPerms.slice(0, 5).map(p => Number(p.id));

    // ------------------------------------------------------------------
    // ÉTAPE 2 — Création d'un nouveau rôle
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 2 : création dunouveau rôle');
    const nomRole = `__TEST_PERM_${Date.now()}__`;
    const resCreate = await call(RoleController.createRole, {}, { nom: nomRole, description: 'Rôle de test permissions' });
    show('createRole', resCreate);
    if (resCreate.statusCode !== 201 || !resCreate.body?.id) {
        console.log('FAIL : création du rôle impossible.');
        process.exit(1);
    }
    const newRoleId = String(resCreate.body.id);
    console.log(`  Rôle créé avec id=${newRoleId}`);

    // ------------------------------------------------------------------
    // ÉTAPE 3 — Assignation de permissions au nouveau rôle
    // ------------------------------------------------------------------
    console.log(`\nÉTAPE 3 : assignation des permissions [${sampleIds.join(', ')}] au rôle ${newRoleId}`);
    const resAssign = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: sampleIds });
    show('updateRolePermissions', resAssign);

    // ------------------------------------------------------------------
    // ÉTAPE 4 — Relecture immédiate via le contrôleur
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 4 : relecture via getRolePermissions');
    const resRead = await call(RoleController.getRolePermissions, { id: newRoleId }, {});
    show('getRolePermissions', resRead);
    const readIds = Array.isArray(resRead.body) ? resRead.body.map((rp: any) => Number(rp.permissionId)).sort((a: number, b: number) => a - b) : [];
    const expected = [...sampleIds].sort((a, b) => a - b);
    const stepOk = resRead.statusCode === 200 && JSON.stringify(readIds) === JSON.stringify(expected);
    console.log(`  attendu=[${expected}] obtenu=[${readIds}] => ${stepOk ? 'OK' : 'KO'}`);

    // Relecture directe BDD (indépendante du contrôleur)
    const dbRows = await RolePermission.findAll({ where: { roleId: newRoleId } });
    console.log(`  relecture SQL directe : ${dbRows.length} ligne(s) -> [${dbRows.map(r => Number(r.permissionId)).join(', ')}]`);

    // ------------------------------------------------------------------
    // ÉTAPE 5 — Mise à jour : remplacer par 2 autres permissions
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 5 : mise à jour (remplacement par 2 autres permissions)');
    const newIds = allPerms.slice(10, 12).map(p => Number(p.id));
    const resUpdate = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: newIds });
    show('updateRolePermissions (maj)', resUpdate);
    const resRead2 = await call(RoleController.getRolePermissions, { id: newRoleId }, {});
    const readIds2 = Array.isArray(resRead2.body) ? resRead2.body.map((rp: any) => Number(rp.permissionId)).sort((a: number, b: number) => a - b) : [];
    const step5Ok = JSON.stringify(readIds2) === JSON.stringify([...newIds].sort((a, b) => a - b));
    console.log(`  attendu=[${newIds}] obtenu=[${readIds2}] => ${step5Ok ? 'OK' : 'KO'}`);

    // ------------------------------------------------------------------
    // ÉTAPE 6 — Un rôle EXISTANT (Sécretaire-Adjoint, id=19, 0 permission)
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 6 : rôle existant id=19 (Sécretaire-Adjoint, 0 permission)');
    const resAssign19 = await call(RoleController.updateRolePermissions, { id: '19' }, { permissionIds: sampleIds });
    show('updateRolePermissions (rôle 19)', resAssign19);
    const resRead19 = await call(RoleController.getRolePermissions, { id: '19' }, {});
    const readIds19 = Array.isArray(resRead19.body) ? resRead19.body.map((rp: any) => Number(rp.permissionId)).sort((a: number, b: number) => a - b) : [];
    const step6Ok = JSON.stringify(readIds19) === JSON.stringify([...sampleIds].sort((a, b) => a - b));
    console.log(`  attendu=[${expected}] obtenu=[${readIds19}] => ${step6Ok ? 'OK' : 'KO'}`);

    // ------------------------------------------------------------------
    // ÉTAPE 7 — Un rôle EXISTANT AVEC permissions (Directeur, id=2) : ajout de 2
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 7 : rôle existant id=2 (Directeur, 141 permissions) — ajout de 2 permissions');
    const resReadDir = await call(RoleController.getRolePermissions, { id: '2' }, {});
    const dirIds: number[] = Array.isArray(resReadDir.body) ? resReadDir.body.map((rp: any) => Number(rp.permissionId)) : [];
    const dirBefore = dirIds.length;
    let step7Ok = false;
    if (!Array.isArray(resReadDir.body) || resReadDir.statusCode !== 200) {
        // SÉCURITÉ : ne jamais écrire une liste potentiellement tronquée sur un rôle réel.
        console.log(`  SKIP écriture : la lecture a échoué (HTTP ${resReadDir.statusCode}). Écriture refusée pour ne pas écraser le rôle.`);
    } else {
        const missing = allPerms.map(p => Number(p.id)).filter(id => !dirIds.includes(id)).slice(0, 2);
        const dirAfter = [...dirIds, ...missing];
        const resAssignDir = await call(RoleController.updateRolePermissions, { id: '2' }, { permissionIds: dirAfter });
        show('updateRolePermissions (Directeur)', resAssignDir);
        const resReadDir2 = await call(RoleController.getRolePermissions, { id: '2' }, {});
        const dirIds2: number[] = Array.isArray(resReadDir2.body) ? resReadDir2.body.map((rp: any) => Number(rp.permissionId)) : [];
        step7Ok = dirIds2.length === dirAfter.length && missing.every(id => dirIds2.includes(id));
        console.log(`  avant=${dirBefore}, après(attendu)=${dirAfter.length}, après(obtenu)=${dirIds2.length} => ${step7Ok ? 'OK' : 'KO'}`);
    }

    // ------------------------------------------------------------------
    // ÉTAPE 8 — Cas limites
    // ------------------------------------------------------------------
    console.log('\nÉTAPE 8 : cas limites');
    // 8a. Liste vide SANS confirmation sur un rôle chargé (2 permissions) => 400
    const resVide = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: [] });
    show('permissionIds=[] (sans confirmClear)', resVide);
    const resVideRead = await call(RoleController.getRolePermissions, { id: newRoleId }, {});
    const nbApresVide = Array.isArray(resVideRead.body) ? resVideRead.body.length : -1;
    console.log(`  après refus liste vide : ${nbApresVide} permission(s) (2 attendues, non effacées)`);

    // 8b. Liste non-tableau sur un rôle chargé => 400 (écrasait silencieusement avant)
    const resMalforme = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: 'pas-un-tableau' });
    show('permissionIds=string (rôle chargé)', resMalforme);

    // 8c. Liste vide AVEC confirmClear => 200 vidage autorisé
    const resVideConfirm = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: [], confirmClear: true });
    show('permissionIds=[] + confirmClear', resVideConfirm);
    const resVideConfirmRead = await call(RoleController.getRolePermissions, { id: newRoleId }, {});
    const nbApresConfirm = Array.isArray(resVideConfirmRead.body) ? resVideConfirmRead.body.length : -1;
    console.log(`  après confirmClear : ${nbApresConfirm} permission(s) (0 attendue)`);

    const resInconnu = await call(RoleController.updateRolePermissions, { id: newRoleId }, { permissionIds: [99999999] });
    show('permissionIds=[inconnu]', resInconnu);

    const resRoleAbsent = await call(RoleController.updateRolePermissions, { id: '99999' }, { permissionIds: sampleIds });
    show('rôle inexistant', resRoleAbsent);

    // ------------------------------------------------------------------
    // NETTOYAGE
    // ------------------------------------------------------------------
    console.log('\nNETTOYAGE : suppression du rôle de test');
    const resDel = await call(RoleController.deleteRole, { id: newRoleId }, {});
    show('deleteRole', resDel);
    // Restaurer le rôle 19 à son état initial (0 permission) — confirmClear obligatoire
    // car le rôle 19 a 5 permissions à ce stade (la garde refuserait un liste vide simple).
    const resReset19 = await call(RoleController.updateRolePermissions, { id: '19' }, { permissionIds: [], confirmClear: true });
    show('reset rôle 19 (confirmClear)', resReset19);
    const nbFinal19 = await RolePermission.count({ where: { roleId: '19' } });
    console.log(`  rôle 19 : ${nbFinal19} permission(s) en base (0 attendue).`);

    // Résumé
    const results: Array<[string, boolean]> = [
        ['ÉT3 assignation nouveau rôle', resAssign.statusCode === 200],
        ['ÉT4 relecture cohérente', stepOk],
        ['ÉT5 mise à jour (remplacement)', step5Ok],
        ['ÉT6 rôle existant vide', step6Ok],
        ['ÉT7 rôle existant chargé', step7Ok],
        ['ÉT8 refuse liste vide sans confirmation (400)', resVide.statusCode === 400 && nbApresVide === 2],
        ['ÉT8 refuse liste non-tableau sur rôle chargé (400)', resMalforme.statusCode === 400],
        ['ÉT8 vide avec confirmClear (200)', resVideConfirm.statusCode === 200 && nbApresConfirm === 0],
        ['ÉT8 refuse permission inconnue (400)', resInconnu.statusCode === 400],
        ['ÉT8 rôle inexistant (404)', resRoleAbsent.statusCode === 404],
        ['NETTOYAGE rôle 19 => 0 permission', resReset19.statusCode === 200 && nbFinal19 === 0],
    ];
    console.log('\n================ RÉSUMÉ ================');
    for (const [label, ok] of results) console.log(`  ${ok ? 'OK  ' : 'KO  '} ${label}`);
    const allOk = results.every(([, ok]) => ok);
    console.log(`\n=> ${allOk ? 'TOUS LES TESTS PASSENT' : 'DES TESTS ÉCHOUENT'}`);

    await DatabaseConnection.getInstance().sequelize.close();
    process.exit(allOk ? 0 : 1);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
