import { Request, Response } from 'express'
import { RedisClient } from '../cache/RedisClient'

export function cache(ttlSeconds: number = 60) {
  return async (req: Request, res: Response, next: Function) => {
    const redis = RedisClient.getInstance()

    if (req.method === 'GET') {
      const userId = (req as any).utilisateurId || 'anonymous'
      const etablissementId = (req as any).etablissementId || 'global'
      const cacheKey = `cache:${userId}:${etablissementId}:${req.originalUrl}`

      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return res.json(JSON.parse(cached))
        }
      } catch (err) {
        // Entrée corrompue ou Redis injoignable : on sert la source de vérité,
        // mais l'anomalie doit rester traçable.
        console.warn(`[CACHE] lecture impossible pour ${cacheKey}:`, err instanceof Error ? err.message : err)
      }

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
    let invalidationStarted = false
    const invalidateCache = () => {
      if (invalidationStarted || res.statusCode < 200 || res.statusCode >= 300) return
      invalidationStarted = true
      const modulePrefix = `cache:*:${req.baseUrl}*`
      void redis.delByPattern(modulePrefix)
    }

    const originalJson = res.json.bind(res)
    res.json = function (body: any) {
      invalidateCache()
      return originalJson(body)
    }

    const originalSend = res.send.bind(res)
    res.send = function (body: any) {
      invalidateCache()
      return originalSend(body)
    }
    next()
  }
}
