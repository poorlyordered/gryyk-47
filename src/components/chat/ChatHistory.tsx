import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Spinner,
  useToast,
  Tooltip,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { Search, Trash2, MessageSquare, Clock } from 'lucide-react';
import { loadUserSessions, deleteConversationSession, type ChatSession } from '../../services/chat-persistence';
import { findSimilarConversations } from '../../services/pinecone-chat-history';

interface ChatHistoryProps {
  onSelectSession?: (sessionId: string) => void;
  currentSessionId?: string;
}

export default function ChatHistory({ onSelectSession, currentSessionId }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'recent' | 'semantic'>('recent');
  const toast = useToast();

  const loadRecentSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedSessions = await loadUserSessions(undefined, 20);
      setSessions(loadedSessions);
      setSearchMode('recent');
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: 'Failed to load chat history',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load recent sessions on mount
  useEffect(() => {
    loadRecentSessions();
  }, [loadRecentSessions]);

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      loadRecentSessions();
      return;
    }

    setIsLoading(true);
    try {
      const results = await findSimilarConversations(searchQuery, {
        topK: 10,
        minScore: 0.6,
      });

      // Load full session data for the results
      const allSessions = await loadUserSessions(undefined, 100);
      const matchedSessions = allSessions.filter(session =>
        results.some(r => r.sessionId === session.sessionId)
      );

      setSessions(matchedSessions);
      setSearchMode('semantic');

      if (matchedSessions.length === 0) {
        toast({
          title: 'No similar conversations found',
          description: 'Try a different search query',
          status: 'info',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Semantic search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Falling back to recent conversations',
        status: 'warning',
        duration: 3000,
      });
      loadRecentSessions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      await deleteConversationSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      toast({
        title: 'Conversation deleted',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Failed to delete conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getConversationPreview = (session: ChatSession): string => {
    const userMessages = session.messages.filter(m => m.sender === 'user');
    if (userMessages.length === 0) return 'New conversation';
    return userMessages[0].content.substring(0, 60) + (userMessages[0].content.length > 60 ? '...' : '');
  };

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={4}
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <HStack mb={4} justify="space-between">
        <HStack>
          <MessageSquare size={20} />
          <Text fontSize="lg" fontWeight="bold">
            Chat History
          </Text>
        </HStack>
        {searchMode === 'semantic' && (
          <Button size="xs" onClick={loadRecentSessions} variant="ghost">
            Show Recent
          </Button>
        )}
      </HStack>

      {/* Search */}
      <HStack mb={4}>
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
          size="sm"
          bg="gray.700"
        />
        <Tooltip label="Semantic search using AI">
          <IconButton
            aria-label="Search"
            icon={<Search size={18} />}
            onClick={handleSemanticSearch}
            size="sm"
            colorScheme="blue"
            isLoading={isLoading}
          />
        </Tooltip>
      </HStack>

      <Divider mb={3} />

      {/* Sessions List */}
      <VStack
        spacing={2}
        align="stretch"
        flex="1"
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'gray.600',
            borderRadius: '4px',
          },
        }}
      >
        {isLoading && sessions.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Spinner size="md" />
            <Text mt={2} fontSize="sm" color="gray.400">
              Loading conversations...
            </Text>
          </Box>
        ) : sessions.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text fontSize="sm" color="gray.400">
              {searchMode === 'semantic'
                ? 'No conversations found'
                : 'No chat history yet'}
            </Text>
          </Box>
        ) : (
          sessions.map((session) => (
            <Box
              key={session.sessionId}
              p={3}
              bg={session.sessionId === currentSessionId ? 'blue.900' : 'gray.700'}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: 'gray.600' }}
              onClick={() => onSelectSession?.(session.sessionId)}
              position="relative"
            >
              <HStack justify="space-between" mb={1}>
                <HStack spacing={2}>
                  <Clock size={14} />
                  <Text fontSize="xs" color="gray.400">
                    {formatDate(session.updatedAt)}
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Badge size="sm" colorScheme="blue">
                    {session.messages.length}
                  </Badge>
                  <IconButton
                    aria-label="Delete conversation"
                    icon={<Trash2 size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => handleDeleteSession(session.sessionId, e)}
                  />
                </HStack>
              </HStack>
              <Text fontSize="sm" noOfLines={2}>
                {getConversationPreview(session)}
              </Text>
              {session.tags && session.tags.length > 0 && (
                <HStack mt={2} spacing={1}>
                  {session.tags.map((tag, i) => (
                    <Badge key={i} size="xs" colorScheme="purple">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              )}
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}
