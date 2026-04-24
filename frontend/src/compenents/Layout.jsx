import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="content-wrap" style={{ marginLeft: 'var(--sidebar-w)' }}>
        <header className="app-header">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(true)} style={{ marginRight: 12 }}>☰</button>
            <h1>GestionClinique Mada</h1>
            <p className="subtitle">Connecté : <strong>{user?.firstName || user?.prenom} {user?.lastName || user?.nom}</strong> <span className="role-badge">{user?.role}</span></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="logout-btn" onClick={() => { if (confirm('Se déconnecter ?')) { logout(); window.location.href='/login' } }}>Déconnexion</button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}