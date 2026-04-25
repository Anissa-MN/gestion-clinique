import { useState, useEffect } from 'react'
import api from '../services/api'

export default function DashboardPage() {
  const [counts, setCounts] = useState({ patients: 0, appointments: 0, consultations: 0, medecins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.get('/patients').then(r => r.data).catch(() => ({ patients: [] })),
      api.get('/appointments').then(r => r.data).catch(() => []),
      api.get('/consultations').then(r => r.data).catch(() => []),
      api.get('/medecins').then(r => r.data).catch(() => [])
    ]).then(([p, a, c, m]) => {
      if (!mounted) return
      setCounts({
        patients: Array.isArray(p) ? p.length : (p?.patients?.length || 0),
        appointments: Array.isArray(a) ? a.length : (a?.length || 0),
        consultations: Array.isArray(c) ? c.length : (c?.length || 0),
        medecins: Array.isArray(m) ? m.length : (m?.length || 0)
      })
    }).finally(() => setLoading(false))

    return () => { mounted = false }
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"/></div>

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Tableau de bord</h2>
          <p className="page-subtitle">Aperçu général de la clinique</p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-content">
            <div className="stat-value">{counts.patients}</div>
            <div className="stat-label">Patients</div>
          </div>
        </article>
        
        <article className="stat-card">
          <div className="stat-icon amber">📅</div>
          <div className="stat-content">
            <div className="stat-value">{counts.appointments}</div>
            <div className="stat-label">Rendez‑vous</div>
          </div>
        </article>
        
        <article className="stat-card">
          <div className="stat-icon green">🩺</div>
          <div className="stat-content">
            <div className="stat-value">{counts.consultations}</div>
            <div className="stat-label">Consultations</div>
          </div>
        </article>
        
        <article className="stat-card">
          <div className="stat-icon purple">👨‍⚕️</div>
          <div className="stat-content">
            <div className="stat-value">{counts.medecins}</div>
            <div className="stat-label">Médecins</div>
          </div>
        </article>
      </section>

      <div className="card fade-in">
        <div className="card-header">
          <h3 className="card-title">Bienvenue</h3>
        </div>
        <div className="card-body">
          <p className="text-muted">Utilisez le menu latéral pour gérer les patients, les rendez-vous et vos consultations. Ce tableau de bord vous permet d'avoir une vue globale sur les activités récentes.</p>
        </div>
      </div>
    </div>
  )
}
