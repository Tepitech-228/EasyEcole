# RAPPORT HEBDOMADAIRE — EasyÉcole

**Période :** lundi 28 septembre → vendredi 2 octobre 2026
**Projet :** EasyÉcole — informatisation de l'École Supérieure (ESA)
**Périmètre :** inscriptions, admission, espaces de travail, mise en production

---

## 1. En résumé

| Indicateur | Valeur |
|---|---|
| Livraisons (mises en production du code) | 6 |
| Fichiers modifiés | 127 |
| Modules concernés | 3 (Inscription, Dossiers d'admission, Infrastructure) |
| Points de vigilance ouverts | 2 |

**En une phrase :** la semaine a été consacrée à **finaliser le parcours d'inscription** et à **rendre l'installation sur les serveurs plus fiable et plus légère**. Un diagnostic de la base de données a également été mené (voir § 4).

---

## 2. Ce qui a été livré

### Parcours d'inscription — corrections et finitions

- Correction du cheminement de l'étudiant : moins de blocages et moins de doublons dans le circuit d'inscription.
- Fiabilisation du rattachement du bordereau de paiement à la demande de l'étudiant.
- Amélioration du circuit d'admission (comité d'orientation) et des écrans d'autorisation provisoire.

### Enseignements et documents administratifs

- Mise en place des pages de relevé de notes et de suivi des unités d'enseignement.

### Mise en production — plus fiable et plus légère

- Le programme d'installation a été **allégé d'environ 360 Mo** : les images serveur sont plus petites, donc plus rapides à déployer et à sauvegarder.
- Les téléchargements de dépendances sont désormais **mis en cache et partagés** entre deux livraisons : moins d'échecs liés au réseau.
- Les tentatives de téléchargement sont désormais **bornées** : un incident réseau ne bloque plus le déploiement indéfiniment.
- Ajout d'un **script d'installation progressif** sur les serveurs : une nouvelle version peut être installée sans tout remettre à zéro.

### Rangement du projet

- Le dossier racine du projet a été **rangé et archivé** (rapports, journaux et documents de travail regroupés dans un dossier dédié).

---

## 3. Demandes en cours d'étude

Deux demandes du client sont en cours d'analyse ; aucune n'est encore développée.

### 3.1 Reprise du dossier étudiant

Aujourd'hui, si un étudiant ferme son navigateur au milieu de son inscription, il doit tout recommencer.

**Souhait :** que sa saisie soit **enregistrée** et qu'il puisse la reprendre le lendemain.

**Constat de l'analyse :** le problème vient du fait que rien n'est conservé sur le serveur. Tout est stocké dans le navigateur de l'étudiant, qui disparaît à la fermeture de l'onglet et au bout de deux heures.

### 3.2 Correction d'un dossier rejeté

Aujourd'hui, lorsqu'un dossier est rejeté, l'étudiant ne voit pas clairement ce qu'il doit corriger et le système ne permet pas de renvoyer uniquement la pièce fautive.

**Souhait :**

- un rejet **ciblé** : rechargement du seul document concerné (le bordereau si le rejet vient du service comptable, la pièce précise si le rejet vient du comité) ;
- un retour **direct** chez le validateur qui a rejeté, sans repasser par les étapes déjà validées ;
- un **écran de suivi** pour l'étudiant, avec le motif du rejet et un bouton « Renvoyer pour validation ».

> **Estimation :** 3 à 4 semaines de développement au total, à démarrer après le point 4.1 ci-dessous.

---

## 4. Points de vigilance

| Point | Impact | Action |
|---|---|---|
| **La base de données ne peut plus évoluer sur un fichier** | Le fichier regroupant les données des enseignants a atteint la limite technique de son moteur. Toute évolution future sur ce fichier sera **refusée silencieusement**, sans message d'erreur. | **Action requise avant de poursuivre le chantier inscription.** Charge : 1 à 2 jours. |
| **Mise à jour automatique de la base à chaque démarrage** | Le programme reconstruit lui-même la base à chaque démarrage, ce qui a provoqué un incident au lancement cette semaine. Risque : des erreurs lors des mises en production. | Étude en cours : bascule vers des mises à jour contrôlées et versionnées (2 à 3 jours). |
| **Le rangement des fichiers doit être validé** | Les 50 fichiers déplacés sont encore vus comme « supprimés » par l'outil de suivi de version. Sans validation, **les rapports et documents disparaîtraient de l'historique** au prochain enregistrement. | Validation attendue du responsable technique (une commande, 5 minutes). |

---

## 5. Décisions attendues

1. **Qui valide et exécute le nettoyage de la base ?** Opération sensible : elle doit être testée sur une copie de sauvegarde avant d'être appliquée sur les serveurs.
2. **Faut-il faire évoluer la base vers des mises à jour contrôlées ?** Recommandation : **oui**, car le projet s'agrandit et le mode actuel est fragile en production.
3. **Les paiements mobiles (Cinetpay) et le cache rapide (Redis) doivent-ils être actifs avant la prochaine démonstration client ?**

---

## 6. Activité prévue la semaine prochaine

- Nettoyage et fiabilisation de la base de données (préalable au chantier inscription).
- Spécification détaillée du parcours « reprise de dossier » et « correction après rejet ».
- Choix du libellé et du logo des e-mails (passage de « EasyÉcole » à « ESA »).

---

*Document rédigé le 2 octobre 2026.*