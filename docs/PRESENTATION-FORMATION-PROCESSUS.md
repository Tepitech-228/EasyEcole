---
marp: true
theme: default
paginate: true
size: 16:9
header: 'EasyEcole — Formation processus'
footer: 'Document interne — à adapter selon l’établissement'
style: |
  section { font-size: 26px; }
  h1 { font-size: 42px; }
  h2 { font-size: 32px; }
  table { font-size: 20px; }
  blockquote { font-size: 22px; }
---

<!--
Génération PowerPoint :
npx @marp-team/marp-cli@latest docs/PRESENTATION-FORMATION-PROCESSUS.md --pptx

Alternative : importer ce fichier dans Gamma, Canva Docs ou tout outil acceptant le markdown.
Les commentaires HTML comme celui-ci servent de notes présentateur et ne s’affichent pas sur les slides.
-->

<!-- _class: lead -->

# EasyEcole

## Présentation des processus et formation des équipes

**Version 1.0 — Novembre 2026**

<!-- Notes : rappeler le contexte, l’objectif de la session et le public concerné. -->

---

## Objectifs de la session

- Comprendre le périmètre fonctionnel et les rôles
- Savoir exécuter les processus clés de bout en bout
- Identifier les contrôles et les points de blocage
- Appliquer les bonnes pratiques au quotidien
- Savoir où trouver la documentation de référence

<!-- Notes : demander aux participants leurs principaux irritants actuels. -->

---

## Agenda

1. **Cadre et rôles** — vue d’ensemble, périmètres, responsabilités
2. **Parcours étudiant** — orientation, admission, inscription, réinscription
3. **Processus pédagogiques** — cours, emplois du temps, pointage, présences, évaluations
4. **Processus support** — finances, documents, GED, RH, qualité
5. **Ateliers et checklist** — exercices, erreurs fréquentes, ressources

---

## EasyEcole en bref

- Plateforme de gestion scolaire intégrée
- Couvre l’inscription, la pédagogie, les finances, les RH, la GED, l’e-learning et la qualité
- Fonctionne par **établissement / site**, avec rôles et permissions
- Trace les décisions et les opérations importantes
- S’appuie sur des référentiels configurés avant chaque campagne

> Une incohérence de paramétrage en amont bloque les processus en aval.

---

## Rôles et périmètres

| Rôle | Périmètre principal | Exemples d’actions |
|---|---|---|
| Apprenant | Son dossier et son parcours | Consulter notes, absences, documents |
| Enseignant | Ses cours et séances | Cahier de texte, présences, notes |
| Institution / Admin | Paramétrage et pilotage | Inscriptions, affectations, reporting |
| Surveillant | Site actif autorisé | Présences, retards, suivi des séances |
| Superviseur général | Vision transverse | Contrôle et pilotage global |
| Caissier / Comptable | Encaissements et échéances | Vérifier paiements, imputer |
| Parent | Suivi de l’apprenant | Résultats, absences, communications |

<!-- Notes : insister sur la séparation entre visibilité d’un menu et autorisation réelle d’exécuter une action. -->

---

## Cartographie macro des processus

```
Orientation → Admission → Inscription → Cursus
                                      ↓
Planification pédagogique → Cours / Séances → Évaluations
                                      ↓
Bulletins → Jury → Rattrapage → Clôture
                                      ↓
Paiements → Comptabilité → Documents / GED → Reporting
```

- Chaque étape produit un statut et des données utilisées par la suivante
- Les processus support (RH, achats, qualité) suivent les mêmes exigences de contrôle

---

## Processus 1 — Accès et comptes

1. Création du compte : identité, email, statut, rôle applicatif
2. Association d’un profil métier : apprenant, enseignant, parent, personnel
3. Attribution des rôles et permissions
4. Communication ou définition des identifiants selon la procédure locale
5. Journalisation des actions d’administration

**Contrôles :** unicité, statut autorisé, séparation visibilité / exécution.

**Bonne pratique :** comptes nominatifs, jamais de compte partagé.

---

## Processus 2 — Paramétrage avant campagne

- Référentiels : établissement, année / session, parcours, cours / UE, niveaux, classes
- Frais, barèmes, règles de notation, types documentaires, rôles
- Vérifier les dates, rattachements, coefficients, crédits et calendriers d’examen
- Contrôler les affectations enseignants et apprenants

