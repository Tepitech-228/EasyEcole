# Mise en service terrain — pointage facial Hikvision

Ce guide est une checklist à emporter lors de l’installation d’un terminal Hikvision sur un site distant. Il complète le [guide Hikvision du modèle DS-K1T342MFWX-E1](./GUIDE-HIKVISION-DS-K1T342MFWX-E1.md).

## 1. Comprendre le trajet des événements

Le terminal ne se connecte pas à l’interface web de l’application pour pointer. Après une reconnaissance, il envoie un événement au backend EasyEcole, qui l’associe à une personne, enregistre le pointage puis le diffuse en temps réel :

```text
Terminal Hikvision → callback HTTP(S) EasyEcole → backend → base de données
                                                └──────→ page Pointage (Socket.IO)
```

La page peut également afficher la **photo de profil déjà enregistrée dans EasyEcole** si elle est disponible. Il s’agit de la photo du dossier ou du profil associée au compte, pas d’une capture du visage prise à l’instant par le terminal. Le terminal et le navigateur doivent pouvoir charger le fichier image depuis le serveur EasyEcole.

Le callback prévu par l’application est :

```text
POST https://<HOTE_API_EASYECOLE>/api/hikvision/event
```

Le terminal doit pouvoir atteindre cet hôte et envoyer le format JSON attendu par le backend. La configuration de destination push se fait sur le terminal ; l’enregistrement du terminal dans EasyEcole ne configure pas automatiquement cette destination.

## 2. Architecture réseau recommandée pour un site distant

**Recommandation avec pfSense sur le site : établir un VPN IPsec site-à-site IKEv2 entre pfSense et une passerelle VPN contrôlée côté serveur.** Cette passerelle peut être fournie par l’hébergeur cloud ou installée sur un hôte Linux administré par l’équipe réseau. Elle ne doit pas être confondue avec le conteneur de l’application.

Le VPN doit permettre les deux trajets suivants :

1. Le backend EasyEcole peut joindre l’adresse fixe du terminal sur son port ISAPI (80 ou 443, selon la configuration).
2. Le terminal peut envoyer son événement au callback EasyEcole à travers un chemin réseau autorisé.

Ne publiez pas les ports d’administration/ISAPI du terminal sur Internet et ne créez pas de redirection publique vers la caméra. Une adresse IP fixe ou une réservation DHCP est nécessaire pour le terminal.

### Limite réseau à valider avant l’installation

Dans la version actuelle, le champ **IP source** enregistré pour un terminal sert à la fois :

- d’hôte cible lorsque le backend contacte le terminal pour ISAPI ;
- d’adresse attendue pour autoriser les événements entrants.

Le callback compare l’adresse du pair TCP (`req.socket.remoteAddress`) à cette IP. Il ne se base pas sur `X-Forwarded-For`. Par conséquent, un proxy inverse, un NAT, un VPN qui traduit l’adresse source ou un réseau Docker qui masque l’adresse du terminal peut faire échouer l’autorisation, même si l’URL répond.

Avant de déployer sur un site distant, faites confirmer par l’administrateur réseau que :

- l’adresse configurée comme **IP source** est joignable par le backend pour ISAPI ;
- le backend voit la même adresse comme pair réseau lors du callback ;
- aucun proxy/NAT ne remplace cette adresse sur le trajet du callback.

Si ces conditions ne sont pas réunies, **ne contournez pas le contrôle en ouvrant le terminal à Internet** : il faut d’abord adapter l’architecture réseau ou faire évoluer le backend pour gérer explicitement les adresses de gestion et de callback et les proxies de confiance.

> Dokploy et les reverse proxies exposent généralement le backend derrière un proxy. Dans cette configuration, le callback peut apparaître au backend avec l’adresse du proxy, pas celle du terminal. Le transfert de `X-Forwarded-For` seul ne suffit pas avec le contrôle actuel. Le callback direct `HIKVISION_CALLBACK_HOST` est un écouteur HTTP supplémentaire : son interface, son port et son routage doivent être validés avec l’équipe qui gère le serveur avant toute utilisation.

### Configurer le VPN IPsec site-à-site pfSense

