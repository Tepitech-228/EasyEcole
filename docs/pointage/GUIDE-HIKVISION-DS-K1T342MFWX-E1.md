# Configuration du terminal Hikvision MinMoe DS-K1T342MFWX-E1

Ce guide décrit le flux push Hikvision vers EasyEcole. La configuration ISAPI dans l'application sert au test de connexion au terminal ; les pointages temps réel sont reçus par le backend.

## Sécurité avant le raccordement

- Changez le mot de passe administrateur partagé dans la conversation avant de connecter l'appareil.
- Ne copiez aucun mot de passe ou secret dans ce guide, dans Git ou dans un ticket.
- Gardez le terminal sur un réseau privé. N'exposez ni son interface d'administration ni son port ISAPI à Internet.
- Réservez une adresse IP au terminal. EasyEcole autorise le push en vérifiant l'adresse IP source de la requête ; un changement d'IP ou un proxy/NAT qui masque l'adresse du terminal empêchera cette vérification.

## Fonctionnement

Le terminal envoie chaque événement à `POST http://<IP_DU_PC>:3000/api/hikvision/event` sous forme JSON, par exemple :

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

Le backend valide le format, l'adresse IP et l'existence d'un terminal Hikvision actif configuré avec cette IP. Il enregistre l'événement en attente avant de répondre `200 OK`, puis l'intègre au pointage existant et le diffuse via Socket.IO aux utilisateurs autorisés. Les événements en attente sont repris au démarrage et périodiquement. Un événement déjà reçu n'est pas compté deux fois.

`employeeNoString` doit correspondre sans ambiguïté à un identifiant EasyEcole : ID numérique du compte, identifiant de compte ou matricule associé au site. Le nom transmis par l'appareil n'est jamais utilisé seul pour identifier une personne ; le nom et le rôle affichés proviennent du compte EasyEcole. Un identifiant absent, ambigu ou non affecté au site est refusé et conservé dans le journal des événements.

## Préparer le terminal et le réseau

1. Relever le modèle complet, le numéro de série, la version firmware et l'adresse IP réservée.
2. Connecter le terminal et le PC serveur au même LAN, ou établir un réseau privé équivalent.
3. Configurer la destination push de l'appareil vers `http://<IP_DU_PC>:3000/api/hikvision/event`.
4. Autoriser dans le pare-feu du PC les requêtes entrantes depuis l'adresse IP du terminal vers le port du backend (`3000` par défaut).
5. Vérifier que le terminal peut joindre le PC ; `localhost` ne doit pas être utilisé comme adresse de destination.

Les menus et paramètres exacts du push Hikvision peuvent varier selon le firmware. Vérifiez la disponibilité du mécanisme de notification HTTP et le format JSON sur le firmware installé avant la mise en service.

## Préparer le backend

1. Depuis `easy-ecole-backend`, appliquer les migrations : `npm run db:migrate`. La migration `046_hikvision_minmoe_isapi.sql` ajoute les paramètres Hikvision, `048_hikvision_push_events.sql` autorise le statut durable `en_attente` et `049_hikvision_enrollment.sql` prépare la file d'enrôlement consenti.
2. Dans l'écran **Pointage > Configuration des terminaux**, enregistrer le terminal en protocole Hikvision avec son IP source, son site et ses informations ISAPI. Le numéro de série doit être celui de l'appareil.
3. En développement local, garder `HOST=localhost` pour l'interface EasyEcole et définir `HIKVISION_CALLBACK_HOST=<IP_WI-FI_DU_PC>`. Le backend expose alors uniquement le callback Hikvision sur cette interface réseau, sans rendre toutes les routes de l'API accessibles au terminal.
4. Garder `ENCRYPTION_MASTER_KEY` configurée et stable pour les tests ISAPI. Les identifiants sont chiffrés en base et ne sont pas transmis au navigateur.
5. Redémarrer le backend et vérifier les journaux `[Hikvision]` ainsi que `Hikvision callback listening`.

Le backend peut tester ISAPI en se connectant au terminal sur son IP et son port configurés. Aucun polling ISAPI n'est lancé pour les pointages : ceux-ci arrivent par le callback push ci-dessus.

## Enrôlement automatique après inscription

Après validation de l'inscription par le comité, EasyEcole crée une tâche d'enrôlement par terminal actif du site, avec le matricule final comme numéro d'employé. L'envoi de la photo au terminal est **systématique** : il ne dépend d'aucun consentement facultatif de l'étudiant (voir « Base légale et information » ci-dessous). La file est traitée en arrière-plan et réessaie avec délai si le terminal est indisponible. Le personnel et les enseignants disposant d'une photo de profil sont également éligibles.

Sans photo de profil ou terminal actif configuré pour le site au moment de la validation, l'enrôlement automatique n'est pas garanti (la tâche est conservée et reprise si une photo ou un terminal devient disponible). Vérifiez les journaux `[Hikvision]` et le support de `/ISAPI/Intelligent/FDLib/FaceDataRecord` par le firmware du DS-K1T342MFWX-E1 : les API et formats d'image varient avec le firmware. Une réponse positive de la connexion ISAPI ne prouve pas à elle seule que l'enrôlement facial est pris en charge.

## Base légale et information

L'envoi de la photo à un terminal de reconnaissance faciale constitue un traitement de données biométriques. La base légale retenue par l'établissement est **autre que le consentement facultatif** (règlement intérieur / contrat de scolarité / intérêt légitime de sécurité). En conséquence :

- Le parcours d'inscription affiche une **information** sur la transmission systématique de la photo ; il ne recueille plus de case à cocher facultative.
- Le champ `DemandeInscription.consentementHikvisionAt` et l'endpoint `PUT /inscription/demandes/:id/consentement-hikvision` sont **conservés en base et en API** (compatibilité, historique) mais **ne conditionnent plus** l'enrôlement.
- Toute évolution de cette base légale doit être validée avec le responsable de la protection des données de l'établissement avant mise en production.

## Test de bout en bout

1. Confirmer que l'IP source vue par le backend correspond à l'IP enregistrée pour le terminal.
2. Dans EasyEcole, tester la connexion ISAPI et vérifier que le terminal est actif et associé au bon site.
3. Faire un pointage facial avec un compte de test dont `employeeNoString` correspond à EasyEcole.
4. Vérifier la ligne de pointage, le journal des événements du terminal et l'affichage temps réel sur la page Pointage.
5. Vérifier qu'un identifiant inconnu ou ambigu ne crée pas de pointage et qu'un même événement rejoué ne crée pas de doublon.

En cas d'échec après le `200 OK`, l'événement reste `en_attente`, une erreur est journalisée et la reprise périodique réessaie son traitement. Ne pas créer de table de pointage générique : le flux utilise les tables `ins_pointages` et `ins_pointage_terminal_events` de l'application.

## Utilisation en production

N'exposez pas le callback en HTTP sur Internet. Utilisez un VPN ou un réseau privé entre le terminal et le backend. Si un reverse proxy est nécessaire, configurez-le de façon à conserver l'IP source réelle et vérifiez celle-ci côté backend avant d'activer le terminal.

## Références

- Modèle communiqué : Hikvision MinMoe DS-K1T342MFWX-E1.
- [Documentation produit Hikvision — Face Recognition Terminals](https://www.hikvision.com/en/products/Access-Control-Products/terminals/face-recognition-terminal/).
- Les champs et écrans de configuration doivent être confirmés avec le manuel correspondant au modèle et à la version firmware installée.
