import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [mot_de_passe, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !mot_de_passe) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, mot_de_passe);
      toast.success(`Bienvenue, ${user.prenom} !`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@clinique.mg', pwd: 'password' },
      medecin: { email: 'dr.rakoto@clinique.mg', pwd: 'password' },
      secretaire: { email: 'secretaire@clinique.mg', pwd: 'password' }
    };
    setEmail(creds[role].email);
    setPassword(creds[role].pwd);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-big">🏥</div>
          <h1>GestionClinique Mada</h1>
          <p>Système de gestion de clinique</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="votre@email.mg"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={mot_de_passe}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 10, textAlign: 'center' }}>
            Comptes de démonstration :
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>Admin</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('medecin')}>Médecin</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('secretaire')}>Secrétaire</button>
          </div>
        </div>
      </div>
    </div>
  );
}
