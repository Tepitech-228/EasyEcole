/**
 * Garde-fou de couverture OpenAPI.
 *
 * Compare les routes RÉELLEMENT montées dans l'application Express
 * (introspection récursive du router `src/routes.ts`) avec celles
 * documentées dans la spec swagger-jsdoc (`src/core/swagger.ts`).
 *
 * Usage:
 *   npx ts-node scripts/openapi-coverage.ts            # rapport + exit 1 si gap > seuil
 *   npx ts-node scripts/openapi-coverage.ts --json     # sortie JSON
 *   OPENAPI_MAX_MISSING=0 npx ts-node scripts/openapi-coverage.ts
 *
 * Ce script NE modifie rien : lecture seule.
 */
import 'dotenv/config'
import type { Router } from 'express'
import router from '../src/routes'
import { swaggerSpec } from '../src/core/swagger'

const METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const

interface RouteRef { method: string; path: string }

/** Convertit un chemin Express (`:id`) en template OpenAPI (`{id}`). */
function toSwaggerPath(p: string): string {
  return p
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\/+/g, '/')
    .replace(/(.+)\/$/, '$1') || '/'
}

function joinPath(prefix: string, p: string): string {
  if (!p) return prefix || '/'
  if (p === '/') return prefix || '/'
  const left = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  const right = p.startsWith('/') ? p : '/' + p
  return toSwaggerPath(left + right)
}

/** Extrait le préfixe de montage depuis `layer.regexp` (Express 4). */
function mountPathFromLayer(layer: any): string | null {
  const re = layer?.regexp
  if (!re) return null
  if (re.fast_slash) return ''
  let s: string = re.source
  // retire l'ancre de début et le lookahead de fin posés par Express
  s = s.replace(/^\^/, '')
  s = s.replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
  s = s.replace(/\\\//g, '/')
  s = s.replace(/\/$/, '')
  if (s === '' || s === '?') return ''
  // ignore les wildcards / non littéraux
  if (/[()*+?\[\]|]/.test(s)) return null
  return s
}

function walk(stack: any[], prefix: string, out: RouteRef[]): void {
  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route.path
      const paths: string[] = Array.isArray(path) ? path : [path]
      const methods = METHODS.filter((m) => layer.route.methods?.[m])
      for (const p of paths) {
        for (const m of methods) {
          out.push({ method: m, path: joinPath(prefix, p) })
        }
      }
      continue
    }
    // sous-router monté
    const handle = layer.handle
    if (handle?.stack && (layer.name === 'router' || typeof handle === 'function')) {
      const mount = mountPathFromLayer(layer)
      if (mount === null) continue
      walk(handle.stack, joinPath(prefix, mount), out)
    }
  }
}

function collectDocumented(): Set<string> {
  const set = new Set<string>()
  const paths = (swaggerSpec as any).paths || {}
  for (const [p, item] of Object.entries<any>(paths)) {
    for (const m of Object.keys(item)) {
      if (METHODS.includes(m as any)) {
        set.add(`${m.toUpperCase()} ${toSwaggerPath(p)}`)
      }
    }
  }
  return set
}

function main(): void {
  const mounted: RouteRef[] = []
  const rootStack = (router as unknown as Router & { stack: any[] }).stack
  walk(rootStack, '', mounted)

  const mountedSet = new Set(mounted.map((r) => `${r.method.toUpperCase()} ${r.path}`))
  const documented = collectDocumented()

  const missing = [...mountedSet].filter((k) => !documented.has(k)).sort()
  const phantom = [...documented].filter((k) => !mountedSet.has(k)).sort()

  const totalMounted = mountedSet.size
  const totalDoc = documented.size
  const covered = totalMounted - missing.length
  const pct = totalMounted ? Math.round((covered / totalMounted) * 100) : 100

  const asJson = process.argv.includes('--json')
  if (asJson) {
    console.log(JSON.stringify({
      totalMounted, totalDocumented: totalDoc, covered, coveragePct: pct,
      missingCount: missing.length, phantomCount: phantom.length,
      missing, phantom,
    }, null, 2))
    process.exit(0)
  }

  console.log('=== Couverture OpenAPI ===')
  console.log(`Routes montées           : ${totalMounted}`)
  console.log(`Opérations documentées   : ${totalDoc}`)
  console.log(`Couvertes                : ${covered} (${pct}%)`)
  console.log(`NON documentées (manque) : ${missing.length}`)
  console.log(`Paths fantômes (doc sans route) : ${phantom.length}`)

  if (missing.length) {
    console.log('\n--- Routes NON documentées ---')
    missing.forEach((k) => console.log('  ' + k))
  }
  if (phantom.length) {
    console.log('\n--- Paths documentés sans route correspondante (fantômes) ---')
    phantom.forEach((k) => console.log('  ' + k))
  }

  const maxMissing = Number(process.env.OPENAPI_MAX_MISSING ?? '-1')
  if (maxMissing >= 0 && missing.length > maxMissing) {
    console.error(`\n[GARDE-FOU] ${missing.length} routes non documentées > seuil ${maxMissing}`)
    process.exit(1)
  }
}

main()
