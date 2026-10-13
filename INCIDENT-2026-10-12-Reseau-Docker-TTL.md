# Document d'incident — Perte de connectivité Internet des conteneurs Docker

**Serveur :** `srvapp` · **Date :** 12/10/2026 · **Statut :** ✅ Cause racine identifiée et neutralisée (sécurisation durable en cours)

---

## 1. Résumé exécutif

Tous les conteneurs Docker du serveur étaient **incapables d'accéder à Internet**, bloquant le clone GitHub de Dokploy et donc le déploiement de l'application. L'hôte `srvapp`, lui, disposait d'un accès réseau normal.

Après avoir écarté pare-feu, NAT et routage Docker, la cause réelle s'est révélée être **un TTL forcé à 1 sur le trafic entrant par le réseau amont** (politique « anti-partage » opérateur/routeur). Un correctif côté serveur — normalisation du TTL à l'entrée — a rétabli la connectivité des conteneurs.

---

## 2. Symptômes observés

| Cible | Comportement |
|---|---|
| Dokploy (clone GitHub) | `Failed to connect to github.com port 443 after 140270 ms` |
| Conteneur → Internet | `ping 8.8.8.8` → **100 % de perte** ; `curl` → « Could not resolve host » |
| Conteneur → passerelle `172.17.0.1` | **OK** (0 % de perte) |
| Hôte `srvapp` → Internet | **OK** (ping et HTTPS GitHub fonctionnels) |

---

## 3. Diagnostic — étapes et fausses pistes

