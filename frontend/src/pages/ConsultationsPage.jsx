import { useState, useEffect } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function ConsultationsPage() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    api.get('/consultations')
      .then(r => setConsultations(Array.isArray(r.data) ? r.data : (r.data?.consultations || [])))
      .catch(e => { setError(e?.message || 'Erreur'); toast.error('Impossible de charger les consultations') })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Consultations</h2>
        <p className="page-subtitle">Liste des consultations enregistrées</p>
      </div>

      <div className="page-body">
        {error && <p className="error">{error}</p>}

        {consultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🩺</div>
            <h3>Aucune consultation</h3>
            <p>Aucune consultation n'a été trouvée.</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Motif</th>
                    <th>Diagnostic</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/patients/${c.patient_id || c.patientId || c.patient}`)} style={{ cursor: 'pointer' }}>
                      <td>{c.date_consultation ? new Date(c.date_consultation).toLocaleString('fr-FR') : (c.date ? new Date(c.date).toLocaleString('fr-FR') : '—')}</td>
                      <td>{c.patient_nom || `${c.patientFirstName || c.patient_firstname || ''} ${c.patientLastName || c.patient_lastname || ''}` || '—'}</td>
                      <td>{c.medecin_nom || `${c.medecinFirstName || ''} ${c.medecinLastName || ''}` || '—'}</td>
                      <td>{c.motif || '—'}</td>
                      <td>{c.diagnostic || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
