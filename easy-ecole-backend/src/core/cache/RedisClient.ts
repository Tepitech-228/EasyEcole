// @ts-ignore - ioredis est optionnel, installé via npm si besoin
import Redis from 'ioredis'

export class RedisClient {
  private static instance: RedisClient
  private client: Redis | null = null
  private enabled: boolean = false

  private constructor() { }

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
    } catch {
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.enabled) return
    try {
      await this.client!.set(key, value, 'EX', ttlSeconds)
    } catch { }
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
    } catch { }
  }
}
