# Guide d'utilisation — Cabinet comptable

> Contrôle des encaissements, validation des bordereaux, suivi des immobilisations et production des rapports financiers.

**Profil :** Cabinet comptable (rôle RBAC « Comptable »)  
**Écrans retenus :** 18 (sur 24 captures)  
**Version :** 08/11/2026 — contenu vérifié sur l'application

> **Périmètre de ce guide.** Le compte « cabinet comptable » est rattaché au rôle RBAC **Comptable**. Il contrôle les encaissements et les bordereaux, consulte la situation financière des étudiants, tient le registre des immobilisations et produit les rapports financiers. Certains écrans visibles dans le menu peuvent afficher un message d'accès refusé : ils sont recensés en fin de guide pour éviter toute confusion.

## Sommaire

**Votre rôle au quotidien**

**Avant de commencer**

**Votre parcours conseillé**

**Comprendre les statuts**

### Partie 1 — Contrôler les encaissements

1. [Paiements](#1-paiements)
2. [Validation des bordereaux](#2-validation-des-bordereaux)
3. [Mes bordereaux](#3-mes-bordereaux)
4. [Situation financière](#4-situation-financière)

### Partie 2 — Suivre les immobilisations

5. [Immobilisations](#5-immobilisations)
6. [Sites](#6-sites)
7. [Catégories](#7-catégories)
8. [Affectations](#8-affectations)
9. [Assurances](#9-assurances)
10. [Sorties provisoires](#10-sorties-provisoires)
11. [Cessions](#11-cessions)
12. [Rebuts](#12-rebuts)
13. [Maintenance](#13-maintenance)
14. [Inventaires](#14-inventaires)

### Partie 3 — Produire les rapports

15. [Reporting immobilisations](#15-reporting-immobilisations)
16. [Rapport Paiements et Factures](#16-rapport-paiements-et-factures)

### Partie 4 — Votre compte

17. [Mon profil](#17-mon-profil)
18. [Mon compte](#18-mon-compte)

**Écrans à accès restreint ou hors périmètre**

**Index des écrans**

**En cas de problème**

**Votre sécurité**

**Glossaire**

**Note sur les captures**

---

## Votre rôle au quotidien

Le cabinet comptable est le **contrôleur financier** de l'établissement. Votre mission se résume en quatre temps :

- **Authentifier** les bordereaux déposés par les étudiants : vérifier le PDF, la référence bancaire, le montant et la date.
- **Contrôler** les paiements et la situation financière des étudiants (inscription et scolarité).
- **Tenir le registre des immobilisations** : acquisition, affectation, assurance, maintenance, sortie, cession ou rebut.
- **Produire les rapports** destinés au pilotage et aux partenaires.

Vous ne saisissez ni les notes, ni les inscriptions, ni la comptabilité générale : ces opérations relèvent d'autres profils (secrétariat, service recouvrement ESA, direction).

## Avant de commencer

- **Connectez-vous** avec l'identifiant ou l'adresse e-mail du cabinet, puis validez le code à usage unique (OTP) reçu.
- **Vérifiez le site actif** en haut de l'écran : les listes et les rapports sont filtrés par site.
- **Préparez vos justificatifs** : PDF, JPG, JPEG, PNG, HEIC ou HEIF, dans la limite de 20 Mo par fichier.
- **Actualisez la page** après une validation : les compteurs et les statuts se mettent à jour au chargement.
- **Utilisez un navigateur récent** et évitez plusieurs onglets ouverts sur le même formulaire.

## Votre parcours conseillé

| Étape | Écran | Objectif |
|---|---|---|
| 1 | Validation des bordereaux | Contrôler et authentifier les paiements déposés |
| 2 | Paiements | Retrouver un encaissement et vérifier son reçu |
| 3 | Situation financière | Analyser le solde d'un étudiant (inscription + scolarité) |
| 4 | Immobilisations | Mettre à jour le registre des biens |
| 5 | Reporting immobilisations / Rapport Paiements & Factures | Produire les états de synthèse |

## Comprendre les statuts

### Bordereau

| Statut | Signification | Action attendue |
|---|---|---|
| **En attente** | Bordereau déposé, non encore contrôlé | Ouvrir le PDF et vérifier les informations |
| **Validé** | Bordereau authentifié par le cabinet | Part en saisie comptable côté ESA |
| **Rejeté** | Bordereau non conforme, avec motif | L'étudiant doit déposer un nouveau justificatif |
| **En saisie comptable** | Imputation en cours par le service recouvrement | Aucune action du cabinet |
| **Traité** | Paiement imputé et échéance soldée | Consultation seule |

### Paiement et échéance

| Élément | Valeurs | Remarque |
|---|---|---|
| Statut de paiement | **pending**, **saisi**, **finalise** | `finalise` = encaissement clôturé |
| Mode de paiement | **Espèces**, **Mobile money**, **Autre** | Repris dans le reçu et le journal de caisse |
| Échéance | **Payée**, **En retard**, **Impayée** | Calculée à partir de la date limite |
| Reçu | Numéro unique, date, montant, PDF | À conserver comme preuve d'encaissement |

### Immobilisations et opérations liées

| Élément | Valeurs |
|---|---|
| État du bien | **neuf**, **bon**, **moyen**, **mauvais**, **réformé** |
| Assurance | **active**, **expirée**, **résiliée** |
| Sortie provisoire | **en_cours**, **retourne** |
| Inventaire | **en_cours**, **clôturé** |
| Maintenance | **préventive**, **corrective** |
| Cession / rebut | Approuvée par un responsable, avec date d'approbation |

---

## Partie 1 — Contrôler les encaissements

### 1. Paiements

![Paiements](../images-nouveau/cabinet-comptable/01_paiements.png)

**Où le trouver :** menu **Financier > Finance > Paiements**.

**À quoi sert :** parcourir les paiements par année, dossier et transaction, retrouver un encaissement et consulter son reçu.

**À faire :**

1. Saisissez un matricule, un numéro de reçu, un nom ou une référence dans la recherche rapide.
2. Filtrez par année académique si nécessaire.
3. Dépliez l'arborescence **année > étudiant > paiement**.
4. Ouvrez le détail pour vérifier le montant, la date, le mode et le reçu.

**Bon à savoir :** la recherche accepte plusieurs types d'identifiants ; un paiement annulé reste visible dans l'historique avec son statut. Utilisez le bouton **Effacer** pour réinitialiser les filtres.

---

### 2. Validation des bordereaux

![Validation des bordereaux](../images-nouveau/cabinet-comptable/05_valid-bordereaux.png)

**Où le trouver :** menu **Financier > Finance > Valid. bordereaux**.

**À quoi sert :** contrôler, authentifier et orienter les paiements soumis par les étudiants. Les onglets **Tous**, **Inscription** et **Scolarité** séparent les dossiers.

**À faire :**

1. Filtrez par année académique, niveau d'étude et filière.
2. Ouvrez un bordereau et contrôlez le PDF joint.
3. Vérifiez la référence bancaire, le numéro et la date de paiement.
4. **Validez** si tout est conforme : le bordereau part en saisie comptable ESA.
5. **Rejetez** avec un motif clair si le justificatif est incomplet ou incohérent.

**Bon à savoir :** un bordereau validé n'est pas encore imputé ; c'est le service recouvrement qui finalise l'écriture. Ne validez jamais un bordereau sans avoir ouvert le PDF.

---

### 3. Mes bordereaux

![Mes bordereaux](../images-nouveau/cabinet-comptable/09_mes-bordereaux.png)

**Où le trouver :** menu **Pédagogique > Admission & Inscription > Mes bordereaux** (vue partagée avec l'espace étudiant).

**À quoi sert :** déposer un bordereau et suivre son état : référence bancaire, fichier PDF, statut, montant et date.

**À faire :**

1. Recherchez un bordereau par type, référence, statut ou fichier.
2. Filtrez par statut (**Tous**, **Validé**, **En attente**, **Rejeté**).
3. Ouvrez **Voir le PDF** pour consulter le justificatif.
4. Utilisez **Détails** pour l'historique du dossier.

**Bon à savoir :** cette vue est celle du déposant. Pour contrôler et authentifier un bordereau, utilisez l'écran **Validation des bordereaux**.

---

### 4. Situation financière

![Situation financière](../images-nouveau/cabinet-comptable/04_situation-financiere.png)

**Où le trouver :** adresse directe `/inscription/finance/situation-financiere` (aucune entrée de menu dédiée).

**À quoi sert :** suivre globalement les frais d'inscription et de scolarité, par année, niveau, parcours, classe et option de cours.

**À faire :**

1. Filtrez par année académique, niveau, parcours, classe ou option.
2. Recherchez un étudiant par nom, prénom ou matricule.
3. Dépliez l'arborescence **année > niveau > parcours > classe > étudiant**.
4. Lisez le solde et l'historique des échéances.

**Bon à savoir :** le compteur **Étudiants affichés** se met à jour à chaque filtre. Une situation détaillée s'ouvre par étudiant pour analyser les échéances non soldées.

---

## Partie 2 — Suivre les immobilisations

### 5. Immobilisations

![Immobilisations](../images-nouveau/cabinet-comptable/13_immobilisations.png)

**Où le trouver :** menu **Financier > Immobilisations > Immobilisations**.

**À quoi sert :** tenir le registre des biens : nom, référence, catégorie, site, localisation, état, date de mise en service et valeur d'acquisition.

**À faire :**

1. Recherchez un bien par nom, référence ou catégorie.
2. Créez une immobilisation avec sa référence, sa catégorie et sa valeur.
3. Renseignez la date de mise en service et l'état.
4. Consultez la fiche et le QR code pour l'inventaire physique.

**Bon à savoir :** l'état du bien alimente les indicateurs de reporting. Ne supprimez pas une immobilisation rattachée à une affectation, une assurance ou une maintenance.

---

### 6. Sites

![Sites](../images-nouveau/cabinet-comptable/14_sites.png)

**Où le trouver :** menu **Financier > Immobilisations > Sites**.

**À quoi sert :** gérer les sites et établissements rattachés, avec leur adresse et leur responsable.

**À faire :**

1. Recherchez un site existant.
2. Créez un site et renseignez son adresse.
3. Activez-le pour le rendre disponible dans les affectations.

**Bon à savoir :** un site est nécessaire pour affecter un bien et pour filtrer les rapports par implantation.

---

### 7. Catégories

![Catégories](../images-nouveau/cabinet-comptable/15_categories.png)

**Où le trouver :** menu **Financier > Immobilisations > Categories**.

**À quoi sert :** consulter et gérer les catégories d'immobilisations utilisées dans les référentiels.

**À faire :**

1. Recherchez une catégorie.
2. Consultez les règles associées (durée et taux d'amortissement).
3. Créez ou modifiez une catégorie uniquement si votre habilitation le permet.

**Bon à savoir :** une catégorie mal paramétrée fausse les amortissements. Vérifiez les règles avant de créer une immobilisation et ne supprimez pas une catégorie déjà utilisée.

---

### 8. Affectations

![Affectations](../images-nouveau/cabinet-comptable/16_affectations.png)

**Où le trouver :** menu **Financier > Immobilisations > Affectations**.

**À quoi sert :** affecter un bien à un site, un département, une localisation ou un responsable.

**À faire :**

1. Sélectionnez le bien concerné.
2. Choisissez le bénéficiaire (site, département, localisation, responsable).
3. Renseignez la date d'affectation et le motif.
4. Enregistrez le retour lorsque le bien est restitué.

**Bon à savoir :** une affectation en cours apparaît dans le reporting. Clôturez-la dès le retour pour éviter de fausser les indicateurs.

---

### 9. Assurances

![Assurances](../images-nouveau/cabinet-comptable/17_assurances.png)

**Où le trouver :** menu **Financier > Immobilisations > Assurances**.

**À quoi sert :** suivre les contrats d'assurance des biens : police, assureur, couverture, prime annuelle, période et statut.

**À faire :**

1. Recherchez un contrat par police ou assureur.
2. Consultez la période de couverture et les échéances.
3. Créez ou renouvelez un contrat avant sa date de fin.
4. Suivez les sinistres déclarés.

**Bon à savoir :** le statut passe de **active** à **expirée** à la date de fin. Un bien non couvert doit être signalé à la direction.

---

### 10. Sorties provisoires

![Sorties provisoires](../images-nouveau/cabinet-comptable/18_sorties-provisoires.png)

**Où le trouver :** menu **Financier > Immobilisations > Sorties provisoires**.

**À quoi sert :** enregistrer les biens sortis temporairement : date de sortie, date de retour prévue, motif, prestataire et description.

**À faire :**

1. Enregistrez une sortie pour le bien concerné.
2. Fixez la date de retour prévue.
3. Contrôlez le retour effectif et clôturez la sortie.

**Bon à savoir :** le statut passe de **en_cours** à **retourne**. Une sortie non clôturée fausse la disponibilité et les inventaires.

---

### 11. Cessions

![Cessions](../images-nouveau/cabinet-comptable/19_cessions.png)

**Où le trouver :** menu **Financier > Immobilisations > Cessions**.

**À quoi sert :** enregistrer la cession d'un bien : date, motif, type d'opération, prix, destinataire et approbation.

**À faire :**

1. Sélectionnez le bien à céder.
2. Renseignez le motif, le prix et le destinataire.
3. Faites approuver l'opération par le responsable habilité.
4. Conservez la preuve d'approbation dans le dossier du bien.

**Bon à savoir :** une cession est un acte définitif. Vérifiez qu'aucune affectation ni assurance n'est encore active sur le bien.

---

### 12. Rebuts

![Rebuts](../images-nouveau/cabinet-comptable/20_rebuts.png)

**Où le trouver :** menu **Financier > Immobilisations > Rebuts**.

**À quoi sert :** consigner la mise au rebut d'un bien : motif, montant, approbation et date.

**À faire :**

1. Sélectionnez les biens concernés.
2. Renseignez le motif et le montant.
3. Faites approuver la mise au rebut.
4. Vérifiez la sortie du bien de l'inventaire.

**Bon à savoir :** le rebut retire définitivement le bien du registre actif. Assurez-vous qu'il n'est ni affecté ni assuré.

---

### 13. Maintenance

![Maintenance](../images-nouveau/cabinet-comptable/21_maintenance.png)

**Où le trouver :** menu **Financier > Immobilisations > Maintenance**.

**À quoi sert :** suivre les interventions préventives et curatives : date, type, description, coût et prestataire.

**À faire :**

1. Créez une demande de maintenance pour le bien.
2. Précisez le type (**préventive** ou **corrective**) et le prestataire.
3. Planifiez l'intervention.
4. Clôturez avec le rapport et le coût réel.

**Bon à savoir :** les coûts de maintenance alimentent le reporting immobilisations. Une intervention non clôturée reste visible dans les indicateurs.

---

### 14. Inventaires

![Inventaires](../images-nouveau/cabinet-comptable/22_inventaires.png)

**Où le trouver :** menu **Financier > Immobilisations > Inventaires**.

**À quoi sert :** organiser les campagnes d'inventaire physique et rapprocher les constats du registre comptable.

**À faire :**

1. Lancez une campagne pour l'année fiscale.
2. Saisissez les constats de présence et d'état.
3. Générez les écarts entre le registre et le terrain.
4. Clôturez la campagne.

**Bon à savoir :** une campagne **clôturée** n'est plus modifiable. Traitez les écarts avant la clôture.

---

## Partie 3 — Produire les rapports

### 15. Reporting immobilisations

![Reporting immobilisations](../images-nouveau/cabinet-comptable/23_reportings.png)

**Où le trouver :** menu **Financier > Immobilisations > Reportings**.

**À quoi sert :** visualiser les indicateurs clés des immobilisations : total, valeur totale, assurances actives, affectations en cours, biens en service, en maintenance et hors service.

**À faire :**

1. Consultez les indicateurs de la période.
2. Vérifiez les écarts entre le registre et les opérations en cours.
3. Exportez le rapport pour le comité de direction ou le cabinet.

**Bon à savoir :** les indicateurs se recalculent à partir des opérations enregistrées. Actualisez la page après une affectation, une maintenance ou un rebut.

---

### 16. Rapport Paiements et Factures

![Rapport Paiements & Factures](../images-nouveau/cabinet-comptable/24_paiements.png)

**Où le trouver :** menu **Communication & Collaboration > Reporting > Paiements**.

**À quoi sert :** synthétiser l'activité financière : total des transactions, montant total, évolution des paiements, détail des paiements et des factures.

**À faire :**

1. Choisissez la période d'analyse.
2. Lisez le total des transactions et le montant total.
3. Consultez l'évolution des paiements et les tables de détail.
4. Exportez le rapport en PDF.

**Bon à savoir :** les montants sont exprimés en FCFA. L'export PDF reprend les mêmes chiffres que l'écran ; vérifiez la période avant de diffuser.

---

## Partie 4 — Votre compte

### 17. Mon profil

![Mon profil](../images-nouveau/cabinet-comptable/07_mon-profil.png)

**Où le trouver :** menu **Administration & Systeme > Parametres > Mon profil**.

**À quoi sert :** consulter et mettre à jour vos informations personnelles et professionnelles : identité, contacts et rattachements.

**À faire :**

1. Vérifiez vos informations.
2. Mettez à jour les champs modifiables.
3. Enregistrez.

**Bon à savoir :** certains champs (rôle, identifiant) ne sont modifiables que par l'administrateur.

---

### 18. Mon compte

![Mon compte](../images-nouveau/cabinet-comptable/08_mon-compte.png)

**Où le trouver :** menu **Administration & Systeme > Parametres > Mon compte**.

**À quoi sert :** gérer la sécurité de votre compte : mot de passe, double authentification et sessions ouvertes.

**À faire :**

1. Changez votre mot de passe si nécessaire.
2. Activez ou vérifiez la double authentification.
3. Fermez les sessions que vous ne reconnaissez pas.

**Bon à savoir :** ne partagez jamais votre code OTP. En cas de doute, changez immédiatement votre mot de passe et signalez l'incident.

---

## Écrans à accès restreint ou hors périmètre

Certaines captures du profil ouvrent un message d'accès refusé ou ne relèvent pas de la mission du cabinet. Elles ne sont pas détaillées dans ce guide.

| Écran | Message / situation | Conduite à tenir |
|---|---|---|
| **Échéances** | « Accès réservé à l'institution » | Utilisez **Paiements** ou **Situation financière** |
| **Situation irrégulière** | Page accessible, mais capture en erreur serveur | Réessayez ultérieurement ; signalez l'erreur avec la date et l'heure |
| **Comptabilité** | « Accès réservé à la comptabilité ESA » | La comptabilité générale est tenue par le service recouvrement ESA |
| **Tableau de bord enseignant** | « Accès réservé aux enseignants » | Sans objet pour le profil comptable |
| **Configurations de bourses** | Module bourses, hors périmètre Comptable | Accessible uniquement si une habilitation étendue a été attribuée |
| **Attributions de bourses** | Module bourses, hors périmètre Comptable | Accessible uniquement si une habilitation étendue a été attribuée |

## Index des écrans

| N° | Écran | Chemin de menu | Famille |
|---|---|---|---|
| 1 | Paiements | Financier > Finance > Paiements | Encaissements |
| 2 | Validation des bordereaux | Financier > Finance > Valid. bordereaux | Encaissements |
| 3 | Mes bordereaux | Pédagogique > Admission & Inscription > Mes bordereaux | Encaissements |
| 4 | Situation financière | Adresse directe `/inscription/finance/situation-financiere` | Encaissements |
| 5 | Immobilisations | Financier > Immobilisations > Immobilisations | Immobilisations |
| 6 | Sites | Financier > Immobilisations > Sites | Immobilisations |
| 7 | Catégories | Financier > Immobilisations > Categories | Immobilisations |
| 8 | Affectations | Financier > Immobilisations > Affectations | Immobilisations |
| 9 | Assurances | Financier > Immobilisations > Assurances | Immobilisations |
| 10 | Sorties provisoires | Financier > Immobilisations > Sorties provisoires | Immobilisations |
| 11 | Cessions | Financier > Immobilisations > Cessions | Immobilisations |
| 12 | Rebuts | Financier > Immobilisations > Rebuts | Immobilisations |
| 13 | Maintenance | Financier > Immobilisations > Maintenance | Immobilisations |
| 14 | Inventaires | Financier > Immobilisations > Inventaires | Immobilisations |
| 15 | Reporting immobilisations | Financier > Immobilisations > Reportings | Reporting |
| 16 | Rapport Paiements & Factures | Communication & Collaboration > Reporting > Paiements | Reporting |
| 17 | Mon profil | Administration & Systeme > Parametres > Mon profil | Compte |
| 18 | Mon compte | Administration & Systeme > Parametres > Mon compte | Compte |

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Accès refusé » | Le rôle ou l'habilitation ne couvre pas l'écran | Vérifiez votre périmètre ; contactez l'administrateur |
| Bordereau introuvable | Filtre d'année ou de statut trop restrictif | Réinitialisez les filtres et vérifiez l'onglet actif |
| PDF illisible | Format ou taille non accepté | Utilisez un PDF/JPG/PNG/HEIC de moins de 20 Mo |
| Montant incohérent | Justificatif ou référence erronée | Ne validez pas ; rejetez avec un motif précis |
| Erreur serveur | Incident temporaire | Réessayez plus tard et signalez la date, l'heure et l'écran |

## Votre sécurité

- Ne communiquez jamais votre mot de passe ni votre code OTP.
- Activez la double authentification dès que possible.
- Verrouillez votre session lorsque vous quittez votre poste.
- Signalez toute anomalie (paiement inattendu, accès inhabituel) à la direction.

## Glossaire

- **Bordereau** : justificatif de paiement déposé par l'étudiant (PDF + référence bancaire).
- **Authentification** : contrôle du bordereau par le cabinet avant imputation.
- **Imputation** : enregistrement comptable du paiement par le service recouvrement.
- **Échéance** : montant attendu à une date donnée (inscription ou scolarité).
- **Immobilisation** : bien durable inscrit au registre (matériel, mobilier, véhicule…).
- **Amortissement** : répartition de la valeur du bien sur sa durée d'utilisation.
- **Affectation** : attribution d'un bien à un site, un service ou un responsable.
- **Cession** : transfert définitif d'un bien à un tiers.
- **Rebut** : mise au rebut d'un bien devenu inutilisable.
- **Inventaire** : vérification physique des biens et rapprochement avec le registre.
- **KPI** : indicateur clé de performance affiché dans les reportings.

## Note sur les captures

- **24 captures** ont été réalisées le 02/11/2026 avec le compte `cabinet_comptable`.
- **18 écrans** sont retenus dans ce guide.
- **6 captures écartées** : Échéances (accès refusé), Situation irrégulière (erreur serveur), Comptabilité (accès refusé ESA), Tableau de bord enseignant (accès refusé), Configurations de bourses et Attributions de bourses (hors périmètre Comptable).

---

*Guide rédigé manuellement pour le profil Cabinet comptable — EasyEcole, version du 08/11/2026.*
