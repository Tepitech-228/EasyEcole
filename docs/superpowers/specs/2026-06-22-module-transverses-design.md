# Modules Transverses — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Module Communication & Vie Estudiantine

### Tables (préfixe `com_`)
- `com_suggestions` — id, utilisateurId, type (etudiant/enseignant), message, date, statut (ouverte/traitée/fermée)
- `com_reponses_suggestion` — id, suggestionId, utilisateurId, message, date
- `com_communications` — id, titre, contenu, datePublication, statut (brouillon/publiée)
- `com_actualites` — id, titre, contenu, date, image, categorie

### Backend
```
modules/communication/
├── CommunicationRoutes.ts
├── controllers/ → SuggestionController, CommunicationController, ActualiteController
└── routers/
```

### Frontend
```
features/modules/communication/
├── pages/
│   ├── suggestions-page       → Liste + soumission (étudiant/enseignant)
│   ├── traitement-suggestions  → Institution
│   ├── vie-estudiantine-page  → Communications (étudiant)
│   └── gestion-communications  → Institution
```

---

## 2. Module Scolarité & Documents

### Tables (préfixe `scol_`)
- `scol_types_document` — id, libelle (relevé notes / attestation / certificat / diplôme), frais, format
- `scol_demandes_document` — id, etudiantId, typeDocumentId, statut (soumise/validée/rejetée/délivrée), date, fraisPayes
- `scol_documents_delivres` — id, demandeId, fichierPDF, dateDelivrance
- `scol_reclamations` — id, etudiantId, evaluationId, motif, statut (ouverte/traitée/fermée), date
- `scol_reponses_reclamation` — id, reclamationId, repondeurId, reponse, date

### Backend
```
modules/scolarite/
├── ScolariteRoutes.ts
├── controllers/ → DemandeDocumentController, DocumentController, ReclamationController
└── routers/
```

### Frontend
```
features/modules/scolarite/
├── pages/
│   ├── demandes-documents-page   → Étudiant
│   ├── traiter-demandes-page     → Institution/Comité
│   ├── mes-reclamations-page     → Étudiant
│   └── traiter-reclamations-page → Institution
```

### Génération PDF
- Utilisation de `pdfkit` ou `html-pdf` ou `exceljs` (déjà installé)
- Documents générés avec logo ESA, numéro matricule, date, signature

---

## 3. À intégrer dans les modules existants

### Autorisation provisoire d'inscription (Orientation)
- Ajout d'un champ `dateAutorisationProvisoire` sur `ReponseOrientation`
- Template email d'autorisation automatique
- Le Comité d'orientation valide et l'autorisation est envoyée

### Quitus de paiement (Inscription)
- Nouvelle table `ins_quitus` dans inscription
- Lié au paiement validé
- Génération PDF du quitus avec code QR
- Téléchargeable par l'étudiant
