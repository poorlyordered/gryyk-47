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
      if (!isAuthenticated) {
        // Only redirect to SSO if not authenticated
        const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('eve_auth_state', state);
        window.location.href = generateAuthUrl(state);
        return;
      }
  
      // Only check token validity if authenticated
      if (isAuthenticated && !isTokenValid()) {
        console.log('🔍 Token expired, attempting refresh...');
        // Try to refresh the token
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log('🔍 Token refresh failed, redirecting to SSO...');
          // If refresh fails, redirect to login
          const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
          sessionStorage.setItem('eve_auth_state', state);
          window.location.href = generateAuthUrl(state);
        } else {
          console.log('🔍 Token refreshed successfully');
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isTokenValid, refreshToken, navigate]);

  // Only render children if authenticated and token is valid
  return isAuthenticated && isTokenValid() ? <>{children}</> : null;
};

export default ProtectedRoute;
