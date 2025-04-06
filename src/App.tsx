import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import StrategicMatrix from './pages/StrategicMatrix';
import SystemPrompt from './pages/SystemPrompt';
import Callback from './pages/Callback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Logout from './components/auth/Logout';

import { useEffect } from 'react';
import { useAuthStore } from './store/auth';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tokenData = useAuthStore((state) => state.tokenData);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated || !tokenData?.accessToken) return;

      try {
        const response = await fetch('/api/auth-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenData.accessToken }),
        });

        if (!response.ok) {
          logout();
        }
      } catch {
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
            </Routes>
          </Layout>
        </Router>
      </ChakraProvider>
    </>
  );
}

export default App;
