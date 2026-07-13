# Signature électronique des présences par l'enseignant

## Résumé

Permettre à l'enseignant d'apposer sa signature électronique (dessinée) sur une séance de présence après avoir scanné les QR codes des étudiants, afin de certifier la feuille de présence.

## Modèle de données

### Table `ins_presences` — colonnes ajoutées

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `signature` | `STRING` | nullable | Chemin du fichier PNG de la signature |
| `signedAt` | `DATE` | nullable | Date et heure de signature |

### Fichiers

Les signatures sont stockées dans : `public/inscription/presences/signatures/{presenceId}.png`

## Backend

### Nouvel endpoint

| Méthode | Endpoint | Auth | Controller |
|---------|----------|------|------------|
| `PUT` | `/api/v1/inscription/presences/:id/sign` | Enseignant | `PresenceController.signPresence` |

### Controller `signPresence`

1. Vérifie que l'utilisateur est ENSEIGNANT
2. Vérifie que la présence appartient bien à un cours de cet enseignant
3. Reçoit `{ signature: "data:image/png;base64,..." }` dans le body
4. Décode le base64 et sauvegarde en PNG dans `public/inscription/presences/signatures/{id}.png`
5. Met à jour `Presence.signature` et `Presence.signedAt`
6. Retourne la présence mise à jour

### Route

```typescript
// PresenceRouter.ts
.put('/:id/sign', [AuthEnseignant], PresenceController.signPresence)
```

### Export PV — modification

Dans `ListeNoteEvaluationController.exportPv`, après les lignes des étudiants, ajouter :
- Cellule fusionnée avec "Signature de l'enseignant :"
- Image de la signature (si présente) ou texte "Non signé"

## Frontend

### Page détails présence (`details-presence-page`)

**Bouton "Signer la feuille"** :
- Visible uniquement si `rolesValue.isEnseignant`
- Visible seulement s'il existe au moins une présence dans la liste
- Si déjà signée → afficher "Signé le {date}" + icône vérifié vert au lieu du bouton

**Modal de signature** (`signature-modal`) :
- Canvas HTML (`<canvas>`) 400x200px avec fond blanc et bordures
- Événements : `mousedown`, `mousemove`, `mouseup`, `touchstart`, `touchmove`, `touchend`
- Trait noir, épaisseur 2px, style lisse (`lineCap: 'round'`, `lineJoin: 'round'`)
- Bouton "Effacer" → vide le canvas
- Bouton "Valider" → convertit le canvas en base64 → `PUT /presences/:id/sign`
- Réutilisation du composant `app-custom-modal` pour la cohérence design

**Affichage dans le tableau des présences** :
- Colonne "Signature" optionnelle après les colonnes des séances
- Si signé : affiche l'image thumbail + "Signé le {date}"
- Si non signé : "Non signé" (grisé)

### Services

- `PresenceService.signPresence(id: string, signatureBase64: string): Observable<Presence>`

### État de signature

Une présence peut être :
- `unsigned` → non signée, bouton "Signer" disponible
- `signed` → signée, affiche la signature, bouton désactivé

Aucune modification d'une signature existante n'est possible (immuable).

## Sécurité

- Seul l'enseignant assigné au cours peut signer
- La signature est stockée côté serveur, jamais dans le localStorage
- Validation du format base64 avant sauvegarde

## Ordre d'implémentation

1. Backend : migration base (colonne signature + signedAt)
2. Backend : controller + route signPresence
3. Backend : export PV avec signature
4. Frontend : service signPresence
5. Frontend : modal de signature canvas
6. Frontend : intégration dans la page détails présence
7. Test : vérifier le flux complet
