const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    jwt_secret_present: !!process.env.JWT_SECRET,
    db_host: process.env.DB_HOST || null,
    db_port: process.env.DB_PORT || null,
    db_name: process.env.DB_NAME || null,
    db_ssl: process.env.DB_SSL === 'true'
  });
});

module.exports = router;
