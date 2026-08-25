import { DatabaseConnection } from "../helpers/DatabaseConnection"
async function main() {
    const db = DatabaseConnection.getInstance().sequelize
    // Comptes existants dans dev
    const [u]: any = await db.query("SELECT id, identifiant, email, role FROM `aut_utilisateurs` WHERE role IN ('admin','institution','secretaire','esa_compta','cabinet_comptable','enseignant') AND deletedAt IS NULL ORDER BY FIELD(role,'admin','institution','secretaire','esa_compta','cabinet_comptable','enseignant')")
    console.log("COMPTES EXISTANTS:")
    for (const x of u as any[]) console.log(" ", x.id, x.role.padEnd(25), x.email)
    // Tables annexes : existe-t-il des lignes liees ?
    for (const t of ["aut_institutions","aut_personnel_administratif","aut_enseignants","aut_caissiers_banque","aut_comite_orientations"]) {
        try {
            const [c]: any = await db.query("SELECT COUNT(*) AS n FROM `" + t + "`")
            console.log(t.padEnd(35), c[0].n, "lignes")
        } catch { console.log(t, "absent") }
    }
    process.exit(0)
}
main().catch(e => { console.error(e.message); process.exit(1) })
