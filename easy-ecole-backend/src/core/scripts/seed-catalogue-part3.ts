import * as path from 'path';
import * as fs from 'fs';

export async function seedCataloguePart3() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const sequelize = DatabaseConnection.getInstance().sequelize;

    require('../../modules/inscription/models/_associations');

    const InsNiv = sequelize.model('InsNiveauEtude');
    const InsPar = sequelize.model('InsParcours');
    const InsCours = sequelize.model('InsCours');
    const InsClasse = sequelize.model('InsClasse');

    let filePath = path.resolve(__dirname, '../../../../catalogue.json');
    if (!fs.existsSync(filePath)) {
        filePath = path.resolve(process.cwd(), '../catalogue.json');
    }
    if (!fs.existsSync(filePath)) {
        filePath = path.resolve(process.cwd(), 'catalogue.json');
    }
    const catalogue = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const codes = ['DRO', 'MKT', 'COM', 'EDU'];
    const filtered = catalogue.filter((entry: any) => codes.includes(entry.code));

    const titles: Record<string, string> = {
        DRO: 'Droit des Affaires',
        MKT: 'Marketing et Commerce International',
        COM: 'Communication et Journalisme',
        EDU: 'Sciences de l\'Éducation',
    };

    const descriptions: Record<string, string> = {
        DRO: 'Formation en droit des affaires, droit commercial et fiscal',
        MKT: 'Formation en marketing, commerce international et stratégies commerciales',
        COM: 'Formation en communication, journalisme et médias',
        EDU: 'Formation en sciences de l\'éducation et pédagogie',
    };

    const niveaux = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];
    const nivMap: Record<string, any> = {};
    for (const lib of niveaux) {
        const [niv] = await InsNiv.findOrCreate({ where: { libelle: lib }, defaults: { libelle: lib } });
        nivMap[lib] = niv;
    }
    console.log('  ✓ Niveaux d\'étude vérifiés');

    const semToNiveau = (semestre: number, cycle: string): string => {
        if (cycle === 'MASTER') {
            return semestre <= 2 ? 'Master 1' : 'Master 2';
        }
        if (semestre <= 2) return 'Licence 1';
        if (semestre <= 4) return 'Licence 2';
        return 'Licence 3';
    };

    const levelLabels: Record<number, string> = {
        1: 'L1', 2: 'L1', 3: 'L2', 4: 'L2', 5: 'L3', 6: 'L3'
    };

    for (const entry of filtered) {
        const code = entry.code;
        const titre = titles[code];
        const description = descriptions[code];
        const dataUes = entry.ues;

        const [parcours] = await InsPar.findOrCreate({
            where: { titre },
            defaults: { titre, description, type: 'LICENCE', niveauEtudeId: nivMap['Licence 1'].id }
        });

        const classes: Record<string, { A: any; B: any }> = {};
        for (const [lv, nivLabel] of Object.entries({ L1: 'Licence 1', L2: 'Licence 2', L3: 'Licence 3', M1: 'Master 1', M2: 'Master 2' })) {
            const niv = nivMap[nivLabel];
            if (!niv) continue;
            const [clA] = await InsClasse.findOrCreate({
                where: { libelle: `${code}-${lv}-A` },
                defaults: { libelle: `${code}-${lv}-A`, description: `${titre} ${lv} Groupe A`, niveauEtudeId: niv.id }
            });
            const [clB] = await InsClasse.findOrCreate({
                where: { libelle: `${code}-${lv}-B` },
                defaults: { libelle: `${code}-${lv}-B`, description: `${titre} ${lv} Groupe B`, niveauEtudeId: niv.id }
            });
            classes[lv] = { A: clA, B: clB };
        }

        const processSemestre = async (semCours: any[], semestre: number, lvl: string) => {
            const ueSem = `semestre${semestre}`;
            const cl = classes[lvl]?.A;
            if (!cl) return;

            for (const c of semCours) {
                await InsCours.findOrCreate({
                    where: { code: c.code, parcoursId: parcours.id },
                    defaults: {
                        code: c.code,
                        intitule: c.intitule,
                        credit: c.credits,
                        creditEcts: c.credits,
                        objectifs: c.intitule,
                        volumeHoraire: c.volume,
                        coefficient: c.coef,
                        semestre: ueSem,
                        description: c.intitule,
                        parcoursId: parcours.id,
                        classeId: cl.id,
                        estObligatoire: true
                    }
                });
            }
        };

        const licenceCours = dataUes.filter((u: any) => u.cycle === 'LICENCE');
        const masterCours = dataUes.filter((u: any) => u.cycle === 'MASTER');

        const licenceSem: Record<number, any[]> = {};
        for (const ue of licenceCours) {
            if (!licenceSem[ue.semestre]) licenceSem[ue.semestre] = [];
            licenceSem[ue.semestre].push(ue);
        }

        const masterSem: Record<number, any[]> = {};
        for (const ue of masterCours) {
            if (!masterSem[ue.semestre]) masterSem[ue.semestre] = [];
            masterSem[ue.semestre].push(ue);
        }

        for (const [sem, cours] of Object.entries(licenceSem)) {
            const s = parseInt(sem);
            await processSemestre(cours, s, levelLabels[s]);
        }

        for (const [sem, cours] of Object.entries(masterSem)) {
            const s = parseInt(sem);
            const lvl = s <= 2 ? 'M1' : 'M2';
            await processSemestre(cours, s, lvl);
        }

        console.log(`  ✓ ${titre} (${code}) — Parcours, classes et cours créés`);
    }

    console.log('\n  ✓ Seed catalogue Partie 3 terminé');
}
