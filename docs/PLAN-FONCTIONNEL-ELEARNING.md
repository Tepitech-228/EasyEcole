# Parcours e-learning — TODO fonctionnel

## Objectif

Permettre à un apprenant de suivre une formation en ligne sans le parcours pédagogique présentiel, tout en conservant le circuit d'admission, de validation collégiale et de recouvrement de la demande d'inscription.

## Parcours apprenant

1. Au début du wizard d'inscription, choisir « Présentiel » ou « En ligne ».
2. Pour « En ligne », ne pas afficher le choix de filière/parcours du pôle pédagogique. Utiliser un wizard e-learning distinct pour les informations et pièces d'inscription nécessaires.
3. Soumettre la demande au même circuit de contrôle et de validation collégiale du comité que les autres demandes. Le comité continue de valider le dossier, pas les sélections d'UE de l'apprenant.
4. Après validation du dossier et ouverture du recouvrement, permettre à l'apprenant de choisir les UE e-learning publiées pour son niveau et son année académique. Chaque UE affiche son nombre de crédits et son coût configuré par l'administration.
5. Après paiement/recouvrement confirmé, ouvrir les supports des UE sélectionnées. Un accès ne doit pas être ouvert par la seule création d'une demande ou d'une sélection non réglée.
6. Afficher les devoirs publiés par semestre. L'apprenant téléverse sa réponse avant l'échéance ; le professeur responsable corrige et saisit la note ainsi qu'un retour.
7. Afficher les examens présentiels planifiés par l'administration. Les séances sont proposées le samedi et associées à un centre ou à l'école ; l'apprenant choisit une séance disponible, sans pouvoir créer ni modifier le calendrier.
8. Présenter un relevé de notes par année, semestre et UE, avec les notes de devoir, d'examen et la moyenne pondérée.

## Règles d'évaluation

### Semestres 1 à 4 (première et deuxième année)

- Deux semestres par année académique.
- Un devoir en ligne par UE et par semestre.
- Un examen présentiel par UE et par semestre.
- Pour chaque semestre : devoir 40 %, examen 60 %.
- Les devoirs sont publiés et rendus en ligne ; les examens sont organisés en centre ou à l'école.

### À partir du semestre 5 (troisième année et suivantes)

- Un seul devoir en ligne par UE au lieu d'un devoir par semestre, corrigé par le professeur responsable.
- Un examen présentiel annuel par UE, planifié par l'administration dans un centre ou à l'école.
- La validation de la matière dépend des deux notes et des règles de moyenne à confirmer.

## Gestion par l'administration et les professeurs

- Créer et publier les UE avec niveau, année académique, crédits, coût et responsable pédagogique.
- Associer les supports de cours aux UE. Un même cours/support de référence peut couvrir les UE de plusieurs semestres (ex. Culture générale avec Culture générale 1 et Culture générale 2), mais les devoirs, examens et notes restent rattachés au semestre/à l'UE concerné.
- Créer les devoirs, téléverser le sujet, indiquer semestre, consignes et date limite, puis publier.
- Voir les rendus, les corriger et enregistrer notes/commentaires avec traçabilité.
- Créer les examens, téléverser les sujets, planifier des séances du samedi et affecter chaque séance à un centre ou à l'école.
- Autoriser uniquement les rôles d'administration à créer, publier ou modifier le calendrier d'examen. Les responsables de centre consultent les examens qui leur sont affectés.
- Produire les relevés par apprenant, année, semestre et UE, y compris les détails de pondération.

## Sécurité et cohérence des données

- Le serveur reste la source de vérité pour le mode de formation, l'admission, le paiement, les sélections et les notes.
- Une demande e-learning ne contourne jamais la validation collégiale du comité.
- Une sélection d'UE ne donne pas accès aux supports avant validation du dossier et confirmation du recouvrement.
- Un apprenant ne peut rendre un devoir que pour une UE à laquelle il a accès ; une soumission ne peut être modifiée après l'échéance, sauf autorisation explicite.
- Les notes et changements de statut sont journalisés et attribués à l'acteur.

## Tranches d'implémentation

- [x] Ajouter le choix du mode au wizard et masquer le choix de filière présentielle pour le mode en ligne.
- [x] Conserver le mode dans la demande et le store du wizard ; laisser l'admission dans le circuit collégial et créer le dossier e-learning sans cursus présentiel.
- [x] Filtrer le catalogue des UE par le niveau/année de la session et permettre la sélection après validation du comité et recouvrement.
- [x] Lier l'ouverture d'accès aux supports au choix financé (`acces_ouvert`) ; les cours restent invisibles sans sélection.
- [x] Dériver les devoirs de l'UE : un par semestre en S1-S4, un annuel en S5-S6 ; poids 40 % fixé côté serveur.
- [x] Dériver les examens de l'UE : un par semestre en S1-S4, annuel en S5-S6 ; samedi obligatoire et sujet réservé à l'administration.
- [ ] Créer une gestion dédiée des centres d'examen et affecter un compte responsable à chaque centre.
- [ ] Affecter les séances du samedi aux centres, les proposer aux étudiants autorisés et gérer réservation, présence et note.
- [ ] Ajouter les relevés et moyennes pondérées devoir/examen (40/60) ainsi que la note minimale de validation.
- [ ] Exécuter les tests Jest ciblés, les tests Angular et un scénario E2E complet.
- [x] Vérifier le checksum de `037_workflow_evaluations.sql` sur la base locale 3307 : l'empreinte en base correspond au SHA-256 du fichier versionné.
- [ ] Vérifier séparément le checksum 037 sur chaque base de production ciblée avant déploiement.

## Décisions à confirmer

- Les 30 crédits sont-ils le total cible de chaque semestre, réparti entre UE, ou une valeur par UE ? Le présent plan suppose un total de 30 crédits par semestre.
- Quelle note minimale valide une UE et quelle règle appliquer en cas d'absence à l'examen ?
- Un « support de cours » doit-il être partagé entre plusieurs UE liées, ou seulement visible depuis chacune d'elles ?
- Quels rôles précis voient les rendus et peuvent noter (enseignant titulaire, chargé de support, les deux) ?