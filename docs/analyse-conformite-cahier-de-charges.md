# Analyse de conformité — Cahier de charges ESA vs EasyEcole

> Date : 22/06/2026
> Source : `Cahier de charges ESA ECOLE.docx` vs codebase (frontend Angular + backend Node.js/Express)

---

## Résumé

| Statut | Axes | Modules |
|--------|------|---------|
| ✅ Conforme | 1 sur 5 (partiel) | Auth, Orientation, Inscription, Cours, Bulletins |
| ⚠️ Partiel | 1 sur 5 | Pointage (QR code), Stages |
| ❌ Non implémenté | 3 sur 5 | E-learning, Gestion Administrative, Reporting |

---

## AXE 1 — Admission et Inscription

### 🔹 Orientation

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Présentation parcours, filières, frais | ✅ Fait | Catalogue orientation avec parcours, catégories |
| Pièces à fournir | ✅ Fait | Upload dossier dans inscription |
| Préinscription : constitution dossier | ✅ Fait | Demande d'orientation + Demande d'inscription |
| Enregistrement comptable des frais | ✅ Fait | PaiementInscriptionController |
| Génération matricule étudiant | ✅ Fait | CursusApprenant avec matricule |
| Délivrance autorisation provisoire d'inscription | ❌ Manquant | Pas de module "Comité d'orientation et d'équivalence" |
| Notification email | ⚠️ Partiel | Email confirmation existant, pas pour autorisation provisoire |

### 🔹 Inscription définitive

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Paiement frais inscription | ✅ Fait | 3 modes : espèces, en ligne, Mobile Money (CinetPay) |
| Confirmation paiement (quitus) | ❌ Manquant | Pas de concept "quitus" ni délivrance |
| Code QR lié au matricule | ⚠️ Partiel | Module Pointage existe (scan QR), mais pas de génération automatique liée à l'inscription |
| Module Vie Estudiantine | ❌ Manquant | Aucune interface administration/étudiant pour communications |

---

## AXE 2 — Cursus, Cours, Notes

### 🔹 Cursus

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| BTS / Licence / Master | ✅ Fait | Parcours avec niveaux d'étude |
| Programmation des cours | ✅ Fait | Séances, emplois du temps (FullCalendar) |
| Suivi des présences | ✅ Fait | Présences, feuilles de présence, QR code |
| Cahiers de texte et présence | ✅ Fait | CahierDeTexteController, ListePresence |
| Accès administration/enseignant/délégué | ⚠️ Partiel | Délégué étudiant non géré |

### 🔹 Notes

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Interface enseignant connexion sécurisée | ✅ Fait | AuthEnseignant middleware |
| Chargement PV de notes | ✅ Fait | NoteEvaluationController |
| Interface contrôle (PV gauche, notes droite) | ❌ Manquant | Saisie de notes simple, pas d'interface PV côte à côte |
| Bouton validation/mise à jour | ✅ Fait | Notes avec workflow validation |
| Champ d'observation | ❌ Manquant | Pas de champ d'observation sur les notes |
| Gestion cahier de texte | ✅ Fait | CahierDeTexteController |
| Boîte à suggestions | ❌ Manquant | Aucune boîte à suggestions présente |

### 🔹 Consultation et contestation

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Notes consultables (admin + étudiant) | ✅ Fait | Liste notes, bulletins, mon-releve-page |
| Réclamation / contestation (procès) | ❌ Manquant | Aucune procédure d'appel/contestation |
| Demande document académique | ❌ Manquant | Pas de workflow de demande de document |
| Délivrance document électronique | ❌ Manquant | Pas de génération PDF des documents |

---

## AXE 3 — E-learning et Supports Pédagogiques

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Plateforme centralisée supports | ✅ Partiel | Ressources, fichiers, vidéos dans Cours |
| Compression vidéos (bande passante limitée) | ❌ Manquant | Aucune compression vidéo |
| Couplage envoi mail + plateforme | ❌ Manquant | Pas d'envoi automatique par mail |
| Même processus préinscription/inscription | ✅ Fait | Via module Inscription |
| Chat dates évaluation/examen | ❌ Manquant | Aucun chat implémenté |

---

## AXE 4 — Gestion Administrative

### 🔹 Ressources Humaines

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Recrutement | ❌ Manquant | Aucun module RH |
| Formation personnel | ❌ Manquant | Aucun module RH |
| Évaluation personnel | ❌ Manquant | Aucun module RH |
| Reporting RH (recrutements, formations) | ❌ Manquant | Aucun reporting RH |
| Paie personnel administratif | ❌ Manquant | Aucune paie |
| Gestion prestations enseignants | ❌ Manquant | Aucune gestion prestations |