Cette procédure décrit les tâches réseau de bout en bout. Les noms des menus changent légèrement selon la version de pfSense. Elle suppose que vous administrez pfSense et la passerelle côté serveur, et que les deux côtés ont des adresses IP publiques joignables. Si le serveur est derrière un NAT cloud, utilisez de préférence la passerelle VPN recommandée par l’hébergeur et suivez sa documentation pour le routage et les règles de sécurité.

#### A. Préparer un plan d’adressage

Choisissez des réseaux privés non chevauchants et notez-les des deux côtés. Exemple fictif à remplacer :

| Paramètre | Exemple fictif | À relever |
|---|---:|---|
| Réseau du site derrière pfSense | `192.168.50.0/24` | |
| IP réservée du terminal Hikvision | `192.168.50.20/32` | |
| IP publique WAN de pfSense | `198.51.100.10` | |
| Réseau privé accessible côté serveur/VPN | `10.20.0.0/24` | |
| Adresse privée de la passerelle/backend | `10.20.0.10` | |
| IP publique de la passerelle VPN serveur | `203.0.113.20` | |

Les adresses publiques ci-dessus sont des adresses réservées aux exemples ; elles ne sont pas des adresses de configuration. Ne poursuivez pas si le LAN du site chevauche le réseau privé serveur ou un réseau VPN déjà utilisé : l’administrateur réseau doit d’abord choisir un autre plan.

Définissez aussi les ports nécessaires, selon les réglages réels du terminal :

- Terminal → callback : TCP 443 de préférence si le terminal accepte le certificat HTTPS, sinon le port privé validé par le responsable réseau.
- Backend → terminal : TCP 80 ou 443 pour ISAPI, selon le port configuré dans EasyEcole.
- Établissement IPsec : UDP 500 et UDP 4500 entre les deux pairs publics ; ESP (IP protocole 50) seulement si le chemin n’utilise pas NAT-T et si l’hébergeur l’autorise.

N’ouvrez pas le port ISAPI depuis Internet. Les règles indiquées ci-dessous sont limitées aux sous-réseaux du tunnel.

#### B. Configurer le pair serveur

Sur la passerelle côté serveur :

1. Créez un tunnel IPsec site-à-site IKEv2 dont l’identifiant distant est l’IP publique WAN pfSense.
2. Configurez une authentification par clé pré-partagée (PSK) forte, générée aléatoirement et transmise à l’administrateur pfSense par un canal sécurisé. Ne l’inscrivez ni dans ce guide, ni dans Git, ni dans un ticket.
3. Configurez la phase 1 avec des propositions IKEv2 identiques des deux côtés. Un profil courant à faire valider par l’hébergeur est AES-256, SHA-256, groupe DH 14, durée de vie conforme à son profil. Si l’hébergeur impose d’autres propositions, utilisez ses paramètres sur les deux pairs.
4. Configurez la phase 2 avec les sélecteurs exacts : réseau privé serveur côté local (`10.20.0.0/24` dans l’exemple) et LAN pfSense côté distant (`192.168.50.0/24`). Utilisez AES-256/SHA-256 et le groupe PFS recommandé par le pair.
5. Activez le routage du trafic entre le tunnel et le réseau privé de l’application. Sur un serveur Linux administré directement, cela nécessite IP forwarding, règles de pare-feu et une solution IPsec maintenue par l’équipe système ; sur un cloud, configurez plutôt les routes, security groups et passerelle VPN de l’hébergeur.
6. Si EasyEcole est en conteneurs Docker, ajoutez et testez la route vers le LAN pfSense sur l’hôte et vérifiez le forwarding/pare-feu Docker. Ne présumez pas que le conteneur backend reçoit les paquets avec l’adresse du terminal inchangée.
7. Autorisez UDP 500/4500 depuis l’IP WAN pfSense vers le pair VPN serveur dans le pare-feu cloud/hôte. Autorisez ensuite uniquement les ports métier listés plus haut depuis/vers les réseaux du tunnel.

Les interfaces et configurations Linux/cloud diffèrent selon l’hébergeur ; ne copiez pas une configuration générique d’IPsec sur le serveur de production sans validation de l’administrateur de cette passerelle.

#### C. Configurer pfSense

