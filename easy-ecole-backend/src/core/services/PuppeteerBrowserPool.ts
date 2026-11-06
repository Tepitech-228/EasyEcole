import fs from 'fs';
import os from 'os';
import path from 'path';

let browserPromise: Promise<any> | null = null;

/**
 * Chromium (Crashpad) a besoin d'un HOME et de répertoires XDG inscriptibles.
 * En conteneur, HOME peut pointer vers /root alors que le process tourne en
 * tant que `node` : Crashpad échoue alors avec « --database is required ».
 * On force donc les répertoires XDG vers un dossier temporaire inscriptible,
 * et on remplace HOME s'il n'est pas accessible en écriture.
 */
function resolveWritableDir(dir: string): string | undefined {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch {
    return undefined;
  }
}

function buildChromiumEnv(): NodeJS.ProcessEnv {
  const baseDir = path.join(os.tmpdir(), 'easyecole-chromium');
  let chromiumDir = baseDir;
  try {
    fs.mkdirSync(baseDir, { recursive: true });
  } catch {
    chromiumDir = os.tmpdir();
  }

  const home = [process.env.HOME, process.env.USERPROFILE, chromiumDir]
    .filter((dir): dir is string => Boolean(dir))
    .map(resolveWritableDir)
    .find((dir): dir is string => Boolean(dir)) ?? os.tmpdir();

  return {
    ...process.env,
    HOME: home,
    XDG_CONFIG_HOME: resolveWritableDir(process.env.XDG_CONFIG_HOME || '') || chromiumDir,
    XDG_CACHE_HOME: resolveWritableDir(process.env.XDG_CACHE_HOME || '') || chromiumDir,
  };
}

export async function getPuppeteerBrowser(): Promise<any> {
  if (!browserPromise) {
    browserPromise = import('puppeteer').then((module: any) => {
      const puppeteer = module.default ?? module;
      return puppeteer.launch({
        headless: true,
        env: buildChromiumEnv(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-crash-reporter',
          '--disable-breakpad',
        ],
      });
    }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}
