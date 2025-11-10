import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import StrategicMatrix from './pages/StrategicMatrix';
import SystemPrompt from './pages/SystemPrompt';
import EveSSOData from './pages/EveSSOData';
import AgentManagement from './pages/AgentManagement';
import AgentConfiguration from './pages/AgentConfiguration';
import { AgentMonitoring } from './pages/AgentMonitoring';
import { ESIPipeline } from './pages/ESIPipeline';
import AdminSettings from './pages/AdminSettings';
import Callback from './pages/Callback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Logout from './components/auth/Logout';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { jwtDecode } from 'jwt-decode';
import type { EveJWT } from './services/eve';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tokenData = useAuthStore((state) => state.tokenData);
  const logout = useAuthStore((state) => state.logout);

  // Token verification
  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated || !tokenData?.accessToken) return;

      try {
        // First, try local JWT validation as it's more reliable
        const decoded = jwtDecode<EveJWT>(tokenData.accessToken);
        
        if (!decoded.exp) {
          console.log('🔍 Token missing expiry time, logging out');
          logout();
          return;
        }
        
        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        if (expiryTime < Date.now()) {
          console.log('🔍 Token expired, logging out');
          logout();
          return;
        }
        
        console.log('🔍 Token valid until', new Date(expiryTime).toISOString());
        
        // Optional: Try server verification, but don't logout on failure
        try {
          const response = await fetch('/.netlify/functions/auth-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: tokenData.accessToken }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Token verified successfully with server:', data.CharacterName);
          } else {
            console.warn('🔍 Server token verification failed, but continuing with local validation:', 
              response.status, response.statusText);
          }
        } catch (serverError) {
          console.warn('🔍 Server token verification error, but continuing with local validation:', serverError);
        }
        
      } catch (jwtError) {
        console.error('🔍 JWT decoding error, logging out:', jwtError);
        logout();
      }
    };

    verify();
  }, [isAuthenticated, tokenData, logout]);

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/logout" element={<Logout />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategic-matrix"
                element={
                  <ProtectedRoute>
                    <StrategicMatrix />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-prompt"
                element={
                  <ProtectedRoute>
                    <SystemPrompt />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <ProtectedRoute>
                    <AgentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent-configuration"
                element={
                  <ProtectedRoute>
                    <AgentConfiguration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent-monitoring"
                element={
                  <ProtectedRoute>
                    <AgentMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/esi-pipeline"
                element={
                  <ProtectedRoute>
                    <ESIPipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/eve-sso"
                element={
                  <ProtectedRoute>
                    <EveSSOData />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </ChakraProvider>
    </>
  );
}

export default App;
