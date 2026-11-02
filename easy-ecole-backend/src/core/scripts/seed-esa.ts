import { DatabaseConnection } from '../helpers/DatabaseConnection';

export async function seedEsa(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  const sequelize = db.sequelize;

  require('../../modules/orientation/models/_associations');
  require('../../modules/orientation/models/NiveauEtude');
  require('../../modules/orientation/models/Categorie');
  require('../../modules/orientation/models/Parcours');

  const OriNiv = sequelize.model('ori_NiveauEtude');
  const OriCat = sequelize.model('OriCategorie');
  const OriPar = sequelize.model('OriParcours');
  const transaction = await sequelize.transaction();

  try {
    const niveauByLibelle = new Map<string, any>();
    for (const libelle of ['Baccalauréat', 'Bac+2', 'Bac+3', 'Bac+5']) {
      const [niveau] = await OriNiv.findOrCreate({
        where: { libelle },
        defaults: { libelle },
        transaction
      });
      niveauByLibelle.set(libelle, niveau);
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
      const [categorie] = await OriCat.findOrCreate({
        where: { libelle },
        defaults: { libelle, description },
        transaction
      });
      categories[libelle] = categorie;
    }

  interface ParcoursSeedItem {
    titre: string;
    type: 'LICENCE' | 'MASTER' | 'MBA' | 'BTS';
    niveau: 'Bac+3' | 'Bac+5' | 'Bac+2';
    categorie: string;
    dureeDeFormation: string;
  }

  const parcoursSeed: ParcoursSeedItem[] = [
    { titre: 'Administration générale', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Administration des collectivités territoriales', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Administration des collectivités locales', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Marketing digital et E business', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Protocole et relations publiques', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Gestion commerciale', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Gestion des ressources humaines', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Science et techniques comptables et financières', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Audit et contrôle de gestion', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Commerce international', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Transport logistique', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Marketing-communication', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Gestion des projets et passation des marchés', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Réseaux et télécommunication', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie logiciel', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie civil', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Energies renouvelables et efficacité énergétique', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Sécurité informatique-cyber sécurité-cybercriminalité', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Marketing', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Commerce et Gestion', dureeDeFormation: '3/y' },
    { titre: 'Génie électrique', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Administration et gestion des affaires', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '3/y' },
    { titre: 'Gestion fiscales des entreprises', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Comptabilité et Finance', dureeDeFormation: '3/y' },
    { titre: 'Economie des transports et développement social', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Management du tourisme et de l\'hôtellerie', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '3/y' },
    { titre: 'Management et gestion des organisations sportives', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Sport et Loisirs', dureeDeFormation: '3/y' },
    { titre: 'Journalisme', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },
    { titre: 'Banque et finance', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Monnaie et finance', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Banque-assurance', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Technologies alimentaires et biologiques', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Aquaculture', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Informatique industrielle', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Sciences et Technologies', dureeDeFormation: '3/y' },
    { titre: 'Génie mécanique', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Génie industriel', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Ingénierie et Génie', dureeDeFormation: '3/y' },
    { titre: 'Agro business', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '3/y' },
    { titre: 'Modélisation économétrique et analyse des données', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Économie et Finance', dureeDeFormation: '3/y' },
    { titre: 'Diplomatie, protocole et relations publiques', type: 'LICENCE', niveau: 'Bac+3', categorie: 'Communication et Médias', dureeDeFormation: '3/y' },

    { titre: 'Gestion des entreprises', type: 'MBA', niveau: 'Bac+5', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Leadership, gouvernance et performance des équipes', type: 'MBA', niveau: 'Bac+5', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },

    { titre: 'Comptabilité et gestion des entreprises', type: 'BTS', niveau: 'Bac+2', categorie: 'Comptabilité et Finance', dureeDeFormation: '2/y' },
    { titre: 'Communication des entreprises', type: 'BTS', niveau: 'Bac+2', categorie: 'Communication et Médias', dureeDeFormation: '2/y' },
    { titre: 'Assistant de gestion PME/PMI', type: 'BTS', niveau: 'Bac+2', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Génie civil', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Secrétariat de direction', type: 'BTS', niveau: 'Bac+2', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '2/y' },
    { titre: 'Commerce international', type: 'BTS', niveau: 'Bac+2', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Transport logistique', type: 'BTS', niveau: 'Bac+2', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Action commerciale et force de vente', type: 'BTS', niveau: 'Bac+2', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Gestion des ressources humaines', type: 'BTS', niveau: 'Bac+2', categorie: 'Commerce et Gestion', dureeDeFormation: '2/y' },
    { titre: 'Gestion des collectivités locales', type: 'BTS', niveau: 'Bac+2', categorie: 'Administration et Affaires Publiques', dureeDeFormation: '2/y' },
    { titre: 'Informatique de gestion (développeur d\'application)', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Informatique de gestion (administrateur de réseaux locaux d\'entreprise)', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Télécommunications', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Maintenance informatique et réseaux', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Journalisme', type: 'BTS', niveau: 'Bac+2', categorie: 'Communication et Médias', dureeDeFormation: '2/y' },
    { titre: 'Informatique industrielle', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Géomètre topographe', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Assurance', type: 'BTS', niveau: 'Bac+2', categorie: 'Économie et Finance', dureeDeFormation: '2/y' },
    { titre: 'Finance banque', type: 'BTS', niveau: 'Bac+2', categorie: 'Économie et Finance', dureeDeFormation: '2/y' },
    { titre: 'Génie électrique', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Restauration', type: 'BTS', niveau: 'Bac+2', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Hôtellerie', type: 'BTS', niveau: 'Bac+2', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Génie thermique', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Electromécanique', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Electronique', type: 'BTS', niveau: 'Bac+2', categorie: 'Sciences et Technologies', dureeDeFormation: '2/y' },
    { titre: 'Electrotechnique', type: 'BTS', niveau: 'Bac+2', categorie: 'Ingénierie et Génie', dureeDeFormation: '2/y' },
    { titre: 'Tourisme et loisirs', type: 'BTS', niveau: 'Bac+2', categorie: 'Tourisme, Hôtellerie et Loisirs', dureeDeFormation: '2/y' },
    { titre: 'Aquaculture', type: 'BTS', niveau: 'Bac+2', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '2/y' },
    { titre: 'Technologies alimentaires et biologiques', type: 'BTS', niveau: 'Bac+2', categorie: 'Agriculture et Agro-alimentaire', dureeDeFormation: '2/y' }
  ];

  const masterSeed = parcoursSeed
    .filter(parcours => parcours.type === 'LICENCE')
    .map(parcours => ({
      ...parcours,
      type: 'MASTER' as const,
      niveau: 'Bac+5' as const,
      dureeDeFormation: '2/y'
    }));
  const completeParcoursSeed = [...parcoursSeed, ...masterSeed];
  const createdParcours = [] as any[];
  for (const parcours of completeParcoursSeed) {
    const uniqueTitle = `${parcours.titre} (${parcours.type})`;
    const [record] = await OriPar.findOrCreate({
      where: { titre: uniqueTitle },
      defaults: {
        titre: uniqueTitle,
        type: parcours.type,
        contenu: `${uniqueTitle} — ${parcours.niveau}`,
        dureeDeFormation: parcours.dureeDeFormation,
        categorieId: categories[parcours.categorie].id,
        niveauEtudeId: niveauByLibelle.get(parcours.niveau)?.id
      },
      transaction
    });
    createdParcours.push(record);
  }

    console.log(`✓ Catégories: ${Object.keys(categories).length}`);
    console.log(`✓ Niveaux: ${niveauByLibelle.size}`);
    if (createdParcours.length !== 105) {
      throw new Error(`Nombre de parcours ESA inattendu: ${createdParcours.length} (attendu: 105).`);
    }
    console.log(`✓ Parcours ESA créés / confirmés: ${createdParcours.length} (37 licences, 37 masters, 2 MBA, 29 BTS)`);
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
