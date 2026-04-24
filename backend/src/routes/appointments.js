const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { patientId, appointmentDate, reason = null, status = "PLANIFIE" } = req.body ?? {};

  if (!patientId || !appointmentDate) {
    return res.status(400).json({ message: "patientId et appointmentDate sont obligatoires." });
  }

  try {
    const [patientRows] = await pool.query("SELECT id FROM patients WHERE id = ?", [patientId]);
    if (patientRows.length === 0) {
      return res.status(404).json({ message: "Patient introuvable." });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, appointment_date, reason, status)
       VALUES (?, ?, ?, ?)`,
      [patientId, appointmentDate, reason, status]
    );

    return res.status(201).json({ id: result.insertId, message: "Rendez-vous cree avec succes." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la creation du rendez-vous.", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.patient_id AS patientId, a.appointment_date AS appointmentDate, a.reason, a.status,
              a.created_at AS createdAt, a.updated_at AS updatedAt,
              p.first_name AS patientFirstName, p.last_name AS patientLastName
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       ORDER BY a.appointment_date DESC`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la recuperation des rendez-vous.", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { patientId, appointmentDate, reason = null, status = "PLANIFIE" } = req.body ?? {};

  if (!patientId || !appointmentDate) {
    return res.status(400).json({ message: "patientId et appointmentDate sont obligatoires." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE appointments
       SET patient_id = ?, appointment_date = ?, reason = ?, status = ?
       WHERE id = ?`,
      [patientId, appointmentDate, reason, status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rendez-vous introuvable." });
    }
    return res.json({ message: "Rendez-vous mis a jour avec succes." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la mise a jour du rendez-vous.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM appointments WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rendez-vous introuvable." });
    }
    return res.json({ message: "Rendez-vous supprime avec succes." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la suppression du rendez-vous.", error: error.message });
  }
});

module.exports = router;
