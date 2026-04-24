const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/patients - Liste des patients avec recherche
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM patients`;
    let countQuery = `SELECT COUNT(*) as total FROM patients`;
    let params = [];

    if (search) {
      const searchClause = ` WHERE nom LIKE ? OR prenom LIKE ? OR num_dossier LIKE ? OR telephone LIKE ?`;
      query += searchClause;
      countQuery += searchClause;
      const s = `%${search}%`;
      params = [s, s, s, s];
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await db.execute(query, [...params, parseInt(limit), parseInt(offset)]);
    const [countRows] = await db.execute(countQuery, params);

    res.json({
      patients: rows,
      total: countRows[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countRows[0].total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/patients/:id - Détail d'un patient
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/patients/:id/historique - Historique complet (rdv + consultations)
router.get('/:id/historique', async (req, res) => {
  try {
    const { id } = req.params;

    const [patient] = await db.execute('SELECT * FROM patients WHERE id = ?', [id]);
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }

    const [consultations] = await db.execute(
      `SELECT c.*, CONCAT(u.prenom, ' ', u.nom) as medecin_nom
       FROM consultations c
       JOIN utilisateurs u ON c.medecin_id = u.id
       WHERE c.patient_id = ?
       ORDER BY c.date_consultation DESC`,
      [id]
    );

    const [rendezVous] = await db.execute(
      `SELECT r.*, CONCAT(u.prenom, ' ', u.nom) as medecin_nom
       FROM rendez_vous r
       JOIN utilisateurs u ON r.medecin_id = u.id
       WHERE r.patient_id = ?
       ORDER BY r.date_rdv DESC, r.heure_rdv DESC`,
      [id]
    );

    res.json({ patient: patient[0], consultations, rendezVous });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/patients - Créer un patient (admin, secrétaire)
router.post('/', requireRole('admin', 'secretaire'), async (req, res) => {
  try {
    const { nom, prenom, date_naissance, sexe, telephone, adresse, email } = req.body;

    if (!nom || !prenom || !sexe) {
      return res.status(400).json({ message: 'Nom, prénom et sexe sont obligatoires.' });
    }

    // Générer numéro de dossier automatique
    const [lastPatient] = await db.execute(
      'SELECT num_dossier FROM patients ORDER BY id DESC LIMIT 1'
    );
    let newNum = 'PAT-0001';
    if (lastPatient.length > 0 && lastPatient[0].num_dossier) {
      const lastNum = parseInt(lastPatient[0].num_dossier.split('-')[1]) + 1;
      newNum = `PAT-${String(lastNum).padStart(4, '0')}`;
    }

    const [result] = await db.execute(
      `INSERT INTO patients (nom, prenom, date_naissance, sexe, telephone, adresse, email, num_dossier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, date_naissance || null, sexe, telephone || null, adresse || null, email || null, newNum]
    );

    res.status(201).json({ message: 'Patient créé avec succès.', id: result.insertId, num_dossier: newNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/patients/:id - Modifier un patient (admin, secrétaire)
router.put('/:id', requireRole('admin', 'secretaire'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, date_naissance, sexe, telephone, adresse, email } = req.body;

    const [existing] = await db.execute('SELECT id FROM patients WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }

    await db.execute(
      `UPDATE patients SET nom = ?, prenom = ?, date_naissance = ?, sexe = ?,
       telephone = ?, adresse = ?, email = ? WHERE id = ?`,
      [nom, prenom, date_naissance || null, sexe, telephone || null, adresse || null, email || null, id]
    );

    res.json({ message: 'Patient mis à jour avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/patients/:id - Supprimer un patient (admin seulement)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.execute('SELECT id FROM patients WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }
    await db.execute('DELETE FROM patients WHERE id = ?', [id]);
    res.json({ message: 'Patient supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;