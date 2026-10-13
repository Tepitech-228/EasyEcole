# MinIO — PARTIE 2 : À faire ici (code de l'application)

> Cette partie concerne **le code du dépôt `D:\EasyEcole`** (backend `easy-ecole-backend`, un peu `easy-ecole-web`). Elle suppose que la **Partie 1** est terminée : MinIO tourne sur le Windows Server, le bucket `easyecole-pdfs` et l'utilisateur applicatif existent.
>
> Prérequis à récupérer de la Partie 1 : `ENDPOINT` (`http://10.10.10.1:9000`), `accessKey` (`easyecole-app`), `secretKey`.

---

## 1. Dépendances

Dans `easy-ecole-backend` :

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 2. Variables d'environnement

À mettre dans le `.env` local **et** dans les variables du service sur **Dokploy** (VM APP) :

```dotenv
S3_ENDPOINT=http://10.10.10.1:9000
S3_ACCESS_KEY=easyecole-app
S3_SECRET_KEY=xxxxxxxxxxxxxxxx
S3_BUCKET=easyecole-pdfs
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=            # vide = URLs présignées ; sinon http://10.10.10.1:9000/easyecole-pdfs
```

---

## 3. Créer le service de stockage

Fichier : `easy-ecole-backend/src/core/services/S3StorageService.ts`

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET || "easyecole-pdfs";

export class S3StorageService {
  /** Envoie un fichier (Buffer) et renvoie la clé objet. */
  static async upload(key: string, body: Buffer, contentType = "application/pdf"): Promise<string> {
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return key;
  }

  /** Télécharge l'objet en Buffer. */
  static async download(key: string): Promise<Buffer> {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as any) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  /** URL présignée temporaire (lecture). */
  static async presignedUrl(key: string, expiresSec = 3600): Promise<string> {
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: expiresSec },
    );
  }

  /** Vérifie la présence d'un objet. */
  static async exists(key: string): Promise<boolean> {
    try {
      await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  static async remove(key: string): Promise<void> {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  }
}
```

> Le `S3Client` devrait idéalement être instancié **une seule fois** (module singleton) ; exportez `client` si besoin ailleurs.

---

## 4. Convention de clé objet

On reprend l'arborescence actuelle produite par `DossierStorageService` (`public/dossiers/{annee}/{parcours}/{classe}/{niveau}/{matricule}/{sousDossier}/fichier.pdf`), mais comme **clé S3** (sans préfixe `public/`) :

```
dossiers/{annee}/{parcours}/{classe}/{niveau}/{matricule}/{sousDossier}/{fichier}.pdf
```

Sous-dossiers (identiques à `SOUS_DOSSIERS` de `DossierStorageService.ts`) :
`autorisations`, `bordereaux`, `bulletins`, `cartes`, `diplomes`, `dossiers`, `paiements`, `pv`.

En base, on stocke la **clé S3** (là où était stocké l'ancien chemin relatif `public/dossiers/...`).

### Adaptation de `DossierStorageService`

Le rôle de `DossierStorageService.getChemin(...)` devient : construire la **clé objet** (au lieu d'un chemin disque absolu). Retirer les usages `fs.*` (`creerDossier`, `mkdirSync`, `renameSync`, `copyFileSync`, `existsSync`) au profit des appels `S3StorageService`.

---

## 5. Points d'intégration à migrer

Remplacer `fs.writeFileSync(...)` / `fs.renameSync(...)` par `S3StorageService.upload(...)` dans :

| Fichier | Objet produit |
|---|---|
| `src/modules/inscription/services/GenerateurCarteService.ts` | Cartes étudiant (PDF) |
| `src/modules/inscription/services/GenerateurEcheancierService.ts` | Échéanciers de scolarité |
| `src/modules/inscription/services/GenerateurEcheancierScolariteService.ts` | Échéanciers scolarité |
| `src/modules/inscription/services/GenerateurEcheancierSessionService.ts` | Échéanciers de session |
| `src/modules/inscription/services/VerificationPaiementService.ts` | Quitus / reçus de paiement |
| `src/modules/inscription/services/DossierStorageService.ts` | Déplacement/copie des pièces |

Règle : `getChemin(...)` → clé objet ; `fs.*` → `S3StorageService.*`.

---

## 6. Diffusion des PDF au front

Deux options :

- **URL présignée (recommandée)** : le contrôleur renvoie `await S3StorageService.presignedUrl(key, 3600)`. Le front ouvre un lien valable 1 h ; le bucket reste **privé**.
- **Téléchargement via le backend** : endpoint qui fait `res.setHeader("Content-Type","application/pdf")` puis `res.send(await S3StorageService.download(key))`. Plus sûr mais consomme la bande passante du backend.

Côté `easy-ecole-web` : si l'affichage du PDF passait par un chemin statique (`/public/dossiers/...`), le remplacer par l'appel d'endpoint qui renvoie l'URL présignée.

---

## 7. Tests

### 7.1 Script jetable Node (hors app)

`test-minio.cjs` :

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const client = new S3Client({
  endpoint: "http://10.10.10.1:9000",
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: "easyecole-app", secretAccessKey: "xxxxxxxxxxxxxxxx" },
});
(async () => {
  await client.send(new PutObjectCommand({
    Bucket: "easyecole-pdfs", Key: "test/hello.txt",
    Body: Buffer.from("hello minio"), ContentType: "text/plain",
  }));
  const r = await client.send(new GetObjectCommand({ Bucket: "easyecole-pdfs", Key: "test/hello.txt" }));
  console.log(String(await r.Body.transformToString()));
})();
```

```powershell
node test-minio.cjs
```

### 7.2 Test applicatif

1. Générer une carte étudiant ou un échéancier.
2. Vérifier l'objet dans la console MinIO (`Buckets → easyecole-pdfs`) sous `dossiers/...`.
3. Ouvrir le PDF depuis le front.
4. Vérifier la clé stockée en base de données.

### 7.3 Compilation et lint

```bash
npx tsc --noEmit
```

---

## 8. Checklist code

- [ ] `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` installés
- [ ] Variables `S3_*` définies (local + Dokploy)
- [ ] `S3StorageService.ts` créé
- [ ] `DossierStorageService` adapté (clé objet, plus de `fs.*`)
- [ ] Générateurs PDF migrés vers `S3StorageService.upload`
- [ ] Endpoint d'affichage (URL présignée / téléchargement) en place
- [ ] Front adapté (plus de chemin statique `/public/dossiers/...`)
- [ ] Un PDF réel généré est présent dans le bucket
- [ ] Le PDF s'ouvre depuis le front
- [ ] Plus aucune écriture dans `public/dossiers/` du conteneur
- [ ] `npx tsc --noEmit` OK
