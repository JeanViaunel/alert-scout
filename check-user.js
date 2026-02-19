const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

const email = process.argv[2] || 'ppython2020@proton.me';

console.log('Checking user:', email);
console.log('DB Path:', DB_PATH);

const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email);

if (user) {
  console.log('\n✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Name:', user.name);
  console.log('  Password hash:', user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'MISSING');
  console.log('  Hash length:', user.password_hash?.length);
} else {
  console.log('\n❌ User not found');
  console.log('\nAll users in database:');
  const allUsers = db.prepare('SELECT email, name FROM users').all();
  allUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.name})`);
  });
}

db.close();
