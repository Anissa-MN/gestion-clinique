import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'planifie', label: 'Planifié', badge: 'badge-blue' },
  { value: 'confirme', label: 'Confirmé', badge: 'badge-green' },
  { value: 'annule', label: 'Annulé', badge: 'badge-red' },
  { value: 'termine', label: 'Terminé', badge: 'badge-gray' }
];

const statusBadge = (s) => {
  const opt = STATUS_OPTIONS.find(o => o.value === s);
  return opt ? <span className={`badge ${opt.badge}`}>{opt.label}</span> : <span className="badge badge-gray">{s}</span>;
};

function RdvModal({ rdv, onClose, onSaved }) {
  const [form, setForm] = useState({
    patient_id: '', medecin_id: '', date_rdv: '', heure_rdv: '',
    motif: '', statut: 'planifie', notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');

  useEffect(() => {
    api.get('/utilisateurs/medecins').then(r => setMedecins(r.data));
    if (rdv?.id) {
      setForm({
        patient_id: rdv.patient_id,
        medecin_id: rdv.medecin_id,
        date_rdv: rdv.date_rdv?.split('T')[0] || '',
        heure_rdv: rdv.heure_rdv?.slice(0, 5) || '',
        motif: rdv.motif || '',
        statut: rdv.statut || 'planifie',
        notes: rdv.notes || ''
      });
    }
  }, [rdv]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = { limit: 10 };
      if (searchPatient) params.search = searchPatient;
      api.get('/patients', { params }).then(r => setPatients(r.data.patients));
    }, 300);
    return () => clearTimeout(t);
  }, [searchPatient]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.medecin_id || !form.date_rdv || !form.heure_rdv) {
      toast.error('Tous les champs obligatoires doivent être remplis.'); return;
    }
    setLoading(true);
    try {
      if (rdv?.id) {
        await api.put(`/rendez-vous/${rdv.id}`, form);
        toast.success('Rendez-vous mis à jour.');
      } else {
        await api.post('/rendez-vous', form);
        toast.success('Rendez-vous créé.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{rdv?.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Patient</label>
              <input
                className="form-input"
                placeholder="Rechercher un patient..."
                value={searchPatient}
                onChange={e => setSearchPatient(e.target.value)}
                style={{ marginBottom: 6 }}
              />
              <select className="form-select" value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
                <option value="">-- Sélectionner un patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.num_dossier})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Médecin</label>
              <select className="form-select" value={form.medecin_id} onChange={e => set('medecin_id', e.target.value)}>
                <option value="">-- Sélectionner un médecin --</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>Dr {m.prenom} {m.nom} {m.specialite ? `(${m.specialite})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Date</label>
                <input type="date" className="form-input" value={form.date_rdv} onChange={e => set('date_rdv', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label required">Heure</label>
                <input type="time" className="form-input" value={form.heure_rdv} onChange={e => set('heure_rdv', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motif</label>
              <input className="form-input" placeholder="Motif de la consultation" value={form.motif} onChange={e => set('motif', e.target.value)} />
            </div>

            {rdv?.id && (
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="form-select" value={form.statut} onChange={e => set('statut', e.target.value)}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳' : '💾'} {rdv?.id ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RendezVousPage() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const { canEdit, isMedecin } = useAuth();

  const fetchRdvs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatut) params.statut = filterStatut;
      const res = await api.get('/rendez-vous', { params });
      setRdvs(res.data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatut]);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  const handleAnnuler = async (rdv) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    try {
      await api.delete(`/rendez-vous/${rdv.id}`);
      toast.success('Rendez-vous annulé.');
      fetchRdvs();
    } catch {
      toast.error('Erreur.');
    }
  };

  const handleStatut = async (id, statut) => {
    try {
      await api.patch(`/rendez-vous/${id}/statut`, { statut });
      toast.success('Statut mis à jour.');
      fetchRdvs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const today = rdvs.filter(r => r.date_rdv?.split('T')[0] === new Date().toISOString().split('T')[0]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Rendez-vous</h2>
          <p className="page-subtitle">{rdvs.length} rendez-vous</p>
        </div>
        {canEdit() && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            ＋ Nouveau rendez-vous
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-icon amber">📅</div>
            <div>
              <div className="stat-value">{today.length}</div>
              <div className="stat-label">Aujourd'hui</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-icon blue" style={{ fontSize: '1.1rem' }}>✅</div>
            <div>
              <div className="stat-value">{rdvs.filter(r => r.statut === 'confirme').length}</div>
              <div className="stat-label">Confirmés</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-icon green" style={{ fontSize: '1.1rem' }}>⏳</div>
            <div>
              <div className="stat-value">{rdvs.filter(r => r.statut === 'planifie').length}</div>
              <div className="stat-label">Planifiés</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto' }}
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
              <select className="form-select" style={{ width: 'auto' }} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {(filterDate || filterStatut) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setFilterDate(''); setFilterStatut(''); }}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : rdvs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>Aucun rendez-vous</h3>
                <p>Aucun rendez-vous ne correspond à vos filtres.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rdvs.map(rdv => (
                    <tr key={rdv.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-muted">🕐 {rdv.heure_rdv?.slice(0, 5)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rdv.patient_nom}</div>
                        <div className="text-xs text-muted">{rdv.num_dossier}</div>
                      </td>
                      <td>Dr {rdv.medecin_nom}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rdv.motif || <span className="text-muted">—</span>}
                      </td>
                      <td>{statusBadge(rdv.statut)}</td>
                      <td>
                        <div className="actions-cell">
                          {canEdit() && rdv.statut !== 'annule' && rdv.statut !== 'termine' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => setModal(rdv)}>✏️</button>
                              {rdv.statut === 'planifie' && (
                                <button className="btn btn-success btn-sm" onClick={() => handleStatut(rdv.id, 'confirme')}>✓</button>
                              )}
                              <button className="btn btn-danger btn-sm" onClick={() => handleAnnuler(rdv)}>✕</button>
                            </>
                          )}
                          {isMedecin() && rdv.statut === 'confirme' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleStatut(rdv.id, 'termine')}>
                              ✓ Terminé
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <RdvModal
          rdv={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchRdvs(); }}
        />
      )}
    </>
  );
}
