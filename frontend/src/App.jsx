import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import RendezVousPage from './pages/RendezVousPage'
import ConsultationsPage from './pages/ConsultationsPage'
import UtilisateursPage from './pages/UtilisateursPage'
import Layout from './compenents/Layout'

export default function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <LoginPage />

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/rendez-vous" element={<RendezVousPage />} />
        <Route path="/consultations" element={<ConsultationsPage />} />
        <Route path="/utilisateurs" element={<UtilisateursPage />} />
        {/* add other routes as needed */}
      </Route>
    </Routes>
  )
}
