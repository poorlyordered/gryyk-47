import React from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showSidebar = isAuthenticated && location.pathname !== '/';

  return (
    <Box minH="100vh">
      <Header />
      <Flex>
        {showSidebar && <Sidebar />}
        <Container
          maxW={showSidebar ? 'container.xl' : 'container.lg'}
          py={8}
          px={4}
        >
          {children}
        </Container>
      </Flex>
    </Box>
  );
};

export default Layout;