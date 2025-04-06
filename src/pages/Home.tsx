import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Image,
  SimpleGrid,
  HStack,
} from '@chakra-ui/react';
import { Bot, Shield, Brain, Database } from 'lucide-react';
import { generateAuthUrl } from '../services/eve';
import { useAuthStore } from '../store/auth';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, text }) => {
  return (
    <VStack
      align="start"
      p={6}
      bg="gray.800"
      borderRadius="lg"
      border="1px"
      borderColor="gray.700"
    >
      <Box color="brand.500">{icon}</Box>
      <Heading size="md">{title}</Heading>
      <Text color="gray.400">{text}</Text>
    </VStack>
  );
};

const Home: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('eve_auth_state', state);
    window.location.href = generateAuthUrl(state);
  };

  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={12} align="center" textAlign="center">
        <VStack spacing={4}>
          <Heading
            size="2xl"
            bgGradient="linear(to-r, brand.400, purple.400)"
            bgClip="text"
          >
            Gryyk-47: Your EVE Online AI Strategic Advisor
          </Heading>
          <Text fontSize="xl" color="gray.400" maxW="2xl">
            Enhance your corporation management with advanced AI assistance.
            Gryyk-47 helps you make informed decisions and maintain institutional
            knowledge.
          </Text>
          {!isAuthenticated && (
            <HStack spacing={4} mt={8}>
              <Button
                size="lg"
                colorScheme="blue"
                onClick={handleLogin}
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
            </HStack>
          )}
          {!isAuthenticated && (
            <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
              This application uses EVE Online's SSO for secure authentication.
              No passwords are stored by this application.
            </Text>
          )}
        </VStack>

        <Image
          src="https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?auto=format&fit=crop&w=2000&q=80"
          alt="Space"
          borderRadius="lg"
          maxH="400px"
          objectFit="cover"
        />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
          <Feature
            icon={<Bot size={24} />}
            title="AI Assistant"
            text="Get strategic advice and insights powered by advanced AI"
          />
          <Feature
            icon={<Shield size={24} />}
            title="Security"
            text="Secure authentication through EVE Online SSO"
          />
          <Feature
            icon={<Brain size={24} />}
            title="Smart Analysis"
            text="Intelligent analysis of market trends and corporation data"
          />
          <Feature
            icon={<Database size={24} />}
            title="Knowledge Base"
            text="Maintain and access your corporation's institutional knowledge"
          />
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default Home;
