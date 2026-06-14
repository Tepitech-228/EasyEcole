# Fonctionnalités par rôle — EasyEcole

> Document généré le 10/06/2026

## Rôles disponibles

| Rôle | Identifiant dans le code |
|---|---|
| Administrateur | `admin` |
| Institution | `institution` |
| Enseignant | `enseignant` |
| Apprenant | `apprenant` |
| Caissier Banque | `caissier_banque` |

---

## 🏫 Institution

Rôle le plus complet. Gère l'établissement de A à Z.

### Orientation
| Fonction | Écrire | Lire |
|---|---|---|
| Parcours de formation | CRUD complet | ✅ |
| Catégories | CRUD complet | ✅ |
| Niveaux d'étude | CRUD complet | ✅ |
| Matières prérequis | CRUD complet | ✅ |
| Débouchés | CRUD complet | ✅ |
| Prérequis parcours | CRUD complet | ✅ |
| Demandes d'orientation | — | ✅ |
| Parcours choisis | — | ✅ |

### Inscription
| Fonction | Écrire | Lire |
|---|---|---|
| Sessions d'inscription | CRUD complet | ✅ |
| Parcours (inscription) | CRUD complet | ✅ |
| Classes | CRUD complet | ✅ |
| Cours | CRUD complet + assigner enseignant | ✅ |
| Matières | CRUD complet | ✅ |
| Niveaux d'étude (inscription) | CRUD complet | ✅ |
| Salles de classe | CRUD complet | ✅ |
| Années académiques | CRUD complet | ✅ |
| Cursus apprenant | CRUD complet | ✅ |
| Types de note d'évaluation | CRUD complet | ✅ |
| Demandes d'inscription | Valider | ✅ |
| Paiements | — | ✅ |
| Présences | — | ✅ |
| Cahiers de texte | — | ✅ |
| Emplois du temps | — | ✅ |
| Notes d'évaluation | — | ✅ |

### Utilisateurs
| Fonction | Écrire | Lire |
|---|---|---|
| Enseignants | Créer, modifier, supprimer | ✅ |
| Apprenants | Supprimer | ✅ |
| Institutions | Modifier, supprimer | ✅ |
| Liste des utilisateurs | — | ✅ |

---

## 👨‍🏫 Enseignant

Focalisé sur le contenu pédagogique des cours.

| Fonction | Écrire | Lire |
|---|---|---|
| Chapitres de cours | CRUD complet (avec image) | ✅ |
| Ressources | CRUD complet | ✅ |
| Fichiers ressources | CRUD complet | ✅ |
| Cours (liste + détails) | — | ✅ |
| Présences | — | ✅ |
| Cahiers de texte | — | ✅ |
| Emplois du temps | — | ✅ |
| Notes d'évaluation | — | ✅ |
| Mon profil (photo, infos) | ✅ | ✅ |

### Masqué pour l'enseignant
- Orientation (groupe entier)
- Inscription (groupe entier)
- Gestion des utilisateurs

---

## 👨‍🎓 Apprenant

Libre-service : parcourir, postuler, s'inscrire, payer, suivre.

| Fonction | Écrire | Lire |
|---|---|---|
| **Tableau de bord** (vue exclusive) | ✅ | ✅ |
| Orientation : parcourir les parcours | Ajouter au panier | ✅ |
| Orientation : demandes d'orientation | CRUD | ✅ |
| Inscription : parcourir les parcours | — | ✅ |
| Inscription : demandes d'inscription | CRUD | ✅ |
| Inscription : paiements | Effectuer un paiement | ✅ |
| Inscription : mon cursus | — | ✅ |
| Inscription : dossier (upload pièces) | ✅ | ✅ |
| Cours consulter | — | ✅ |
| Présences | — | ✅ |
| Cahiers de texte | — | ✅ |
| Emplois du temps | — | ✅ |
| Notes d'évaluation | — | ✅ |
| Mon profil (photo, infos) | ✅ | ✅ |

---

## 💰 Caissier Banque

Rôle limité à la gestion des paiements.

| Fonction | Écrire | Lire |
|---|---|---|
| Paiements d'inscription | ✅ | ✅ |
| Mon profil | ✅ | ✅ |

### Masqué pour le caissier
- Orientation (groupe entier)
- Inscription (sauf Paiements)
- Cours (groupe entier)

---

## ⚠️ Administrateur

Le rôle `admin` est défini dans le code mais **aucune interface n'est encore implémentée** pour lui :
- Aucun élément de menu dans la sidebar
- Aucune route frontend protégée par `admin`
- Aucune route backend utilisant le middleware `AuthAdmin`
- Les utilisateurs avec le rôle `admin` existent en base mais ne voient qu'une page vide

---

## Notes techniques

1. **Protection frontend** : les éléments de menu sont masqués selon le rôle, mais les routes restent accessibles si l'URL est tapée manuellement. La sécurité réelle est assurée par les middlewares backend.

2. **Middlewares backend** :
   - `Authenticate` — tout utilisateur connecté
   - `AuthInstitution` — institution uniquement
   - `AuthEnseignant` — enseignant uniquement
   - `AuthApprenant` — apprenant uniquement
   - `AuthCaissierBanque` — caissier banque uniquement
   - `AuthAdmin` — admin uniquement (non utilisé)

3. **Comptes de démo** (mot de passe : `password123`) :
   - `admin` — Super Admin
   - `institution1` / `institution2`
   - `enseignant1` .. `enseignant4`
   - `caissier1` / `caissier2`
   - `apprenant1` .. `apprenant16`
