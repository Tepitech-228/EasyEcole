import { DocGenTemplate } from "../models/DocGenTemplate";
import { DocGenType } from "../models/DocGenType";
import fs from "fs";
import path from "path";

const TEMPLATE_MAP: Record<string, { libelle: string; typeCodes: string[] }> = {
  'attestation.html': {
    libelle: 'Attestation par défaut',
    typeCodes: ['INS003', 'INS005', 'SCO001', 'SCO002', 'CER001', 'CER002', 'CER003', 'CER004', 'CER005'],
  },
  'releve-notes.html': {
    libelle: 'Relevé de notes par défaut',
    typeCodes: ['NOT001', 'NOT002', 'NOT003', 'NOT004', 'NOT005', 'NOT006', 'BUL001', 'BUL002', 'BUL003'],
  },
  'diplome.html': {
    libelle: 'Diplôme par défaut',
    typeCodes: ['DIP001', 'DIP002', 'DIP003', 'DIP004'],
  },
  'pv-deliberation.html': {
    libelle: 'PV de délibération par défaut',
    typeCodes: ['DEL001', 'DEL002', 'DEL003', 'DEL004', 'DEL005', 'DEL006', 'DEL007', 'DEL008'],
  },
  'decision.html': {
    libelle: 'Décision par défaut',
    typeCodes: ['ADM009', 'ADM014', 'ADM015', 'DSC005', 'DSC006', 'RH005'],
  },
};

export async function seedDocGenTemplates(): Promise<void> {
  const templatesDir = path.resolve(__dirname, 'templates');

  for (const [fileName, info] of Object.entries(TEMPLATE_MAP)) {
    const filePath = path.join(templatesDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`  [docgen] Template file not found: ${fileName}`);
      continue;
    }

    const contenu = fs.readFileSync(filePath, 'utf-8');

    for (const typeCode of info.typeCodes) {
      const type = await DocGenType.findOne({ where: { code: typeCode } });
      if (!type) {
        console.warn(`  [docgen] Type not found for code: ${typeCode} (template: ${fileName})`);
        continue;
      }

      const existing = await DocGenTemplate.findOne({
        where: { typeId: type.id, isDefault: true }
      });

      if (!existing) {
        await DocGenTemplate.create({
          typeId: type.id,
          libelle: info.libelle,
          contenu,
          isDefault: true,
          version: 1,
        } as any);
        console.log(`  [docgen] Template créé: ${typeCode} -> ${info.libelle}`);
      } else {
        console.log(`  [docgen] Template existant: ${typeCode}`);
      }
    }
  }

  console.log(`[docgen] Templates synchronisés.`);
}
