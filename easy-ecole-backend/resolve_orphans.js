const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'easyecole'
  });

  const relations = [
    { table: 'ins_chapitres_cours', col: 'coursId', refTable: 'ins_cours' },
    { table: 'ins_seances', col: 'coursId', refTable: 'ins_cours' },
    { table: 'ins_cours_participants', col: 'coursId', refTable: 'ins_cours' },
    { table: 'ins_presences_cours_participants', col: 'coursParticipantId', refTable: 'ins_cours_participants' },
    { table: 'ins_cahiers_de_texte', col: 'coursId', refTable: 'ins_cours' }
  ];

  for (const rel of relations) {
    try {
      const [result] = await conn.query(
        `DELETE t FROM ${rel.table} t 
         LEFT JOIN ${rel.refTable} r ON r.id = t.${rel.col} 
         WHERE r.id IS NULL AND t.${rel.col} IS NOT NULL`
      );
      console.log(`Deleted ${result.affectedRows} orphaned rows from ${rel.table} referencing ${rel.refTable}`);
    } catch (err) {
      console.log(`Table ${rel.table} cleanup failed: ${err.message}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