1. **Écarté — pare-feu.** `DEFAULT_FORWARD_POLICY="ACCEPT"`, règle `MASQUERADE` présente, règles `ufw route allow` ajoutées, `ufw reload` + `systemctl restart docker` → **aucun changement**.
2. **Écarté — nft/iptables.** Le `drop` à 1502 paquets suspecté était en réalité la chaîne **INPUT** (`ufw-skip-to-policy-input`, trafic destiné à l'hôte) → **fausse piste**. Les chaînes `FORWARD` / `DOCKER*` n'avaient **aucun drop actif**.
3. **Écarté — données / routes.** `conntrack` correct (`172.17.0.2→8.8.8.8` ↔ `8.8.8.8→192.168.83.171`), `ip route get 172.17.0.2 → dev docker0`, `ip_forward=1`, NAT opérationnel.
4. **Preuve décisive** (`tcpdump -vni eth0 icmp`) :

```
ttl 63  192.168.83.171 > 8.8.8.8   echo request
ttl 1   8.8.8.8 > 192.168.83.171   echo reply        <-- anomalie
ttl 64  192.168.83.171 > 8.8.8.8   ICMP time exceeded
```

5. **Confirmation.** `ping -c1 8.8.8.8` **sur l'hôte** affiche également **`ttl=1`**, et **aucune règle locale** ne réécrit le TTL (`net.ipv4.ip_default_ttl = 64`, tables `mangle` vides, aucune règle `ttl` dans nft).

---

## 4. Cause racine

> Le **réseau en amont** (routeur passerelle `192.168.83.1` / opérateur) livre les paquets **entrants avec TTL = 1**.

**Mécanisme :** l'hôte *consomme* ces paquets (il reste un serveur fonctionnel), mais dès qu'il doit les **router** vers un conteneur, il décrémente le TTL → **0 → « ICMP time exceeded » → paquet détruit**. Conséquence : **aucun conteneur ne peut atteindre Internet**.

Ce comportement est typique d'une politique **« anti-partage »** (empêcher un client de router / partager sa connexion). **Aucune action UFW/Docker/`ip_forward` ne pouvait corriger cela** : le paquet mourait *après* un routage et un NAT pourtant corrects.

---

## 5. Processus de résolution

**Correctif appliqué** — normaliser le TTL à l'entrée sur l'interface WAN :

```bash
sudo iptables -t mangle -A PREROUTING -i eth0 -j TTL --ttl-set 64
```

**Vérification :**

```bash
docker run --rm curlimages/curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 15 https://github.com
# -> HTTP 200 ✅
```

**Persistance :** installation de `iptables-persistent` (`netfilter-persistent`) pour survivre aux reboots.

⚠️ **Effet de bord :** cette installation a **désinstallé `ufw`** (conflit de paquets). Sans gravité fonctionnelle — les règles restent actives dans le noyau et le conflit ufw↔Docker disparaît — **mais** l'état doit être sauvegardé, sinon il est perdu au redémarrage.

---

## 6. Ce qui reste à faire

### 🔴 P0 — Sécuriser la durabilité (avant tout reboot)
- [ ] **Sauvegarder l'état courant** : `sudo netfilter-persistent save`
- [ ] **Vérifier** que `rules.v4` contient la règle `--ttl-set 64`, la politique/`INPUT` + autorisation SSH, et que `netfilter-persistent` est *enabled*
- [ ] **Contrôler les tables legacy** (`sudo iptables-legacy-save`) → doivent être quasi vides (pas de double pare-feu)

### 🔴 P0 — Prouver le « pour de bon »
- [ ] **Redémarrer** `srvapp` puis re-tester le `HTTP 200` côté conteneur → valide la restitution au boot

### 🟠 P1 — Débloquer le projet (objectif initial)
- [ ] **Relancer le déploiement Dokploy** (le clone GitHub doit désormais aboutir)
- [ ] Confirmer que la prod tourne sur un build ≥ `05b9f07`

### 🟡 P2 — Cause amont (hors serveur)
- [ ] Identifier le routeur (`ip neigh show 192.168.83.1`) et **lever l'anti-partage** (menu routeur, **mode bridge**, ou demande au FAI)
- [ ] *(Le correctif TTL côté serveur neutralise l'urgence, mais ne corrige pas la cause amont.)*

### 🟡 P2 — Hygiène d'architecture
- [ ] **Acter le modèle pare-feu** : rester sur `iptables` + `netfilter-persistent` (recommandé — supprime le conflit ufw↔Docker), **ou** réinstaller `ufw` proprement
- [ ] **Unifier le backend** iptables (`legacy` vs `nft` coexistent → avertissement permanent)
- [ ] Vérifier que les routes Docker (`docker0`) se recréent correctement après reboot

### 🟢 P3 — Suivi du bug « rôles / permissions »
- [ ] Correctif **déjà présent** dans `V-PROD` (commit `05b9f07`, 03/10) → **aucun code à écrire**
- [ ] Vérifier l'affichage des cases sur la prod **après** redéploiement (le bug vient d'un build obsolète)

---

## 7. Leçons / prévention

1. **Séparer diagnostic hôte vs conteneur** dès le départ : ici, « l'hôte fonctionne / pas le conteneur » orientait immédiatement vers le **routage**, pas le pare-feu.
2. **Toujours confirmer au niveau paquet** (`tcpdump -v`) avant de modifier des règles : on a perdu du temps sur des fausses pistes nft/UFW.
3. **Ne jamais mélanger deux gestionnaires de pare-feu** (ufw + iptables-persistent) : risque de perte de règles au reboot.
4. **Documenter le TTL amont** : toute action de « durcissement réseau » côté opérateur casse silencieusement le routage et doit être tracée.

---

## Annexe — commandes clés utilisées

| Commande | Objet |
|---|---|
| `tcpdump -vni eth0 icmp` | Capturer les paquets et lire le TTL réel |
| `conntrack -L -p icmp` | Vérifier le NAT / suivi de connexion |
| `ip route get <ip>` | Vérifier la route vers une destination |
| `ip -d link show docker0` | État détaillé du pont Docker |
| `iptables -t mangle -S` | Vérifier l'absence de réécriture TTL locale |
| `iptables-legacy-save` | Vérifier un éventuel double pare-feu |
| `netfilter-persistent save` | Figer les règles iptables pour le boot |
