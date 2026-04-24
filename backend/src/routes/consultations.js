const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/consultations - liste des consultations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*,
        CONCAT(p.prenom, ' ', p.nom) as patient_nom,
        CONCAT(u.prenom, ' ', u.nom) as medecin_nom
       FROM consultations c
       JOIN patients p ON c.patient_id = p.id
       JOIN utilisateurs u ON c.medecin_id = u.id
       ORDER BY c.date_consultation DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/consultations/:id - détail
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, CONCAT(p.prenom, ' ', p.nom) as patient_nom, CONCAT(u.prenom, ' ', u.nom) as medecin_nom
       FROM consultations c
       JOIN patients p ON c.patient_id = p.id
       JOIN utilisateurs u ON c.medecin_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Consultation non trouvée.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/consultations - créer (medecin, admin, secretaire)
router.post('/', requireRole('admin', 'medecin', 'secretaire'), async (req, res) => {
  try {
    const body = req.body || {};
    const patient_id = body.patient_id || body.patientId || null;
    const medecin_id = body.medecin_id || body.medecinId || null;
    const rendez_vous_id = body.rendez_vous_id || body.appointmentId || body.rendezVousId || null;
    const date_consultation = body.date_consultation || body.date || new Date().toISOString().slice(0,10);
    const motif = body.motif || '';
    const diagnostic = body.diagnostic || null;
    const traitement = body.traitement || null;

    if (!patient_id || !medecin_id || !motif) {
      return res.status(400).json({ message: 'patient_id, medecin_id et motif sont obligatoires.' });
    }

    const [result] = await db.execute(
      `INSERT INTO consultations (patient_id, medecin_id, rendez_vous_id, date_consultation, motif, diagnostic, traitement)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, medecin_id, rendez_vous_id || null, date_consultation, motif, diagnostic, traitement]
    );

    res.status(201).json({ message: 'Consultation créée.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/consultations/:id - modifier
router.put('/:id', requireRole('admin', 'medecin', 'secretaire'), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const patient_id = body.patient_id || body.patientId || null;
    const medecin_id = body.medecin_id || body.medecinId || null;
    const rendez_vous_id = body.rendez_vous_id || body.appointmentId || null;
    const date_consultation = body.date_consultation || body.date || null;
    const motif = body.motif;
    const diagnostic = body.diagnostic;
    const traitement = body.traitement;

    const [existing] = await db.execute('SELECT * FROM consultations WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Consultation non trouvée.' });

    await db.execute(
      `UPDATE consultations SET patient_id = ?, medecin_id = ?, rendez_vous_id = ?, date_consultation = ?, motif = ?, diagnostic = ?, traitement = ? WHERE id = ?`,
      [
        patient_id || existing[0].patient_id,
        medecin_id || existing[0].medecin_id,
        rendez_vous_id || existing[0].rendez_vous_id,
        date_consultation || existing[0].date_consultation,
        motif !== undefined ? motif : existing[0].motif,
        diagnostic !== undefined ? diagnostic : existing[0].diagnostic,
        traitement !== undefined ? traitement : existing[0].traitement,
        id
      ]
    );

    res.json({ message: 'Consultation mise à jour.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/consultations/:id - supprimer
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await db.execute('DELETE FROM consultations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Consultation supprimée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;