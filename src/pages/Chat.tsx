<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Button,
  HStack,
  Text,
  Avatar,
  Flex,
  Textarea,
  Spinner,
  useColorModeValue,
=======
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  Flex,
>>>>>>> 1ed7324 (Initial commit)
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
<<<<<<< HEAD
import { Bot, Send, Clock, Settings } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { CollapsiblePanel, UpdateProcessor } from '../features/strategicMatrix';

const Chat = () => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isTyping, 
    selectedModel, 
    availableModels,
    isLoadingModels,
    sendMessage, 
=======
import { Settings } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { CollapsiblePanel, UpdateProcessor } from '../features/strategicMatrix';
import MessageList from '../components/chat/MessageList';
import { Link as RouterLink } from 'react-router-dom';
import StrategicSessionManager from '../components/chat/StrategicSessionManager';
import UpdateProposal from '../components/chat/UpdateProposal';

const Chat = () => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    selectedModel,
    availableModels,
    isLoadingModels,
>>>>>>> 1ed7324 (Initial commit)
    setSelectedModel,
    fetchModels
  } = useChatStore();
  const character = useAuthStore((state) => state.character);

<<<<<<< HEAD
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
=======
  // Generate a session ID based on character ID and timestamp
  const sessionId = React.useMemo(() => {
    const characterId = character?.id || 'anonymous';
    return `${characterId}-${Date.now()}`;
  }, [character?.id]);

  // Get corporation ID as string
  const corpId = React.useMemo(() => {
    return character?.corporation?.id?.toString() || '';
  }, [character?.corporation?.id]);
>>>>>>> 1ed7324 (Initial commit)

  // Fetch models when settings panel is opened
  useEffect(() => {
    if (showSettings) {
      fetchModels();
    }
  }, [showSettings, fetchModels]);

<<<<<<< HEAD
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

=======
>>>>>>> 1ed7324 (Initial commit)
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

<<<<<<< HEAD
  const userBgColor = useColorModeValue('brand.600', 'brand.500');
  const aiBgColor = useColorModeValue('gray.700', 'gray.800');

=======
>>>>>>> 1ed7324 (Initial commit)
  return (
    <Flex h="calc(100vh - 8rem)" gap={4}>
      {/* Strategic Matrix Update Processor - Hidden component */}
      <UpdateProcessor />
      {/* Main Chat Column */}
      <Box flex="1" display="flex" flexDirection="column">
<<<<<<< HEAD
=======
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
>>>>>>> 1ed7324 (Initial commit)
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

<<<<<<< HEAD
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
          <VStack spacing={6} align="stretch">
            {messages.length === 0 ? (
              <Flex
                height="100%"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
                opacity={0.7}
                p={10}
              >
                <Bot size={48} />
                <Text mt={4} fontSize="lg">
                  Start a conversation with Gryyk-47
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Your EVE Online AI Strategic Advisor
                </Text>
              </Flex>
            ) : (
              messages.map((message) => (
                message.sender !== 'system' && (
                  <Flex
                    key={message.id}
                    direction="column"
                    align={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <HStack
                      maxW={{ base: '85%', md: '70%' }}
                      bg={message.sender === 'user' ? userBgColor : aiBgColor}
                      p={4}
                      borderRadius="lg"
                      spacing={4}
                      boxShadow="md"
                    >
                      {message.sender === 'assistant' ? (
                        <Avatar
                          icon={<Bot size={24} />}
                          bg="brand.500"
                          name="Gryyk-47"
                        />
                      ) : (
                        <Avatar
                          src={character?.portrait}
                          name={character?.name || 'User'}
                        />
                      )}
                      <Text whiteSpace="pre-wrap">{message.content}</Text>
                    </HStack>
                    <HStack spacing={1} mt={1} opacity={0.7}>
                      <Clock size={12} />
                      <Text fontSize="xs">{formatTimestamp(message.timestamp)}</Text>
                    </HStack>
                  </Flex>
                )
              ))
            )}
            {isTyping && (
              <Flex align="flex-start">
                <HStack
                  maxW={{ base: '85%', md: '70%' }}
                  bg={aiBgColor}
                  p={4}
                  borderRadius="lg"
                  spacing={4}
                  boxShadow="md"
                >
                  <Avatar
                    icon={<Bot size={24} />}
                    bg="brand.500"
                    name="Gryyk-47"
                  />
                  <Spinner size="sm" color="brand.500" />
                </HStack>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </VStack>
=======
        {/* AI Update Proposal */}
        <UpdateProposal />

        {/* Strategic Session Manager */}
        <StrategicSessionManager />
        
        {/* MongoDB-backed Message List */}
        <Box
          flex="1"
          bg="gray.800"
          borderRadius="lg"
          mb={4}
          overflow="hidden"
        >
          <MessageList 
            sessionId={sessionId} 
            corpId={corpId} 
          />
>>>>>>> 1ed7324 (Initial commit)
        </Box>

        <HStack spacing={4}>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            size="lg"
            variant="outline"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Button>
<<<<<<< HEAD
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            size="md"
            bg="gray.800"
            resize="none"
            rows={2}
            borderRadius="lg"
          />
          <Button
            onClick={handleSend}
            size="lg"
            isDisabled={!input.trim() || isTyping}
            leftIcon={<Send size={20} />}
            height="100%"
          >
            Send
          </Button>
        </HStack>
      </Box>
      
      {/* Strategic Matrix Panel - Right Side */}
      <Box w={{ base: '0', md: '300px', lg: '350px' }} display={{ base: 'none', md: 'block' }}>
        <CollapsiblePanel />
      </Box>
=======
        </HStack>
      </Box>

      {/* Strategic Matrix Panel */}
      <CollapsiblePanel />
>>>>>>> 1ed7324 (Initial commit)
    </Flex>
  );
};

export default Chat;
