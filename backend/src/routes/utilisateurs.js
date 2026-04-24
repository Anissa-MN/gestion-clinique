const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Toutes les routes nécessitent une auth
router.use(authMiddleware);

// GET /api/utilisateurs - Liste tous les utilisateurs (admin seulement)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.role, u.actif, u.created_at,
              m.specialite, m.telephone
       FROM utilisateurs u
       LEFT JOIN medecins m ON u.id = m.utilisateur_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/utilisateurs/medecins - Liste des médecins (accessible à tous)
router.get('/medecins', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, m.specialite, m.telephone
       FROM utilisateurs u
       LEFT JOIN medecins m ON u.id = m.utilisateur_id
       WHERE u.role = 'medecin' AND u.actif = TRUE
       ORDER BY u.nom, u.prenom`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/utilisateurs - Créer un utilisateur (admin seulement)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, specialite, telephone } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    const validRoles = ['admin', 'medecin', 'secretaire'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }

    // Vérifier email unique
    const [existing] = await db.execute('SELECT id FROM utilisateurs WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPwd = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await db.execute(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hashedPwd, role]
    );

    // Si médecin, créer entrée dans table medecins
    if (role === 'medecin') {
      await db.execute(
        'INSERT INTO medecins (utilisateur_id, specialite, telephone) VALUES (?, ?, ?)',
        [result.insertId, specialite || null, telephone || null]
      );
    }

    res.status(201).json({ message: 'Utilisateur créé avec succès.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/utilisateurs/:id - Modifier un utilisateur (admin seulement)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role, actif, specialite, telephone, mot_de_passe } = req.body;

    const [existing] = await db.execute('SELECT * FROM utilisateurs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    let updateFields = [];
    let values = [];

    if (nom) { updateFields.push('nom = ?'); values.push(nom); }
    if (prenom) { updateFields.push('prenom = ?'); values.push(prenom); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (role) { updateFields.push('role = ?'); values.push(role); }
    if (actif !== undefined) { updateFields.push('actif = ?'); values.push(actif); }
    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updateFields.push('mot_de_passe = ?');
      values.push(hashed);
    }

    if (updateFields.length > 0) {
      values.push(id);
      await db.execute(
        `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Mise à jour infos médecin
    if (role === 'medecin' || existing[0].role === 'medecin') {
      const [medExists] = await db.execute('SELECT id FROM medecins WHERE utilisateur_id = ?', [id]);
      if (medExists.length > 0) {
        await db.execute(
          'UPDATE medecins SET specialite = ?, telephone = ? WHERE utilisateur_id = ?',
          [specialite || null, telephone || null, id]
        );
      } else if (role === 'medecin') {
        await db.execute(
          'INSERT INTO medecins (utilisateur_id, specialite, telephone) VALUES (?, ?, ?)',
          [id, specialite || null, telephone || null]
        );
      }
    }

    res.json({ message: 'Utilisateur mis à jour avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/utilisateurs/:id - Désactiver un utilisateur (admin seulement)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await db.execute('UPDATE utilisateurs SET actif = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Utilisateur désactivé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;