### 🔹 Achats

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Expression de besoins (formulaire) | ❌ Manquant | Pas de module achats |
| Validation demande | ❌ Manquant | Pas de module achats |
| Exécution commande | ❌ Manquant | Pas de module achats |
| Réception et clôture | ❌ Manquant | Pas de module achats |

### 🔹 Facturation et Comptabilité

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Factures pro forma | ❌ Manquant | Aucune facturation |
| Gestion immobilisations | ✅ Fait | Module Immobilisation complet |
| Gestion stocks | ✅ Fait | Module Stock complet |
| Comptabilité générale | ❌ Manquant | Aucune comptabilité |
| Suivi budgétaire | ❌ Manquant | Aucun budget |

---

## AXE 5 — Reporting

| Exigence CDC | Statut | Notes |
|-------------|--------|-------|
| Rapports académiques | ⚠️ Partiel | Bulletins exportables, pas de reporting consolidé |
| Rapports financiers | ❌ Manquant | Aucun rapport financier |
| Rapports RH | ❌ Manquant | Aucun module RH, aucun rapport |
| Rapports transverses | ❌ Manquant | Aucun module reporting/statistiques dédié |

---

## Profils utilisateurs — Détail fonctionnel

### Étudiant / Candidat (CU-ET)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-ET-01 : Consulter filières | ✅ Fait | Catalogue orientation |
| CU-ET-02 : Préinscription | ✅ Fait | Demande d'orientation + inscription |
| CU-ET-03 : Autorisation provisoire | ❌ Manquant | Pas de comité d'orientation |
| CU-ET-04 : Finaliser inscription | ✅ Fait | Paiement + validation |
| CU-ET-05 : Code QR contrôle accès | ⚠️ Partiel | Module Pointage existe (scan), mais pas lié au matricule |
| CU-ET-06 : Consulter notes | ✅ Fait | Liste notes, bulletins |
| CU-ET-07 : Réclamation note | ❌ Manquant | Aucun formulaire de réclamation |
| CU-ET-08 : Demande document académique | ❌ Manquant | Aucun workflow |
| CU-ET-09 : Vie estudiantine | ❌ Manquant | Aucun module |
| CU-ET-10 : Cours à distance | ❌ Manquant | Pas de module e-learning dédié |
| CU-ET-11 : Boîte à suggestions | ❌ Manquant | Aucune suggestion |
| CU-ET-12 : Payer scolarité | ✅ Fait | CinetPay Mobile Money |
| CU-ET-13 : Cahier de texte/présence délégué | ❌ Manquant | Pas de rôle délégué étudiant |

### Enseignant (CU-EN)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-EN-01 : Connexion interface | ✅ Fait | JWT + AuthEnseignant |
| CU-EN-02 : Charger PV et saisir notes | ✅ Fait | NoteEvaluationController |
| CU-EN-03 : Valider/mettre à jour notes | ⚠️ Partiel | Validation simple, pas d'interface PV côte à côte |
| CU-EN-04 : Cahier de texte/présence | ✅ Fait | CahierDeTexte, Présences |
| CU-EN-05 :Communiquer date évaluation | ❌ Manquant | Pas de chat ni d'annonces |
| CU-EN-06 : Boîte à suggestions | ❌ Manquant | Aucune suggestion |

### Service Scolarité (CU-AD)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-AD-01 : Présenter orientation | ✅ Fait | Catalogue parcours |
| CU-AD-02 : Enregistrer préinscription | ✅ Fait | Demandes orientation + inscription |
| CU-AD-03 : Programmer cours | ✅ Fait | Séances, emploi du temps |
| CU-AD-04 : Suivre présences | ✅ Fait | Présences, cahiers |
| CU-AD-05 : Contrôler notes | ✅ Fait | Consultation notes par admin |
| CU-AD-06 : Relevé de notes | ✅ Fait | Bulletins |
| CU-AD-07 : Boîte à suggestions | ❌ Manquant | Aucune |
| CU-AD-08 : Infos estudiantines | ❌ Manquant | Pas de Vie Estudiantine |

