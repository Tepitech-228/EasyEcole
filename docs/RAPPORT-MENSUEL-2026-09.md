# RAPPORT MENSUEL — EasyÉcole

**Période :** septembre 2026
**Projet :** EasyÉcole — informatisation de l'École Supérieure (ESA)

---

## 1. Chiffres clés du mois

| Indicateur | Valeur |
|---|---|
| Livraisons | 54 |
| Fichiers modifiés | 863 |
| Lignes de programme ajoutées | ~71 400 |
| Lignes supprimées (nettoyage) | ~9 600 |
| Modules traversés | 8 |

**En une phrase :** septembre a été le mois de la **montée en puissance du module Inscription** et de la **consolidation des fondations techniques** (base de données, déploiement, qualité).

---

## 2. Les grandes réalisations de septembre

### 2.1 Inscription des étudiants — le gros effort du mois

- Mise en service du **formulaire d'inscription en 5 étapes**, avec lecture automatique des documents d'identité (l'étudiant n'a plus tout à ressaisir).
- Gestion complète des **pièces justificatives** et du **bordereau de paiement**.
- Barre anti-doublon sur les bordereaux : un même numéro ne peut plus être utilisé deux fois.
- Ouverture de la possibilité d'inscrire **sans affectation de classe** dès le départ (la classe est attribuée plus tard).
- Finalisation du circuit de **rattrapage** et du suivi des impayés.

### 2.2 Admission et comité d'orientation

- Passage à une **décision collégiale** : plusieurs membres du comité interviennent, avec un nombre minimum de votes requis.
- Ajout de la gestion des **membres du comité** et du suivi des votes.
- Présentation de la version 3 du produit au client le 19 septembre.

### 2.3 Personnes et identité (enseignants, personnel, étudiants)

- Formulaire enseignant complet : **CNI, matricule, diplôme, grade, NIF, situation de handicap**.
- **Génération automatique des matricules** au format ESA (matière / service / site) et QR codes de pointage.
- Espace « QR codes » pour le personnel administratif.
- Blocage de la suppression d'un compte lorsqu'il est lié à une clôture de caisse (correction d'une erreur bloquante).

### 2.4 Documents officiels et maquettes

- **Génération de maquettes au format ESA** en Excel et en Word pour : unités d'enseignement, étudiants, enseignants, utilisateurs.
- Fiche d'unité d'enseignement enrichie : composition et récapitulatif CM/TP.
- Refonte de l'écran de connexion et message d'erreur unique en cas de panne.

### 2.5 Socle technique (fondations)

- **Les mises à jour de la base de données s'appliquent désormais automatiquement et de façon contrôlée** au démarrage du serveur (18 versions de base de données livrées en septembre) : vrai progrès par rapport à la reconstruction sans contrôle qui était pratiquée auparavant.
- Chaîne de livraison automatisée : **tests automatiques à chaque livraison**, tests de toutes les fonctions, tests de charge.
- Déploiements fiabilisés : correction d'une panne d'accès réseau après redéploiement, arrêt des redémarrages en boucle du service de traitement en arrière-plan, correction du blocage des fermetures de caisse.
- Documentation : **diagrammes des processus métier par module**.

---

## 3. Bilan par domaine

| Domaine | Avancement | Commentaire |
|---|---|---|
| Inscription | 🟢 Avance | Parcours complet ; reste la reprise de saisie et la correction après rejet |
| Admission / Comité | 🟢 Avance | Décision collégiale opérationnelle |
| Scolarité | 🟢 Avance | Documents, encaissements, reçus, listes |
| Finances / Comptabilité | 🟢 Avance | Tableaux de bord, bordereaux, échéances |
| Personnels & étudiants | 🟡 À surveiller | Fonctionnel, mais données à nettoyer (voir § 4) |
| Mise en production | 🟡 À surveiller | Améliorée ; ajustements encore nécessaires |
| Qualité des tests | 🟢 Avance | Couverture en hausse, outillage en place |
| E-mails et notifications | 🔴 À faire | Toujours signés « EasyÉcole » au lieu de « ESA » |

---

## 4. Risques et points d'attention

1. **Données des enseignants : capacité technique atteinte.** Le fichier de données des enseignants a atteint la limite d'index de recherche de la base (64 index sur 64 autorisés, dont **681 index en doublon sur l'ensemble du projet**). Le logiciel fonctionne encore aujourd'hui, mais **toute évolution future sur ce fichier échouera sans prévenir**. C'est le risque n° 1 du projet : il bloque les évolutions du dossier d'inscription.
2. **Mise à jour automatique de la base à chaque démarrage** : source d'incidents au lancement. Recommandation : passer à des mises à jour versionnées et contrôlées.
3. **Travail simultané sur plusieurs chantiers** : septembre a vu 8 modules avancer en parallèle. C'est efficace à court terme, mais cela augmente le risque de découverte tardive de problèmes. Recommandation : limiter le chantier inscription en cours aux seuls sujets prioritaires.
4. **Documentation technique en retard sur le code** : plusieurs documents décrivent un moteur de base de données qui n'est pas celui utilisé. À mettre à jour pour éviter les erreurs d'appréciation.

---

## 5. Perspectives octobre

| Priorité | Action | Délai indicatif |
|---|---|---|
| 1 | Nettoyer et sécuriser la base de données | 1 à 2 jours |
| 2 | Fiabiliser la mise à jour de la base au démarrage | 1 à 3 jours |
| 3 | **Reprise de dossier étudiant** (saisie conservée, reprise possible) | 4 à 6 jours |
| 4 | **Correction ciblée après rejet** + écran étudiant de suivi | 8 à 10 jours |
| 5 | **E-mails au nom de l'ESA** (marque centralisée) | 2 à 3 jours |
| 6 | Correction des anomalies ouvertes (bouton de rejet du rattrapage, dossier bloqué après rejet) | 1 jour |

---

## 6. Conclusion

Septembre a marqué une avancée nette : le module d'inscription est fonctionnel de bout en bout, l'admission fonctionne en décision collégiale, et l'outillage de livraison est en place.

**Octobre doit être consacré à trois objectifs : fiabiliser la base de données, livrer le parcours de reprise et de correction du dossier étudiant, et aligner la communication (e-mails) sur la marque ESA.**

---

*Document rédigé le 2 octobre 2026.*