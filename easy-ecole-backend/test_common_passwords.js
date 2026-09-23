const bcrypt = require('bcrypt');

const testHashes = [
  { id: 1, identifiant: 'tepitechbuild', hash: '$2b$12$9/xRQwEYUQ6y88neFl8LoOd0HNsrpRxY80hUIj1PEO/sRIC61a6pu' },
  { id: 2, identifiant: 'direction', hash: '$2b$12$e.SBD5MujrcM/rJ3614UvOG...' },
];

const passwords = [
  'tepitech', 'tepitech123', 'password', 'password123',
  'admin123', 'test123', '123456', 'qwerty',
  'Tepitech2024', 'test2024', 'easyecole', 'Easyecole123',
  'tepitechbuild', 'Tepitechbuild123', 'tgp2024',
  '1234', 'admin', 'root', 'tgp', 'ecole'
];

for (const user of testHashes) {
  console.log(`Testing password for ${user.identifiant}`);
  for (const pwd of passwords) {
    if (bcrypt.compareSync(pwd, user.hash)) {
      console.log(`FOUND! ${pwd}`);
      break;
    }
  }
}