1. Dans **System > Advanced > Firewall & NAT**, vérifiez que les règles existantes ne bloquent pas IPsec. Dans **Firewall > Rules > WAN**, autorisez UDP 500 et UDP 4500 depuis l’IP publique de la passerelle serveur uniquement. N’ouvrez pas ces ports à toutes les sources si l’IP serveur est fixe.
2. Dans **VPN > IPsec**, ajoutez une phase 1 :
   - Key Exchange : **IKEv2** ;
   - Internet Protocol : IPv4 si les deux réseaux sont IPv4 ;
   - Interface : **WAN** ;
   - Remote Gateway : IP publique de la passerelle VPN serveur ;
   - Authentication : **Mutual PSK** ;
   - My Identifier et Peer Identifier : identifiants convenus avec l’administrateur serveur ;
   - Encryption/Hash/DH : valeurs convenues, identiques au pair serveur ;
   - laisser les paramètres avancés (NAT-T, DPD, durée de vie) selon le profil commun aux deux pairs.
3. Sous cette phase 1, ajoutez une phase 2 :
   - Mode : **Tunnel IPv4** ;
   - Local Network : LAN du site (ex. `192.168.50.0/24`) ;
   - Remote Network : réseau privé serveur annoncé par la passerelle (ex. `10.20.0.0/24`) ;
   - algorithmes et PFS : mêmes paramètres que sur le pair serveur.
4. Enregistrez et appliquez les changements. Dans **Status > IPsec**, vérifiez que le tunnel est établi et que la phase 2 est active.
5. Dans **Firewall > Rules > IPsec**, créez des règles ciblées pour autoriser uniquement :
   - source `192.168.50.20/32` (terminal) → hôte callback privé → TCP 443 (ou le port convenu) ;
   - hôte backend privé → `192.168.50.20/32` → TCP 80/443 (ISAPI, port retenu).
6. Dans **Firewall > Rules > LAN**, vérifiez que le terminal est autorisé à atteindre le callback. Ne créez pas de règle `any` générale pour « faire fonctionner » le tunnel.
7. Dans **Firewall > NAT > Outbound**, vérifiez que le trafic LAN vers le réseau VPN ne subit pas de NAT. Le mode automatique exclut généralement le trafic IPsec, mais confirmez la règle effective ; avec un mode manuel/hybride, ajoutez l’exception avant la règle NAT générale.
8. Dans **Diagnostics > States** ou **Diagnostics > Packet Capture**, vérifiez le passage des paquets sur LAN, WAN et IPsec. Les règles doivent préserver l’adresse source privée du terminal (pas de SNAT).

Les sélecteurs de phase 2 doivent être compatibles avec ceux du pair serveur. Si vous souhaitez limiter le tunnel à l’hôte du backend au lieu de tout le réseau serveur, l’administrateur peut utiliser un sélecteur `/32` et les routes correspondantes, à condition que cela soit pris en charge des deux côtés.

#### D. Routage direct vers l’application/Dokploy

Le VPN peut être établi sans que le callback soit réellement accessible par EasyEcole. Avant de configurer la destination du terminal :

1. Décidez avec l’administrateur si le terminal appelle une adresse privée du serveur à travers le VPN ou un nom public. Pour un tunnel, privilégiez le chemin privé.
2. Faites acheminer le callback vers le backend sans passer par un reverse proxy qui masque l’adresse du terminal. Ne publiez pas directement un nouveau port Internet pour contourner le proxy.
3. Si un port privé dédié ou `HIKVISION_CALLBACK_HOST` est utilisé, vérifiez son bind, son routage jusqu’au bon processus/conteneur, la règle firewall et le fait que ce listener ne crée pas de conflit de port. Cette variable seule ne configure ni le VPN ni Docker.
4. Depuis le backend (ou un diagnostic réseau autorisé sur son hôte), vérifiez que l’adresse IP du terminal est joignable sur son port ISAPI. Depuis le terminal/réseau du site, vérifiez l’accès au callback privé.
5. Consultez les journaux ou capturez le trafic pour vérifier l’adresse réellement vue par `req.socket.remoteAddress`. Elle doit correspondre à l’adresse saisie dans **IP source** dans EasyEcole. Si elle est différente, arrêtez-vous : l’architecture actuelle refusera l’événement. Demandez une route sans NAT/proxy appropriée ou une évolution backend avec séparation explicite des adresses ISAPI/callback et mécanisme d’authentification adapté.

Ne remplacez pas la vérification d’IP par une confiance aveugle dans `X-Forwarded-For` : un en-tête fourni par un client peut être falsifié si la chaîne de proxies de confiance n’est pas précisément définie.

