// Chargement du fichier .env avant l'import de tout module du projet.
// Sans cela, sous Jest (qui ne lit pas src/app.ts), process.env.DB_HOST/DB_NAME
// et process.env.JWT_SECRET restent vides :
//   - DatabaseConnection.getInstance() lève "Database configuration not found"
//   - src/core/config/jwt.ts lève "JWT_SECRET is required"
// Note : dotenv n'écrase pas les variables déjà définies (ex: NODE_ENV fixé par Jest).
import 'dotenv/config'
