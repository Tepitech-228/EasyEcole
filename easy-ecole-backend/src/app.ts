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
import { RappelEcheanceCron } from './core/services/RappelEcheanceCron'
import { NotificationGedService } from './modules/ged/services/NotificationGedService'
import { seedComptabilite } from './modules/comptabilite/seed'
import { seedParametresFrais } from './modules/comptabilite/seed-parametres-frais'
import { errorHandler } from './core/middlewares/ErrorHandler'

// ── Dernière barrière de diagnostic (cf. audit erreurs silencieuses §28) ──
// Ces handlers ne remplacent PAS la gestion locale des erreurs : ils garantissent
// qu'aucune erreur échappée reste invisible. Journalisation systématique + contexte.
process.on('unhandledRejection', (reason: any) => {
    console.error('[UNHANDLED_REJECTION]', new Date().toISOString(), 'raison:', reason instanceof Error ? `${reason.message}\n${reason.stack}` : reason);
});
process.on('uncaughtException', (err: Error) => {
    console.error('[UNCAUGHT_EXCEPTION]', new Date().toISOString(), `${err.message}\n${err.stack}`);
});

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

// Derrière un reverse proxy (nginx…), indispensable pour que express-rate-limit
// identifie les clients réels via X-Forwarded-For (sinon ERR_ERL_UNEXPECTED_X_FORWARDED_FOR :
// tout le trafic apparaîtrait comme venant de l'IP du proxy).
// NB: valeur 1 = on fait confiance à UN seul saut de proxy ; ajuster si chaîne de proxies.
app.set('trust proxy', 1)

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
app.use('/media/videos', express.static(path.resolve('public', 'elearning', 'videos')))
app.use('/media/scolarite/documents', express.static(path.resolve('public', 'scolarite', 'documents')))
app.use('/media/inscription/bordereaux', express.static(path.resolve('public', 'inscription', 'bordereaux')))

app.get('/logo-esa.png', (req, res) => {
  const filePath = path.resolve('public', 'logo-esa.png')
  res.sendFile(filePath)
})

/** Swagger Documentation */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar {
      background: #002147 !important;
      border-bottom: 3px solid #FFD100 !important;
    }
    .swagger-ui .topbar .link {
      content: url('/logo-esa.png') !important;
      width: 140px !important;
      height: auto !important;
      display: block !important;
      margin: 8px auto !important;
    }
    .swagger-ui .info .title {
      color: #002147 !important;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      font-weight: 700 !important;
      font-size: 24px !important;
      text-align: center !important;
      margin-bottom: 8px !important;
    }
    .swagger-ui .info {
      background: linear-gradient(135deg, rgba(0,33,71,0.03) 0%, rgba(255,209,0,0.03) 50%, rgba(0,150,64,0.03) 100%) !important;
      border-left: 4px solid #002147 !important;
      border-radius: 0 6px 6px 0 !important;
    }
    .swagger-ui .info .description {
      color: #333 !important;
      font-size: 13px !important;
    }
    .swagger-ui .info .base-url {
      color: #002147 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .opblock-tag {
      color: #002147 !important;
      border-bottom: 2px solid #FFD100 !important;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      font-weight: 600 !important;
      font-size: 16px !important;
    }
    .swagger-ui .opblock {
      border-radius: 4px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
      border: 1px solid #e6e6e6 !important;
    }
    .swagger-ui .opblock.opblock-get {
      border-top: 3px solid #009640 !important;
    }
    .swagger-ui .opblock.opblock-post {
      border-top: 3px solid #FFD100 !important;
    }
    .swagger-ui .opblock.opblock-put {
      border-top: 3px solid #ff9800 !important;
    }
    .swagger-ui .opblock.opblock-delete {
      border-top: 3px solid #e53935 !important;
    }
    .swagger-ui .opblock.opblock-patch {
      border-top: 3px solid #9c27b0 !important;
    }
    .swagger-ui .btn.authorize {
      background-color: #002147 !important;
      border-color: #002147 !important;
      color: #fff !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      padding: 6px 16px !important;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #003366 !important;
    }
    .swagger-ui .scheme-container {
      background: #f8f9fa !important;
      border-bottom: 1px solid #e6e6e6 !important;
      padding: 12px 0 !important;
    }
    .swagger-ui .scheme-container .schemes {
      display: flex !important;
      gap: 10px !important;
    }
    .swagger-ui .model-title {
      color: #002147 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .model {
      background: #fafafa !important;
      border: 1px solid #e6e6e6 !important;
      border-radius: 4px !important;
    }
    .swagger-ui .model-box {
      background: #ffffff !important;
    }
    .swagger-ui table thead tr {
      background-color: #002147 !important;
      color: #ffffff !important;
    }
    .swagger-ui table thead tr th {
      color: #ffffff !important;
      font-weight: 600 !important;
    }
    .swagger-ui .response-col_status {
      color: #002147 !important;
      font-weight: 700 !important;
    }
    .swagger-ui .response-col_description .description {
      color: #333 !important;
    }
    .swagger-ui .tab li {
      color: #002147 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .tab li.active {
      border-bottom: 2px solid #FFD100 !important;
      color: #002147 !important;
    }
    .swagger-ui .opblock-summary {
      color: #002147 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .opblock-summary-description {
      color: #333 !important;
      font-size: 12px !important;
    }
    .swagger-ui .parameter__type {
      color: #009640 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .parameter__name {
      color: #002147 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .example {
      background: #f8f9fa !important;
      border: 1px solid #e6e6e6 !important;
      border-radius: 4px !important;
    }
    .swagger-ui .microlight {
      background: #f8f9fa !important;
      border-radius: 4px !important;
    }
    .swagger-ui .microlight code {
      color: #1a1a1a !important;
    }
    .swagger-ui .btn {
      border-radius: 4px !important;
      font-weight: 600 !important;
    }
    .swagger-ui .btn.try-out__btn {
      background: #002147 !important;
      color: #fff !important;
      border-color: #002147 !important;
    }
    .swagger-ui .btn.execute {
      background-color: #009640 !important;
      border-color: #009640 !important;
      color: #fff !important;
    }
    .swagger-ui .btn.execute:hover {
      background-color: #007a33 !important;
    }
    .swagger-ui .loading-container .loading {
      border-color: #FFD100 transparent transparent !important;
    }
    .swagger-ui a {
      color: #002147 !important;
    }
    .swagger-ui a:hover {
      color: #003366 !important;
    }
    .swagger-ui .opblock .opblock-summary {
      background: #fafafa !important;
      border-bottom: 1px solid #e6e6e6 !important;
    }
    .swagger-ui .opblock .opblock-summary:hover {
      background: #f0f4f8 !important;
    }
  `,
  customSiteTitle: 'ESA-TOGO API Documentation',
  customfavIcon: '/logo-esa.png'
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

    // Start cron for overdue échéance reminders
    RappelEcheanceCron.start();

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

    // Seed paramètres de frais (frais rattrapage, demande de document, comptes produits)
    try {
        await seedParametresFrais();
    } catch (e) {
        console.error('Parametres frais seed error:', e);
    }

    // Mail notification
    // await EmailSender.getInstance().sendServerStartingMessage();
})
