import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

function UserForm({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'secretaire', mot_de_passe: '', specialite: '', telephone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setForm({ nom: user.nom || '', prenom: user.prenom || '', email: user.email || '', role: user.role || 'secretaire', mot_de_passe: '', specialite: user.specialite || '', telephone: user.telephone || '' })
  }, [user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email || (!user && !form.mot_de_passe)) {
      toast.error('Champs obligatoires manquants.'); return;
    }
    setSaving(true)
    try {
      if (user) {
        await api.put(`/utilisateurs/${user.id}`, form)
        toast.success('Utilisateur mis à jour.')
      } else {
        await api.post('/utilisateurs', form)
        toast.success('Utilisateur créé.')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{user ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row-2">
              <input className="form-input" placeholder="Prénom" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
              <input className="form-input" placeholder="Nom" value={form.nom} onChange={e => set('nom', e.target.value)} />
            </div>
            <div className="form-row-2">
              <input className="form-input" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="admin">Admin</option>
                <option value="medecin">Médecin</option>
                <option value="secretaire">Secrétaire</option>
              </select>
            </div>
            {!user && (
              <div className="form-group">
                <input className="form-input" type="password" placeholder="Mot de passe" value={form.mot_de_passe} onChange={e => set('mot_de_passe', e.target.value)} />
              </div>
            )}
            {form.role === 'medecin' && (
              <div className="form-row-2">
                <input className="form-input" placeholder="Spécialité" value={form.specialite} onChange={e => set('specialite', e.target.value)} />
                <input className="form-input" placeholder="Téléphone" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : (user ? 'Mettre à jour' : 'Créer')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UtilisateursPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalUser, setModalUser] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/utilisateurs')
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.utilisateurs || []))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur chargement')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeUser = async (id) => {
    if (!window.confirm('Désactiver cet utilisateur ?')) return
    try {
      await api.delete(`/utilisateurs/${id}`)
      toast.success('Utilisateur désactivé.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.')
    }
  }

  if (!isAdmin()) return <div className="card"><p>Accès réservé aux administrateurs.</p></div>
  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Utilisateurs</h2>
          <p className="page-subtitle">Gestion des comptes utilisateurs</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setModalUser(null)}>➕ Nouvel utilisateur</button>
        </div>
      </div>

      <div className="page-body">
        {error && <p className="error">{error}</p>}
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Actif</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.prenom} {u.nom}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.actif ? 'Oui' : 'Non'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModalUser(u)}>Modifier</button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeUser(u.id)}>Désactiver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {typeof modalUser !== 'undefined' && (
        <UserForm user={modalUser} onClose={() => setModalUser(undefined)} onSaved={load} />
      )}
    </div>
  )
}
