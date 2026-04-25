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
      {/* Overlay pour mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />
      
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Conteneur principal (laisse un espace à gauche pour la sidebar sur desktop) */}
      <div className="content-wrap" style={{ marginLeft: 'var(--sidebar-w)' }}>
        <header className="app-header">
          <div className="flex items-center gap-3">
            {/* Bouton hamburger (surtout utile sur mobile) */}
            <button 
              className="btn btn-secondary btn-sm d-lg-none" 
              onClick={() => setSidebarOpen(true)}
              style={{ display: window.innerWidth <= 768 ? 'inline-flex' : 'none' }}
            >
              ☰
            </button>
            <div>
              <h1>TobyCare</h1>
              <p className="subtitle">
                Connecté : <strong>{user?.firstName || user?.prenom} {user?.lastName || user?.nom}</strong> 
                <span className="role-badge">{user?.role}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => { 
                if (window.confirm('Se déconnecter ?')) { 
                  logout(); 
                  window.location.href='/login'; 
                } 
              }}
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}