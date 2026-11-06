# Recette mobile — Inscription et téléversement des pièces

## But

Vérifier qu'un candidat peut réaliser seul, depuis un smartphone, une première
inscription ou une réinscription, y compris la photo de profil et le dépôt des
pièces justificatives. La recette couvre les appareils et navigateurs réellement
utilisés par les étudiants, pas seulement un navigateur de bureau.

## Correctifs intégrés (06/11/2026)

Les points de friction identifiés lors de l'analyse mobile ont été traités
côté frontend et backend :

| Sujet | Comportement actuel |
|---|---|
| Photos trop lourdes | Redimensionnement et compression avant envoi : photo de profil ≤ 1200 px / JPEG q0.86 ; pièces ≤ 2400 px / JPEG q0.88. |
| HEIC (iPhone) | Le navigateur tente de convertir le fichier en JPEG. Si le navigateur ne sait pas le décoder, un message explicite invite à choisir un JPG ou une autre photo. Le backend sait également convertir un HEIC reçu directement. |
| Formats acceptés | Pièces : PDF, JPG, JPEG, PNG, HEIC/HEIF (converti). Photo : JPG, PNG, GIF, WebP, HEIC (converti). |
| Limites | Pièce ≤ 20 Mo avant préparation ; photo ≤ 5 Mo après compression. |
| Parcours concernés | Wizard de première inscription, page de correction des pièces, wizard de réinscription. |

Fichier utilitaire : `easy-ecole-web/src/app/shared/utils/image-compression.util.ts`.

> Si la conversion navigateur échoue, l'interface demande à l'utilisateur de
> choisir un format compatible ; elle n'envoie pas le fichier sans prévenir.
> Le backend applique aussi une conversion HEIC pour les autres clients.

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

1. Choisir une photo iPhone au format HEIC de plus de 5 Mo.
2. Attendre la fin du téléversement.

**Attendu :** la photo est acceptée, l'aperçu est net et correctement orienté ;
dans l'onglet Réseau, la requête `PUT /auth/apprenants/photo` envoie un JPEG de
moins de 5 Mo, pas le HEIC d'origine.

### M-03 — Photo de pièce prise avec l'appareil photo (P0)

1. Sur un document image, ouvrir le sélecteur et choisir « Prendre une photo ».
2. Cadrer une pièce lisible, valider, puis soumettre.

**Attendu :** la photo est convertie en JPEG, la pièce reste lisible, la taille
envoyée est inférieure à la limite et l'envoi aboutit.

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
2. Observer le message affiché.

**Attendu :** si le navigateur ne décode pas le HEIC, un message clair invite à
choisir un JPG ou une autre photo ; le fichier n'est pas envoyé ; l'utilisateur
peut immédiatement réessayer avec un autre format.

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
compressées ; les PDF sont transmis sans modification ; la soumission aboutit.

### M-10 — Petit écran et rotation (P1)

1. Tester le wizard sur un écran de 360 px de large.
2. Passer en paysage puis revenir en portrait.

**Attendu :** les champs passent sur une colonne, les boutons restent
accessibles, seul le stepper défile horizontalement ; aucun débordement ne
masque un champ ou un bouton.

### M-11 — Formats photo de profil limites (P2)

1. Tester un JPG de 12 Mo, un PNG, un GIF animé et un WebP.
2. Tester un fichier de plus de 5 Mo après compression ou un format refusé.

**Attendu :** les images valides sont acceptées et compressées ; un GIF reste
un GIF ; un fichier trop lourd ou d'un format non autorisé est refusé avec un
message compréhensible.

### M-12 — Session expirée pendant la soumission (P1)

1. Laisser expirer le jeton (ou le révoquer) avant de soumettre.
2. Se reconnecter puis reprendre.

**Attendu :** l'utilisateur est invité à se reconnecter ; le brouillon local est
conservé ; aucune demande n'est créée deux fois.

## Points de contrôle techniques

- **Réseau :** comparer la taille du fichier sélectionné et celle de la requête
  réellement envoyée (onglet Réseau). Une photo de 12 Mo doit arriver sous
  forme de JPEG nettement plus léger.
- **Console :** aucune erreur non gérée, aucun message silencieux.
- **Nom du fichier :** après conversion, l'extension envoyée est `.jpg`.
- **Orientation :** une photo prise en portrait doit s'afficher dans le bon
  sens, sans rotation manuelle.
- **Lisibilité :** vérifier qu'un texte fin (numéro de pièce, date) reste lisible
  après compression.

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
- **Formats :** le HEIC reste non accepté par le backend ; seule la conversion
  navigateur le rend utilisable.