#### E. Valider puis mettre en service

1. Depuis le tableau de bord IPsec pfSense, confirmez les phases 1 et 2.
2. Vérifiez le routage dans les deux sens sans désactiver le pare-feu et sans autoriser tout le trafic.
3. Testez l’accès backend → terminal sur le port ISAPI configuré.
4. Testez terminal → callback avec un événement de test conforme au firmware ; vérifiez le code HTTP, les journaux et l’adresse source reçue.
5. Enregistrez ensuite le terminal dans EasyEcole avec son IP joignable et son site, puis testez le pointage facial réel.
6. Rejouez le test uniquement avec un événement de test ; vérifiez l’idempotence et qu’un pointage valide n’est pas créé deux fois.
7. Documentez les IP, réseaux, règles, date de test et responsables dans le dossier d’exploitation sécurisé. N’y consignez pas la PSK ni les mots de passe.

Si le tunnel est établi mais qu’un événement renvoie `403 TERMINAL NOT AUTHORIZED`, le problème est généralement le chemin retour, un NAT, le proxy Dokploy ou l’adresse réellement vue par le backend — pas la phase 1 IPsec.

## 3. Informations à recueillir sur place

À compléter avant de toucher aux réglages :

| Élément | Valeur à noter |
|---|---|
| Établissement / site EasyEcole | |
| Modèle exact et version firmware | |
| Numéro de série du terminal | |
| Adresse IP réservée du terminal | |
| Masque, passerelle et DNS du terminal | |
| Adresse IP/nom du callback joignable depuis le site | |
| Port et protocole ISAPI retenus (HTTP ou HTTPS) | |
| Portée et état du VPN / règles réseau | |
| Compte ISAPI dédié (ne pas noter son mot de passe dans ce document) | |
| Identifiant de test (`employeeNoString`) | |
| Contact réseau / support du site | |

Vérifiez également l’heure, le fuseau et la synchronisation NTP du terminal. L’heure de l’événement doit correspondre à celle attendue dans EasyEcole.

## 4. Préparer le serveur avant le déplacement

- [ ] Le backend de production est démarré et sa base est à jour.
- [ ] Le nom d’hôte public de l’API est connu ; le certificat HTTPS est valide si le terminal prend en charge HTTPS pour les notifications.
- [ ] Le chemin `/api/hikvision/event` est routé vers le backend.
- [ ] Le réseau/VPN permet l’accès au terminal depuis le backend et le callback dans l’autre sens.
- [ ] La configuration Dokploy/reverse proxy a été vérifiée pour le maintien de l’adresse source réelle. Avec le contrôle actuel, une simple transmission d’en-têtes proxy ne suffit pas.
- [ ] `ENCRYPTION_MASTER_KEY` est configurée de façon stable dans le backend. Elle est requise pour enregistrer et tester les identifiants ISAPI.
- [ ] Un compte de test est prêt et son numéro d’employé est rattaché sans ambiguïté au site EasyEcole.
- [ ] L’équipe a convenu du traitement et de l’information des personnes concernant les données biométriques avec le responsable compétent de l’établissement.

### Vérifier la dépendance réseau du backend Linux

Le test de connexion ISAPI et l’enrôlement utilisent `curl`. L’image backend EasyEcole inclut le paquet `curl` et le service choisit le nom de commande selon le système (`curl.exe` sous Windows, `curl` sous Linux). Après déploiement, vérifiez le build de l’image et testez la connexion ISAPI depuis l’écran de configuration. Le callback entrant est un flux distinct : une réception push réussie ne valide pas à elle seule la connexion ISAPI ni l’enrôlement photo.

## 5. Configuration du terminal sur place

Les libellés et menus varient selon le modèle et le firmware ; utilisez le manuel du terminal installé.

1. Branchez le terminal sur le réseau prévu et vérifiez qu’il reçoit l’adresse IP réservée.
2. Confirmez l’accès au serveur EasyEcole par le chemin réseau convenu (VPN ou réseau privé).
3. Réglez l’heure, le fuseau et le NTP.
4. Dans l’interface d’administration du terminal, configurez la notification d’événements / destination HTTP push selon le manuel du firmware :
   - méthode : `POST` ;
   - URL : `https://<HOTE_API_EASYECOLE>/api/hikvision/event` si HTTPS et le certificat sont pris en charge, sinon l’URL privée validée par l’équipe réseau ;
   - contenu : JSON correspondant au format attendu ;
   - événements : événements de reconnaissance faciale autorisée pertinents pour le firmware.
