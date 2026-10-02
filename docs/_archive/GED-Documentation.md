# Guide du module GED — EasyÉcole

## 1. Présentation

Le module **GED** (Gestion Électronique de Documents) permet de numériser, classer, rechercher, archiver et détruire l'ensemble des documents de l'établissement.

**7 domaines documentaires :**

| Domaine | Code | Exemples de documents |
|---|---|---|
| Scolarité | SCOL | Relevés de notes, diplômes, PV de jury, certificats |
| Ressources Humaines | RH | Contrats, bulletins de paie, attestations |
| Finances | FIN | Factures, quitus, bordereaux |
| Recherche | REC | Publications, thèses, rapports |
| Gouvernance | GOUV | Délibérations, PV, règlements |
| Patrimoine | PAT | Inventaires, bons de commande |
| Documents externes | EXT | Conventions, courriers reçus |

---

## 2. Accès

Menu latéral → rubrique **GED**.

---

## 3. Pages

### 3.1 Catalogue

Parcourir l'arborescence par domaine → année → niveau → parcours → classe.

**Filtres disponibles :**
- Recherche texte (titre, référence, auteur)
- Confidentialité (Public / Interne / Restreint / Confidentiel)
- Processus générateur
- Session
- Cycle de vie (Courant / Intermédiaire / Définitif / À détruire)

**Actions :** cliquer sur un document pour voir sa fiche détaillée, télécharger, exporter PDF, supprimer.

---

### 3.2 Dépôt (Upload)

Ajouter un nouveau document dans le GED.

**Champs :**
- **Fichier** – sélectionner le fichier à uploader
- **Domaine** – choisir le domaine (SCOL, RH, FIN, etc.)
- **Type de document** – liste filtrée par domaine
- **Catégorie, date, référence** – informations de base
- **Session** – associer à une session si nécessaire
- **Génération de titre** – le titre est généré automatiquement à partir de : type + date + catégorie + référence, mais reste modifiable
- **Source** – Interne, Externe, Numérisation, Courrier, Email
- **Destinataire / Émetteur externe** – selon le type de source
- **Confidentialité** – Public / Interne / Restreint / Confidentiel
- **Dossier parent** – classer dans un dossier virtuel

**Bouton "Créer"** en bas pour valider.

---

### 3.3 Recherche

Recherche avancée avec de nombreux filtres dans le panneau latéral gauche :

- Texte libre (titre, référence, auteur)
- Domaine et sous-dossiers
- Type de document
- Semestre
- Source
- Mode d'envoi
- Période de création
- Processus générateur
- Lieu de stockage
- Confidentialité
- Cycle de vie
- Tri (date, titre, référence, taille)

Deux modes d'affichage : **Liste** (tableau) ou **Grille** (cartes).

---

### 3.4 Archives

Liste des documents passés en statut **Définitif** (archivés).

**Statistiques par domaine** en haut de page.

**Filtres :** domaine, type de document, source.

**Actions :** télécharger, restaurer (repasser en statut courant).

---

### 3.5 Conservation & DUA

Suivi des **Durées d'Utilité Administrative** (DUA).

**Indicateurs :**
- Nombre total de documents
- DUA proche de l'échéance (< 90 jours)
- DUA expirée
- Documents à détruire
- Documents archivés

**Filtres :** recherche texte, domaine, type de document, seuil d'alerte DUA (30/60/90 jours).

**Actions :**
- Clic sur les statuts pour filtrer
- Sélection multiple + bouton **Archiver sélectionnés**
- **Prolonger DUA** sur un document
- **Télécharger** un document

---

### 3.6 Demande de destruction

Gestion du cycle de fin de vie des documents.

**Onglets :** En attente / Validée / Rejetée.

**Actions :**
- **Confirmer** une destruction (passe le document en « à détruire »)
- **Rejeter** une demande
- **Export CSV** de la liste

---

### 3.7 Registre Courrier

Registre des courriers entrants et sortants avec numérotation automatique par année.

**Filtres :** Tous / Entrants / Sortants, recherche texte.

**Actions :**
- Nouvelle entrée (modale avec sens, objet, expéditeur/destinataire, date, mode d'envoi, accusé réception, annotations)
- Modifier une entrée
- Supprimer une entrée
- Export CSV

**Affichage :** numéro format `2026-0001`, date, sens (badge couleur), expéditeur/destinataire, objet, mode d'envoi, accusé réception, document lié.

---

### 3.8 Dossiers virtuels

Regrouper tous les documents d'un **étudiant** (par ID utilisateur) ou d'un **employé** (par ID).

Résultat : tableau des documents liés à cette personne ( titre, référence, type, domaine, date, actions).

---

## 4. Données de démonstration

Le système est livré avec un jeu de données pré-chargé :

| Élément | Quantité |
|---|---|
| Domaines GED | 7 |
| Types documentaires | 31 |
| Processus générateurs | 6 |
| Niveaux d'études (dont Doctorat) | 10+ |
| Classes | 91 |
| Étudiants | 226 |
| Documents GED | 899 |
| Sessions GED | 6 |
| Entrées courrier | 5 |

Les documents couvrent tous les domaines avec des données réalistes (étudiants, classes, fournisseurs, départements RH, etc.).

---

*Document généré le 22/07/2026*
