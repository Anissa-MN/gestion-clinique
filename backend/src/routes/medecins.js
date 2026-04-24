const express = require('express')
const bcrypt = require('bcrypt')
const pool = require('../db')
const { authMiddleware, requireRole } = require('../middleware/auth')
const router = express.Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.id, m.user_id AS userId, u.first_name AS firstName, u.last_name AS lastName, u.email, m.specialite, m.telephone
      FROM medecins m JOIN users u ON u.id = m.user_id ORDER BY u.last_name
    `)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la recuperation des medecins.', error: error.message })
  }
})

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { firstName, lastName, email, password, specialite, telephone = null } = req.body ?? {}
  if (!firstName || !lastName || !email || !password || !specialite) {
    return res.status(400).json({ message: 'firstName, lastName, email, password et specialite sont obligatoires.' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
    if (existing.length > 0) {
      await conn.rollback()
      return res.status(409).json({ message: 'Cet email existe deja.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'MEDECIN')`,
      [firstName, lastName, email, passwordHash]
    )

    const [medecinResult] = await conn.query(
      'INSERT INTO medecins (user_id, specialite, telephone) VALUES (?, ?, ?)',
      [userResult.insertId, specialite, telephone]
    )

    await conn.commit()
    return res.status(201).json({ id: medecinResult.insertId, message: 'Medecin cree avec succes.' })
  } catch (error) {
    await conn.rollback()
    return res.status(500).json({ message: 'Erreur lors de la creation du medecin.', error: error.message })
  } finally {
    conn.release()
  }
})

router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params
  const { firstName, lastName, email, specialite, telephone = null, password = '' } = req.body ?? {}
  if (!firstName || !lastName || !email || !specialite) {
    return res.status(400).json({ message: 'firstName, lastName, email et specialite sont obligatoires.' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [rows] = await conn.query('SELECT user_id AS userId FROM medecins WHERE id = ? LIMIT 1', [id])
    if (rows.length === 0) {
      await conn.rollback()
      return res.status(404).json({ message: 'Medecin introuvable.' })
    }
    const userId = rows[0].userId

    const [emailRows] = await conn.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, userId])
    if (emailRows.length > 0) {
      await conn.rollback()
      return res.status(409).json({ message: 'Cet email est deja utilise.' })
    }

    await conn.query('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?', [firstName, lastName, email, userId])
    await conn.query('UPDATE medecins SET specialite = ?, telephone = ? WHERE id = ?', [specialite, telephone, id])

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId])
    }

    await conn.commit()
    return res.json({ message: 'Medecin mis a jour avec succes.' })
  } catch (error) {
    await conn.rollback()
    return res.status(500).json({ message: 'Erreur lors de la mise a jour du medecin.', error: error.message })
  } finally {
    conn.release()
  }
})

router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [rows] = await conn.query('SELECT user_id AS userId FROM medecins WHERE id = ? LIMIT 1', [id])
    if (rows.length === 0) {
      await conn.rollback()
      return res.status(404).json({ message: 'Medecin introuvable.' })
    }

    const userId = rows[0].userId
    await conn.query('DELETE FROM medecins WHERE id = ?', [id])
    await conn.query('DELETE FROM users WHERE id = ?', [userId])

    await conn.commit()
    return res.json({ message: 'Medecin supprime avec succes.' })
  } catch (error) {
    await conn.rollback()
    return res.status(500).json({ message: 'Erreur lors de la suppression du medecin.', error: error.message })
  } finally {
    conn.release()
  }
})

module.exports = router