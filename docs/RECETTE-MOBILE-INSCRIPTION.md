# Recette mobile — Inscription et téléversement des pièces

## But

Vérifier qu'un candidat peut réaliser seul, depuis un smartphone, une première
inscription ou une réinscription, y compris la photo de profil et le dépôt des
pièces justificatives. La recette couvre les appareils et navigateurs réellement
utilisés par les étudiants, pas seulement un navigateur de bureau.

## Correctifs intégrés (07/11/2026)

Les points de friction identifiés lors de l'analyse mobile sont traités
**côté serveur**, pour éviter tout décodage d'image volumineuse dans le
navigateur du téléphone :

| Sujet | Comportement actuel |
|---|---|
| Photos trop lourdes | Le fichier est envoyé tel quel (≤ 20 Mo). Le backend le redimensionne : photo de profil ≤ 1200 px / JPEG q0.86 ; pièces ≤ 2400 px / JPEG q0.88. |
| HEIC (iPhone) | Le backend convertit nativement le HEIC/HEIF en JPEG (`heic-convert` + `sharp`), puis applique le redimensionnement. Aucun message d'incompatibilité côté navigateur. |
| Formats acceptés | Pièces : PDF, JPG, JPEG, PNG, HEIC/HEIF. Photo : JPG, PNG, GIF, WebP, HEIC/HEIF. Les PDF et GIF ne sont pas transformés. |
| Limites | Pièce ≤ 20 Mo ; photo ≤ 20 Mo avant normalisation serveur (stockée ≤ 5 Mo après redimensionnement). |
| Parcours concernés | Wizard de première inscription, page de correction des pièces, wizard de réinscription, photo de profil, bordereaux. |

