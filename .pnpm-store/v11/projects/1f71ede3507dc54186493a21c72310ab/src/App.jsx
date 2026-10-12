import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useTheme } from './hooks/useTheme'
import { Dashboard } from './pages/Dashboard'
import { AlertsPage } from './pages/AlertsPage'
import { PredictionsPage } from './pages/PredictionsPage'
import { IncidentHistoryPage } from './pages/IncidentHistoryPage'

export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/incidents" element={<IncidentHistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
