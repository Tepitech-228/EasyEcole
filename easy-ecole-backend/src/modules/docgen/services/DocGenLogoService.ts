import path from 'path';
import fs from 'fs';

const LOGO_CANDIDATES = [
  path.resolve(process.cwd(), '..', 'easy-ecole-web', 'src', 'assets', 'images', 'logo-esa.png'),
  path.resolve(process.cwd(), '..', 'easy-ecole-web', 'assets', 'images', 'logo-esa.png'),
  path.resolve(process.cwd(), 'public', 'logo-esa.png'),
];

export class DocGenLogoService {
  static getLogoDataUri(): string {
    for (const candidate of LOGO_CANDIDATES) {
      try {
        if (fs.existsSync(candidate)) {
          const ext = path.extname(candidate).toLowerCase();
          const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
          const base64 = fs.readFileSync(candidate).toString('base64');
          return `data:${mime};base64,${base64}`;
        }
      } catch (e) {
        console.warn('  [docgen] Impossible de lire le logo:', e);
      }
    }
    return '';
  }

  static injectLogo(contenu: string): string {
    const dataUri = DocGenLogoService.getLogoDataUri();
    if (dataUri) {
      return contenu.split('{{LOGO_DATA_URI}}').join(dataUri);
    }
    return contenu.split('{{LOGO_DATA_URI}}').join('');
  }
}
