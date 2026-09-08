import ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';
import { Cours } from '../models/Cours';
import { Parcours } from '../models/Parcours';
import { Enseignant } from '../../auth/models/Enseignant';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';

export class ExcelImportService {
  static async importUe(filePath: string): Promise<{ importedCount: number; errorCount: number; details: any[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('UE');
    if (!worksheet) throw new Error("Feuille 'UE' introuvable dans le fichier");

    const parcours = await Parcours.findAll({ attributes: ['id', 'titre'] });
    const parcoursByTitle = new Map(parcours.map((item: any) => [String(item.titre).trim().toLowerCase(), item]));
    const enseignants = await Enseignant.findAll({
      include: [{ association: Enseignant.associations.utilisateur, attributes: ['email'] }],
    });
    const enseignantsByEmail = new Map(enseignants.map((item: any) => [String(item.utilisateur?.email || '').trim().toLowerCase(), item]));

    const rows: any[] = [];
    const details: any[] = [];
    let errorCount = 0;

    for (let index = 2; index <= worksheet.rowCount; index++) {
      const row = worksheet.getRow(index);
      const code = row.getCell(1).toString().trim();
      const intitule = row.getCell(2).toString().trim();
      const parcoursTitre = row.getCell(10).toString().trim();
      const enseignantEmail = row.getCell(11).toString().trim().toLowerCase();
      const parcoursItem = parcoursByTitle.get(parcoursTitre.toLowerCase());
      const enseignant = enseignantEmail ? enseignantsByEmail.get(enseignantEmail) : undefined;

      if (!code || !intitule || !parcoursTitre) {
        errorCount++;
        details.push({ code, intitule, statut: 'erreur', message: 'Code, intitulé et parcours sont obligatoires' });
        continue;
      }
      if (!parcoursItem) {
        errorCount++;
        details.push({ code, intitule, statut: 'erreur', message: `Parcours "${parcoursTitre}" introuvable` });
        continue;
      }
      if (enseignantEmail && !enseignant) {
        errorCount++;
        details.push({ code, intitule, statut: 'erreur', message: `Enseignant "${enseignantEmail}" introuvable` });
        continue;
      }

      const obligatoire = row.getCell(8).toString().trim().toUpperCase();
      rows.push({
        code,
        intitule,
        parcoursId: parcoursItem.id,
        credit: parseInt(row.getCell(3).toString()) || 0,
        creditEcts: parseInt(row.getCell(4).toString()) || 0,
        semestre: row.getCell(5).toString().trim() || undefined,
        coefficient: parseInt(row.getCell(6).toString()) || 0,
        volumeHoraire: parseInt(row.getCell(7).toString()) || 0,
        estObligatoire: ['O', 'OUI', 'YES'].includes(obligatoire),
        objectifs: row.getCell(9).toString().trim() || undefined,
        enseignantId: enseignant?.id || null,
      });
    }

    if (rows.length > 0) {
      await Cours.bulkCreate(rows, {
        updateOnDuplicate: [
          'intitule', 'credit', 'creditEcts', 'semestre', 'coefficient',
          'volumeHoraire', 'estObligatoire', 'objectifs', 'enseignantId', 'updatedAt',
        ],
      } as any);
    }

    return { importedCount: rows.length, errorCount, details };
  }

  static async importEnseignants(filePath: string): Promise<{ importedCount: number; errorCount: number; details: any[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Enseignants');
    if (!worksheet) throw new Error("Feuille 'Enseignants' introuvable dans le fichier");

    const emails = new Set<string>();
    const rows: any[] = [];
    const details: any[] = [];
    let errorCount = 0;

    for (let index = 2; index <= worksheet.rowCount; index++) {
      const row = worksheet.getRow(index);
      const email = row.getCell(3).toString().trim().toLowerCase();
      const record = {
        nom: row.getCell(1).toString().trim(),
        prenoms: row.getCell(2).toString().trim(),
        email,
        identifiant: row.getCell(4).toString().trim(),
        contact: row.getCell(5).toString().trim() || '',
        fonction: row.getCell(6).toString().trim() || undefined,
        dateNaissance: row.getCell(7).value ? new Date(row.getCell(7).value as any) : undefined,
        lieuNaissance: row.getCell(8).toString().trim() || undefined,
      };
      if (!record.nom || !record.prenoms || !email || !record.identifiant || Number.isNaN(record.dateNaissance?.getTime())) {
        errorCount++;
        details.push({ email, statut: 'erreur', message: 'Nom, prénoms, email et identifiant sont obligatoires' });
        continue;
      }
      if (emails.has(email)) {
        errorCount++;
        details.push({ email, statut: 'erreur', message: 'Email dupliqué dans le fichier' });
        continue;
      }
      emails.add(email);
      rows.push(record);
    }

    const existants = await Utilisateur.findAll({ where: { email: [...emails] }, attributes: ['email'] });
    const emailsExistants = new Set(existants.map((item: any) => String(item.email).toLowerCase()));
    const aImporter = rows.filter((row) => {
      if (emailsExistants.has(row.email)) {
        errorCount++;
        details.push({ email: row.email, statut: 'erreur', message: 'Cet email est déjà utilisé' });
        return false;
      }
      return true;
    });

    if (aImporter.length === 0) return { importedCount: 0, errorCount, details };

    const transaction = await Utilisateur.sequelize!.transaction();
    try {
      const utilisateurs = await Utilisateur.bulkCreate(aImporter.map((row) => ({
        nom: row.nom,
        prenoms: row.prenoms,
        email: row.email,
        identifiant: row.identifiant,
        contact: row.contact,
        motDePasse: bcrypt.hashSync(`${row.identifiant}@A1`, 12),
        role: RolesUtilisateur.ENSEIGNANT,
      } as any)), { transaction, returning: true } as any);

      await Enseignant.bulkCreate(utilisateurs.map((utilisateur: any, index) => ({
        utilisateurId: utilisateur.id,
        dateNaissance: aImporter[index].dateNaissance,
        lieuNaissance: aImporter[index].lieuNaissance,
        fonction: aImporter[index].fonction,
      } as any)), { transaction } as any);
      await transaction.commit();
      return { importedCount: aImporter.length, errorCount, details };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}