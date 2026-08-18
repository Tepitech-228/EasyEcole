import { DocGenTemplate } from "../models/DocGenTemplate";
import { DocGenType } from "../models/DocGenType";
import { DocGenLogoService } from "../services/DocGenLogoService";
import fs from "fs";
import path from "path";

const TEMPLATE_MAP: Record<string, { libelle: string; typeCodes: string[] }> = {
  'api.html': {
    libelle: 'Autorisation provisoire d\'inscription par défaut',
    typeCodes: ['API001'],
  },
  'pieces-inscription.html': {
    libelle: 'Pièces à fournir pour autorisation d\'inscription par défaut',
    typeCodes: ['INS011'],
  },
  'pieces-admissibilite-licence.html': {
    libelle: 'Pièces à fournir pour la demande d\'admissibilité (Licence) par défaut',
    typeCodes: ['INS012'],
  },
  'pieces-admissibilite-master.html': {
    libelle: 'Pièces à fournir pour la demande d\'admissibilité (Master) par défaut',
    typeCodes: ['INS013'],
  },
  'pieces-soutenance-licence.html': {
    libelle: 'Pièces à fournir pour la demande d\'autorisation de soutenance (Licence) par défaut',
    typeCodes: ['INS014'],
  },
  'pieces-soutenance-master.html': {
    libelle: 'Pièces à fournir pour la demande d\'autorisation de soutenance (Master) par défaut',
    typeCodes: ['INS015'],
  },
  'pieces-delivrance-licence.html': {
    libelle: 'Pièces à fournir pour la demande de délivrance de diplôme (Licence) par défaut',
    typeCodes: ['INS016'],
  },
  'pieces-delivrance-master.html': {
    libelle: 'Pièces à fournir pour la demande de délivrance de diplôme (Master) par défaut',
    typeCodes: ['INS017'],
  },
  'attestation.html': {
    libelle: 'Attestation par défaut',
    typeCodes: ['INS003', 'INS005', 'SCO001', 'SCO002', 'SCO003', 'CER001', 'CER002', 'CER003', 'CER004', 'CER005'],
  },
  'attestation-preinscription.html': {
    libelle: 'Attestation de préinscription par défaut',
    typeCodes: ['PRE001'],
  },
  'attestation-admissibilite.html': {
    libelle: 'Attestation d\'admissibilité par défaut',
    typeCodes: ['ADM020'],
  },
  'releve-notes.html': {
    libelle: 'Relevé de notes par défaut',
    typeCodes: ['NOT001', 'NOT002', 'NOT003', 'NOT004', 'NOT005', 'NOT006'],
  },
  'bulletin.html': {
    libelle: 'Bulletin de notes par défaut',
    typeCodes: ['BUL001', 'BUL002', 'BUL003'],
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
    typeCodes: ['ADM009', 'ADM014', 'ADM015', 'DSC005', 'DSC006'],
  },
  'mem.html': {
    libelle: 'Attribution de Directeur de Mémoire par défaut',
    typeCodes: ['MEM001'],
  },
  'autorisation-soutenance.html': {
    libelle: 'Autorisation de soutenance par défaut',
    typeCodes: ['SOU001'],
  },
  'autorisation-delivrance-diplome.html': {
    libelle: 'Autorisation de délivrance de diplôme par défaut',
    typeCodes: ['SOU002'],
  },
  'autorisation-delivrance-diplome-master.html': {
    libelle: 'Autorisation de délivrance de diplôme de Master par défaut',
    typeCodes: ['SOU003'],
  },
  'fiche-engagement-bts.html': {
    libelle: 'Fiche d\'engagement (2ème année BTS) par défaut',
    typeCodes: ['ENG001'],
  },
  'rapport-validation-memoire.html': {
    libelle: 'Rapport de validation de mémoire par défaut',
    typeCodes: ['SOU004'],
  },
  'fiche-depot-memoire.html': {
    libelle: 'Fiche de dépôt de mémoire définitif par défaut',
    typeCodes: ['SOU005'],
  },
  'fiche-inscription.html': {
    libelle: 'Fiche d\'inscription par défaut',
    typeCodes: ['INS001'],
  },
  'bulletin-inscription.html': {
    libelle: 'Bulletin d\'inscription par défaut',
    typeCodes: ['INS002'],
  },
  'carte-etudiant.html': {
    libelle: 'Carte d\'étudiant par défaut',
    typeCodes: ['INS004'],
  },
  'contrat-pedagogique.html': {
    libelle: 'Contrat pédagogique par défaut',
    typeCodes: ['INS006'],
  },
  'recu-inscription.html': {
    libelle: 'Reçu d\'inscription par défaut',
    typeCodes: ['INS007'],
  },
  'recu-scolarite.html': {
    libelle: 'Reçu de scolarité par défaut',
    typeCodes: ['REC001'],
  },
  'planning-examens.html': {
    libelle: 'Planning des examens par défaut',
    typeCodes: ['EXM001'],
  },
  'convocation-examen.html': {
    libelle: 'Convocation à l\'examen par défaut',
    typeCodes: ['EXM002'],
  },
  'liste-emargement.html': {
    libelle: 'Liste d\'émargement par défaut',
    typeCodes: ['EXM003'],
  },
  'feuille-presence.html': {
    libelle: 'Feuille de présence par défaut',
    typeCodes: ['EXM004'],
  },
  'liste-surveillants.html': {
    libelle: 'Liste des surveillants par défaut',
    typeCodes: ['EXM005'],
  },
  'emploi-enseignant.html': {
    libelle: 'Emploi du temps enseignant par défaut',
    typeCodes: ['ENS005'],
  },
  'charge-horaire.html': {
    libelle: 'Charge horaire enseignant par défaut',
    typeCodes: ['ENS004'],
  },
  'facture.html': {
    libelle: 'Facture par défaut',
    typeCodes: ['FIN001'],
  },
  'recu.html': {
    libelle: 'Reçu de paiement par défaut',
    typeCodes: ['FIN002'],
  },
  'quittance.html': {
    libelle: 'Quittance par défaut',
    typeCodes: ['FIN003'],
  },
  'bon-caisse.html': {
    libelle: 'Bon de caisse par défaut',
    typeCodes: ['FIN004'],
  },
  'bordereau-bancaire.html': {
    libelle: 'Bordereau bancaire par défaut',
    typeCodes: ['FIN005'],
  },
  'etat-paiements.html': {
    libelle: 'État des paiements par défaut',
    typeCodes: ['FIN006'],
  },
  'echeancier.html': {
    libelle: 'Échéancier par défaut',
    typeCodes: ['FIN007'],
  },
  'journal-caisse.html': {
    libelle: 'Journal de caisse par défaut',
    typeCodes: ['FIN008'],
  },
  'rapport-financier.html': {
    libelle: 'Rapport financier par défaut',
    typeCodes: ['FIN009'],
  },
  'contrat-travail.html': {
    libelle: 'Contrat de travail par défaut',
    typeCodes: ['RH001'],
  },
  'bulletin-paie.html': {
    libelle: 'Bulletin de paie par défaut',
    typeCodes: ['RH002'],
  },
  'fiche-presence-rh.html': {
    libelle: 'Fiche de présence par défaut',
    typeCodes: ['RH003'],
  },
  'demande-conge.html': {
    libelle: 'Demande de congé par défaut',
    typeCodes: ['RH004'],
  },
  'decision-conge.html': {
    libelle: 'Décision de congé par défaut',
    typeCodes: ['RH005'],
  },
  'evaluation-annuelle.html': {
    libelle: 'Évaluation annuelle par défaut',
    typeCodes: ['RH006'],
  },
  'dossier-personnel.html': {
    libelle: 'Dossier du personnel par défaut',
    typeCodes: ['RH007'],
  },
  'contrat-enseignant.html': {
    libelle: 'Contrat d\'enseignant par défaut',
    typeCodes: ['ENS001'],
  },
  'arrete-nomination.html': {
    libelle: 'Arrêté de nomination par défaut',
    typeCodes: ['ENS002'],
  },
  'fiche-enseignant.html': {
    libelle: 'Fiche enseignant par défaut',
    typeCodes: ['ENS003'],
  },
  'etat-heures.html': {
    libelle: 'État des heures par défaut',
    typeCodes: ['ENS006'],
  },
  'bulletin-vacation.html': {
    libelle: 'Bulletin de vacation par défaut',
    typeCodes: ['ENS007'],
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

    const contenu = DocGenLogoService.injectLogo(fs.readFileSync(filePath, 'utf-8'));

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
      } else if (existing.contenu !== contenu) {
        existing.contenu = contenu;
        existing.version = (existing.version || 1) + 1;
        await existing.save();
        console.log(`  [docgen] Template mis à jour (v${existing.version}): ${typeCode} -> ${info.libelle}`);
      } else {
        console.log(`  [docgen] Template identique: ${typeCode}`);
      }
    }
  }

  console.log(`[docgen] Templates synchronisés.`);
}
