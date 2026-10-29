# Configuration du terminal Hikvision MinMoe DS-K1T342MFWX-E1

Ce guide décrit la connexion ISAPI sortante d’EasyEcole vers le terminal. Le backend lit son flux d’événements `alertStream` et enregistre automatiquement les pointages ; aucune URL Push n’est à configurer sur la pointeuse.

## Sécurité avant le raccordement

- Changez le mot de passe administrateur partagé dans la conversation avant de connecter l'appareil.
- Ne copiez aucun mot de passe ou secret dans ce guide, dans Git ou dans un ticket.
- Gardez le terminal sur un réseau privé. N'exposez ni son interface d'administration ni son port ISAPI à Internet.
- Réservez une adresse IP au terminal et autorisez le serveur EasyEcole à l’atteindre sur le port ISAPI configuré (80 ou 443).

## Fonctionnement

Le backend ouvre une connexion authentifiée vers `http(s)://<IP_DU_TERMINAL>:<PORT>/ISAPI/Event/notification/alertStream`. Il lit le flux multipart, extrait les événements JSON et les transmet au traitement de pointage existant. L’endpoint HTTP `/api/hikvision/event` reste disponible pour compatibilité, mais n’est pas requis pour ce mode.

```json
{
  "AccessControllerEvent": {
    "employeeNoString": "ESA001",
    "name": "Nom affiché sur le terminal",
    "major": 5,
    "minor": 38,
    "currentVerifyMode": "face",
    "attendanceStatus": "checkIn",
    "serialNo": 102,
    "time": "2026-10-18T09:18:22+00:00"
  }
}
```

Chaque événement est dédupliqué et enregistré dans la file durable avant son intégration au pointage existant, puis diffusé via Socket.IO aux utilisateurs autorisés. La connexion au flux est relancée automatiquement si elle tombe.

`employeeNoString` doit correspondre sans ambiguïté à un identifiant EasyEcole : ID numérique du compte, identifiant de compte ou matricule associé au site. Le nom transmis par l'appareil n'est jamais utilisé seul pour identifier une personne ; le nom et le rôle affichés proviennent du compte EasyEcole. Un identifiant absent, ambigu ou non affecté au site est refusé et conservé dans le journal des événements.

## Préparer le terminal et le réseau

1. Relever le modèle complet, le numéro de série, la version firmware et l'adresse IP réservée.
2. Connecter le terminal et le serveur par le même LAN ou par un VPN routé. Pour un site distant, le backend (y compris son conteneur Docker) doit pouvoir joindre l’IP du terminal sur le port ISAPI.
3. N’activez pas de destination HTTP Push pour ce mode : l’API EasyEcole s’abonne elle-même à `alertStream`.
4. N’ouvrez aucun port entrant vers le terminal depuis Internet. Autorisez seulement le trafic ISAPI depuis le réseau serveur/VPN.

## Préparer le backend

1. Depuis `easy-ecole-backend`, appliquer les migrations : `npm run db:migrate`. La migration `046_hikvision_minmoe_isapi.sql` ajoute les paramètres Hikvision, `048_hikvision_push_events.sql` autorise le statut durable `en_attente` et `049_hikvision_enrollment.sql` prépare la file d'enrôlement consenti.
2. Dans l'écran **Pointage > Configuration des terminaux**, enregistrer le terminal en protocole Hikvision avec son adresse joignable, son site et ses informations ISAPI. Le numéro de série doit être celui de l'appareil.
3. Pour un terminal distant, établir une route VPN entre le réseau du conteneur backend et le réseau du terminal ; aucune variable `HIKVISION_CALLBACK_HOST` n’est nécessaire pour `alertStream`.
4. Garder `ENCRYPTION_MASTER_KEY` configurée et stable pour les tests ISAPI. Les identifiants sont chiffrés en base et ne sont pas transmis au navigateur.
5. Redémarrer le backend et vérifier les journaux `[Hikvision]` ainsi que l’établissement du flux `alertStream`.

Le test de connexion et le flux de pointage utilisent tous deux une connexion ISAPI sortante du backend vers le terminal.

## Enrôlement automatique après inscription

Après validation de l'inscription par le comité, EasyEcole crée une tâche d'enrôlement par terminal actif du site, avec le matricule final comme numéro d'employé. L'envoi de la photo au terminal est **systématique** : il ne dépend d'aucun consentement facultatif de l'étudiant (voir « Base légale et information » ci-dessous). La file est traitée en arrière-plan et réessaie avec délai si le terminal est indisponible. Le personnel et les enseignants disposant d'une photo de profil sont également éligibles.

Sans photo de profil ou terminal actif configuré pour le site au moment de la validation, l'enrôlement automatique n'est pas garanti (la tâche est conservée et reprise si une photo ou un terminal devient disponible). Vérifiez les journaux `[Hikvision]` et le support de `/ISAPI/Intelligent/FDLib/FaceDataRecord` par le firmware du DS-K1T342MFWX-E1 : les API et formats d'image varient avec le firmware. Une réponse positive de la connexion ISAPI ne prouve pas à elle seule que l'enrôlement facial est pris en charge.

## Base légale et information

L'envoi de la photo à un terminal de reconnaissance faciale constitue un traitement de données biométriques. La base légale retenue par l'établissement est **autre que le consentement facultatif** (règlement intérieur / contrat de scolarité / intérêt légitime de sécurité). En conséquence :

- Le parcours d'inscription affiche une **information** sur la transmission systématique de la photo ; il ne recueille plus de case à cocher facultative.
- Le champ `DemandeInscription.consentementHikvisionAt` et l'endpoint `PUT /inscription/demandes/:id/consentement-hikvision` sont **conservés en base et en API** (compatibilité, historique) mais **ne conditionnent plus** l'enrôlement.
- Toute évolution de cette base légale doit être validée avec le responsable de la protection des données de l'établissement avant mise en production.

## Test de bout en bout

1. Depuis le serveur/conteneur backend, confirmer que l’IP du terminal répond sur son port ISAPI à travers le LAN ou le VPN.
2. Dans EasyEcole, tester la connexion ISAPI et vérifier que le terminal est actif et associé au bon site ; consulter les journaux pour confirmer l’abonnement `alertStream`.
3. Faire un pointage facial avec un compte de test dont `employeeNoString` correspond à EasyEcole.
4. Vérifier la ligne de pointage, le journal des événements du terminal et l'affichage temps réel sur la page Pointage.
5. Vérifier qu'un identifiant inconnu ou ambigu ne crée pas de pointage et qu'un même événement rejoué ne crée pas de doublon.

En cas d’échec de traitement, l’événement reste `en_attente`, une erreur est journalisée et la reprise périodique réessaie son traitement. Ne pas créer de table de pointage générique : le flux utilise les tables `ins_pointages` et `ins_pointage_terminal_events` de l’application.

## Utilisation en production

Utilisez un VPN ou un réseau privé routé entre le terminal et le backend. Pour un site distant sous Docker, vérifiez la route depuis l’hôte et le conteneur backend, ainsi que le pare-feu et le chemin retour. N’exposez jamais le port ISAPI du terminal sur Internet.

## Références

- Modèle communiqué : Hikvision MinMoe DS-K1T342MFWX-E1.
- [Documentation produit Hikvision — Face Recognition Terminals](https://www.hikvision.com/en/products/Access-Control-Products/terminals/face-recognition-terminal/).
- Les champs et écrans de configuration doivent être confirmés avec le manuel correspondant au modèle et à la version firmware installée.
