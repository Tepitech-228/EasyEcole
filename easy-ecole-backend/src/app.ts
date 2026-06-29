import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import http from "http"
import https from "https"
import fs from "fs"
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

// Tests

// Email sender
// const emailSender = EmailSender.getInstance()
// emailSender.test();

// ID Generator
// const iDGenerator = IDGenerator.getInstance()
// console.log(iDGenerator.generateMotDePasseUtilisateur())

// Cinetpay
// const mobileMoneyCinetpay = MobileMoneyCinetpay.getInstance()
// mobileMoneyCinetpay.init()

const app = express()
const port: number = Number(process.env.PORT) || 3000
const hostname: string = process.argv[2] || 'localhost'
const SSL_KEY = process.env.SSL_KEY
const SSL_CERT = process.env.SSL_CERT

/** CORS Configuration */
var corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    exposedHeaders: ['Content-Disposition', 'Content-Type']
}

/** Security */
const helmetCspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete helmetCspDirectives['frame-ancestors'];
helmetCspDirectives['frame-ancestors'] = ["'self'", "http://localhost:4200"];
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: helmetCspDirectives,
    }
}))
app.use(cors(corsOptions))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' }
})
app.use(limiter)

app.use(morgan("dev"))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))
app.use(express.static('public'))

/** Swagger Documentation */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EasyEcole API Docs'
}))

const API_BASE_URL = "/api/v1"
app.use(API_BASE_URL, router)

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
    cors: { origin: process.env.CORS_ORIGIN || '*' }
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

    // Mail notification
    // await EmailSender.getInstance().sendServerStartingMessage();
})