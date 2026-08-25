# 🔐 COMPTES DE DÉMONSTRATION — EasyEcole

> Générés par `easy-ecole-backend/src/core/scripts/seed-comptes-par-role.ts`
> Re-exécuter : `npx ts-node src/core/scripts/seed-comptes-par-role.ts` (idempotent)
>
> ⚠️ **Ne pas committer en production** — identifiants en clair, environnement de dev uniquement.
> ⚠️ La connexion déclenche une vérification **OTP** selon la configuration (`otpRequired`) ;
> en dev, les codes OTP sont affichés dans la console du backend.

## Comptes par rôle

| Rôle | Identifiant | Email | Mot de passe |
|------|-------------|-------|--------------|
| **admin** | `admin` | tepitechbuild@gmail.com | `Admin@2026!` |
| **institution** | `institution` | direction@easyecole.tg | `Inst@2026!` |
| **enseignant** | `prof-maths` | prof.maths@easyecole.tg | `Prof@2026!` |
| **enseignant** | `prof-info` | prof.maria@easyecole.tg | `Prof@2026!` |
| **enseignant** | `prof-gestion` | prof.jean@easyecole.tg | `Prof@2026!` |
| **enseignant** | `prof-droit` | prof.ama@easyecole.tg | `Prof@2026!` |
| **caissier_banque** | `caissier1` | caissier.atsu@easyecole.tg | `Caissier@2026!` |
| **caissier_banque** | `caissier2` | caissier.ami@easyecole.tg | `Caissier@2026!` |
| **comite_orientation** | `comite1` | comite.yao@easyecole.tg | `Comite@2026!` |
| **comite_orientation** | `comite2` | comite.adjo@easyecole.tg | `Comite@2026!` |
| **comite_orientation** | `histoiregede` | histoiregede@gmail.com | `Comite@2026!` |
| **cabinet_comptable** | `tepitechcorp` | tepitechcorp@gmail.com | `Comptable@2026!` |
| **esa_compta** | `kakashitogo` | kakashitogo@gmail.com | `Compta@2026!` |
| **personnel_administratif** | `pers-admin1` | pers.admin@easyecole.tg | `Personnel@2026!` |
| **secretaire** | `secretaire1` | secretaire@easyecole.tg | `Secretaire@2026!` |
| **apprenant** | `etudiant-demo` | etudiant.demo@etu.ust.ci | `Etudiant@2026!` |
| **parent** | `parent1` | parent.tchala@easyecole.tg | `Parent@2026!` |

## Étudiants de test (seed historique)

Les comptes `etudiant1` → `etudiant15` (@etu.ust.ci) existent également.
Mot de passe historique du seed : `password123` — réinitialisable via le seed ci-dessus si besoin.

## Notes

- Le seed **répare aussi les profils orphelins** (ex. `aut_enseignants.utilisateurId = NULL`
  après un re-seed des comptes), cause de l'affichage « null, null » dans les listes
  déroulantes d'enseignants.
- Les comptes créés par les scripts E2E utilisent `Passw0rd!2026`.
