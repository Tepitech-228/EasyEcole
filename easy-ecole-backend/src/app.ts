import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import http from "http"
import router from "./routes"
import { DatabaseConnection } from './core/helpers/DatabaseConnection'
import { IDGenerator } from './core/helpers/IDGenerator'
import { EmailSender } from './core/helpers/EmailSender'
import { MobileMoneyCinetpay } from './core/helpers/MobileMoneyCinetpay'

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


/** CORS Configuration */
var corsOptions = {
    origin: '*',
    exposedHeaders: ['Content-Disposition', 'Content-Type']
}

// app.use(helmet())
app.use(cors(corsOptions))
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

const API_BASE_URL = "/api/v1"
app.use(API_BASE_URL, router)

/** HTTP Server setup */
const server = http.createServer(app)

server.listen(port, hostname)
server.on("listening", async () => {
    console.log(`Listening on http://${hostname}:${port}`)

    // Database Connection initialisation
    const databaseConnection = DatabaseConnection.getInstance();
    databaseConnection.init();

    // Mail notification
    // await EmailSender.getInstance().sendServerStartingMessage();
})