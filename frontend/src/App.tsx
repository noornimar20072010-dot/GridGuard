import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { TransformerDetails } from '@/pages/TransformerDetails'

// TODO(Milestone 2 - Authentication): wrap dashboard/transformer routes in a protected-route guard.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transformer/:id" element={<TransformerDetails />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