> Checklist de paramétrage validée avant l’ouverture des inscriptions.

<!-- Notes : montrer un exemple de référentiel incohérent et ses conséquences. -->

---

## Processus 3 — Orientation et admission

1. Le candidat renseigne son profil, son niveau et ses acquis
2. Le système présente le catalogue des parcours : niveaux, prérequis, débouchés
3. Le candidat sélectionne un ou plusieurs parcours
4. Le comité d’orientation examine la demande
5. Une réponse d’orientation est enregistrée

**Contrôles :** prérequis du parcours, cohérence entre conseil et parcours demandé.

**Résultat :** candidat orienté ou demande renvoyée pour complément.

---

## Processus 4 — Inscription

1. Ouverture d’une session : calendrier, parcours, conditions
2. Choix de la session et du parcours
3. Dépôt des pièces justificatives
4. Vérification de la complétude et de la lisibilité
5. Décision : validation, rejet ou demande de correction
6. Paiement et transmission du bordereau / justificatif
7. Vérification et validation du paiement
8. Création du dossier, rattachement au cursus, matricule, carte étudiante

> La validation d’une demande n’est pas l’inscription définitive : le paiement doit être validé.

---

## Processus 5 — Réinscription

1. Préparation de l’année ou du semestre : session, parcours, classes, cours, salles, créneaux
2. L’étudiant consulte ses résultats et son admissibilité au passage
3. Il initie ou planifie sa réinscription
4. Il complète les pièces et informations exigées
5. L’administration examine et confirme ou rejette
6. Le cursus est actualisé ; les frais et échéances sont préparés

**Contrôles :** décision de passage, dettes académiques ou financières, documents complets.

---

## Processus 6 — Enseignement et emplois du temps

- Définir les cours / UE et leur rattachement aux parcours, niveaux ou classes
- Affecter un enseignant, une période, un créneau et une salle
- Renseigner les ECUE : volumes CM, TD/TP, TPE et **VH total**
- Publier l’emploi du temps : condition nécessaire au pointage des séances
- L’enseignant prépare les chapitres, ressources et séances du cahier de texte

**Contrôles :** cohérence des volumes horaires, des affectations et de la publication.

<!-- Notes : rappeler que le VH total est la somme des VH des ECUE, distinct du total CM+TD/TP+TPE. -->

---

## Processus 7 — Pointage des enseignants par séance

- L’enseignant pointe le **début** puis la **fin** de la séance
- Conditions : jour même, séance publiée, enseignant et site autorisés
- Le début enregistre l’heure réelle ; la fin calcule la durée et le départ anticipé
- Statuts : en attente, en cours, terminé
- Source : pointage de séance, avec repli sur l’ancien pointage QR si nécessaire
- Les tableaux de bord utilisent ces données : heures effectuées, retards, présence

**Bonnes pratiques :** pointer dès l’ouverture et à la clôture ; signaler toute anomalie.

<!-- Notes : expliquer les cas NOT_TODAY, TOO_EARLY, SESSION_ENDED, START_REQUIRED et le départ anticipé. -->

---

## Processus 8 — Présences et cahier de texte

1. À chaque séance : contenu, ressources et activités
2. Enregistrement des présences et absences
3. QR code si activé, sinon saisie manuelle
4. Consultation par les acteurs autorisés
5. Alimentation du suivi scolaire et des bulletins

**Contrôles :** bonne séance, bonne classe, bonne date, bon enseignant.

**Résultat :** séance tracée et présence enregistrée.

---

## Processus 9 — Évaluations et bulletins

1. Configuration des modalités de contrôle, types, coefficients et périodes
2. Création ou sélection des évaluations du cours
3. Saisie des notes des apprenants
4. Contrôles : UE, période, apprenant, barème, auteur, période ouverte
5. Brouillon puis publication ; une note publiée ou une période verrouillée devient non modifiable
6. Calcul des moyennes, crédits, mentions et absences
7. Vérification et publication des bulletins

> Ne pas déduire une formule unique : les règles dépendent du paramétrage local.

---

## Processus 10 — Jury, rattrapage et clôture

- **Jury :** examiner résultats, absences, crédits et situations particulières
- **Décisions :** admission / passage, rattrapage, redoublement
- **Rattrapage :** session, éligibilité, demande, évaluation, réintégration du résultat
- **Clôture :** vérifier les saisies et délibérations, geler les notes, préparer la suite
- **Traçabilité :** décisions historisées, procès-verbal, dates et justificatifs

