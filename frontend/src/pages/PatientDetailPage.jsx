import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const statusBadge = (s) => {
  const map = {
    planifie: ['badge-blue', 'Planifié'],
    confirme: ['badge-green', 'Confirmé'],
    annule: ['badge-red', 'Annulé'],
    termine: ['badge-gray', 'Terminé']
  };
  const [cls, label] = map[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} ans`;
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('consultations');

  useEffect(() => {
    api.get(`/patients/${id}/historique`)
      .then(r => setData(r.data))
      .catch(() => { toast.error('Erreur lors du chargement.'); navigate('/patients'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return null;

  const { patient, consultations, rendezVous } = data;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')}>
            ← Retour
          </button>
          <div>
            <h2 className="page-title">{patient.prenom} {patient.nom}</h2>
            <p className="page-subtitle">Dossier {patient.num_dossier}</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Infos patient */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Informations du patient</span>
            <span className="badge badge-green">{patient.num_dossier}</span>
          </div>
          <div className="card-body">
            <div className="form-row-3">
              <div>
                <div className="form-label">Nom complet</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{patient.prenom} {patient.nom}</div>
              </div>
              <div>
                <div className="form-label">Date de naissance</div>
                <div>
                  {patient.date_naissance
                    ? `${new Date(patient.date_naissance).toLocaleDateString('fr-FR')} (${calcAge(patient.date_naissance)})`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="form-label">Sexe</div>
                <div>{patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
              </div>
              <div>
                <div className="form-label">Téléphone</div>
                <div>{patient.telephone || '—'}</div>
              </div>
              <div>
                <div className="form-label">Email</div>
                <div>{patient.email || '—'}</div>
              </div>
              <div>
                <div className="form-label">Adresse</div>
                <div>{patient.adresse || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${tab === 'consultations' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setTab('consultations')}
              >
                🩺 Consultations ({consultations.length})
              </button>
              <button
                className={`btn ${tab === 'rdv' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setTab('rdv')}
              >
                📅 Rendez-vous ({rendezVous.length})
              </button>
            </div>
          </div>

          <div className="table-container">
            {tab === 'consultations' && (
              consultations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🩺</div>
                  <h3>Aucune consultation</h3>
                  <p>Ce patient n'a pas encore eu de consultation.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Médecin</th>
                      <th>Motif</th>
                      <th>Diagnostic</th>
                      <th>Traitement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map(c => (
                      <tr key={c.id}>
                        <td>{new Date(c.date_consultation).toLocaleDateString('fr-FR')}</td>
                        <td>{c.medecin_nom}</td>
                        <td>{c.motif}</td>
                        <td>{c.diagnostic || <span className="text-muted">—</span>}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.traitement || <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {tab === 'rdv' && (
              rendezVous.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>Aucun rendez-vous</h3>
                  <p>Ce patient n'a pas encore de rendez-vous.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Médecin</th>
                      <th>Motif</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rendezVous.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.date_rdv).toLocaleDateString('fr-FR')}</td>
                        <td>{r.heure_rdv?.slice(0, 5)}</td>
                        <td>{r.medecin_nom}</td>
                        <td>{r.motif || <span className="text-muted">—</span>}</td>
                        <td>{statusBadge(r.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
