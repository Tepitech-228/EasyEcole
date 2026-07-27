import * as path from 'path';
import * as fs from 'fs';

export async function seedCataloguePart1() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/inscription/models/_associations');
    await sequelize.sync({ alter: true });

    const M = (name: string) => sequelize.model(name);
    const InsNiv = M('InsNiveauEtude');
    const InsPar = M('InsParcours');
    const InsCours = M('InsCours');
    const InsClasse = M('InsClasse');

    let cataloguePath = path.resolve(process.cwd(), '../catalogue.json');
    if (!fs.existsSync(cataloguePath)) {
        cataloguePath = path.resolve(__dirname, '../../../../catalogue.json');
    }
    if (!fs.existsSync(cataloguePath)) {
        cataloguePath = path.resolve(process.cwd(), 'catalogue.json');
    }
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf-8'));

    const filieres = catalogue.filter((f: any) => ['INF', 'GCI', 'GEE'].includes(f.code));

    const niveauDefs: Record<string, string> = {
        L1: 'Licence 1', L2: 'Licence 2', L3: 'Licence 3',
        M1: 'Master 1', M2: 'Master 2'
    };

    const niveaux: Record<string, any> = {};
    for (const [key, libelle] of Object.entries(niveauDefs)) {
        const [niv] = await InsNiv.findOrCreate({ where: { libelle }, defaults: { libelle } });
        niveaux[key] = niv;
    }

    const parcoursDefs: Record<string, { titre: string; description: string }> = {
        INF: { titre: 'Informatique', description: 'Génie Logiciel et Intelligence Artificielle' },
        GCI: { titre: 'Génie Civil', description: 'Construction et Infrastructures' },
        GEE: { titre: 'Génie Électrique et Électronique', description: 'Électrotechnique et Électronique' },
    };

    const semestreToEnum = (semestre: number): string => `semestre${semestre}`;

    const getNiveauKey = (cycle: string, semestre: number): string => {
        if (cycle === 'LICENCE') {
            if (semestre <= 2) return 'L1';
            if (semestre <= 4) return 'L2';
            return 'L3';
        }
        if (semestre <= 2) return 'M1';
        return 'M2';
    };

    for (const filiere of filieres) {
        const { code, ues: courses } = filiere;
        const parcInfo = parcoursDefs[code];
        console.log(`\n── ${parcInfo.titre} (${code}) ──`);

        const [parcours] = await InsPar.findOrCreate({
            where: { titre: parcInfo.titre },
            defaults: { titre: parcInfo.titre, description: parcInfo.description, type: 'LICENCE' }
        });
        console.log(`  ✓ Parcours: ${parcInfo.titre}`);

        const classes: Record<string, any> = {};
        for (const [key, libelle] of Object.entries(niveauDefs)) {
            const libelleClasse = `${code}-${key}`;
            const [cls] = await InsClasse.findOrCreate({
                where: { libelle: libelleClasse },
                defaults: { libelle: libelleClasse, description: `${parcInfo.titre} - ${libelle}`, niveauEtudeId: niveaux[key].id }
            });
            classes[key] = cls;
            console.log(`  ✓ Classe: ${libelleClasse}`);
        }

        let totalCours = 0;

        for (const c of courses) {
            const semEnum = semestreToEnum(c.semestre);
            const niveauKey = getNiveauKey(c.cycle, c.semestre);
            const cls = classes[niveauKey];

            await InsCours.findOrCreate({
                where: { code: c.code, parcoursId: parcours.id },
                defaults: {
                    code: c.code,
                    intitule: c.intitule,
                    credit: c.credits,
                    creditEcts: c.credits,
                    objectifs: c.intitule,
                    semestre: semEnum as any,
                    volumeHoraire: c.volume,
                    coefficient: c.coef,
                    estObligatoire: true,
                    classeId: cls.id,
                    parcoursId: parcours.id
                }
            });
            totalCours++;
        }

        console.log(`  ✓ ${totalCours} cours créés`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  Seed catalogue part1 terminé avec succès');
    console.log('═══════════════════════════════════════════');
}

if (require.main === module) {
    seedCataloguePart1().catch((err: any) => {
        console.error('Erreur seed catalogue part1:', err);
        process.exit(1);
    });
}
