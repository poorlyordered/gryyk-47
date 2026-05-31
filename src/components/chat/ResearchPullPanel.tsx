import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Newspaper, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useChatStore } from '../../store/chat';
import { getResearchSnapshot, ResearchSnapshot } from '../../services/research-pull';

const processingStatuses = new Set(['queued', 'raw_captured', 'processing']);

function formatDate(value?: string) {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString();
}

function buildBriefMessage(result: ResearchSnapshot) {
  const briefDocument = result.brief;
  if (!briefDocument) {
    return 'No processed research brief is available yet.';
  }

  const brief = briefDocument.brief;
  const actions = brief.recommendedActions?.length
    ? `\n\nRecommended actions:\n${brief.recommendedActions.map((action) => `- ${action}`).join('\n')}`
    : '';
  const watchlist = brief.watchlist?.length
    ? `\n\nWatchlist:\n${brief.watchlist.map((item) => `- ${item}`).join('\n')}`
    : '';
  const sourceList = briefDocument.items?.length
    ? `\n\nSources:\n${briefDocument.items
        .slice(0, 6)
        .map((item) => `- ${item.title} (${item.url})`)
        .join('\n')}`
    : '';

  return [
    '# Official EVE News Brief',
    `Created: ${formatDate(briefDocument.createdAt)}`,
    `Model: ${briefDocument.model || 'Unknown model'}`,
    `Sources: ${briefDocument.sourceCount ?? briefDocument.sources?.length ?? 0}`,
    `Confidence: ${Math.round((brief.confidence || 0) * 100)}%`,
    '',
    brief.briefMarkdown || brief.executiveSummary,
    actions,
    watchlist,
    brief.memory ? `\n\nMemory captured:\n${brief.memory}` : '',
    sourceList,
  ].filter(Boolean).join('\n');
}

const ResearchPullPanel: React.FC = () => {
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const corporationId = useAuthStore((state) => state.character?.corporation?.id?.toString());
  const addMessage = useChatStore((state) => state.addMessage);
  const toast = useToast();

  const loadResearch = useCallback(async (announce = false) => {
    if (!corporationId) return;

    setIsLoading(true);
    try {
      const result = await getResearchSnapshot({ corporationId });
      setSnapshot(result);

      const status = result.request?.status;
      if (status === 'processed' && result.brief) {
        if (announce) {
          addMessage({
            sender: 'assistant',
            content: buildBriefMessage(result),
          });
        }

        toast({
          title: 'Research brief loaded',
          description: `Processed ${formatDate(result.brief.createdAt)}`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      if (status && processingStatuses.has(status)) {
        const message = `Research is processing. Current status: ${status}.`;
        if (announce) {
          addMessage({ sender: 'system', content: message });
        }
        toast({
          title: 'Research is processing',
          description: `Current status: ${status}`,
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      if (status === 'failed') {
        const errorMessage = result.request?.errorMessage || 'No error message was provided.';
        if (announce) {
          addMessage({
            sender: 'system',
            content: `Research processing failed: ${errorMessage}`,
          });
        }
        toast({
          title: 'Research processing failed',
          description: errorMessage,
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
        return;
      }

      if (announce) {
        addMessage({
          sender: 'system',
          content: 'No OvernightDesk research request is available yet.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Research lookup failed';
      if (announce) {
        addMessage({
          sender: 'system',
          content: `Research lookup failed: ${message}`,
        });
      }
      toast({
        title: 'Research lookup failed',
        description: message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, corporationId, toast]);

  useEffect(() => {
    if (corporationId) {
      void loadResearch(false);
    }
  }, [corporationId]);

  const status = snapshot?.request?.status;
  const brief = snapshot?.brief;
  const confidence = brief?.brief?.confidence;

  return (
    <Box p={4} bg="gray.900" borderRadius="lg">
      <HStack justify="space-between" mb={3} align="start">
        <HStack>
          <Newspaper size={18} />
          <Box>
            <Text fontWeight="semibold">Official EVE Research</Text>
            <Text fontSize="xs" color="gray.400">
              {status ? `Status: ${status}` : 'No request found'}
            </Text>
          </Box>
        </HStack>
        <Tooltip label="Refresh the latest OvernightDesk research status and processed brief." placement="top" hasArrow>
          <Button
            size="sm"
            colorScheme="cyan"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => loadResearch(true)}
            isLoading={isLoading}
            isDisabled={!corporationId}
          >
            Refresh
          </Button>
        </Tooltip>
      </HStack>

      <VStack align="stretch" spacing={2}>
        <HStack spacing={2} flexWrap="wrap">
          {status && <Badge colorScheme={status === 'processed' ? 'green' : status === 'failed' ? 'red' : 'yellow'}>{status}</Badge>}
          {brief?.model && <Badge colorScheme="purple">{brief.model}</Badge>}
          {typeof confidence === 'number' && <Badge colorScheme="blue">{Math.round(confidence * 100)}% confidence</Badge>}
        </HStack>

        {brief ? (
          <Text fontSize="sm" color="gray.300">
            Latest brief: {formatDate(brief.createdAt)} · Sources: {brief.sourceCount ?? brief.sources?.length ?? 0}
          </Text>
        ) : status === 'failed' ? (
          <Text fontSize="sm" color="red.200">
            {snapshot?.request?.errorMessage || 'Research processing failed.'}
          </Text>
        ) : processingStatuses.has(status || '') ? (
          <Text fontSize="sm" color="gray.300">
            Research is processing in OvernightDesk.
          </Text>
        ) : (
          <Text fontSize="sm" color="gray.400">
            OvernightDesk has not published a processed brief yet.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default ResearchPullPanel;
