# Module GED d'Easy Ecole

## Objectif
Le module GED (Gestion Électronique de Documents) permet aux utilisateurs de charger, archiver, classer et consulter des documents PDF dans l’application Easy Ecole.

## Fonctionnalités principales

- Chargement de documents PDF
- Archivage immédiat sans saisie obligatoire de métadonnées
- Saisie de métadonnées structurées
- Prévisualisation PDF avant validation
- Organisation des documents par dossier
- Export PDF de documents GED
- Interface professionnelle et organisée

## Composants et pages

### Page d’upload GED

- Interface en deux colonnes :
  - gauche : aperçu PDF
  - droite : formulaire de métadonnées
- Gestion du fichier PDF sélectionné
- Upload du document via un `FormData` vers l’API backend
- Message clair indiquant que la saisie des métadonnées est facultative
- Bouton d’envoi activable uniquement après sélection d’un fichier

### Page catalogue GED

- Affiche la liste des documents GED disponibles
- Permet de télécharger ou d’exporter un document au format PDF
- Intégration des actions principales directement sur la liste

### Page détail de document GED

- Affiche les informations d’un document
- Offre le téléchargement et l’export PDF
- Montre l’état d’archivage et les métadonnées associées

### Page dossiers GED

- Présente les dossiers / emplacements de stockage
- Permet de classer les documents dans des espaces dédiés
- Sert de base pour la structuration des documents GED

### Page nomenclature GED

- Gère les règles de nommage et de classement
- Facilite l’organisation des documents selon des catégories métiers

## Métadonnées gérées

Le formulaire GED permet de renseigner :

- `titre`
- `référence`
- `dossier`
- `élève`
- `parcours`
- `catégorie`
- `nommage`
- `tags`
- `durée de conservation`
- `archivedUntil`
- `isArchived`

Ces champs servent à enrichir le document pour faciliter la recherche, le tri et l’archivage.

## Comportement d’upload

- L’utilisateur sélectionne un PDF
- Le PDF est prévisualisé dans le volet gauche
- L’utilisateur peut choisir de compléter les métadonnées ou non
- L’envoi transfère le fichier et les métadonnées au backend
- Le document est archivé dans le référentiel GED

## Design et expérience utilisateur

- Structure professionnelle inspirée des pages d’inscription
- Mise en forme claire avec blocs distincts et espaces cohérents
- Formulaire centré sur la simplicité et l’efficacité
- Indications explicites lorsque l’utilisateur peut archiver sans saisir de données
- Aperçu PDF visible immédiatement pour validation visuelle

## Architecture technique

### Frontend

- Composants Angular dans `easy-ecole-web/src/app/features/modules/ged`
- Service GED dans `easy-ecole-web/src/app/data/modules/ged/services/ged.service.ts`
- Utilisation des composants partagés pour la navigation et les boutons
- Hook `DomSanitizer` pour afficher l’aperçu PDF en toute sécurité

### Backend

- Router GED exposant les routes API /modules/ged
- Controller GED gérant le traitement des fichiers et les réponses
- Générateur PDF pour l’export et la prévisualisation
- Stockage et archivage via la couche modèle/sequelize

## Cas d’usage

- Chargement rapide d’un rapport PDF sans métadonnées
- Archivage d’un contrat ou d’un document interne
- Classement d’un fichier dans un dossier spécifique
- Consultation et export d’un document existant
- Vérification visuelle avant validation finale

## Améliorations possibles

- Ajout de recherche et filtres par métadonnées
- Logiciel de versioning pour documents modifiés
- Notifications de fin de période de conservation
- Indexation OCR pour recherche textuelle interne
- Support de formats autres que PDF

## Sessions d’archivage administrateur

Le module GED prévoit un workflow complémentaire pour les administrateurs : la création de sessions d’archivage / saisie documentaire.

### Fonctionnalités de session

- Création d’une session par l’administrateur avec :
  - nom de session
  - description
  - période d’activité
  - dossier / catégorie GED affectée
  - ensemble de champs personnalisés à remplir
  - règles d’obligation et de validation pour les champs
- Lors de la création, les composants essentiels de saisie sont générés automatiquement.
- Une session peut être utilisée pour charger un lot de PDF et initier une campagne de saisie.

### Processus collaboratif

- L’administrateur ajoute des contributeurs ou des équipes à la session.
- Les contributeurs accèdent à une liste de documents PDF à traiter.
- Pour chaque document, le PDF est affiché à gauche et les champs paramétrés s’affichent à droite.
- Les contributeurs saisissent les informations demandées puis valident le document.
- L’admin peut partager le nombre de documents ou la session selon ses besoins.

### Upload en masse

- Support du chargement d’un dossier de PDF complet.
- Chaque PDF crée une fiche GED de saisie automatique.
- Possibilité de préremplir ou d’affecter des valeurs par lot selon des règles de nommage.

### Avantages

- Organisation professionnelle de la saisie documentaire
- Pilotage centralisé par l’administrateur
- Saisie structurée et homogène
- Collaboration simple entre admin et contributeurs
- Traçabilité du traitement de chaque document

## Conclusion

Le module GED est pensé pour offrir une gestion documentaire simple, rapide et professionnelle. Il permet à la fois un archivage immédiat sans contrainte et un classement fin avec métadonnées, tout en respectant une présentation claire et ergonomique.