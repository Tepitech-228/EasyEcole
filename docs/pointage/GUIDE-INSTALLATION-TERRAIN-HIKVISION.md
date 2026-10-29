# Mise en service terrain — pointage facial Hikvision

Ce guide est une checklist à emporter lors de l’installation d’un terminal Hikvision sur un site distant. Il complète le [guide Hikvision du modèle DS-K1T342MFWX-E1](./GUIDE-HIKVISION-DS-K1T342MFWX-E1.md).

## 1. Comprendre le trajet des événements

Le backend EasyEcole ouvre une connexion ISAPI vers le terminal et lit son flux `alertStream`. Après une reconnaissance, l’événement suit le traitement de pointage existant puis est diffusé en temps réel :

```text
Backend EasyEcole → ISAPI alertStream du terminal → base de données
                                                  └→ page Pointage (Socket.IO)
```

La page peut également afficher la **photo de profil déjà enregistrée dans EasyEcole** si elle est disponible. Il s’agit de la photo du dossier ou du profil associée au compte, pas d’une capture du visage prise à l’instant par le terminal. Le terminal et le navigateur doivent pouvoir charger le fichier image depuis le serveur EasyEcole.

Le flux utilisé par l’application est :

```text
http(s)://<IP_DU_TERMINAL>:<PORT_ISAPI>/ISAPI/Event/notification/alertStream
```

Le backend doit pouvoir atteindre cette adresse. Aucune destination Push ni URL de callback n’est à saisir sur le terminal. L’endpoint `/api/hikvision/event` reste disponible pour compatibilité, mais n’est pas requis pour le flux `alertStream`.

## 2. Architecture réseau recommandée pour un site distant

**Recommandation avec pfSense sur le site : établir un VPN IPsec site-à-site IKEv2 entre pfSense et une passerelle VPN contrôlée côté serveur.** Cette passerelle peut être fournie par l’hébergeur cloud ou installée sur un hôte Linux administré par l’équipe réseau. Elle ne doit pas être confondue avec le conteneur de l’application.

Le VPN doit permettre au serveur EasyEcole, y compris au conteneur Docker du backend, de joindre l’adresse fixe du terminal sur son port ISAPI (80 ou 443, selon la configuration), avec le chemin retour autorisé. Aucun flux entrant du terminal vers l’application n’est nécessaire pour `alertStream`.

Ne publiez pas les ports d’administration/ISAPI du terminal sur Internet et ne créez pas de redirection publique vers la caméra. Une adresse IP fixe ou une réservation DHCP est nécessaire pour le terminal.

### Limite réseau à valider avant l’installation

Le champ **Adresse IP du terminal** sert d’hôte cible pour la connexion ISAPI sortante. Pour un site distant, cette adresse doit être routée depuis l’hôte Docker et le conteneur backend via le VPN. Le NAT peut masquer l’adresse source du serveur, mais il ne doit pas empêcher le chemin retour des paquets. Les reverse proxies HTTP de l’application ne participent pas à cette connexion.

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
   - hôte/réseau du backend → `192.168.50.20/32` (terminal) → TCP 80/443 (port ISAPI retenu).
6. Dans **Firewall > Rules > LAN**, autorisez le retour des connexions ISAPI initiées par le backend. Ne créez pas de règle `any` générale pour « faire fonctionner » le tunnel.
7. Dans **Firewall > NAT > Outbound**, vérifiez que le trafic LAN vers le réseau VPN ne subit pas de NAT. Le mode automatique exclut généralement le trafic IPsec, mais confirmez la règle effective ; avec un mode manuel/hybride, ajoutez l’exception avant la règle NAT générale.
8. Dans **Diagnostics > States** ou **Diagnostics > Packet Capture**, vérifiez le passage des paquets sur LAN, WAN et IPsec. Les règles doivent préserver l’adresse source privée du terminal (pas de SNAT).

Les sélecteurs de phase 2 doivent être compatibles avec ceux du pair serveur. Si vous souhaitez limiter le tunnel à l’hôte du backend au lieu de tout le réseau serveur, l’administrateur peut utiliser un sélecteur `/32` et les routes correspondantes, à condition que cela soit pris en charge des deux côtés.

#### D. Routage du réseau distant vers Docker

Le VPN peut être actif sur la passerelle ou l’hôte sans que le conteneur backend puisse atteindre le terminal. Avant l’enregistrement dans EasyEcole :

1. Faites annoncer/installer sur l’hôte Docker une route vers le sous-réseau du terminal via la passerelle VPN.
2. Vérifiez le forwarding et les règles de pare-feu Docker entre le réseau du conteneur backend et le tunnel ; autorisez uniquement le TCP 80 ou 443 nécessaire vers l’IP du terminal.
3. Vérifiez le chemin retour depuis le réseau distant. Si le VPN ne route pas le sous-réseau Docker, l’équipe réseau peut configurer une route de retour ou un SNAT limité au trafic du backend vers le terminal.
4. Depuis le conteneur backend, testez la connexion à l’IP et au port ISAPI du terminal. Un test depuis le navigateur ou l’hôte Docker seul ne prouve pas que le conteneur a la route.

Ne publiez pas les ports ISAPI du terminal sur Internet. La configuration du tunnel et des routes relève de l’administrateur réseau ; le code applicatif ne peut pas créer cette connectivité à lui seul.

#### E. Valider puis mettre en service

