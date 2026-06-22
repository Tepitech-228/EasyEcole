# Module E-learning — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Tables (préfixe `elearning_`)

### Cours & Contenu
- `elearning_cours` — id, coursId (FK liaison cours existant), titre, description, image, statut
- `elearning_modules` — id, coursId, titre, description, ordre
- `elearning_supports` — id, moduleId, type (video/pdf/document), fichierOriginal, fichierCompresse, dureeVideo, taille
- `elearning_commentaires` — id, supportId, utilisateurId, message, date

### Chat
- `elearning_salons` — id, coursId, titre, type (cours/classe/prive), dateCreation
- `elearning_messages` — id, salonId, utilisateurId, message, date, lu (bool)
- `elearning_participants_salon` — id, salonId, utilisateurId, dateAjout

### Notifications
- `elearning_notifications` — id, utilisateurId, type, message, lu, date
- `elearning_couplages_mail` — id, supportId, emailEnvoye, dateEnvoi

## 2. Backend

```
modules/elearning/
├── ElearningRoutes.ts
├── models/*.ts
├── controllers/
│   ├── CoursEnLigneController     → CRUD cours
│   ├── ModuleController           → CRUD modules
│   ├── SupportController          → Upload + compression vidéo (FFmpeg)
│   ├── ChatController             → CRUD salons + messages (REST)
│   └── NotificationController     → Envoi mail automatique
├── routers/
└── socket/
    └── chatSocket.ts              → WebSocket Socket.io
```

### Compression vidéo
- Package : `fluent-ffmpeg`
- À l'upload, compression automatique en arrière-plan
- Stockage : `public/elearning/videos/compressed/`
- Formats cibles : MP4 H.264, résolution 720p max

### WebSocket Chat
- `socket.io` sur le même serveur HTTP (port 3000)
- Événements : `join:salon`, `send:message`, `new:message`, `typing`
- Stockage persistant en DB + diffusion en temps réel

### Couplage mail
- Utilisation de `EmailSender` existant
- Déclenché après upload d'un support → envoi automatique aux inscrits du cours

## 3. Frontend

```
features/modules/elearning/
├── elearning.module.ts
├── elearning-routing.module.ts
├── pages/
│   ├── mes-cours-page             → Étudiant : liste cours e-learning
│   ├── cours-details-page         → Détail cours + modules + supports
│   ├── chat-page                  → Salon de chat (temps réel)
│   ├── upload-support-page        → Enseignant : upload + compression
│   └── gestion-elearning-page     → Institution : gestion globale
├── components/
│   ├── video-player
│   ├── chat-window
│   └── support-card
```

## 4. Installation

Nouveaux packages npm :
- `socket.io` + `socket.io-client`
- `fluent-ffmpeg` (nécessite FFmpeg installé sur le serveur)
