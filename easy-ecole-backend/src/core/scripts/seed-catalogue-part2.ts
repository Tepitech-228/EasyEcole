import fs from 'fs';
import path from 'path';
import { SemestresParcours } from '../../core/enums/SemestresParcours';

interface CatalogueEntry {
    code: string;
    ues: {
        code: string;
        intitule: string;
        volume: number;
        credits: number;
        coef: number;
        semestre: number;
        cycle: string;
    }[];
}

export async function seedCataloguePart2() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    require('../../modules/inscription/models/_associations');

    const InsNiv = sequelize.model('InsNiveauEtude');
    const InsPar = sequelize.model('InsParcours');
    const InsCours = sequelize.model('InsCours');
    const InsClasse = sequelize.model('InsClasse');

    console.log('\n── CATALOGUE PART 2 (GES, CPT, ECO) ──');

    const [nivL1] = await InsNiv.findOrCreate({ where: { libelle: 'Licence 1' }, defaults: { libelle: 'Licence 1' } });
    const [nivL2] = await InsNiv.findOrCreate({ where: { libelle: 'Licence 2' }, defaults: { libelle: 'Licence 2' } });
    const [nivL3] = await InsNiv.findOrCreate({ where: { libelle: 'Licence 3' }, defaults: { libelle: 'Licence 3' } });
    const [nivM1] = await InsNiv.findOrCreate({ where: { libelle: 'Master 1' }, defaults: { libelle: 'Master 1' } });
    const [nivM2] = await InsNiv.findOrCreate({ where: { libelle: 'Master 2' }, defaults: { libelle: 'Master 2' } });
    console.log('  ✓ Niveaux d\'étude');

    const nivMap: Record<string, Record<number, any>> = {
        LICENCE: { 1: nivL1, 2: nivL1, 3: nivL2, 4: nivL2, 5: nivL3, 6: nivL3 },
        MASTER: { 1: nivM1, 2: nivM1, 3: nivM2, 4: nivM2 },
    };

    const semMap: Record<string, string> = {
        '1': SemestresParcours.SEMESTRE1,
        '2': SemestresParcours.SEMESTRE2,
        '3': SemestresParcours.SEMESTRE3,
        '4': SemestresParcours.SEMESTRE4,
        '5': SemestresParcours.SEMESTRE5,
        '6': SemestresParcours.SEMESTRE6,
    };

    let cataloguePath = path.resolve(process.cwd(), '../catalogue.json');
    if (!fs.existsSync(cataloguePath)) {
        cataloguePath = path.resolve(__dirname, '../../../catalogue.json');
    }
    if (!fs.existsSync(cataloguePath)) {
        cataloguePath = path.resolve(process.cwd(), 'catalogue.json');
    }
    const raw = fs.readFileSync(cataloguePath, 'utf-8');
    const catalogue: CatalogueEntry[] = JSON.parse(raw);

    const codes = ['GES', 'CPT', 'ECO'];
    const filieres = catalogue.filter(e => codes.includes(e.code));

    const titres: Record<string, string> = {
        GES: 'Gestion des Entreprises',
        CPT: 'Comptabilité et Finance',
        ECO: 'Économie et Développement',
    };

    const descriptions: Record<string, string> = {
        GES: 'Formation en gestion des entreprises et management',
        CPT: 'Formation en comptabilité, audit et finance',
        ECO: 'Formation en économie et développement durable',
    };

    for (const filiere of filieres) {
        const code = filiere.code;

        const coursesByCycle: Record<string, typeof filiere.ues> = {};
        for (const c of filiere.ues) {
            if (!coursesByCycle[c.cycle]) coursesByCycle[c.cycle] = [];
            coursesByCycle[c.cycle].push(c);
        }

        for (const [cycle, courses] of Object.entries(coursesByCycle)) {
            const nivStart = cycle === 'LICENCE' ? nivL1 : nivM1;
            const titre = `${titres[code]} (${cycle === 'LICENCE' ? 'Licence' : 'Master'})`;

            const [parcours] = await InsPar.findOrCreate({
                where: { titre },
                defaults: {
                    titre,
                    type: cycle,
                    description: descriptions[code],
                    niveauEtudeId: nivStart.id,
                },
            });
            console.log(`  ✓ Parcours: ${titre}`);

            const niveauSet = new Set<number>();
            for (const c of courses) {
                const niv = nivMap[cycle]?.[c.semestre];
                if (niv) niveauSet.add(niv.id);
            }

            const classes: Record<number, any> = {};
            for (const nivId of niveauSet) {
                const niv = [nivL1, nivL2, nivL3, nivM1, nivM2].find(n => n.id === nivId);
                if (!niv) continue;
                const prefix = niv.libelle.startsWith('Master') ? 'M' : 'L';
                const levelNum = niv.libelle.replace(/^(Licence|Master) /, '');
                const libelle = `${code}-${prefix}${levelNum}-A`;
                const [cl] = await InsClasse.findOrCreate({
                    where: { libelle },
                    defaults: {
                        libelle,
                        description: `${niv.libelle} - ${titres[code]}`,
                        niveauEtudeId: nivId,
                    },
                });
                classes[nivId] = cl;
            }
            console.log(`  ✓ Classes (${Object.keys(classes).length})`);

            const coursesBySem: Record<number, typeof courses> = {};
            for (const c of courses) {
                if (!coursesBySem[c.semestre]) coursesBySem[c.semestre] = [];
                coursesBySem[c.semestre].push(c);
            }

            for (const [sem, semCourses] of Object.entries(coursesBySem)) {
                const semNum = parseInt(sem);
                const niv = nivMap[cycle]?.[semNum];
                const classe = classes[niv?.id];
                const semEnum = semMap[sem] || `semestre${sem}`;

                for (const coursData of semCourses) {
                    await InsCours.findOrCreate({
                        where: { code: coursData.code, parcoursId: parcours.id },
                        defaults: {
                            code: coursData.code,
                            intitule: coursData.intitule,
                            credit: coursData.credits,
                            creditEcts: coursData.credits,
                            objectifs: coursData.intitule,
                            coefficient: coursData.coef,
                            volumeHoraire: coursData.volume,
                            semestre: semEnum,
                            estObligatoire: true,
                            parcoursId: parcours.id,
                            classeId: classe?.id ?? null,
                            description: coursData.intitule,
                        },
                    });
                }
            }
            console.log(`  ✓ Cours pour ${titre}`);
        }
    }

    console.log('\n✓ Seed catalogue part2 terminé\n');
}
