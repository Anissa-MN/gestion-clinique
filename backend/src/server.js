const express = require('express');
const cors = require('cors');
const loadEnv = require('./loadEnv');
loadEnv();

const app = express();

// Middlewares
// CORS: autoriser le FRONTEND_URL si défini, sinon autoriser tous les localhost:PORT en dev
const frontendUrl = process.env.FRONTEND_URL;
const defaultWhitelist = [/^http:\/\/localhost:\d+$/];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools like curl
    if (frontendUrl) {
      return callback(null, origin === frontendUrl);
    }
    const allowed = defaultWhitelist.some((r) => r.test(origin));
    callback(null, allowed);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/utilisateurs', require('./routes/utilisateurs'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medecins', require('./routes/medecins'));
app.use('/api/rendez-vous', require('./routes/rendezVous'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GestionClinique Mada API en ligne', version: '1.0.0' });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée.' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏥 GestionClinique Mada API démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}/api/health`);
});

module.exports = app;