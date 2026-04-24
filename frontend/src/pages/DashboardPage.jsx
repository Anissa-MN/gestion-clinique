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
    <div>
      <section className="stats-grid">
        <article className="stat-card"><h3>Patients</h3><p>{counts.patients}</p></article>
        <article className="stat-card"><h3>Rendez‑vous</h3><p>{counts.appointments}</p></article>
        <article className="stat-card"><h3>Consultations</h3><p>{counts.consultations}</p></article>
        <article className="stat-card"><h3>Médecins</h3><p>{counts.medecins}</p></article>
      </section>

      <div style={{ marginTop: 20 }}>
        <p>Bienvenue sur le tableau de bord — utilisez la barre latérale pour naviguer.</p>
      </div>
    </div>
  )
}