5. Ne placez pas le nom d’utilisateur ou le mot de passe ISAPI dans l’URL du callback.
6. Vérifiez que le firmware envoie au minimum `AccessControllerEvent.employeeNoString`, `time`, `major` et `minor` sous forme JSON. Le backend rejette un format différent.
7. Ne validez pas l’installation sur la seule présence d’un événement dans l’historique local du terminal : il faut confirmer sa réception par EasyEcole.

Exemple de structure JSON attendue (valeurs fictives) :

```json
{
  "AccessControllerEvent": {
    "employeeNoString": "MATRICULE_TEST",
    "name": "Personne de test",
    "major": 5,
    "minor": 75,
    "time": "2026-10-18T09:18:22+00:00"
  }
}
```

Les champs et numéros d’événements varient selon le firmware : confirmez le payload réel sur le modèle installé avant de conclure qu’il est compatible.

## 6. Enregistrer le terminal dans EasyEcole

Dans **Pointage > Configuration des terminaux** (action réservée à l’administrateur) :

1. Ajoutez le numéro de série et le nom du terminal.
2. Renseignez l’adresse IP utilisée par le backend pour joindre l’appareil et qui sera également visible comme IP source du callback, conformément à la limite réseau ci-dessus.
3. Choisissez le site auquel le terminal est physiquement affecté.
4. Renseignez le port et le protocole ISAPI réellement activés sur le terminal.
5. Enregistrez les identifiants ISAPI ; utilisez un compte dédié et un mot de passe fort.
6. Activez le terminal, puis vérifiez les journaux backend.

La personne reconnue doit avoir un identifiant employé/matricule associé sans ambiguïté à son compte et au site. Le nom transmis par l’appareil n’est pas utilisé seul pour identifier la personne.

## 7. Test de réception et critères d’acceptation

Effectuez le test avec une personne de test autorisée, en présence de l’équipe du site :

- [ ] Une requête envoyée au callback reçoit `200 OK`.
- [ ] Le backend reconnaît le terminal actif à partir de l’adresse réseau réellement vue.
- [ ] L’événement apparaît dans le journal du terminal dans EasyEcole.
- [ ] Le pointage est enregistré sur le bon compte, à la bonne date, au bon site.
- [ ] La page Pointage affiche la personne et le rôle attendus.
- [ ] La notification vocale/sonore fonctionne sur le poste qui affiche la page, si cette fonction est activée et autorisée par le navigateur.
- [ ] Le rejeu du même événement ne crée pas un second pointage.
- [ ] Un identifiant inconnu ou ambigu ne crée pas de pointage.
- [ ] La connexion ISAPI et l’enrôlement facial sont testés séparément ; une réception push réussie ne les valide pas.

## 8. Diagnostic rapide

| Symptôme | Vérification prioritaire |
|---|---|
| Aucun événement reçu | URL/port, règle pare-feu, routage du callback, configuration push et format envoyé par le firmware. |
| Réponse `400 INVALID EVENT` | Le corps n’est pas le JSON attendu ou un champ obligatoire / la date est invalide. |
| Réponse `403 TERMINAL NOT AUTHORIZED` | Le terminal doit être actif, enregistré en Hikvision et l’adresse de pair TCP vue par le backend doit correspondre à son IP source enregistrée. Vérifier VPN, NAT, Docker et proxy. |
| Réponse `503 RETRY` | Lire les journaux backend et vérifier la base de données. |
| `200 OK` mais pas de pointage | Vérifier l’identifiant envoyé (`employeeNoString`), son rattachement au site et le statut de l’événement dans EasyEcole. |
| Connexion ISAPI en échec | Vérifier le routage backend → terminal, le port, HTTP/HTTPS, les identifiants et la présence de `curl` dans l’image backend. |
| Le visage n’est pas enrôlé | Vérifier le matricule, la photo, la file d’enrôlement, les journaux et le support ISAPI du firmware ; le push de pointage ne réalise pas l’enrôlement à lui seul. |

Ne désactivez pas la vérification d’adresse IP pour résoudre un problème de routage. Relevez l’adresse réellement vue dans un environnement contrôlé et faites valider une solution réseau sécurisée.
