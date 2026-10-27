# Diagnostic montage SMB Windows Server 2022 depuis Linux

Ton netplan est déjà fonctionnel. L'entrée outes sur ens192 n'est pas obligatoire pour un réseau directement connecté, mais ça ne bloque pas. Le plus probable, c'est un petit souci de connectivité SMB / pare-feu / partage.

On va aller droit au but, étape par étape.

## 1) Vérifier la connectivité réseau

Depuis ton serveur Linux, teste d'abord si tu vois bien ton Windows Server 2022.

`ash
ping -c 4 192.168.100.60
`

Si tu as des réponses, le câble/réseau entre les deux est OK.

## 2) Vérifier le port SMB (445)

C'est souvent le pare-feu Windows qui bloque encore à ce niveau.

`ash
nc -vz 192.168.100.60 445
`

Ou avec bash directement :

`ash
timeout 3 bash -c "</dev/tcp/192.168.100.60/445" && echo "OUVERT" || echo "FERME"
`

- Si OUVERT -> le port répond
- Si FERME ou TIMEOUT -> Windows bloque toujours

## 3) Tester l'accès au partage avec smbclient

C'est l'étape la plus importante. Si smbclient fonctionne, mount fonctionnera aussi.

### Lister les partages

`ash
smbclient -L //192.168.100.60 -U easyecole-svc
`

On te demandera le mot de passe du compte easyecole-svc. Si ça affiche bien EasyEcole dans la liste, c'est que l'authentification et le partage passent.

### Tester l'accès au dossier Documents

`smbclient //192.168.100.60/EasyEcole/Documents -U easyecole-svc
smb: \> ls
smb: \> exit
`

Ou directement en une commande :

`ash
smbclient //192.168.100.60/EasyEcole/Documents -U easyecole-svc -c "ls"
`

Si tu vois la liste des fichiers/dossiers qui se trouvent déjà dans D:\EasyEcole\Documents\, tout est bon côté Windows.

## 4) Monter le partage une fois que smbclient fonctionne

Si les tests 2 et 3 sont OK, on peut monter proprement.

Crée les points de montage :

`ash
sudo mkdir -p /data/documents /data/backups
`

Crée ton fichier d'identifiants :

`ash
sudo mkdir -p /etc/samba
sudo nano /etc/samba/creds-easyecole
`

Contenu :

`	ext
username=easyecole-svc
password=TON_MOT_DE_PASSE
`

Sécurise-le :

`ash
sudo chmod 600 /etc/samba/creds-easyecole
sudo chown root:root /etc/samba/creds-easyecole
`

Ouvre /etc/fstab :

`ash
sudo nano /etc/fstab
`

Ajoute ces deux lignes :

`	ext
//192.168.100.60/EasyEcole/Documents   /data/documents   cifs   credentials=/etc/samba/creds-easyecole,uid=1000,gid=1000,vers=3.1.1,cache=loose,rw,_netdev,nofail,x-systemd.automount 0 0
//192.168.100.60/EasyEcole/Sauvegardes /data/backups     cifs   credentials=/etc/samba/creds-easyecole,uid=1000,gid=1000,vers=3.1.1,cache=loose,rw,_netdev,nofail,x-systemd.automount 0 0
`

Monter :

`ash
sudo mount -a
df -h | grep EasyEcole
`

## 5) Petites corrections à vérifier côté Windows

Puisque tu as déjà autorisé 192.168.100.10 dans le pare-feu, vérifie ces 2 petites choses :

- **Partage avancé** : Assure-toi que sur D:\EasyEcole le partage est bien activé avec easyecole-svc en Contrôle total
- **NTFS** : Sur D:\EasyEcole\Documents\ et D:\EasyEcole\Sauvegardes\, le compte easyecole-svc doit avoir les droits Lecture/Écriture
- **Profil réseau Windows** : Si ton interface réseau 192.168.100.0/24 est en Réseau public, le pare-feu est plus strict. Idéalement il doit être en Réseau privé sur ce lien entre tes serveurs

## 6) Astuce sur ton netplan

Ton netplan actuel est correct tel qu'il est. La route ia: 0.0.0.0 scope: link n'est effectivement pas nécessaire pour un réseau directement connecté, mais elle ne bloque rien.

Si vraiment tu veux le rendre encore plus clair, voici la version la plus fluide :

`yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens160:
      dhcp4: false
      addresses:
        - 192.168.85.50/24
      gateway4: 192.168.85.1
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
    ens192:
      dhcp4: false
      addresses:
        - 192.168.100.10/24
`

Teste sans toucher ça pour l'instant. Lance directement les tests du point 1-3. C'est ça qui va t'indiquer la vraie raison.
