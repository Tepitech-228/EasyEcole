# Pôle Stockage des fichiers

Le menu **Stockage des fichiers > Importer / exporter** fournit un catalogue de
PDF avec classement académique, aperçu, téléchargement et contrôle SHA-256.

## Stockage et inventaire

- Les nouveaux PDF sont conservés sous `storage/files` avec un nom généré et
  une empreinte SHA-256 créée à l’import.
- En déploiement Docker, ce répertoire est dans le volume persistant
  `/app/storage`; il est inclus dans les sauvegardes du stockage.
- Les documents déjà référencés par la GED, les inscriptions, la scolarité,
  l’e-learning, les stages et le générateur de documents sont indexés sans
  déplacement de leur fichier d’origine. Le catalogue indique aussi les
  références dont le fichier est introuvable.
- L’index des sources existantes est actualisé au plus toutes les cinq minutes.
- La vérification d’un fichier importé compare son contenu à l’empreinte de
  l’import. Pour une ancienne pièce sans empreinte, la première vérification
  crée une empreinte de référence; les contrôles suivants détectent les
  modifications.

## Importer et exporter

1. Sélectionner un PDF (maximum 50 Mo), un site et sa catégorie.
2. Renseigner, si disponibles, l’année académique, la filière, le niveau, le
   parcours et la classe, puis importer.
3. Utiliser **Afficher**, **Télécharger** ou **Vérifier** dans le catalogue.
4. **Exporter le catalogue CSV** exporte les métadonnées et le statut des
   documents filtrés; les contenus sont téléchargés document par document.

## Droits

- Administrateurs, superviseurs généraux et comité d’orientation : accès à
  l’ensemble du catalogue.
- Comptables (`ESA_COMPTA` et `CABINET_COMPTABLE`) : pièces classées
  financières de leur site actif uniquement. Cette règle est appliquée par
  l’API lors de la consultation, de l’aperçu, du téléchargement, de la
  vérification et de l’export.
- Les autres rôles n’ont pas accès au pôle.

La migration `047_stockage_fichiers.sql` crée la table de catalogue; le runner
de migrations existant l’applique au prochain démarrage configuré pour les
migrations.
