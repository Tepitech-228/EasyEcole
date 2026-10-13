# MinIO — PARTIE 1 : À faire sur le serveur Windows

> Cette partie ne concerne **que le Windows Server hôte**. À la fin, vous aurez un MinIO opérationnel exposant une API S3 (`:9000`) et une console (`:9001`), avec un bucket privé `easyecole-pdfs` et un utilisateur applicatif.
>
> La partie code (backend/front) est dans le fichier **`MINIO-2-CODE-APPLICATION.md`**.

---

## 0. Vue d'ensemble — tout est sur le même serveur physique

Un **seul serveur Windows Server** héberge à la fois **Hyper-V (les 2 VM)** et **MinIO (sur l'hôte Windows)** :

```
┌──────────────────────────────────────────────────────────────────┐
│  SERVEUR PHYSIQUE WINDOWS SERVER (hôte Hyper-V)                    │
│                                                                    │
│  HÔTE WINDOWS                                                      │
│    └── MinIO  (minio.exe sur l'hôte, PAS dans une VM)              │
│        API S3 :9000 / Console :9001                                │
│                                                                    │
│  Hyper-V                                                          │
│    ├── VM APP (Linux)  — Dokploy : backend, front, redis           │
│    └── VM DB  (Linux)  — MySQL standalone                          │
└──────────────────────────────────────────────────────────────────┘
```

| Élément | Où | Valeur |
|---|---|---|
| MinIO — binaire | Hôte Windows | `C:\MinIO\minio.exe` |
| MinIO — données | Hôte Windows | `D:\MinIO_Data` |
| MinIO — logs | Hôte Windows | `C:\MinIO\logs` |
| MinIO — API S3 | Hôte Windows | port `9000` |
| MinIO — Console admin | Hôte Windows | port `9001` |
| Bucket | MinIO | `easyecole-pdfs` |
| Identifiants applicatifs | MinIO | accessKey `easyecole-app` + secretKey (généré) |
| VM APP | Hyper-V | Dokploy, IP interne `10.10.10.10` |
| VM DB | Hyper-V | MySQL, IP interne `10.10.10.20` |

**Réseau de référence (à adapter).** MinIO et les 2 VM sont reliés par le **switch virtuel interne Hyper-V** `10.10.10.0/24` :

| Machine | Rôle | IP interne |
|---|---|---|
| Hôte Windows | MinIO (+ passerelle du switch interne) | `10.10.10.1` |
| VM APP | Dokploy / conteneurs | `10.10.10.10` |
| VM DB | MySQL | `10.10.10.20` |

Le backend (VM APP) joint donc MinIO à `http://10.10.10.1:9000/...`.

> ⚠️ Le code (conteneur Dokploy dans la VM APP) n'écrit **jamais** directement dans `D:\` de l'hôte : tout passe par l'API S3 de MinIO.
>
> ⚠️ **Tout repose sur un seul serveur physique** : MinIO, VM APP et VM DB partagent le même hôte. Une panne matérielle/disque coupe l'application entière. C'est acceptable pour démarrer, mais prévoyez une sauvegarde **externe** (cf. §10) et, à terme, une séparation physique ou une réplication.

---

## 1. Prérequis

- Droits **Administrateur** sur le Windows Server.
- Disque `D:\` avec espace suffisant (1 PDF ≈ 50–300 Ko).
- IP fixe sur le réseau interne (ex. `10.10.10.1`).
- Outils :
  - `minio.exe` : <https://dl.min.io/server/minio/release/windows-amd64/minio.exe>
  - Service Windows : **NSSM** <https://nssm.cc/download> (option A) ou **WinSW** <https://github.com/winsw/winsw/releases> (option B)
  - (Optionnel) client `mc.exe` : <https://dl.min.io/client/mc/release/windows-amd64/mc.exe>

---

## 2. Créer l'arborescence

Dans **PowerShell (Administrateur)** :

```powershell
New-Item -ItemType Directory -Path "C:\MinIO" -Force
New-Item -ItemType Directory -Path "D:\MinIO_Data" -Force
New-Item -ItemType Directory -Path "C:\MinIO\logs" -Force
```

---

## 3. Télécharger MinIO

```powershell
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" `
  -OutFile "C:\MinIO\minio.exe"
& "C:\MinIO\minio.exe" --version
```

---

## 4. Définir les identifiants root

Le mot de passe doit comporter **au moins 8 caractères**. Ces valeurs serviront d'`accessKey`/`secretKey` (au moins pour l'admin) côté code.

```powershell
[Environment]::SetEnvironmentVariable("MINIO_ROOT_USER", "easyecole", "Machine")
[Environment]::SetEnvironmentVariable("MINIO_ROOT_PASSWORD", "ChangezMoiMotDePasse2026!", "Machine")
```

---

## 5. Test manuel (avant de passer en service)

```powershell
$env:MINIO_ROOT_USER="easyecole"
$env:MINIO_ROOT_PASSWORD="ChangezMoiMotDePasse2026!"
& "C:\MinIO\minio.exe" server "D:\MinIO_Data" --console-address ":9001" --address ":9000"
```

Ouvrir <http://localhost:9001> et se connecter avec les identifiants. `Ctrl+C` pour arrêter.

---

## 6. Installer MinIO en service Windows

Le service garantit le redémarrage automatique au boot.

### 6.1 Option A — NSSM (recommandée)

```powershell
# Placer nssm.exe dans C:\MinIO\
& "C:\MinIO\nssm.exe" install MinIO "C:\MinIO\minio.exe"
& "C:\MinIO\nssm.exe" set MinIO AppParameters 'server "D:\MinIO_Data" --console-address ":9001" --address ":9000"'
& "C:\MinIO\nssm.exe" set MinIO AppDirectory "C:\MinIO"
& "C:\MinIO\nssm.exe" set MinIO AppEnvironmentExtra "MINIO_ROOT_USER=easyecole" "MINIO_ROOT_PASSWORD=ChangezMoiMotDePasse2026!"
& "C:\MinIO\nssm.exe" set MinIO AppStdout "C:\MinIO\logs\minio.log"
& "C:\MinIO\nssm.exe" set MinIO AppStderr "C:\MinIO\logs\minio.err.log"
& "C:\MinIO\nssm.exe" set MinIO Start SERVICE_AUTO_START
Start-Service MinIO
```

### 6.2 Option B — WinSW

Créer `C:\MinIO\minio-service.xml` :

```xml
<service>
  <id>MinIO</id>
  <name>MinIO Object Storage</name>
  <description>MinIO S3-compatible object storage pour EasyEcole</description>
  <executable>C:\MinIO\minio.exe</executable>
  <arguments>server "D:\MinIO_Data" --console-address ":9001" --address ":9000"</arguments>
  <workingdirectory>C:\MinIO</workingdirectory>
  <env name="MINIO_ROOT_USER" value="easyecole"/>
  <env name="MINIO_ROOT_PASSWORD" value="ChangezMoiMotDePasse2026!"/>
  <logmode>rotate</logmode>
  <onfailure action="restart" delay="10 sec"/>
  <startmode>Automatic</startmode>
</service>
```

Puis :

```powershell
Rename-Item "C:\MinIO\winsw.exe" "C:\MinIO\minio-service.exe"
& "C:\MinIO\minio-service.exe" install
& "C:\MinIO\minio-service.exe" start
```

### 6.3 Vérifier

```powershell
Get-Service MinIO
Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing
```

`/minio/health/live` doit répondre **HTTP 200**.

---

## 7. Pare-feu

```powershell
# API S3 : autorisée uniquement depuis la VM APP
New-NetFirewallRule -DisplayName "MinIO API 9000 (VM APP)" -Direction Inbound `
  -Protocol TCP -LocalPort 9000 -RemoteAddress 10.10.10.10 -Action Allow

# Console admin : uniquement depuis le réseau d'administration
New-NetFirewallRule -DisplayName "MinIO Console 9001 (admin)" -Direction Inbound `
  -Protocol TCP -LocalPort 9001 -RemoteAddress 10.10.10.0/24 -Action Allow
```

> Ne **jamais** exposer 9001 sur Internet. L'API 9000 doit rester interne.

Depuis la VM APP, tester :

```bash
curl -v http://10.10.10.1:9000/minio/health/live
```

---

## 8. Créer le bucket et l'utilisateur applicatif

### 8.1 Console (9001)

1. Se connecter à <http://10.10.10.1:9001>.
2. **Buckets → Create Bucket** → `easyecole-pdfs`.
3. **Identity → Users → Create User** :
   - Access Key : `easyecole-app`
   - Secret Key : *(généré, ≥ 8 caractères — **à noter**, il servira à la Partie 2)*
4. **Identity → Policies → Create Policy** (JSON) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::easyecole-pdfs",
        "arn:aws:s3:::easyecole-pdfs/*"
      ]
    }
  ]
}
```

5. Attacher la politique à l'utilisateur `easyecole-app`.

### 8.2 Alternative CLI `mc`

```powershell
& "C:\MinIO\mc.exe" alias set local http://10.10.10.1:9000 easyecole "ChangezMoiMotDePasse2026!"
& "C:\MinIO\mc.exe" mb local/easyecole-pdfs
& "C:\MinIO\mc.exe" anonymous set none local/easyecole-pdfs   # bucket privé
& "C:\MinIO\mc.exe" ls local
```

---

## 9. Exploitation courante

| Tâche | Commande |
|---|---|
| Redémarrer | `Restart-Service MinIO` |
| État | `Get-Service MinIO` |
| Logs | `Get-Content C:\MinIO\logs\minio.log -Tail 100` |
| Lister les objets | `mc ls --recursive local/easyecole-pdfs` |
| Espace utilisé | `mc du local/easyecole-pdfs` |

---

## 10. Sauvegarde et rétention

- **Sauvegarde** : `D:\MinIO_Data` est un système de fichiers classique → copie/VSS, ou miroir `mc` :

```powershell
& "C:\MinIO\mc.exe" mirror --overwrite local/easyecole-pdfs "E:\Backup\easyecole-pdfs"
```

- **Rétention** : *lifecycle rule* dans la console (ex. archiver/supprimer les pièces de l'année N-3).
- **HA** (optionnelle) : MinIO distribué multi-nœuds — à envisager seulement si le volume devient critique.

---

## 11. Dépannage (côté serveur)

| Symptôme | Cause probable | Solution |
|---|---|---|
| Service ne démarre pas | `D:\MinIO_Data` absent / droits | Recréer le dossier, vérifier le compte du service |
| `Connection refused` depuis VM APP | Port 9000 fermé / mauvaise IP | Vérifier la règle pare-feu + l'IP du serveur |
| `SignatureDoesNotMatch` | Horloge décalée | Synchroniser l'heure (NTP) |
| `AccessDenied` | Politique IAM insuffisante | Ajouter les actions au user `easyecole-app` |
| Console inaccessible | Règle 9001 / réseau | Vérifier la règle et le réseau admin |

---

## 12. Checklist serveur

- [ ] `minio.exe` installé dans `C:\MinIO`
- [ ] Données dans `D:\MinIO_Data`
- [ ] Identifiants root définis
- [ ] Service `MinIO` démarré, `StartType = Automatic`
- [ ] `/minio/health/live` = HTTP 200 depuis la VM APP
- [ ] Ports 9000 (restreint) et 9001 (admin) ouverts
- [ ] Bucket `easyecole-pdfs` créé et **privé**
- [ ] Utilisateur applicatif `easyecole-app` + politique créés
- [ ] Secret key applicatif **noté** pour la Partie 2
- [ ] Sauvegarde `mc mirror` planifiée
