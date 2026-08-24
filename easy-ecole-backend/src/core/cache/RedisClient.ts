// @ts-ignore - ioredis est optionnel, installé via npm si besoin
import Redis from 'ioredis'

export class RedisClient {
  private static instance: RedisClient
  private client: Redis | null = null
  private enabled: boolean = false
  /** Anti-spam de logs : on ne signale la dégradation qu'une fois par clé de contexte. */
  private static derniersWarnings = new Map<string, number>()

  private constructor() { }

  /** Log throttlé (1 message / minute max par contexte) pour rendre les pannes cache visibles. */
  private signaler(contexte: string, err: unknown, grave: boolean = false): void {
    const dernier = RedisClient.derniersWarnings.get(contexte) || 0
    const maintenant = Date.now()
    if (maintenant - dernier < 60_000) return
    RedisClient.derniersWarnings.set(contexte, maintenant)
    const message = `[CACHE][${contexte}] ${err instanceof Error ? err.message : String(err)}`
    if (grave) console.error(message)
    else console.warn(message)
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  async init(): Promise<void> {
    const url = process.env.REDIS_URL
    if (!url) {
      console.log('Redis: non configuré (skip)')
      return
    }
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null
          return Math.min(times * 200, 2000)
        },
        lazyConnect: true
      })
      await this.client.connect()
      this.enabled = true
      console.log('Redis: connecté')
    } catch (err: any) {
      console.warn(`Redis: échec de connexion, cache désactivé (${err.message})`)
      this.enabled = false
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled) return null
    try {
      return await this.client!.get(key)
    } catch (err) {
      // Cache miss de secours : la requête reste valide, mais la panne doit être visible.
      this.signaler('get', err)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.enabled) return
    try {
      await this.client!.set(key, value, 'EX', ttlSeconds)
    } catch (err) {
      this.signaler('set', err)
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.enabled) return
    try {
      let cursor = '0'
      do {
        const result = await this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = result[0]
        const keys = result[1]
        if (keys.length > 0) {
          await this.client!.del(...keys)
        }
      } while (cursor !== '0')
    } catch (err) {
      // GRAVE : invalidation ratée = le cache peut servir des données obsolètes
      // après une écriture (incohérence lecture/écriture). À surveiller.
      this.signaler('delByPattern — risque de données obsolètes', err, true)
    }
  }
}