### Comité d'orientation (CU-CO)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-CO-01 : Étudier dossier | ⚠️ Partiel | Demande orientation traitée, pas d'analyse d'équivalence |
| CU-CO-02 : Autorisation provisoire | ❌ Manquant | Pas de génération d'autorisation |
| CU-CO-03 : Valider document académique | ❌ Manquant | Pas de workflow document |

### Service Comptabilité (CU-CP)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-CP-01 : Générer quitus | ❌ Manquant | Pas de concept quitus |
| CU-CP-02 : Confirmer paiement | ✅ Fait | Paiement validé mais pas de "quitus" |
| CU-CP-04 : Facture pro forma | ❌ Manquant | Aucune facturation |
| CU-CP-05 : Immobilisations/stocks | ✅ Fait | Modules dédiés |
| CU-CP-06 : Budget | ❌ Manquant | Aucun budget |

### Ressources Humaines (CU-RH)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-RH-01 : Paie | ❌ Manquant | Aucune |
| CU-RH-02 : Prestations enseignants | ❌ Manquant | Aucune |
| CU-RH-03 : Recrutement | ❌ Manquant | Aucun |
| CU-RH-04 : Formation | ❌ Manquant | Aucun |
| CU-RH-05 : Évaluation | ❌ Manquant | Aucun |

### Achats (CU-AP)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-AP-01 : Expression de besoins | ❌ Manquant | Aucun |
| CU-AP-02 : Réceptionner commande | ❌ Manquant | Aucun |

### Service Informatique (CU-SI)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-SI-01 : Admin e-learning | ❌ Manquant | Pas de module e-learning dédié |
| CU-SI-02 : Gérer code QR | ⚠️ Partiel | Pointage existe, mais génération/liaison matricule manquante |
| CU-SI-03 : Couplage mail/plateforme | ❌ Manquant | Pas de couplage automatique |

### Reporting (CU-RS)

| Cas d'usage | Statut | Notes |
|-------------|--------|-------|
| CU-RS-01 à CU-RS-10 | ❌ Manquant | Aucun module reporting dédié |

---

## Synthèse des écarts par module

| Module CDC | Module EasyEcole | Statut | Écarts |
|-----------|-----------------|--------|--------|
| Orientation | orientation | ✅ 90% | Pas d'équivalence, pas d'autorisation provisoire |
| Inscription | inscription | ✅ 85% | Pas de quitus, pas de vie estudiantine |
| Notes/Bulletins | bulletins + cours | ⚠️ 70% | Pas de contestation, pas de demande de document |
| E-learning | (aucun) | ❌ 0% | Module entier manquant |
| Présences/QR | pointage | ⚠️ 50% | QR existe, mais pas lié au matricule |
| Stages | stages | ✅ 80% | Pas de soutenance, pas de grille entreprise |
| RH | (aucun) | ❌ 0% | Module entier manquant |
| Achats | (aucun) | ❌ 0% | Module entier manquant |
| Comptabilité/Paie | (aucun) | ❌ 0% | Module entier manquant |
| Immobilisations | immobilisations | ✅ 85% | Pas d'états comptables |
| Stocks | stocks | ✅ 85% | Pas d'inventaire physique |
| Reporting | (aucun) | ❌ 0% | Module entier manquant |
| Communication | (aucun) | ❌ 0% | Pas de chat, pas d'annonces |
| Vie Estudiantine | (aucun) | ❌ 0% | Module entier manquant |

---

## Priorisation des écarts

### Critique (bloquant pour la recette)
1. **E-learning** (AXE 3) — Module entier absent
2. **Gestion Administrative** (AXE 4) — RH, Achats, Compta absents
3. **Reporting** (AXE 5) — Absence totale
4. **Boîte à suggestions** — Requise pour étudiants, enseignants
5. **Réclamation de notes** — Requise pour étudiants
6. **Demande de documents académiques** — Workflow complet manquant

### Important
7. Autorisation provisoire d'inscription par comité
8. Quitus de paiement par cabinet comptable
9. Vie Estudiantine (communications administration → étudiants)
10. Interface PV côte à côte pour validation notes
11. Chat enseignant → étudiants (dates évaluation)
12. Gestion délégué étudiant (cahier de texte)

### Souhaitable
13. Couplage mail automatique pour supports
14. Compression vidéo pour zones reculées
15. Code QR systématique lié au matricule
16. Factures pro forma
17. Évaluation personnel (RH)
18. Rapports transverses consolidés

---

*Analyse générée le 22/06/2026 — Confronte le Cahier de charges ESA v1.0 avec l'implémentation EasyEcole (backend 7 modules + frontend Angular 12)*
