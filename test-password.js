const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

const email = 'ppython2020@proton.me';
const password = '111111';

console.log('Testing password verification...\n');

const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email);

if (!user) {
  console.log('❌ User not found');
  process.exit(1);
}

console.log('User:', user.name);
console.log('Password to verify:', password);
console.log('Stored hash:', user.password_hash.substring(0, 30) + '...\n');

console.log('Running bcrypt.compare...');
bcrypt.compare(password, user.password_hash)
  .then(isValid => {
    console.log('\nResult:', isValid ? '✅ Password matches!' : '❌ Password does NOT match');
    process.exit(isValid ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
