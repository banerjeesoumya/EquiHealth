import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  role: 'patient' | 'doctor' | 'admin';
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    // Redirect to appropriate dashboard based on user's actual role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'patient':
        return <Navigate to="/dashboard" replace />;
      default:
        // Fallback if role is unexpected (shouldn't happen)
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
} 