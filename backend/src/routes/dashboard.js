const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard/stats - Statistiques globales
router.get('/stats', async (req, res) => {
  try {
    const isMedecin = req.user.role === 'medecin';
    const medecinId = req.user.id;

    // Total patients
    const [totalPatients] = await db.execute('SELECT COUNT(*) as count FROM patients');

    // RDV aujourd'hui
    let rdvQuery = `SELECT COUNT(*) as count FROM rendez_vous WHERE date_rdv = CURDATE() AND statut != 'annule'`;
    let rdvParams = [];
    if (isMedecin) { rdvQuery += ` AND medecin_id = ?`; rdvParams.push(medecinId); }
    const [rdvAujourdhui] = await db.execute(rdvQuery, rdvParams);

    // Consultations ce mois
    let consultQuery = `SELECT COUNT(*) as count FROM consultations WHERE MONTH(date_consultation) = MONTH(CURDATE()) AND YEAR(date_consultation) = YEAR(CURDATE())`;
    let consultParams = [];
    if (isMedecin) { consultQuery += ` AND medecin_id = ?`; consultParams.push(medecinId); }
    const [consultMois] = await db.execute(consultQuery, consultParams);

    // Nouveaux patients ce mois
    const [nouveauxPatients] = await db.execute(
      `SELECT COUNT(*) as count FROM patients WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
    );

    // RDV de la semaine
    let rdvSemaineQuery = `
      SELECT COUNT(*) as count FROM rendez_vous 
      WHERE date_rdv >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      AND date_rdv < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
      AND statut != 'annule'
    `;
    let rdvSemaineParams = [];
    if (isMedecin) { rdvSemaineQuery += ` AND medecin_id = ?`; rdvSemaineParams.push(medecinId); }
    const [rdvSemaine] = await db.execute(rdvSemaineQuery, rdvSemaineParams);

    // RDV récents (prochains 5)
    let prochainQuery = `
      SELECT r.*, CONCAT(p.prenom, ' ', p.nom) as patient_nom, p.num_dossier,
             CONCAT(u.prenom, ' ', u.nom) as medecin_nom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN utilisateurs u ON r.medecin_id = u.id
      WHERE r.date_rdv >= CURDATE() AND r.statut != 'annule'
    `;
    let prochainParams = [];
    if (isMedecin) { prochainQuery += ` AND r.medecin_id = ?`; prochainParams.push(medecinId); }
    prochainQuery += ` ORDER BY r.date_rdv ASC, r.heure_rdv ASC LIMIT 5`;
    const [prochainRdv] = await db.execute(prochainQuery, prochainParams);

    // Consultations récentes
    let recentConsultQuery = `
      SELECT c.*, CONCAT(p.prenom, ' ', p.nom) as patient_nom, p.num_dossier,
             CONCAT(u.prenom, ' ', u.nom) as medecin_nom
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN utilisateurs u ON c.medecin_id = u.id
    `;
    let recentConsultParams = [];
    if (isMedecin) { recentConsultQuery += ` WHERE c.medecin_id = ?`; recentConsultParams.push(medecinId); }
    recentConsultQuery += ` ORDER BY c.created_at DESC LIMIT 5`;
    const [recentConsultations] = await db.execute(recentConsultQuery, recentConsultParams);

    // Graphique: consultations par mois (6 derniers mois)
    let graphQuery = `
      SELECT MONTH(date_consultation) as mois, YEAR(date_consultation) as annee, COUNT(*) as count
      FROM consultations
      WHERE date_consultation >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `;
    let graphParams = [];
    if (isMedecin) { graphQuery += ` AND medecin_id = ?`; graphParams.push(medecinId); }
    graphQuery += ` GROUP BY YEAR(date_consultation), MONTH(date_consultation) ORDER BY annee, mois`;
    const [graphData] = await db.execute(graphQuery, graphParams);

    res.json({
      stats: {
        totalPatients: totalPatients[0].count,
        rdvAujourdhui: rdvAujourdhui[0].count,
        consultationsMois: consultMois[0].count,
        nouveauxPatients: nouveauxPatients[0].count,
        rdvSemaine: rdvSemaine[0].count
      },
      prochainRdv,
      recentConsultations,
      graphData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;