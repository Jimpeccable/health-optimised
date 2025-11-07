import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';

export default function RequireAuth({ children, role }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && session.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