**Contrôle :** traiter les corrections avant le gel ; vérifier les impacts irréversibles.

---

## Processus 11 — Paiements et comptabilité

1. Détermination des frais applicables et de l’échéancier
2. Paiement par un moyen activé par l’établissement
3. Transmission du justificatif ou du bordereau si requis
4. Vérification du paiement et de l’authenticité des pièces
5. Imputation comptable lorsque l’étape est utilisée
6. Validation du bordereau par l’acteur habilité

> Un rejet impose une correction ou une nouvelle preuve : le paiement n’est pas acquis.

---

## Processus 12 — Scolarité, documents et GED

- Demande de document scolaire par l’apprenant ou l’administration
- Génération du document et vérification d’authenticité
- GED : versement, classement, gestion des versions, courrier
- Conservation et élimination selon les règles de l’établissement
- Contrôles : pièces complètes, droits d’accès, traçabilité

**Bonne pratique :** ne diffuser que les documents validés et au bon destinataire.

---

## Processus 13 — E-learning et espace parents

- **E-learning :** cours en ligne, ressources, suivi à distance
- **Espace parents :** résultats, absences, paiements, communications
- Publication au bon moment et selon les droits
- Respect de la confidentialité des données scolaires et financières

**Contrôle :** vérifier le statut de publication avant de communiquer.

---

## Processus 14 — RH, achats, stocks et immobilisations

- **RH :** personnel, contrats, temps, éléments variables, paie, congés, recrutement
- **Achats / stocks :** besoin, achat, réception, mouvement, inventaire, marché
- **Immobilisations :** acquisition, affectation, suivi et patrimoine
- Processus support soumis aux mêmes exigences de contrôle et de traçabilité

> Chaque décision doit pouvoir être reliée à un acteur, une date et un justificatif.

---

## Processus 15 — Qualité, audit et reporting

- Non-conformité, analyse des causes et action corrective
- Audit, revue de direction et mesure de la satisfaction
- Reporting : indicateurs, exports et tableaux de bord
- Contrôles : fiabilité des données, source, période et droits d’accès

**Résultat :** décisions pilotées par des données vérifiées et traçables.

---

## Contrôles transverses

- **Identité et rattachements :** bon étudiant, bon parent, bon enseignant, bon site
- **Séparation des tâches :** saisie, contrôle et approbation distincts
- **Traçabilité :** acteur, date, statut, motif, pièces justificatives
- **Confidentialité :** données scolaires, RH et pièces d’identité limitées aux rôles habilités
- **Statuts :** brouillon, soumis, validé, publié, payé, clôturé, archivé
- **Paramétrage local :** frais, formules, crédits, délais et conservation variables

---

## Erreurs fréquentes et bonnes pratiques

| Erreur fréquente | Bonne pratique |
|---|---|
| Pointer en retard ou oublier la fin | Pointer dès l’ouverture et à la clôture |
| Mauvaise session ou mauvais parcours | Contrôler avant validation |
| Dossier incomplet | Utiliser la checklist des pièces |
| Note modifiée après publication | Appliquer la procédure de correction |
| Compte partagé | Utiliser un compte nominatif |
| Mauvais site actif | Vérifier le sélecteur de site |

---

## Ateliers de formation

1. **Inscription :** traiter un candidat de l’orientation à la carte étudiante
2. **Réinscription :** gérer un étudiant avec une dette et une pièce manquante
3. **Séance :** préparer une séance, pointer le début et la fin, saisir les présences
4. **Évaluation :** saisir les notes, publier un bulletin, corriger une note
5. **Paiement :** traiter un bordereau rejeté puis corrigé

**Livrable :** checklist complétée par groupe et restitution des points bloquants.

---

## Ressources et questions

- `docs/PROCESSUS-APPLICATION.md` — processus détaillés
- `docs/FONCTIONNALITES.md` — périmètre fonctionnel
- `docs/DIAGRAMMES-CAS-UTILISATION.md` — cas d’utilisation
- `docs/LOGIQUE-METIER-POLES.md` — règles métier par pôle
- `guide/` — captures et supports visuels

---

<!-- _class: lead -->

# Questions

<!-- Notes : ouvrir la discussion, noter les questions sans réponse et les affecter à un responsable. -->
