import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Common.jsx';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
