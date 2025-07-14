import React from 'react';
import {
  Box,
  VStack,
  Text,
  HStack,
  Avatar,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { useChatStore } from '../../store/chat';
import { useAuthStore } from '../../store/auth';
import type { Message } from '../../types/chat';
import OrchestrationStatus from './OrchestrationStatus';

export default function ChatMessageList() {
  const { messages, isTyping } = useChatStore();
  const character = useAuthStore((state) => state.character);
  
  const userBg = useColorModeValue('blue.500', 'blue.600');
  const assistantBg = useColorModeValue('gray.100', 'gray.700');
  const systemBg = useColorModeValue('yellow.100', 'yellow.800');

  // Parse orchestration metadata from message content (if available)
  const parseOrchestrationData = (content: string) => {
    // Look for orchestration indicators in the message
    const specialistMatch = content.match(/\*\*([^*]+) Specialist\*\*/g);
    const confidenceMatch = content.match(/Analysis confidence: ([^*]+)\*\)/);
    
    const specialistsConsulted = specialistMatch 
      ? specialistMatch.map(match => match.replace(/\*\*([^*]+) Specialist\*\*/, '$1').toLowerCase())
      : [];
    
    const confidence = confidenceMatch 
      ? parseFloat(confidenceMatch[1].replace('%', '')) / 100
      : undefined;

    const isOrchestrated = content.includes('Specialist Consultation Summary') || 
                          content.includes('Analysis confidence') ||
                          specialistsConsulted.length > 0;

    return {
      isOrchestrated,
      specialistsConsulted,
      confidence
    };
  };

  const formatMessageContent = (content: string) => {
    // Remove orchestration metadata for cleaner display
    return content
      .replace(/\*\*Specialist Consultation Summary:\*\*[\s\S]*?(?=\n\n|\n$|$)/g, '')
      .replace(/\*Analysis confidence: [^*]+\*/g, '')
      .replace(/\*This analysis has been stored in my memory for future reference\.\*/g, '')
      .trim();
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const orchestrationData = !isUser ? parseOrchestrationData(message.content) : null;
    const cleanContent = formatMessageContent(message.content);

    return (
      <Box
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        maxW="85%"
        mb={3}
      >
        <HStack spacing={3} align="flex-start">
          {!isUser && (
            <Avatar
              size="sm"
              name={isSystem ? 'System' : 'Gryyk-47'}
              bg={isSystem ? 'yellow.500' : 'blue.500'}
              color="white"
            />
          )}
          
          <Box flex={1}>
            <Box
              bg={isUser ? userBg : isSystem ? systemBg : assistantBg}
              color={isUser ? 'white' : 'inherit'}
              px={4}
              py={3}
              borderRadius="lg"
              borderBottomLeftRadius={isUser ? 'lg' : 'sm'}
              borderBottomRightRadius={isUser ? 'sm' : 'lg'}
              wordBreak="break-word"
            >
              {!isUser && !isSystem && (
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="bold" color="blue.300">
                    Gryyk-47
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </HStack>
              )}
              
              {isSystem && (
                <HStack justify="space-between" mb={2}>
                  <Badge colorScheme="yellow" size="sm">
                    System
                  </Badge>
                  <Text fontSize="xs" color="gray.600">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </HStack>
              )}

              <Text fontSize="sm" whiteSpace="pre-wrap">
                {cleanContent}
              </Text>
            </Box>

            {/* Show orchestration status for assistant messages */}
            {!isUser && !isSystem && orchestrationData && (
              <OrchestrationStatus
                isOrchestrated={orchestrationData.isOrchestrated}
                specialistsConsulted={orchestrationData.specialistsConsulted}
                confidence={orchestrationData.confidence}
              />
            )}
          </Box>

          {isUser && (
            <Avatar
              size="sm"
              name={character?.name || 'User'}
              src={character?.portrait}
            />
          )}
        </HStack>
      </Box>
    );
  };

  return (
    <VStack spacing={0} align="stretch" px={4} py={2}>
      {messages.length === 0 ? (
        <Box textAlign="center" py={8} color="gray.500">
          <Text fontSize="lg" mb={2}>Welcome to Gryyk-47</Text>
          <Text fontSize="sm">
            Your AI strategic advisor for EVE Online. Ask me about corporation management, 
            strategic planning, or specific game mechanics.
          </Text>
          <Text fontSize="xs" mt={4} color="gray.400">
            💡 Try asking about recruitment strategies, mining operations, or market analysis 
            to see specialist consultation in action.
          </Text>
        </Box>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}

      {/* Typing indicator */}
      {isTyping && (
        <Box alignSelf="flex-start" maxW="85%" mb={3}>
          <HStack spacing={3} align="flex-start">
            <Avatar
              size="sm"
              name="Gryyk-47"
              bg="blue.500"
              color="white"
            />
            <Box
              bg={assistantBg}
              px={4}
              py={3}
              borderRadius="lg"
              borderBottomLeftRadius="sm"
            >
              <HStack spacing={1}>
                <Box w={2} h={2} bg="blue.400" borderRadius="full" animation="pulse 1.4s infinite" />
                <Box w={2} h={2} bg="blue.400" borderRadius="full" animation="pulse 1.4s infinite 0.2s" />
                <Box w={2} h={2} bg="blue.400" borderRadius="full" animation="pulse 1.4s infinite 0.4s" />
              </HStack>
            </Box>
          </HStack>
        </Box>
      )}
    </VStack>
  );
}