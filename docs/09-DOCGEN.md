# Gestion documentaire (DocGen)

## Pipeline de génération
```
Données réelles → TemplateEngine → HTML + QR code → Puppeteer → PDF → SHA-256 → Stockage + DB
```

## Processus
1. Configuration des types de documents
2. Création des templates HTML (avec variables `{{var}}`, `{{#each}}`, `{{#if}}`)
3. Génération des documents (relevés, attestations, diplômes, PV, décisions)
4. Signature (enseignant → direction)
5. Cachets électroniques
6. Workflows de validation
7. QR code anti-fraude (HMAC SHA-256)
8. Vérification publique `/verification/document/:matricule/:reference`

## Pages (9)
Types, Templates, Documents, Cachets, Workflows, Signatures, Signatures direction, Génération
