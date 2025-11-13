import React from 'react';
import { Button, Box, Text, Tag, Spinner, HStack, Tooltip } from '@chakra-ui/react';
import { useChatStore } from '../../store/chat';
import { useAuthStore } from '../../store/auth';
import { Play, Loader, BrainCircuit, Mic, MessageSquare, Save } from 'lucide-react';

const stateConfig = {
  idle: {
    icon: Play,
    label: 'Start Strategic Session',
    colorScheme: 'brand',
    showSpinner: false,
  },
  loading_context: {
    icon: Loader,
    label: 'Loading Context...',
    colorScheme: 'yellow',
    showSpinner: true,
  },
  analyzing: {
    icon: BrainCircuit,
    label: 'Analyzing...',
    colorScheme: 'purple',
    showSpinner: true,
  },
  recommending: {
    icon: Mic,
    label: 'Ready for Input',
    colorScheme: 'blue',
    showSpinner: false,
  },
  user_feedback: {
    icon: MessageSquare,
    label: 'Awaiting Feedback...',
    colorScheme: 'gray',
    showSpinner: false,
  },
  updating_matrix: {
    icon: Save,
    label: 'Updating Strategic Matrix...',
    colorScheme: 'teal',
    showSpinner: true,
  },
};

const StrategicSessionManager: React.FC = () => {
  const { workflow, startStrategicSession } = useChatStore(state => ({
    workflow: state.workflow,
    startStrategicSession: state.startStrategicSession
  }));
  const corporationId = useAuthStore(state => state.character?.corporation?.id?.toString());

  const { sessionState, contextError } = workflow;
  const config = stateConfig[sessionState];

  const handleStartSession = () => {
    if (sessionState === 'idle' && corporationId) {
      startStrategicSession(corporationId);
    }
  };

  return (
    <Box p={4} bg="gray.900" borderRadius="lg" mb={4}>
      <HStack justify="space-between">
        <Tag size="lg" colorScheme={config.colorScheme} variant="solid" borderRadius="full">
          <HStack>
            {config.showSpinner ? <Spinner size="xs" mr={2} /> : <config.icon size={16} />}
            <Text>{config.label}</Text>
          </HStack>
        </Tag>
        <Tooltip
          label="Start a comprehensive strategic analysis session with full corporation context. Loads all Strategic Matrix documents and live EVE data for personalized strategic planning and recommendations."
          placement="top"
          hasArrow
          maxW="300px"
        >
          <Button
            onClick={handleStartSession}
            colorScheme="brand"
            leftIcon={<Play />}
            isDisabled={sessionState !== 'idle' || !corporationId}
          >
            New Session
          </Button>
        </Tooltip>
      </HStack>
      {contextError && (
        <Text color="red.400" mt={2} fontSize="sm">
          Error: {contextError}
        </Text>
      )}
    </Box>
  );
};

export default StrategicSessionManager; 