import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const roleLabels = { admin: 'Administrateur', medecin: 'Médecin', secretaire: 'Secrétaire' };

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin, isMedecin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie.');
    navigate('/login');
  };

  const initials = user ? `${user.prenom?.[0]}${user.nom?.[0]}`.toUpperCase() : '?';

  // Fermer la sidebar sur mobile après un clic
  const handleNavClick = () => {
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <img src="/logo.png" alt="TobyCare" style={{ width: '140px', height: 'auto', marginBottom: '8px' }} />
        <span>Panel Médical</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Principal</div>
          <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">📊</span> Tableau de bord
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Gestion</div>
          <NavLink to="/patients" onClick={handleNavClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">👥</span> Patients
          </NavLink>
          <NavLink to="/rendez-vous" onClick={handleNavClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">📅</span> Rendez-vous
          </NavLink>
          {(isMedecin() || isAdmin()) && (
            <NavLink to="/consultations" onClick={handleNavClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">🩺</span> Consultations
            </NavLink>
          )}
        </div>

        {isAdmin() && (
          <div className="nav-section">
            <div className="nav-section-label">Administration</div>
            <NavLink to="/utilisateurs" onClick={handleNavClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">⚙️</span> Utilisateurs
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.prenom} {user?.nom}</div>
          <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
          <span style={{ fontSize: '1.2rem' }}>⏏</span>
        </button>
      </div>
    </aside>
  );
}