Fichier serveur : `easy-ecole-backend/src/core/helpers/NormaliserImage.ts`
(middleware `normaliserImages`, placé après multer sur chaque route d'upload).

> La compression canvas côté navigateur a été retirée : sur les photos de
> téléphone (48 Mpx), elle provoquait l'erreur « mémoire insuffisante pour
> cette procédure » dans Safari/WebKit. Le serveur, via libvips (sharp), traite
> ces images avec une empreinte mémoire maîtrisée.

## Environnements à couvrir

| Référence | Appareil / navigateur | Réseau |
|---|---|---|
| iOS | iPhone (iOS 16 ou 17), Safari | Wi-Fi puis 4G |
| Android | Android 12+, Chrome | Wi-Fi puis 4G |
| Petit écran | 360 × 640 px (émulation ou appareil réel) | Wi-Fi |
| Tablette | iPad ou tablette Android, Safari/Chrome | Wi-Fi |

## Prérequis et jeu de données

1. Un compte candidat sans photo de profil.
2. Une session ouverte avec au moins un document PDF et un document image.
3. Un dossier au statut `correction_demandee` avec deux pièces à remplacer.
4. Un étudiant éligible à la réinscription, avec six pièces et un bordereau.
5. Fichiers de test préparés : PDF de 15 Mo, photo JPG de 12 Mo, photo HEIC
   d'iPhone, PDF de 25 Mo (doit être refusé), fichier `.docx` (doit être refusé).
6. Accès aux outils de développement mobile (Safari Web Inspector ou Chrome
   Remote Debugging) pour lire la console et l'onglet Réseau.

## Scénarios

### M-01 — Première inscription complète sur iPhone (P0)

1. Se connecter, démarrer une première inscription et choisir parcours, session
   et filière.
2. Ajouter une photo de profil depuis la galerie.
3. Déposer un PDF et une photo de pièce, puis compléter les informations
   personnelles.
4. Soumettre la demande.

**Attendu :** chaque étape progresse sans blocage ; la photo et les pièces sont
visibles dans le récapitulatif ; la demande est créée une seule fois ; aucun
message d'erreur console.

### M-02 — Photo de profil HEIC > 5 Mo (P0)

1. Choisir une photo iPhone au format HEIC de plus de 5 Mo (jusqu'à 20 Mo).
2. Attendre la fin du téléversement.

**Attendu :** la photo est acceptée sans erreur mémoire ; l'aperçu local peut
être vide sur certains navigateurs non-Safari, mais l'upload aboutit ; côté
serveur, la photo est convertie en JPEG ≤ 1200 px et stockée sous 5 Mo. Dans
l'onglet Réseau, la requête `PUT /auth/apprenants/photo` transmet le fichier
d'origine (HEIC), pas un JPEG préparé par le navigateur.

### M-03 — Photo de pièce prise avec l'appareil photo (P0)

1. Sur un document image, ouvrir le sélecteur et choisir « Prendre une photo ».
2. Cadrer une pièce lisible, valider, puis soumettre.

**Attendu :** la photo est acceptée et transmise telle quelle ; le serveur la
convertit en JPEG et la redimensionne, la pièce reste lisible et l'envoi
aboutit sans erreur mémoire.

### M-04 — PDF volumineux (P1)

1. Déposer un PDF de 15 Mo comme pièce.
2. Soumettre.

**Attendu :** le PDF n'est pas recompressé ; il est envoyé tel quel ; le
téléversement aboutit ; la taille constatée dans Réseau est cohérente avec le
fichier d'origine.

### M-05 — Réseau instable pendant la soumission (P0)

1. Démarrer une soumission avec plusieurs pièces.
2. Couper le réseau (mode avion) pendant l'envoi.
3. Rétablir le réseau et relancer.

**Attendu :** un message d'erreur explicite s'affiche ; l'application ne crée
pas de demande partielle ; après reprise, l'utilisateur peut renvoyer sans
perdre les pièces déjà préparées ; aucun doublon de demande.

### M-06 — Rechargement de page en cours de saisie (P0)

1. Sélectionner une session et plusieurs pièces.
2. Recharger la page.
3. Revenir au wizard.

**Attendu :** l'étape et les métadonnées des pièces sont restaurées ; les
fichiers eux-mêmes ne sont pas conservés et l'interface demande de les
re-sélectionner ; aucune pièce n'est annoncée comme déposée à tort.

### M-07 — HEIC importé sur Android / Chrome (P1)

1. Importer un fichier HEIC depuis l'application Fichiers de Chrome Android.
2. Attendre la fin du téléversement.

**Attendu :** le fichier est accepté et envoyé ; le backend le convertit en JPEG.
L'aperçu local peut ne pas s'afficher (Chrome ne décode pas le HEIC), mais la
pièce est bien enregistrée et consultable après rechargement.

### M-08 — Correction de pièces depuis mobile (P0)

1. Ouvrir un dossier au statut `correction_demandee`.
2. Remplacer deux pièces par des photos prises au téléphone.
3. Soumettre puis vérifier le statut du dossier.

**Attendu :** les deux pièces sont envoyées séquentiellement ; si la seconde
échoue, la première reste enregistrée et l'utilisateur peut reprendre ; le
dossier repasse au statut attendu après traitement.

### M-09 — Réinscription mobile (P0)

1. Démarrer une réinscription éligible.
2. Déposer les six pièces et le bordereau, dont au moins une photo mobile.
3. Soumettre.

**Attendu :** les six pièces et le bordereau sont acceptés ; les images sont
normalisées côté serveur (HEIC converti, redimensionnement) ; les PDF sont
transmis sans modification ; la soumission aboutit.

### M-10 — Petit écran et rotation (P1)

1. Tester le wizard sur un écran de 360 px de large.
2. Passer en paysage puis revenir en portrait.

**Attendu :** les champs passent sur une colonne, les boutons restent
accessibles, seul le stepper défile horizontalement ; aucun débordement ne
masque un champ ou un bouton.

### M-11 — Formats photo de profil limites (P2)

1. Tester un JPG de 12 Mo, un PNG, un GIF animé, un WebP et un HEIC.
2. Tester un fichier de plus de 20 Mo ou un format refusé (`.docx`).

**Attendu :** les images valides sont acceptées et normalisées côté serveur ;
un GIF reste un GIF ; un fichier de plus de 20 Mo ou d'un format non autorisé
est refusé avec un message compréhensible.

### M-12 — Session expirée pendant la soumission (P1)

1. Laisser expirer le jeton (ou le révoquer) avant de soumettre.
2. Se reconnecter puis reprendre.

**Attendu :** l'utilisateur est invité à se reconnecter ; le brouillon local est
conservé ; aucune demande n'est créée deux fois.

## Points de contrôle techniques

- **Réseau :** la requête d'upload transmet le fichier d'origine (jusqu'à 20 Mo).
  Vérifier ensuite l'URL du fichier stocké : le serveur renvoie un JPEG
  redimensionné (≤ 1200 px pour une photo de profil, ≤ 2400 px pour une pièce).
- **Console :** aucune erreur non gérée, aucun message « mémoire insuffisante ».
- **Nom du fichier :** après normalisation serveur, le fichier stocké porte
  l'extension `.jpg`.
- **Orientation :** une photo prise en portrait doit s'afficher dans le bon
  sens, sans rotation manuelle (rotation EXIF appliquée par sharp).
- **Lisibilité :** vérifier qu'un texte fin (numéro de pièce, date) reste lisible
  après redimensionnement serveur.

## Preuves à joindre au rapport

- Modèle d'appareil, version de l'OS et du navigateur.
- Captures d'écran avant/après pour M-02, M-03 et M-08.
- Taille des requêtes dans l'onglet Réseau pour M-02 et M-04.
- Vidéo ou capture pour M-05 et M-06 (comportement en cas de coupure/rechargement).
- Erreurs console éventuelles, avec l'horodatage.

## Critères de sortie

La recette est considérée comme réussie si :

- tous les scénarios P0 passent sur iPhone Safari et Android Chrome ;
- aucun échec silencieux n'est constaté sur les téléversements ;
- les tailles envoyées respectent les limites serveur ;
- aucun doublon de demande n'est créé après une reprise ou une reconnexion ;
- les scénarios P1/P2 non exécutés sont explicitement notés `NON EXÉCUTÉ`,
  jamais `PASS`.

## Limites connues et suites

Ces points ne sont pas couverts par les correctifs actuels et restent à
planifier :

- **Brouillon serveur :** le brouillon reste local (sessionStorage, 2 h) et ne
  conserve que les métadonnées ; un changement d'appareil ou un vidage du
  stockage impose de tout re-sélectionner.
- **Reprise d'upload :** pas de reprise automatique fichier par fichier après
  une coupure ; l'utilisateur relance la soumission.
- **Progression :** pas de barre de progression par fichier ; seule l'attente
  globale « Soumission… » est affichée.
- **PWA / hors ligne :** pas de service worker ni de manifeste ; l'application
  nécessite une connexion.
- **Charge serveur :** la conversion HEIC et le redimensionnement consomment du
  CPU ; un envoi massif simultané (plusieurs dizaines de photos 20 Mo) doit être
  surveillé (mémoire du conteneur backend).
- **Aperçu HEIC :** sur les navigateurs qui ne décodent pas le HEIC (Chrome,
  Firefox), l'aperçu local avant envoi peut rester vide ; le fichier est
  néanmoins accepté et converti côté serveur.
