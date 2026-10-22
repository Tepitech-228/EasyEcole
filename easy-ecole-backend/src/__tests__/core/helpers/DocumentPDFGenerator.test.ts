import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * pdfkit est mocké : on capture les chaînes réellement passées à doc.text(...)
 * afin de vérifier ce qui serait imprimé dans le PDF, sans dépendre du parsing
 * binaire ni d'un worker ESM (incompatible avec Jest CJS).
 */
const textesImprimes: string[] = [];

jest.mock('pdfkit', () => {
    return jest.fn().mockImplementation(() => {
        const doc: any = {
            fontSize: jest.fn().mockReturnThis(),
            fillColor: jest.fn().mockReturnThis(),
            opacity: jest.fn().mockReturnThis(),
            save: jest.fn().mockReturnThis(),
            restore: jest.fn().mockReturnThis(),
            translate: jest.fn().mockReturnThis(),
            rotate: jest.fn().mockReturnThis(),
            moveDown: jest.fn().mockReturnThis(),
            image: jest.fn().mockReturnThis(),
            text: jest.fn((value: string) => {
                if (typeof value === 'string') textesImprimes.push(value);
                return doc;
            }),
            pipe: jest.fn().mockReturnThis(),
            end: jest.fn(),
            page: { width: 595, height: 842, margins: { left: 50, right: 50 } }
        };
        return doc;
    });
});

import { DocumentPDFGenerator } from '../../../core/helpers/DocumentPDFGenerator';

describe('DocumentPDFGenerator.generateDocument', () => {
    let outputDir: string;

    beforeEach(() => {
        textesImprimes.length = 0;
        outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docgen-test-'));
    });

    afterEach(() => {
        fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it('imprime les coordonnées de l\'étudiant lorsque fournies', () => {
        DocumentPDFGenerator.generateDocument(
            42,
            "Attestation de frequentation",
            outputDir,
            {
                nomComplet: 'Kabila Mbuyi',
                matricule: 'MAT-2026-001',
                parcours: 'Informatique de gestion',
                niveauEtude: 'Licence 3',
                classe: 'L3 INFO A',
                anneeAcademique: '2025-2026'
            }
        );

        const texte = textesImprimes.join('\n');
        expect(texte).toContain('IDENTIFICATION DE L\'ÉTUDIANT');
        expect(texte).toContain('Nom et prénoms: Kabila Mbuyi');
        expect(texte).toContain('Matricule: MAT-2026-001');
        expect(texte).toContain('Parcours: Informatique de gestion');
        expect(texte).toContain('Niveau: Licence 3');
        expect(texte).toContain('Classe: L3 INFO A');
        expect(texte).toContain('Année académique: 2025-2026');
        expect(texte).toContain('Numéro de demande: 42');
    });

    it('reste générable sans coordonnées étudiant (aucune section d\'identification)', () => {
        DocumentPDFGenerator.generateDocument(7, 'Document', outputDir);

        const texte = textesImprimes.join('\n');
        expect(texte).toContain('Document');
        expect(texte).toContain('Numéro de demande: 7');
        expect(texte).not.toContain('IDENTIFICATION DE L\'ÉTUDIANT');
    });

    it('n\'imprime que les champs de coordonnées disponibles', () => {
        DocumentPDFGenerator.generateDocument(
            99,
            'Releve de notes',
            outputDir,
            { nomComplet: 'Sarah Ilunga', matricule: null, parcours: null }
        );

        const texte = textesImprimes.join('\n');
        expect(texte).toContain('Sarah Ilunga');
        expect(texte).not.toContain('Matricule:');
        expect(texte).not.toContain('Parcours:');
    });

    it('ne crée pas de section d\'identification si toutes les coordonnées sont vides', () => {
        DocumentPDFGenerator.generateDocument(1, 'Document', outputDir, {});

        const texte = textesImprimes.join('\n');
        expect(texte).not.toContain('IDENTIFICATION DE L\'ÉTUDIANT');
    });
});
