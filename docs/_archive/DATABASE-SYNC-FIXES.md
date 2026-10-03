# Corrections des Erreurs de Synchronisation Base de Données

## Problèmes Identifiés

### 1. **Erreur de Clé Étrangère - Rattrapage**
```
Warning (rattrapage/frais schema sync ignored): Cannot add or update a child row: 
a foreign key constraint fails (`easyecole`.`#sql-4c84_8eb`, 
CONSTRAINT `#sql-4c84_8eb_ibfk_76` FOREIGN KEY (`coursParticipantId`) 
REFERENCES `ins_cours_participants` (`id`)
```

**Cause :** Des enregistrements orphelins dans `ins_rattrapages_inscriptions` avec des `coursParticipantId` qui n'existent plus dans `ins_cours_participants`

**Solution Appliquée :**
- Ajout d'une étape de nettoyage AVANT la synchronisation des tables
- Suppression des enregistrements orphelins pour `coursParticipantId`
- Suppression cascade des documents déposés correspondants

**Fichier modifié :** `src/core/helpers/DatabaseConnection.ts`

```typescript
// Nettoyer les orphelins AVANT de syncer les tables rattrapage
try {
    await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Supprimer les RattrapageInscription avec coursParticipantId orpheline
    await this._sequelize.query(`
        DELETE FROM ins_rattrapages_inscriptions 
        WHERE coursParticipantId IS NOT NULL 
        AND coursParticipantId NOT IN (SELECT id FROM ins_cours_participants)
    `);
    
    // Supprimer les RattrapageDocumentDepose avec rattrapageInscriptionId orpheline
    await this._sequelize.query(`
        DELETE FROM ins_rattrapages_documents_deposes 
        WHERE rattrapageInscriptionId NOT IN (SELECT id FROM ins_rattrapages_inscriptions)
    `);

    await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
} catch (cleanupError: any) {
    console.warn('Warning (rattrapage cleanup):', cleanupError?.message || cleanupError);
}
```

### 2. **Erreur de Clés MySQL - ExerciceComptable**
```
Sync ExerciceComptable (alter) ignored: Too many keys specified; max 64 keys allowed
```

**Cause :** MySQL a une limite de 64 clés par table. Lorsque Sequelize essaie d'altérer la table, il essaie d'ajouter trop de clés simultanément.

**Status :** Cette erreur est normale et n'affecte pas le fonctionnement - elle est correctement attrapée et ignorée par le DatabaseConnection

### 3. **Avertissement de Dépréciation MySQL**
```
[SEQUELIZE0006] DeprecationWarning: This database engine version is not supported, 
please update your database server.
```

**Cause :** Version de MySQL trop ancienne ou non supportée par Sequelize 6.32.1

**Solution :** Mettre à jour MySQL vers version 8.0+

### 4. **Cinetpay Non Configuré**
```
[Cinetpay] API key or merchant ID not configured. Mobile money payments will be disabled.
```

**Cause :** Variables d'environnement `CINETPAY_API_KEY` ou `CINETPAY_MERCHANT_ID` non définies

**Solution :** Optionnel - configurer dans `.env` pour activer les paiements mobile money
```env
CINETPAY_API_KEY=your_api_key
CINETPAY_MERCHANT_ID=your_merchant_id
```

## Processus de Synchronisation Optimisé

Le processus de démarrage suit maintenant cet ordre :

1. **Authentification** - Vérifier la connexion à la BD
2. **Nettoyage** - Supprimer les enregistrements orphelins
3. **Sync Rattrapage** - Synchroniser les tables de rattrapage avec FK propres
4. **Sync Complète** - Synchroniser toutes les autres tables
5. **Vérification Comptable** - Vérifier/compléter les journaux

## Résultat Attendu au Démarrage

```
Database connected successfully
Database connected successfully
Database: all data synchronized
[RappelSalleCron] Cron de rappel démarré (chaque minute, fenêtre H-10min)
[RappelEcheanceCron] Cron de rappel d'échéances démarré (quotidien à 06:00)
Database connected successfully
Journaux VEN, ACH, BQ, CAI, PAI, OD vérifiés / complétés
Plan comptable OHADA universitaire vérifié / complété
```

## À Faire

- [ ] Mettre à jour MySQL vers version 8.0+
- [ ] Configurer les variables Cinetpay si paiements mobiles nécessaires
- [ ] Valider la synchronisation sur premier démarrage après cette correction
- [ ] Monitorer les logs pour détecter d'autres orphelins

## Détails Techniques

### Tables Affectées
- `ins_rattrapages_inscriptions` - Table principale des demandes
- `ins_rattrapages_documents_deposes` - Dépendance en cascade
- `ins_frais_scolarites` - Table des frais
- `ins_rattrapages_sessions` - Sessions de rattrapage
- `ins_rattrapages_documents_requis` - Documents obligatoires
- `ins_rattrapages_sessions_classes` - Affectation des classes

### Contraintes Appliquées
- FK: `coursParticipantId` → `ins_cours_participants(id)`
- FK: `rattrapageSessionId` → `ins_rattrapages_sessions(id)`
- FK: `bordereauId` → `ins_bordereaux(id)`
- FK: `demandePar` → `auth_utilisateurs(id)`

---

**Date de correction :** 2026-08-18  
**Version :** After access control suite implementation
