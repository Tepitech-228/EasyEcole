type CacheEntry = { value: string; expiresAt: number }

const memoryCache = new Map<string, CacheEntry>()


async function tryGetRedisJson<T>(key: string): Promise<T | null> {
  // Fallback: Redis peut manquer (ioredis non installé) ou être désactivé.
  try {
    // Lazy require pour éviter le crash au chargement du module.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RedisClient } = require('../../../core/cache/RedisClient')
    const redis = RedisClient.getInstance()
    const cached: string | null = await redis.get(key)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch {
    return null
  }
}

async function trySetRedisJson(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RedisClient } = require('../../../core/cache/RedisClient')
    const redis = RedisClient.getInstance()
    await redis.set(key, value, ttlSeconds)
  } catch {
    // ignore
  }
}

export async function cacheJson<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now()

  const mem = memoryCache.get(key)
  if (mem && mem.expiresAt > now) {
    return JSON.parse(mem.value) as T
  }

  const redisValue = await tryGetRedisJson<T>(key)
  if (redisValue !== null) return redisValue

  const value = await compute()
  const serialized = JSON.stringify(value)

  memoryCache.set(key, { value: serialized, expiresAt: now + ttlSeconds * 1000 })
  await trySetRedisJson(key, serialized, ttlSeconds)

  return value
}





