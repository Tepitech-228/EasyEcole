import { DatabaseConnection } from "../helpers/DatabaseConnection"

if (process.env.ALLOW_DEV_SCRIPTS !== 'true') {
    console.error('Ce script de développement est désactivé en production.');
    process.exit(1);
}

async function main() {
    const db = DatabaseConnection.getInstance().sequelize
    const [u]: any = await db.query("SHOW COLUMNS FROM `aut_utilisateurs`")
    console.log("USER:", (u as any[]).map(x => x.Field + ":" + x.Type + (x.Null === "NO" && !x.Extra.includes("auto") && x.Default === null ? " NOT_NULL" : "")).join(" | "))
    // etat du role
    const [roles]: any = await db.query("SELECT DISTINCT role FROM `aut_utilisateurs`")
    console.log("ROLES PRESENTS:", JSON.stringify((roles as any[]).map(r => r.role)))
    // hash existant pour connaitre le format
    const [h]: any = await db.query("SELECT id, email, motDePasse FROM `aut_utilisateurs` WHERE motDePasse IS NOT NULL LIMIT 1")
    console.log("HASH EXEMPLE:", JSON.stringify(h[0]))
    process.exit(0)
}
main().catch(e => { console.error(e.message); process.exit(1) })
