import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Flex,
  Textarea,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Send } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { CollapsiblePanel, UpdateProcessor } from '../features/strategicMatrix';
import ChatMessageList from '../components/chat/ChatMessageList';
import { Link as RouterLink } from 'react-router-dom';
import StrategicSessionManager from '../components/chat/StrategicSessionManager';
import UpdateProposal from '../components/chat/UpdateProposal';
import OrchestrationControls from '../components/chat/OrchestrationControls';
import { useAIChat } from '../hooks/useAIChat';

const Chat = () => {
  const [showSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const {
    selectedModel,
    availableModels,
    isLoadingModels,
    setSelectedModel,
    fetchModels
  } = useChatStore();

  // Use AI SDK for chat functionality
  const {
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useAIChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isLoading]);

  // Fetch models when settings panel is opened
  useEffect(() => {
    if (showSettings) {
      fetchModels();
    }
  }, [showSettings, fetchModels]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await handleSubmit(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  return (
    <Flex h="calc(100vh - 8rem)" gap={4}>
      {/* Strategic Matrix Update Processor - Hidden component */}
      <UpdateProcessor />
      {/* Main Chat Column */}
      <Box flex="1" display="flex" flexDirection="column">
        {/* ESI Scope navigation link */}
        <Box mb={2} textAlign="center">
          <Text fontSize="lg" fontWeight="bold">
            <Box
              as={RouterLink}
              to="/profile/eve-sso"
              color="blue.300"
              _hover={{ textDecoration: 'underline', color: 'blue.400' }}
              display="inline"
            >
              esi-location.read_location.v1
            </Box>
          </Text>
        </Box>
        {showSettings && (
          <Box mb={4} p={4} bg="gray.800" borderRadius="lg">
            <FormControl>
              <FormLabel>AI Model</FormLabel>
              <HStack mb={2}>
                <Select
                  value={selectedModel}
                  onChange={handleModelChange}
                  bg="gray.700"
                  isDisabled={isLoadingModels}
                >
                  {[...availableModels]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                </Select>
                <Button 
                  onClick={fetchModels} 
                  isLoading={isLoadingModels}
                  size="sm"
                >
                  Refresh
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {availableModels.find(m => m.id === selectedModel)?.description || 'Loading model information...'}
              </Text>
            </FormControl>
          </Box>
        )}
        <Box
          ref={chatContainerRef}
          flex="1"
          overflowY="auto"
          p={4}
          bg="gray.800"
          borderRadius="lg"
          mb={4}
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'gray.600',
              borderRadius: '8px',
            },
          }}
        >
          <ChatMessageList />
          <div ref={messagesEndRef} />
        </Box>
        <Box mt={2} as="form" onSubmit={handleFormSubmit}>
          <Textarea
            value={input}
            onChange={(e) => handleInputChange(e)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            size="md"
            minH="48px"
            maxH="120px"
            resize="vertical"
            mb={2}
            isDisabled={isLoading}
          />
          <Button
            leftIcon={<Send size={18} />}
            colorScheme="blue"
            type="submit"
            isLoading={isLoading}
            isDisabled={!input.trim() || isLoading}
            w="100%"
          >
            Send
          </Button>
        </Box>
      </Box>
      {/* Sidebar Column */}
      <Box w={{ base: '0', md: '350px' }} display={{ base: 'none', md: 'block' }}>
        <VStack spacing={4} align="stretch">
          <OrchestrationControls />
          <StrategicSessionManager />
          <UpdateProposal />
          <CollapsiblePanel />
        </VStack>
      </Box>
    </Flex>
  );
};

export default Chat;
