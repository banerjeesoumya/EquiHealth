import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import Landing from './pages/Landing';
import FoodInfo from './components/dashboard/FoodInfo';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="EquiHealth-theme">
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<ProtectedRoute role="patient" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/food-info" element={<FoodInfo />} />
              </Route>

              <Route element={<ProtectedRoute role="doctor" />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              </Route>

              <Route element={<ProtectedRoute role="admin" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <Toaster position="top-center" richColors />
        </Router>
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
