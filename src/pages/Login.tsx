import { Box, Button, Heading, Text, VStack, Image, useColorModeValue } from '@chakra-ui/react';
import { generateAuthUrl } from '../services/eve';

const Login = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('eve_auth_state', state);
    window.location.href = generateAuthUrl(state);
  };

  return (
    <Box 
      minH="calc(100vh - 8rem)" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg={bgColor}
      p={4}
    >
      <Box 
        maxW="md" 
        w="full" 
        bg={cardBgColor} 
        p={8} 
        borderRadius="lg" 
        boxShadow="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6} align="center">
          <Heading as="h1" size="xl">Gryyk-47</Heading>
          <Text fontSize="lg" textAlign="center">
            EVE Online AI Strategic Advisor
          </Text>
          
          <Box py={4}>
            <Text mb={4} textAlign="center">
              Sign in with your EVE Online account to continue
            </Text>
            <Button
              onClick={handleLogin}
              size="lg"
              width="full"
              colorScheme="blue"
              leftIcon={
                <Image 
                  src="https://web.ccpgamescdn.com/eveonlineassets/developers/eve-sso-login-white-small.png" 
                  alt="EVE Online Logo"
                  height="24px"
                  display="inline"
                />
              }
            >
              Login with EVE Online
            </Button>
          </Box>
          
          <Text fontSize="sm" color="gray.500" textAlign="center">
            This application uses EVE Online's SSO for secure authentication.
            No passwords are stored by this application.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;
