import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const SEXE_LABEL = { M: 'Masculin', F: 'Féminin' };

function PatientModal({ patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', date_naissance: '', sexe: 'M',
    telephone: '', adresse: '', email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm({
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        date_naissance: patient.date_naissance ? patient.date_naissance.split('T')[0] : '',
        sexe: patient.sexe || 'M',
        telephone: patient.telephone || '',
        adresse: patient.adresse || '',
        email: patient.email || ''
      });
    }
  }, [patient]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom) {
      toast.error('Nom et prénom sont obligatoires.'); return;
    }
    setLoading(true);
    try {
      if (patient?.id) {
        await api.put(`/patients/${patient.id}`, form);
        toast.success('Patient mis à jour.');
      } else {
        await api.post('/patients', form);
        toast.success('Patient créé avec succès.');
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
          <h3 className="modal-title">{patient?.id ? 'Modifier le patient' : 'Nouveau patient'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Prénom</label>
                <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label required">Nom</label>
                <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de naissance</label>
                <input type="date" className="form-input" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label required">Sexe</label>
                <select className="form-select" value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" placeholder="+261 34 00 000 00" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <textarea className="form-textarea" rows={2} value={form.adresse} onChange={e => set('adresse', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳' : '💾'} {patient?.id ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | patient object
  const { canEdit, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/patients', { params });
      setPatients(res.data.patients);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer le patient ${p.prenom} ${p.nom} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/patients/${p.id}`);
      toast.success('Patient supprimé.');
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const calcAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} ans`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Patients</h2>
          <p className="page-subtitle">{total} patient{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
        </div>
        {canEdit() && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            ＋ Nouveau patient
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="search-bar" style={{ margin: 0, flex: 1 }}>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Rechercher par nom, prénom, numéro dossier, téléphone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : patients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Aucun patient trouvé</h3>
                <p>{search ? 'Essayez d\'autres termes de recherche.' : 'Commencez par ajouter un patient.'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>N° Dossier</th>
                    <th>Nom complet</th>
                    <th>Âge / Sexe</th>
                    <th>Téléphone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span className="badge badge-green">{p.num_dossier}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</div>
                        {p.email && <div className="text-xs text-muted">{p.email}</div>}
                      </td>
                      <td>
                        <div>{calcAge(p.date_naissance)}</div>
                        <div className="text-xs text-muted">{SEXE_LABEL[p.sexe]}</div>
                      </td>
                      <td>{p.telephone || <span className="text-muted">—</span>}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/patients/${p.id}`)}>
                            👁 Voir
                          </button>
                          {canEdit() && (
                            <button className="btn btn-secondary btn-sm" onClick={() => setModal(p)}>
                              ✏️ Modifier
                            </button>
                          )}
                          {isAdmin() && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>
                              🗑
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

          {totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <PatientModal
          patient={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchPatients(); }}
        />
      )}
    </>
  );
}
