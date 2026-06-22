# Analyse de conformité universitaire — EasyEcole

## Modules audités

EasyEcole comporte 7 modules backend + 11 modules frontend. Cette analyse couvre la conformité des modules métier par rapport au fonctionnement réel des universités (particulièrement en contexte africain francophone).

---

## 1. Module Inscription

### Points conformes
- Workflow d'inscription par étapes (demande → validation → inscription définitive)
- Gestion des sessions/périodes d'inscription
- Validation des prérequis avant affectation aux parcours
- Frais d'inscription et suivi des paiements
- Dépôt de pièces justificatives numériques
- Création du cursus étudiant après validation
- Gestion des classes, niveaux d'étude, parcours
- Cours avec crédits, semestre, caractère obligatoire

### Lacunes
- Pas de gestion des équivalences/transferts depuis d'autres établissements
- Pas de groupes de TD/TP (seulement des classes)
- Pas de passerelle entre parcours (réorientation en cours de cycle)
- Pas de gestion des dispenses de cours
- Pas de suivi des absences aux évaluations (seulement aux séances)
- Pas de module de réinscription automatique pour les années supérieures
- Pas de gestion des situations spéciales (étudiants en mobilité, auditeurs libres)

---

## 2. Module Orientation

### Points conformes
- Catalogue de parcours avec prérequis
- Demande d'orientation par l'étudiant
- Validation/rejet par l'administration
- Débouchés professionnels associés aux parcours

### Lacunes
- **Duplication complète avec Inscription** : `Parcours`, `NiveauEtude`, `PrerequisParcours`, `ParcoursChoisi` existent en double dans les deux modules. Mêmes champs, mêmes associations. Incohérence garantie.
- Ne gère pas l'orientation continue (réorientation en cours de cycle)
- Devrait être fusionné avec le module Inscription

---

## 3. Module Bulletins (Notes)

### Points conformes
- Pondération des notes : `controle_continu` / `devoir` / `examen`
- Calcul de moyenne pondérée par les coefficients
- Génération automatisée des bulletins par classe + semestre
- Mentions académiques (Passable, Assez Bien, Bien, Très Bien)
- Classement par rang dans la classe
- Workflow de publication (brouillon → publié)
- Relevé de notes consultable par l'étudiant

### Lacunes
- Pas de système LMD avec compensation entre UE (unités d'enseignement)
- Pas de gestion des rattrapages (session de rattrapage, note de rattrapage, mention AJ)
- Pas de validation par semestre avec crédits capitalisables
- Pas de relevé de notes cumulé sur tout le parcours (GPA cumulative)
- Pas de gestion des délibérations (conseil de classe, jury)
- Pas de procédure d'appel/contestation de note
- Pas de gestion des évaluations par compétences
- Pas de prise en compte des notes de session antérieure (rachat d'UE)

---

## 4. Module Stage

### Points conformes
- Gestion des entreprises partenaires
- Offres de stage avec période et nombre de places
- Demandes de stage avec validation
- Conventions de stage
- Rapports de stage
- Notation du stage par l'enseignant
- Attestations de stage

### Lacunes
- Pas de convention tripartite signée numériquement (étudiant/entreprise/école)
- Pas de grille d'évaluation par l'entreprise (seulement l'enseignant note)
- Pas de gestion des soutenances de stage
- Pas de suivi des compétences acquises pendant le stage
- Pas de validation automatique des crédits de stage
- Pas de gestion des stages à l'étranger

---

## 5. Module Auth (Utilisateurs)

### Points conformes
- Rôles multiples : apprenant, enseignant, institution, caissier, admin
- Informations personnelles complètes (identité, adresse, parents, urgences)
- Gestion des photos et QR codes
- Authentification JWT
- Inscription avec vérification email

### Lacunes
- Pas de rôle bibliothécaire ou personnel de scolarité
- Pas de RBAC fin (permissions par action, pas seulement par rôle)
- Pas de gestion des sessions utilisateur
- Pas d'historique des connexions
- Pas de self-service pour modification des informations personnelles
- Pas de gestion des anciens étudiants (alumni)

---

## 6. Module Stock

### Points conformes
- Gestion des catégories d'articles
- Suivi des fournisseurs
- Bons de commande avec lignes
- Mouvements de stock (entrée/sortie)
- Seuil d'alerte (stock minimum)

### Analyse
- Module non-académique mais utile à l'administration
- Fonctionnel et complet pour un usage basique
- Manque : gestion des inventaires physiques, code-barres, reporting

---

## 7. Module Immobilisation

### Points conformes
- Sites, bâtiments, localisations
- Catégories d'immobilisations avec taux d'amortissement
- Cycle de vie complet (acquisition → amortissement → maintenance → cession)
- Maintenance programmée

### Analyse
- Module non-académique mais complet
- Conforme aux standards de gestion d'actifs
- Manque : génération d'états comptables, code-barres/QR code scannable

---

## Synthèse : ce qui manque pour une université

### Critique
1. **Duplication Orientation/Inscription** — À fusionner d'urgence
2. **Pas de calendrier académique** — Absence de gestion des périodes (congés, examens, vacances)
3. **Pas de rattrapages** — Aucune session de rattrapage ni mention d'échec
4. **Pas de GPA cumulée** — Impossible d'avoir la moyenne générale sur tout le parcours
5. **Pas de délibération** — Aucun processus de jury/délibération

### Recommandé
6. Système de communication interne (messagerie, annonces)
7. Module de gestion des bourses et aides financières
8. Gestion disciplinaire (conseil de discipline, sanctions)
9. Bibliothèque universitaire (prêts, ressources)
10. Génération automatique d'emplois du temps
11. Portail alumni
12. Mobilité académique (échanges, conventions inter-universités)

---

*Analyse réalisée le 19 juin 2026*