1. Depuis le tableau de bord IPsec pfSense, confirmez les phases 1 et 2.
2. Vérifiez le routage dans les deux sens sans désactiver le pare-feu et sans autoriser tout le trafic.
3. Testez depuis le conteneur backend l’accès à l’IP du terminal sur le port ISAPI configuré.
4. Enregistrez le terminal dans EasyEcole avec son IP routée, son port, son site et ses identifiants ISAPI.
5. Vérifiez dans les journaux backend que le flux `alertStream` est ouvert, puis effectuez un pointage facial réel de test.
6. Vérifiez l’événement et le pointage dans EasyEcole ; rejouez uniquement un événement de test et confirmez qu’il n’est pas compté deux fois.
7. Documentez les IP, réseaux, règles, date de test et responsables. N’y consignez ni PSK ni mots de passe.

Si ISAPI fonctionne depuis l’hôte mais pas depuis le conteneur, le problème est le routage/forwarding Docker ou le pare-feu, pas la configuration Hikvision.

## 3. Informations à recueillir sur place

À compléter avant de toucher aux réglages :

| Élément | Valeur à noter |
|---|---|
| Établissement / site EasyEcole | |
| Modèle exact et version firmware | |
| Numéro de série du terminal | |
| Adresse IP réservée du terminal | |
| Masque, passerelle et DNS du terminal | |
| Adresse IP du terminal routée depuis le conteneur backend | |
| Port et protocole ISAPI retenus (HTTP ou HTTPS) | |
| Portée et état du VPN / règles réseau | |
| Compte ISAPI dédié (ne pas noter son mot de passe dans ce document) | |
| Identifiant de test (`employeeNoString`) | |
| Contact réseau / support du site | |

Vérifiez également l’heure, le fuseau et la synchronisation NTP du terminal. L’heure de l’événement doit correspondre à celle attendue dans EasyEcole.

## 4. Préparer le serveur avant le déplacement

- [ ] Le backend de production est démarré et sa base est à jour.
- [ ] Le réseau/VPN et le pare-feu permettent au conteneur backend d’atteindre l’IP du terminal sur son port ISAPI.
- [ ] La route vers le réseau distant et le chemin retour sont vérifiés depuis le conteneur, pas uniquement depuis l’hôte.
- [ ] `ENCRYPTION_MASTER_KEY` est configurée de façon stable dans le backend. Elle est requise pour enregistrer et tester les identifiants ISAPI.
- [ ] Un compte de test est prêt et son numéro d’employé est rattaché sans ambiguïté au site EasyEcole.
- [ ] L’équipe a convenu du traitement et de l’information des personnes concernant les données biométriques avec le responsable compétent de l’établissement.

### Vérifier la dépendance réseau du backend Linux

Le test de connexion, l’écoute `alertStream` et l’enrôlement utilisent `curl`. L’image backend EasyEcole inclut ce paquet. Après déploiement, testez la connexion ISAPI depuis l’écran de configuration et vérifiez les journaux de l’abonnement `alertStream`.

## 5. Configuration du terminal sur place

Les libellés et menus varient selon le modèle et le firmware ; utilisez le manuel du terminal installé.

1. Branchez le terminal sur le réseau prévu et vérifiez qu’il reçoit l’adresse IP réservée.
2. Confirmez l’accès au serveur EasyEcole par le chemin réseau convenu (VPN ou réseau privé).
3. Réglez l’heure, le fuseau et le NTP.
4. N’activez pas de destination HTTP Push pour EasyEcole : le backend lit le flux ISAPI du terminal.
5. Ne validez pas l’installation sur la seule présence d’un événement dans l’historique local : confirmez sa réception dans EasyEcole.

Structure JSON extraite d’une partie du flux (valeurs fictives) :

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
2. Renseignez l’adresse IP routée que le backend utilisera pour joindre l’appareil. Pour un terminal distant, ce peut être une adresse privée accessible via le VPN.
3. Choisissez le site auquel le terminal est physiquement affecté.
4. Renseignez le port et le protocole ISAPI réellement activés sur le terminal.
5. Enregistrez les identifiants ISAPI ; utilisez un compte dédié et un mot de passe fort.
6. Activez le terminal, puis vérifiez les journaux backend.

La personne reconnue doit avoir un identifiant employé/matricule associé sans ambiguïté à son compte et au site. Le nom transmis par l’appareil n’est pas utilisé seul pour identifier la personne.

## 7. Test de réception et critères d’acceptation

Effectuez le test avec une personne de test autorisée, en présence de l’équipe du site :

- [ ] Le journal backend confirme l’ouverture du flux ISAPI du terminal.
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
| Aucun événement reçu | Vérifier les journaux `alertStream`, l’IP/port ISAPI, le routage VPN depuis le conteneur et le pare-feu. |
| Le flux ne s’ouvre pas | Tester le port ISAPI depuis le conteneur, puis vérifier VPN, route de retour, HTTP/HTTPS et identifiants. |
| Flux ouvert mais aucun pointage | Vérifier l’identifiant employé, son rattachement au site et le journal des événements dans EasyEcole. |
| Connexion ISAPI en échec | Vérifier le routage backend → terminal, le port, HTTP/HTTPS, les identifiants et la présence de `curl` dans l’image backend. |
| Le visage n’est pas enrôlé | Vérifier le matricule, la photo, la file d’enrôlement, les journaux et le support ISAPI du firmware ; le push de pointage ne réalise pas l’enrôlement à lui seul. |

N’exposez pas le port ISAPI du terminal sur Internet pour résoudre un problème de routage. Faites corriger la route VPN ou le forwarding Docker par l’administrateur réseau.
