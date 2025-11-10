import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './store/auth';
import { jwtDecode } from 'jwt-decode';
import type { EveJWT } from './services/eve';
import { Spinner, Center } from '@chakra-ui/react';

// Lazy load route components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Chat = lazy(() => import('./pages/Chat'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StrategicMatrix = lazy(() => import('./pages/StrategicMatrix'));
const SystemPrompt = lazy(() => import('./pages/SystemPrompt'));
const EveSSOData = lazy(() => import('./pages/EveSSOData'));
const AgentManagement = lazy(() => import('./pages/AgentManagement'));
const AgentConfiguration = lazy(() => import('./pages/AgentConfiguration'));
const AgentMonitoring = lazy(() => import('./pages/AgentMonitoring').then(m => ({ default: m.AgentMonitoring })));
const ESIPipeline = lazy(() => import('./pages/ESIPipeline').then(m => ({ default: m.ESIPipeline })));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const Callback = lazy(() => import('./pages/Callback'));
const Logout = lazy(() => import('./components/auth/Logout'));

// Loading fallback component
const PageLoader = () => (
  <Center h="100vh">
    <Spinner size="xl" color="blue.500" thickness="4px" />
  </Center>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </Layout>
        </Router>
      </ChakraProvider>
    </>
  );
}

export default App;
