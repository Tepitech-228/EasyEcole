import { Request, Response } from 'express'
import { RedisClient } from '../cache/RedisClient'

export function cache(ttlSeconds: number = 60) {
  return async (req: Request, res: Response, next: Function) => {
    const redis = RedisClient.getInstance()

    if (req.method === 'GET') {
      const userId = (req as any).utilisateurId || 'anonymous'
      const cacheKey = `cache:${userId}:${req.originalUrl}`

      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return res.json(JSON.parse(cached))
        }
      } catch { }

      const originalJson = res.json.bind(res)
      res.json = function (body: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(cacheKey, JSON.stringify(body), ttlSeconds)
        }
        return originalJson(body)
      }
      return next()
    }

    // POST / PUT / PATCH / DELETE → invalidate module cache on success
    const originalJson = res.json.bind(res)
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const modulePrefix = `cache:*:${req.baseUrl}*`
        redis.delByPattern(modulePrefix)
      }
      return originalJson(body)
    }
    next()
  }
}
