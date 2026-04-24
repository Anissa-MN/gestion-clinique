const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/rendez-vous - Liste des rendez-vous avec filtres
router.get('/', async (req, res) => {
  try {
    const { date, statut, medecin_id, patient_id } = req.query;

    let query = `
      SELECT r.*, 
        CONCAT(p.prenom, ' ', p.nom) as patient_nom, p.num_dossier,
        CONCAT(u.prenom, ' ', u.nom) as medecin_nom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN utilisateurs u ON r.medecin_id = u.id
      WHERE 1=1
    `;
    let params = [];

    // Si médecin, voir seulement ses RDV
    if (req.user.role === 'medecin') {
      query += ` AND r.medecin_id = ?`;
      params.push(req.user.id);
    } else if (medecin_id) {
      query += ` AND r.medecin_id = ?`;
      params.push(medecin_id);
    }

    if (date) { query += ` AND r.date_rdv = ?`; params.push(date); }
    if (statut) { query += ` AND r.statut = ?`; params.push(statut); }
    if (patient_id) { query += ` AND r.patient_id = ?`; params.push(patient_id); }

    query += ` ORDER BY r.date_rdv ASC, r.heure_rdv ASC`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rendez-vous/aujourd-hui - RDV du jour
router.get('/aujourd-hui', async (req, res) => {
  try {
    let query = `
      SELECT r.*,
        CONCAT(p.prenom, ' ', p.nom) as patient_nom, p.num_dossier, p.telephone as patient_telephone,
        CONCAT(u.prenom, ' ', u.nom) as medecin_nom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN utilisateurs u ON r.medecin_id = u.id
      WHERE r.date_rdv = CURDATE()
    `;
    let params = [];

    if (req.user.role === 'medecin') {
      query += ` AND r.medecin_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY r.heure_rdv ASC`;
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rendez-vous/:id - Détail d'un rendez-vous
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*,
        CONCAT(p.prenom, ' ', p.nom) as patient_nom, p.num_dossier,
        CONCAT(u.prenom, ' ', u.nom) as medecin_nom
       FROM rendez_vous r
       JOIN patients p ON r.patient_id = p.id
       JOIN utilisateurs u ON r.medecin_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/rendez-vous - Créer un rendez-vous (admin, secrétaire)
router.post('/', requireRole('admin', 'secretaire'), async (req, res) => {
  try {
    const { patient_id, medecin_id, date_rdv, heure_rdv, motif, notes } = req.body;

    if (!patient_id || !medecin_id || !date_rdv || !heure_rdv) {
      return res.status(400).json({ message: 'Patient, médecin, date et heure sont obligatoires.' });
    }

    // Vérifier disponibilité du créneau
    const [conflict] = await db.execute(
      `SELECT id FROM rendez_vous 
       WHERE medecin_id = ? AND date_rdv = ? AND heure_rdv = ? AND statut != 'annule'`,
      [medecin_id, date_rdv, heure_rdv]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ message: 'Ce créneau est déjà pris pour ce médecin.' });
    }

    const [result] = await db.execute(
      `INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_rdv, motif, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, medecin_id, date_rdv, heure_rdv, motif || null, notes || null, req.user.id]
    );

    res.status(201).json({ message: 'Rendez-vous créé avec succès.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/rendez-vous/:id - Modifier un rendez-vous (admin, secrétaire)
router.put('/:id', requireRole('admin', 'secretaire'), async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, medecin_id, date_rdv, heure_rdv, motif, statut, notes } = req.body;

    const [existing] = await db.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    // Vérifier conflit de créneau si date/heure/médecin changent
    if (date_rdv && heure_rdv && medecin_id) {
      const [conflict] = await db.execute(
        `SELECT id FROM rendez_vous
         WHERE medecin_id = ? AND date_rdv = ? AND heure_rdv = ? AND statut != 'annule' AND id != ?`,
        [medecin_id, date_rdv, heure_rdv, id]
      );
      if (conflict.length > 0) {
        return res.status(409).json({ message: 'Ce créneau est déjà pris pour ce médecin.' });
      }
    }

    await db.execute(
      `UPDATE rendez_vous SET patient_id = ?, medecin_id = ?, date_rdv = ?, heure_rdv = ?,
       motif = ?, statut = ?, notes = ? WHERE id = ?`,
      [
        patient_id || existing[0].patient_id,
        medecin_id || existing[0].medecin_id,
        date_rdv || existing[0].date_rdv,
        heure_rdv || existing[0].heure_rdv,
        motif !== undefined ? motif : existing[0].motif,
        statut || existing[0].statut,
        notes !== undefined ? notes : existing[0].notes,
        id
      ]
    );

    res.json({ message: 'Rendez-vous mis à jour avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PATCH /api/rendez-vous/:id/statut - Changer le statut
router.patch('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ['planifie', 'confirme', 'annule', 'termine'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    // Médecin peut seulement marquer comme terminé ses propres RDV
    if (req.user.role === 'medecin') {
      const [rdv] = await db.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
      if (rdv.length === 0) return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
      if (rdv[0].medecin_id !== req.user.id) {
        return res.status(403).json({ message: 'Accès refusé.' });
      }
      if (statut !== 'termine') {
        return res.status(403).json({ message: 'Les médecins peuvent seulement marquer un RDV comme terminé.' });
      }
    }

    await db.execute('UPDATE rendez_vous SET statut = ? WHERE id = ?', [statut, id]);
    res.json({ message: 'Statut mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/rendez-vous/:id - Annuler un rendez-vous (admin, secrétaire)
router.delete('/:id', requireRole('admin', 'secretaire'), async (req, res) => {
  try {
    await db.execute(`UPDATE rendez_vous SET statut = 'annule' WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Rendez-vous annulé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;