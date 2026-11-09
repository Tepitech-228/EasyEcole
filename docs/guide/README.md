# Guides d'utilisation EasyEcole

Les procédures détaillées et les responsabilités sont indiquées dans la section **Procédures pas à pas** des guides de profils concernés.

Guides générés automatiquement à partir des captures d'écran de `docs/guide/images/` et `docs/guide/images-nouveau/`.

```bash
cd easy-ecole-backend
node scripts/guide/generer-guides.cjs --pdf
```

Pour régénérer uniquement le PDF étudiant sans remplacer son guide Markdown détaillé :

```bash
node scripts/guide/generer-guides.cjs --profil etudiants --pdf-only
```

Si le PDF habituel est ouvert et verrouillé par un lecteur, utilisez un autre nom de sortie sans toucher au fichier existant. Exemple pour le guide du Superviseur général :

```bash
node scripts/guide/generer-guides.cjs --profil superviseur-general --pdf-only --pdf-output docs/guide/pdf/GUIDE-superviseur-general-avec-captures.pdf
```

Pour actualiser les captures des wizards étudiant (captures fictives, aucune demande transmise) :

```bash
node scripts/guide/capturer-wizard-etudiant.cjs
```

Pour régénérer les exemples illustrés de cahier de texte, de présence et d'emploi du temps (images locales, données fictives, aucune écriture dans l’application) :

```bash
node scripts/guide/capturer-exemples-pedagogiques.cjs
node scripts/guide/generer-guides.cjs --profil enseignant --pdf
node scripts/guide/generer-guides.cjs --profil superviseur-general --pdf
```

| Ordre | Profil | Guide Markdown | PDF | Écrans |
|-------|--------|----------------|-----|--------|
| 1 | Audit & contrôle | [Ouvrir](profils/GUIDE-audit.md) | [Ouvrir](pdf/GUIDE-audit.pdf) | 9 |
| 2 | Recouvrement (ESA Compta) | [Ouvrir](profils/GUIDE-recouvrement.md) | [Ouvrir](pdf/GUIDE-recouvrement.pdf) | 28 |
| 3 | Comptabilité (Cabinet comptable) | [Ouvrir](profils/GUIDE-comptable.md) | [Ouvrir](pdf/GUIDE-comptable.pdf) | 24 |
| 4 | Comité d'orientation | [Ouvrir](profils/GUIDE-comite-orientation.md) | [Ouvrir](pdf/GUIDE-comite-orientation.pdf) | 9 |
| 5 | Étudiants (Apprenants) | [Ouvrir](profils/GUIDE-etudiants.md) | [PDF mis à jour avec les captures](pdf/GUIDE-etudiants-avec-captures.pdf) | 30 |
| 6 | Superviseur général | [Ouvrir](profils/GUIDE-superviseur-general.md) | [PDF mis à jour avec les captures](pdf/GUIDE-superviseur-general-avec-captures.pdf) | 26 |
| 7 | Secrétaire | [Ouvrir](profils/GUIDE-secretaire.md) | [Ouvrir](pdf/GUIDE-secretaire.pdf) | 58 |
| 8 | Direction (Institution) | [Ouvrir](profils/GUIDE-institution.md) | [Ouvrir](pdf/GUIDE-institution.pdf) | 116 |
| 9 | Administrateur | [Ouvrir](profils/GUIDE-admin.md) | [Ouvrir](pdf/GUIDE-admin.pdf) | 187 |
| 10 | Enseignant | [Ouvrir](profils/GUIDE-enseignant.md) | [PDF mis à jour avec les captures](pdf/GUIDE-enseignant-avec-captures.pdf) | 29 |
| 11 | Personnel administratif | [Ouvrir](profils/GUIDE-personnel-administratif.md) | [Ouvrir](pdf/GUIDE-personnel-administratif.pdf) | 64 |
| 12 | Ressources humaines | [Ouvrir](profils/GUIDE-ressources-humaines.md) | [Ouvrir](pdf/GUIDE-ressources-humaines.pdf) | 17 |
| 13 | Espace parents | [Ouvrir](profils/GUIDE-parent.md) | [Ouvrir](pdf/GUIDE-parent.pdf) | 7 |
| 14 | Surveillant | [Ouvrir](profils/GUIDE-surveillant.md) | [PDF mis à jour avec les captures](pdf/GUIDE-surveillant-avec-captures.pdf) | 6 |

> Les guides de profil sont générés par le script. Les procédures opérationnelles figurent dans les guides concernés ; les parties manuelles sont préservées avec `--pdf-only`.
