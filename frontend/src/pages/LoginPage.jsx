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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="TobyCare Logo" style={{ width: '180px', height: 'auto', margin: '0 auto 24px', display: 'block' }} />
          <p>Système de gestion de clinique premium</p>
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳ Connexion en cours...' : '🔐 Se connecter'}
          </button>
        </form>

      </div>
    </div>
  );
}
