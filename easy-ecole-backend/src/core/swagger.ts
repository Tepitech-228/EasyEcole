import swaggerJsdoc from 'swagger-jsdoc';
import { modelSchemas } from './swagger_schemas';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EasyEcole API',
      version: '1.0.0',
      description: `API de gestion universitaire complète.

## Modules
- **Auth** — Authentification, utilisateurs, apprenants, enseignants, institutions
- **Inscription** — Sessions, cours, classes, parcours, notes, présence, capacité salles
- **Orientation** — Catalogue de parcours, demandes d'orientation
- **Bulletins** — Génération de bulletins, relevés de notes
- **Stages** — Offres, demandes, conventions, rapports
- **Stock** — Articles, fournisseurs, commandes, mouvements, affectation salles
- **Immobilisation** — Sites, bâtiments, actifs, maintenance, affectation salles
- **Achats** — Demandes, commandes, factures, fournisseurs, budgets
- **DocGen** — Génération documents, templates, cachets, signatures, workflows, vérification
- **RH** — Employés, paie, contrats, offres d'emploi, candidatures, GED
- **Scolarité** — Demandes de documents, registres, discipline, conseils de classe
- **E-Learning** — Cours en ligne, quiz, progression, certificats
- **Communication** — Messagerie, annonces, discussions, suggestions
- **Comptabilité** — Plan comptable, journaux, écritures
- **Reporting** — Tableaux de bord, effectifs, notes, paiements, RH
- **GED** — Gestion électronique de documents, arbre hiérarchique, courriers
- **Qualité** — Non-conformités, audits, actions correctives, enquêtes satisfaction
- **Marché** — Planification, appels d'offres, contrats, avenants
- **Établissement** — Configuration et informations de l'établissement
- **Menu** — Menu de navigation dynamique
- **Parent** — Liaison parent-enfant, suivi scolaire`
    },
    servers: [
      { url: '/api/v1', description: 'API de base' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: modelSchemas
    }
  },
  apis: [
    './src/modules/auth/routers/*.ts',
    './src/modules/inscription/routers/*.ts',
    './src/modules/orientation/routers/*.ts',
    './src/modules/stage/routers/*.ts',
    './src/modules/stock/routers/*.ts',
    './src/modules/immobilisation/routers/*.ts',
    './src/modules/bulletins/routers/*.ts',
    './src/modules/achats/routers/*.ts',
    './src/modules/rh/routers/*.ts',
    './src/modules/scolarite/routers/*.ts',
    './src/modules/elearning/routers/*.ts',
    './src/modules/communication/routers/*.ts',
    './src/modules/comptabilite/routers/*.ts',
    './src/modules/reporting/routers/*.ts',
    './src/modules/docgen/routers/*.ts',
    './src/modules/ged/routers/*.ts',
    './src/modules/qualite/routers/*.ts',
    './src/modules/marche/routers/*.ts',
    './src/modules/etablissement/routers/*.ts',
    './src/modules/parent/*.ts',
    './src/modules/menu/*.ts',
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
