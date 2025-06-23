import React from 'react';
import { Heading, Container } from '@chakra-ui/react';
import SystemPromptEditor from '../components/chat/SystemPromptEditor';

const SystemPrompt: React.FC = () => {
  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>System Prompt Settings</Heading>
      <SystemPromptEditor />
    </Container>
  );
};

export default SystemPrompt;
