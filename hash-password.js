// scripts/hash-password.js
// Usage : node scripts/hash-password.js MonMotDePasse
// Copie le résultat dans le INSERT du schema.sql

const bcrypt = require('bcrypt')

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.js <mot_de_passe>')
  process.exit(1)
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nHash bcrypt généré :')
  console.log(hash)
  console.log('\nCopiez ce hash dans le INSERT du schema.sql')
})