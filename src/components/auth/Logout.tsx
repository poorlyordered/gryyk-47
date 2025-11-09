import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuthStore } from '../../store/auth';

const Logout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout
    logout();
    
    // Redirect to login page after a short delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 1500);

    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <Box h="calc(100vh - 8rem)" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="brand.500" />
        <Text>Logging out...</Text>
      </VStack>
    </Box>
  );
};

export default Logout;
