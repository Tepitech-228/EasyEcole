import 'dotenv/config'
import express from 'express'
import http from 'http'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../../core/config/jwt'
import { DatabaseConnection } from '../../core/helpers/DatabaseConnection'
import { Utilisateur } from '../../modules/auth/models/Utilisateur'
import InscriptionRoutes from '../../modules/inscription/InscriptionRoutes'

/**
 * Helper de tests d'intégration : monte un mini-serveur Express qui n'enregistre
 * QUE les routes d'inscription concernées (parcours / documents requis par niveau),
 * avec le VRAI middleware d'authentification et la VRAIE base de données (MariaDB
 * locale configurée par le .env via DatabaseConnection).
 *
 * Ce montage volontairement « léger » (contrairement à src/app.ts qui boot socket.io,
 * Cinetpay, RedisCache, cron… ) isole la chaîne réelle :
 *   HTTP → Authenticate (JWT + utilisateur réel en base) → controller → Sequelize → SQL
 */
export interface IntegrationServer {
  baseUrl: string
  token: string
  close: () => Promise<void>
}

/** Construit un token JWT valide pour un utilisateur existant en base. */
export async function buildValidToken(): Promise<string> {
  const utilisateur = await Utilisateur.findOne({ attributes: ['id', 'identifiant', 'email', 'role', 'tokenVersion'] })
  if (!utilisateur) {
    throw new Error('[integration] Aucun utilisateur en base — impossible de générer un token valide.')
  }
  const payload = {
    id: utilisateur.get('id'),
    identifiant: utilisateur.get('identifiant'),
    email: utilisateur.get('email'),
    role: utilisateur.get('role'),
    tokenVersion: utilisateur.get('tokenVersion'),
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

/** Démarre le serveur de test sur un port éphémère et retourne { baseUrl, token, close }. */
export async function startIntegrationServer(): Promise<IntegrationServer> {
  const app = express()
  app.use(express.json())
  // Même préfixe que l'application réelle.
  app.use('/api/v1/inscription', InscriptionRoutes)

  const db = DatabaseConnection.getInstance()
  await db.sequelize.authenticate()

  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  const token = await buildValidToken()

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    token,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
        // Sécurité : ferme aussi les connexions keep-alive en attente.
        server.closeAllConnections?.()
      }),
  }
}

/** Helper HTTP très léger (évite une dépendance supertest non installée). */
export async function getJSON(url: string, token: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          let body: any = data
          try {
            body = JSON.parse(data)
          } catch {
            /* non-JSON : on garde la chaîne brute */
          }
          resolve({ status: res.statusCode || 0, body })
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}
