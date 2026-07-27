# Gaps Process & Conformité ISO 21001

## ISO 21001:2018 — Management systems for educational organizations

### Exigences clés vs Implémentation actuelle

| Clause ISO | Exigence | Statut | Action requise |
|------------|----------|--------|----------------|
| **4. Contexte** | Compréhension de l'organisme et de son contexte | ❌ Manquant | Ajouter module SWOT/PESTAL |
| **5. Politique** | Politique qualité, rôles et responsabilités | ❌ Manquant | Page politique qualité + validation direction |
| **6. Planification** | Risques et opportunités, objectifs qualité | ❌ Manquant | Module gestion des risques / objectifs |
| **7. Support** | Ressources, compétences, sensibilisation, communication, information documentée | ⚠️ Partiel | GED existante mais pas de gestion des compétences |
| **8. Réalisation des activités** | Planification admission, évaluation, conception programmes | ✅ Partiel | Parcours, inscriptions, notes OK. Manque : réclamations formelles, enquêtes satisfaction |
| **9. Évaluation** | Surveillance, mesure, analyse, audit interne, revue de direction | ❌ Manquant | Audit interne, revue direction, indicateurs qualité |
| **10. Amélioration** | Non-conformités, actions correctives, amélioration continue | ❌ Manquant | Module NC/AC/Amélioration |

## Gaps critiques par module

### RH (Ressources Humaines)

| Gap | Priorité | Pb métier |
|-----|----------|-----------|
| **Workflow congés** | 🔴 Haute | Les employés n'ont pas de processus de demande/validation congés. ISO 7.2 (compétences) nécessite suivi des absences. |
| **Workflow recrutement** | 🔴 Haute | Offre→Candidature→Entretien→Décision doit être tracé. ISO 7.1.2 (ressources humaines) |
| **Masse salariale prévisionnelle** | 🟡 Moyenne | Pas de simulation budgétaire avant versement paie |
| **Plan de formation** | 🟡 Moyenne | ISO 7.3 (compétences) exige : identification besoin → planification → suivi → évaluation |
| **Contrats alerts** | 🟡 Moyenne | Pas d'alerte échéance CDD. Risque de rupture involontaire. |
| **Départs / Retraites** | 🟡 Moyenne | Pas de workflow de sortie (entretien, solde, certificat) |
| **Visites médicales** | 🟢 Basse | Suivi obligatoire selon code du travail |

### Administration & Système

| Gap | Priorité | Pb métier |
|-----|----------|-----------|
| **Audit interne** | 🔴 Haute | ISO 9.2 exige des audits internes planifiés |
| **Revue de direction** | 🔴 Haute | ISO 9.3 exige revue annuelle par la direction |
| **Indicateurs qualité** | 🔴 Haute | ISO 9.1.1 exige mesure des performances. Pas de KPI structurés |
| **Gestion des risques** | 🔴 Haute | ISO 6.1 exige identification et traitement des risques |
| **Satisfaction apprenants** | 🟡 Moyenne | ISO 9.1.2 exige enquêtes satisfaction |
| **Réclamations formelles** | 🟡 Moyenne | Module réclamations existe mais sans workflow NC (non-conformité) |
| **Sauvegardes** | 🟡 Moyenne | Pas de politique formalisée (fréquence, rétention, test restauration) |
| **RGPD / Données pers.** | 🟡 Moyenne | Pas de registre des traitements, consentement, droit à l'effacement |

### Comptabilité

| Gap | Priorité | Pb métier |
|-----|----------|-----------|
| **Lettrage** | 🔴 Haute | Impossible de clôturer sans lettrage. ISO 8.2 (planification financière) |
| **Rapprochement bancaire** | 🔴 Haute | Indispensable pour certification des comptes |
| **Clôture périodique** | 🔴 Haute | Impossible de verrouiller une période pour conformité OHADA/SYSCOA |
| **Bilan / Compte de résultat** | 🔴 Haute | Documents légaux obligatoires |
| **Budget / Suivi** | 🟡 Moyenne | Gestion budgétaire essentielle pour pilotage |
| **Déclaration fiscale** | 🟡 Moyenne | TVA, IS, IR... Obligation légale |
| **Trésorerie** | 🟡 Moyenne | Suivi des flux indispensable |

## Recommandations ISO 21001 immédiates

### 1. Ajouter un module Qualité
- `QualitePolitique` (politique qualité signée par la direction)
- `QualiteRisque` (registre des risques et opportunités)
- `QualiteObjectif` (objectifs qualité avec indicateurs)
- `QualiteNonConformite` (déclaration NC, analyse cause, action corrective)
- `QualiteAudit` (plan d'audit, grille, rapport, suivi)
- `QualiteRevueDirection` (ordre du jour, PV, décisions)
- `QualiteEnqueteSatisfaction` (campagnes, questionnaires, résultats)

### 2. Renforcer la conformité RH
- Ajouter module congés (demande → validation → solde)
- Ajouter workflow recrutement avec états
- Ajouter plan de formation avec budget et évaluation
- Ajouter alertes automatiques (contrats, visites médicales)

### 3. Renforcer la conformité Comptable
- Ajouter lettrage (rapprochement compte→écriture)
- Ajouter rapprochement bancaire (relevé→comptabilité)
- Ajouter clôture périodique (verrouillage + génération Bilan/CR)
- Ajouter budget prévisionnel par centre de coût

### 4. Corriger les lacunes Administration
- Centraliser la configuration sous `/administration/configuration`
- Ajouter page "Indicateurs qualité" avec KPI temps réel
- Ajouter registre RGPD des traitements
- Automatiser les sauvegardes avec politique documentée
