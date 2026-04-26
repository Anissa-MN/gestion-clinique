const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.get('/', (req, res) => {
  res.json({
    jwt_secret_present: !!process.env.JWT_SECRET,
    db_host: process.env.DB_HOST || null,
    db_port: process.env.DB_PORT || null,
    db_name: process.env.DB_NAME || null,
    db_ssl: process.env.DB_SSL === 'true'
  });
});

// POST /api/debug/reset-password
// Body: { token, email, newPassword }
// Requires ADMIN_RESET_TOKEN to be set in environment for safety.
router.post('/reset-password', async (req, res) => {
  try {
    if (!process.env.ADMIN_RESET_TOKEN) {
      return res.status(403).json({ message: 'Password reset disabled (no ADMIN_RESET_TOKEN set).' });
    }
    const { token, email, newPassword } = req.body || {};
    if (!token || token !== process.env.ADMIN_RESET_TOKEN) {
      return res.status(403).json({ message: 'Invalid token.' });
    }
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'email and newPassword required.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute('UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?', [hash, email]);
    return res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Reset password error:', err.stack || err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
