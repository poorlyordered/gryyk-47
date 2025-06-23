import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { generateAuthUrl } from '../../services/eve';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isTokenValid, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('eve_auth_state', state);

      if (!isAuthenticated) {
        // Redirect to EVE SSO login
        window.location.href = generateAuthUrl(state);
        return;
      }
  
      // Check if token is valid
      if (!isTokenValid()) {
        // Try to refresh the token
        const refreshed = await refreshToken();
        if (!refreshed) {
          // If refresh fails, redirect to login
          window.location.href = generateAuthUrl(state);
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isTokenValid, refreshToken, navigate]);

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
