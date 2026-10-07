type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * Serialise `meta` pour le log.
 * JSON.stringify sur une Error renvoie '{}' (proprietes non enumerables) :
 * on restitue donc message + stack pour conserver la cause reelle.
 */
function serializeMeta(meta: any): string {
  if (meta instanceof Error) {
    const parts = [`${meta.name}: ${meta.message}`];
    const code = (meta as any).code;
    if (code) parts.push(`code=${code}`);
    if (meta.stack) parts.push(meta.stack);
    return parts.join(' | ');
  }
  if (typeof meta === 'object' && meta !== null) {
    const json = JSON.stringify(meta);
    // Objet sans propriete enumerable (ex: {} renvoye par un catch) : on tente un rendu lisible.
    return json === '{}' ? Object.prototype.toString.call(meta) + ' ' + String(meta) : json;
  }
  return String(meta);
}

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    return `${prefix} ${message} ${serializeMeta(meta)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, meta?: any) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message, meta));
  },
  info(message: string, meta?: any) {
    if (shouldLog('info')) console.info(formatMessage('info', message, meta));
  },
  warn(message: string, meta?: any) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta));
  },
  error(message: string, meta?: any) {
    if (shouldLog('error')) console.error(formatMessage('error', message, meta));
  }
};
