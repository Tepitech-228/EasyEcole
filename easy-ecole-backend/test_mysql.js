const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'easyecole'
    });
    
    console.log('MySQL connected');
    
    const [rows] = await conn.execute(
      'SELECT id,email,identifiant,role,tokenVersion,status FROM aut_utilisateurs WHERE identifiant IN (?, ?) OR email LIKE ?',
      ['tepitechdev', 'tepitechbuild', '%tepitech%']
    );
    
    console.log('Tepitech users:');
    rows.forEach(r => console.log('  id=' + r.id + ' email=' + r.email + ' identifiant=' + r.identifiant + ' role=' + r.role + ' status=' + r.status));
    
    await conn.end();
  } catch(e) {
    console.error('DB Error:', e.message);
  }
})();