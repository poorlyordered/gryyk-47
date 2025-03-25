import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Text, VStack, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';
import { useAuthStore } from '../store/auth';
import { exchangeAuthCode, getCharacterInfo } from '../services/eve';

const Callback = () => {
  const navigate = useNavigate();
  const { login, setCharacter } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('eve_auth_state');
        
        // Clear the stored state
        sessionStorage.removeItem('eve_auth_state');
        
        // Verify state parameter to prevent CSRF attacks
        // In development, we'll make this check optional
        if (import.meta.env.PROD && (!state || state !== storedState)) {
          throw new Error('Invalid state parameter. Authentication failed.');
        }

        if (!code) {
          throw new Error('No authorization code received from EVE SSO.');
        }

        // Exchange the authorization code for tokens
        const tokenData = await exchangeAuthCode(code);
        
        // Store the tokens in the auth store
        login(tokenData);

        // Get character information
        const character = await getCharacterInfo(tokenData.accessToken);
        setCharacter(character);
        
        // Redirect to the chat page
        navigate('/chat');
      } catch (err) {
        console.error('Authentication failed:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [login, setCharacter, navigate]);

  const handleRetry = () => {
    navigate('/');
  };

  if (error) {
    return (
      <Box h="calc(100vh - 8rem)" display="flex" alignItems="center" justifyContent="center">
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Authentication Failed
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button mt={4} colorScheme="red" onClick={handleRetry}>
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 8rem)" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="brand.500" />
        <Text>Authenticating with EVE Online...</Text>
      </VStack>
    </Box>
  );
};

export default Callback;
