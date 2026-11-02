import { DatabaseConnection } from '../helpers/DatabaseConnection';
import { Op } from 'sequelize';
import { Categorie as OriCategorie } from '../../modules/orientation/models/Categorie';
import { Parcours as OriParcours } from '../../modules/orientation/models/Parcours';
import { Parcours as InsParcours } from '../../modules/inscription/models/Parcours';
import { Etablissement } from '../../modules/etablissement/models/Etablissement';

export async function seedEsa(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  const sequelize = db.sequelize;

  require('../../modules/orientation/models/_associations');
  const transaction = await sequelize.transaction();

  try {
    const siteEnv = process.env.ESA_ETABLISSEMENT_ID;
    const etablissementId = siteEnv ? Number(siteEnv) : null;
    if (siteEnv && (!Number.isSafeInteger(etablissementId) || (etablissementId as number) <= 0)) {
      throw new Error('ESA_ETABLISSEMENT_ID doit être un entier positif.');
    }
    if (etablissementId !== null && !await Etablissement.findByPk(etablissementId, { transaction })) {
      throw new Error(`L'établissement ESA ${etablissementId} est introuvable.`);
    }

    const categoryDefs = [
      ['Sciences et Technologies', 'Filières scientifiques et numériques'],
      ['Commerce et Gestion', 'Filières de gestion et de commerce'],
      ['Sciences Juridiques', 'Filières de droit'],
      ['Comptabilité et Finance', 'Comptabilité, audit, contrôle et fiscalité'],
      ['Économie et Finance', 'Banque, assurance, monnaie et économie'],
      ['Communication et Médias', 'Journalisme, communication et relations publiques'],
      ['Administration et Affaires Publiques', 'Administration générale, territoriale et des affaires'],
      ['Ingénierie et Génie', 'Filières d\'ingénierie et de génie'],
      ['Tourisme, Hôtellerie et Loisirs', 'Tourisme, hôtellerie, restauration et loisirs'],
      ['Agriculture et Agro-alimentaire', 'Agriculture, aquaculture et agro business'],
      ['Sport et Loisirs', 'Management et gestion des organisations sportives']
    ] as const;

    const categories: Record<string, any> = {};
    for (const [libelle, description] of categoryDefs) {
      const [categorie] = await OriCategorie.findOrCreate({
        where: { libelle },
        defaults: { libelle, description },
        transaction
      });
      categories[libelle] = categorie;
    }

  interface ParcoursSeedItem {
    titre: string;
    type: 'LICENCE' | 'MASTER' | 'MBA' | 'BTS';
    categorie: string;
    dureeDeFormation: string;
  }

  const parcoursSeed: ParcoursSeedItem[] = [
    { titre: 'Administration générale', type: 'LICENCE', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Administration des collectivités territoriales', type: 'LICENCE', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Administration des collectivités locales', type: 'LICENCE', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Marketing digital et E business', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Protocole et relations publiques', type: 'LICENCE', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Gestion commerciale', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Gestion des ressources humaines', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Science et techniques comptables et financières', type: 'LICENCE', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Audit et contrôle de gestion', type: 'LICENCE', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Commerce international', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Transport logistique', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Marketing-communication', type: 'LICENCE', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Gestion des projets et passation des marchés', type: 'LICENCE', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Réseaux et télécommunication', type: 'LICENCE', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie logiciel', type: 'LICENCE', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie civil', type: 'LICENCE', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Energies renouvelables et efficacité énergétique', type: 'LICENCE', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Sécurité informatique-cyber sécurité-cybercriminalité', type: 'LICENCE', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Marketing', type: 'LICENCE', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Génie électrique', type: 'LICENCE', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Administration et gestion des affaires', type: 'LICENCE', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Gestion fiscales des entreprises', type: 'LICENCE', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Economie des transports et développement social', type: 'LICENCE', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Management du tourisme et de l\'hôtellerie', type: 'LICENCE', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '3/y' },
    { titre: 'Management et gestion des organisations sportives', type: 'LICENCE', categorie: 'Sport et Loisirs', dureeDeFormation: '3/y' },
    { titre: 'Journalisme', type: 'LICENCE', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Banque et finance', type: 'LICENCE', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Monnaie et finance', type: 'LICENCE', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Banque-assurance', type: 'LICENCE', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Technologies alimentaires et biologiques', type: 'LICENCE', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Aquaculture', type: 'LICENCE', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Informatique industrielle', type: 'LICENCE', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie mécanique', type: 'LICENCE', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Génie industriel', type: 'LICENCE', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Agro business', type: 'LICENCE', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Modélisation économétrique et analyse des données', type: 'LICENCE', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Diplomatie, protocole et relations publiques', type: 'LICENCE', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },

    { titre: 'Gestion des entreprises', type: 'MBA', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Leadership, gouvernance et performance des équipes', type: 'MBA', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },

    { titre: 'Comptabilité et gestion des entreprises', type: 'BTS', categorie: 'Comptabilité et Finance', dureeDeFormation: '2/y' },
    { titre: 'Communication des entreprises', type: 'BTS', categorie: 'Communication et Médias', dureeDeFormation: '2/y' },
    { titre: 'Assistant de gestion PME/PMI', type: 'BTS', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Génie civil', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Secrétariat de direction', type: 'BTS', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '2/y' },
    { titre: 'Commerce international', type: 'BTS', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Transport logistique', type: 'BTS', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Action commerciale et force de vente', type: 'BTS', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Gestion des ressources humaines', type: 'BTS', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Gestion des collectivités locales', type: 'BTS', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '2/y' },
    { titre: 'Informatique de gestion (développeur d\'application)', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Informatique de gestion (administrateur de réseaux locaux d\'entreprise)', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Télécommunications', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Maintenance informatique et réseaux', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Journalisme', type: 'BTS', categorie: 'Communication et Médias', dureeDeFormation: '2/y' },
    { titre: 'Informatique industrielle', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Géomètre topographe', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Assurance', type: 'BTS', categorie: 'Économie et Finance', dureeDeFormation: '2/y' },
    { titre: 'Finance banque', type: 'BTS', categorie: 'Économie et Finance', dureeDeFormation: '2/y' },
    { titre: 'Génie électrique', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Restauration', type: 'BTS', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Hôtellerie', type: 'BTS', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Génie thermique', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Electromécanique', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Electronique', type: 'BTS', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Electrotechnique', type: 'BTS', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Tourisme et loisirs', type: 'BTS', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Aquaculture', type: 'BTS', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '2/y' },
    { titre: 'Technologies alimentaires et biologiques', type: 'BTS', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '2/y' }
  ];

  const masterSeed = parcoursSeed
    .filter(parcours => parcours.type === 'LICENCE')
    .map(parcours => ({
      ...parcours,
      type: 'MASTER' as const,
      dureeDeFormation: '2/y'
    }));
  const completeParcoursSeed = [...parcoursSeed, ...masterSeed];
  const gradeByType = {
    LICENCE: 'Licence Professionnelle',
    MASTER: 'Master Professionnel',
    MBA: 'MBA',
    BTS: 'BTS'
  };
  const seededTitles = new Set<string>();
  for (const parcours of completeParcoursSeed) {
    const uniqueTitle = `${parcours.titre} (${parcours.type})`;
    seededTitles.add(uniqueTitle);
    const [record] = await OriParcours.findOrCreate({
      where: { titre: uniqueTitle },
      defaults: {
        titre: uniqueTitle,
        type: parcours.type,
        contenu: uniqueTitle,
        dureeDeFormation: parcours.dureeDeFormation,
        categorieId: categories[parcours.categorie].id
      },
      transaction
    });
    let inscriptionParcours = await InsParcours.findOne({
      where: { titre: uniqueTitle },
      transaction
    });
    if (!inscriptionParcours) {
      inscriptionParcours = await InsParcours.findOne({
        where: { titre: parcours.titre, type: parcours.type },
        transaction
      });
    }
    if (!inscriptionParcours) {
      inscriptionParcours = await InsParcours.create({
        titre: uniqueTitle,
        description: uniqueTitle,
        type: parcours.type,
        grade: gradeByType[parcours.type],
        niveauEtudeId: null,
        etablissementId,
      }, { transaction });
    } else {
      await inscriptionParcours.update({
        titre: uniqueTitle,
        niveauEtudeId: null,
        type: parcours.type,
        grade: gradeByType[parcours.type],
        description: uniqueTitle,
        ...(inscriptionParcours.etablissementId == null && etablissementId !== null
          ? { etablissementId }
          : {}),
      }, { transaction });
    }
    if (record.niveauEtudeId != null || record.contenu !== uniqueTitle) {
      await record.update(
        { niveauEtudeId: null, contenu: uniqueTitle },
        { transaction }
      );
    }
  }

    console.log(`✓ Catégories: ${Object.keys(categories).length}`);
    const expectedTitles = Array.from(seededTitles);
    const orientationCount = await OriParcours.count({
      where: { titre: { [Op.in]: expectedTitles } },
      transaction
    });
    const inscriptionCount = await InsParcours.count({
      where: { titre: { [Op.in]: expectedTitles } },
      transaction
    });
    if (expectedTitles.length !== 105 || orientationCount !== 105 || inscriptionCount !== 105) {
      throw new Error(
        `Nombre de parcours ESA inattendu: titres=${expectedTitles.length}, orientation=${orientationCount}, inscription=${inscriptionCount} (attendu: 105 chacun).`
      );
    }
    console.log(`✓ Parcours ESA présents: orientation=${orientationCount}, inscription=${inscriptionCount}.`);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CONFIRM_ESA_SEED_PRODUCTION !== 'I_UNDERSTAND') {
      console.error('Production protégée : définissez CONFIRM_ESA_SEED_PRODUCTION=I_UNDERSTAND après avoir vérifié la cible.');
      process.exitCode = 1;
      return;
    }
    if (!process.env.DB_HOST || !process.env.DB_NAME) {
      console.error('DB_HOST et DB_NAME doivent désigner explicitement la base de production.');
      process.exitCode = 1;
      return;
    }
    console.log(`Cible production confirmée: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  }

  let db: any;
  try {
    db = DatabaseConnection.getInstance();
    await seedEsa();
    console.log('Seed ESA terminé avec succès.');
  } catch (error: any) {
    console.error('Erreur durant le seed ESA:', error);
    process.exitCode = 1;
  } finally {
    if (db) {
      await db.sequelize.close();
    }
  }
}

main();
