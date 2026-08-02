import 'dotenv/config'
import './core/types/express'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import http from "http"
import https from "https"
import fs from "fs"
import path from "path"
import { Server as SocketIOServer } from "socket.io"
import swaggerUi from 'swagger-ui-express'
import router from "./routes"
import { swaggerSpec } from './core/swagger'
import { DatabaseConnection } from './core/helpers/DatabaseConnection'
import { IDGenerator } from './core/helpers/IDGenerator'
import { EmailSender } from './core/helpers/EmailSender'
import { MobileMoneyCinetpay } from './core/helpers/MobileMoneyCinetpay'
import { setupChatSocket } from './modules/elearning/socket/chatSocket'
import { PermissionSeed } from './modules/auth/seed/PermissionSeed'
import { RoleSeed } from './modules/auth/seed/RoleSeed'
import { RappelSalleCron } from './core/services/RappelSalleCron'
import { NotificationGedService } from './modules/ged/services/NotificationGedService'
import { seedComptabilite } from './modules/comptabilite/seed'
import { errorHandler } from './core/middlewares/ErrorHandler'

// Tests

// Email sender
// const emailSender = EmailSender.getInstance()
// emailSender.test();

// ID Generator
// const iDGenerator = IDGenerator.getInstance()
// console.log(iDGenerator.generateMotDePasseUtilisateur())

// Cinetpay
const mobileMoneyCinetpay = MobileMoneyCinetpay.getInstance()
mobileMoneyCinetpay.init()

const app = express()
const port: number = Number(process.env.PORT) || 3000
const hostname: string = process.argv[2] || 'localhost'
const SSL_KEY = process.env.SSL_KEY
const SSL_CERT = process.env.SSL_CERT

/** CORS Configuration */
const corsOrigin = process.env.CORS_ORIGIN
if (!corsOrigin) {
    throw new Error('CORS_ORIGIN is required. Set it in your .env file.')
}
var corsOptions = {
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition', 'Content-Type']
}

/** Security */
const helmetCspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete helmetCspDirectives['frame-ancestors'];
const frameOrigins = ["'self'", "http://localhost:4200"]
if (process.env.CORS_ORIGIN && !frameOrigins.includes(process.env.CORS_ORIGIN)) {
  frameOrigins.push(process.env.CORS_ORIGIN)
}
helmetCspDirectives['frame-ancestors'] = frameOrigins;
helmetCspDirectives['style-src'] = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];
helmetCspDirectives['font-src'] = ["'self'", "https://fonts.gstatic.com"];
helmetCspDirectives['img-src'] = ["'self'", "data:", "blob:"];
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: helmetCspDirectives,
    }
}))
app.use(cors(corsOptions))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' }
})
app.use(limiter)

app.use(morgan("dev"))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))

// Restricted static serving — only media subdirectories, NOT qr-codes or cartes
app.use('/media/photos/apprenants', express.static(path.resolve('public', 'auth', 'apprenants', 'photos')))
app.use('/media/photos/enseignants', express.static(path.resolve('public', 'auth', 'enseignants', 'photos')))
app.use('/media/profiles', express.static(path.resolve('public', 'auth', 'profiles')))

/** Swagger Documentation */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EasyEcole API Docs'
}))

const API_BASE_URL = "/api/v1"
app.use(API_BASE_URL, router)

app.use(errorHandler)

/** HTTPS setup (fallback HTTP if no SSL) */
let server: http.Server | https.Server
if (SSL_KEY && SSL_CERT && fs.existsSync(SSL_KEY) && fs.existsSync(SSL_CERT)) {
  server = https.createServer({
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
  }, app)
} else {
  server = http.createServer(app)
}

/** Socket.io setup */
const io = new SocketIOServer(server, {
    cors: { origin: corsOrigin }
})
setupChatSocket(io)

server.listen(port, hostname)
server.on("listening", async () => {
    const protocol = server instanceof https.Server ? 'https' : 'http'
    console.log(`Listening on ${protocol}://${hostname}:${port}`)

    // Database Connection initialisation
    const databaseConnection = DatabaseConnection.getInstance();
    await databaseConnection.init();

    // Seed permissions
    await PermissionSeed.init();

    // Seed roles
    await RoleSeed.init();

    // Start cron for room reminders
    RappelSalleCron.start();

    // Check DUA expirations on startup
    try {
        await NotificationGedService.verifierDUA();
    } catch (e) {
        console.error('DUA check error:', e);
    }

    // Seed comptabilite (comptes, journaux, frais parcours)
    try {
        await seedComptabilite();
    } catch (e) {
        console.error('Comptabilite seed error:', e);
    }

    // Mail notification
    // await EmailSender.getInstance().sendServerStartingMessage();
})
