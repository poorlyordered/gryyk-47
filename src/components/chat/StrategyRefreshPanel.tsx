import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Textarea,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useChatStore } from '../../store/chat';
import { runStrategyRefresh } from '../../services/strategy-refresh';

interface StrategyRefreshPanelProps {
  sessionId?: string;
}

const focusOptions = [
  'All strategic areas',
  'Recruiting flywheel',
  'Income and market flywheel',
  'Mining and operations cadence',
  'Mission running and member progression',
  'Risk, diplomacy, and threats',
];

const StrategyRefreshPanel: React.FC<StrategyRefreshPanelProps> = ({ sessionId }) => {
  const [focus, setFocus] = useState(focusOptions[0]);
  const [leadershipInput, setLeadershipInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const corporationId = useAuthStore((state) => state.character?.corporation?.id?.toString());
  const addMessage = useChatStore((state) => state.addMessage);
  const toast = useToast();

  const handleRefresh = async () => {
    if (!corporationId || isRefreshing) return;

    setIsRefreshing(true);
    addMessage({
      sender: 'system',
      content: `Strategy update started. Focus: ${focus}. Pulling current context, memory, decisions, and Strategic Matrix documents...`,
    });

    try {
      const result = await runStrategyRefresh({
        corporationId,
        sessionId,
        focus,
        leadershipInput,
      });

      const { report, contextSummary } = result;
      const actionList = report.suggestedActions?.length
        ? `\n\nSuggested actions:\n${report.suggestedActions.map((action) => `- ${action}`).join('\n')}`
        : '';
      const questions = report.questionsForLeadership?.length
        ? `\n\nQuestions for leadership:\n${report.questionsForLeadership.map((question) => `- ${question}`).join('\n')}`
        : '';

      addMessage({
        sender: 'assistant',
        content: `# Strategy Update\n\n${report.progressReportMarkdown}${actionList}${questions}\n\nMemory captured: ${report.strategicMemory}\n\nContext used: ${contextSummary.strategicDocuments} matrix docs, ${contextSummary.recentMessages} recent messages, ${contextSummary.strategicDecisions} prior decisions, ${contextSummary.agentExperiences} memory records.`,
      });

      toast({
        title: 'Strategy update complete',
        description: 'Report and strategic memory were saved.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Strategy update failed';
      addMessage({
        sender: 'system',
        content: `Strategy update failed: ${message}`,
      });
      toast({
        title: 'Strategy update failed',
        description: message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Box p={4} bg="gray.900" borderRadius="lg">
      <HStack justify="space-between" mb={3}>
        <HStack>
          <TrendingUp size={18} />
          <Text fontWeight="semibold">Strategy Update</Text>
        </HStack>
        <Tooltip
          label="Run a memory-backed strategy refresh using live EVE data, Strategic Matrix docs, prior chats, decisions, and saved outcomes."
          placement="top"
          hasArrow
          maxW="320px"
        >
          <Button
            size="sm"
            colorScheme="teal"
            leftIcon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            isDisabled={!corporationId}
          >
            Refresh
          </Button>
        </Tooltip>
      </HStack>

      <FormControl mb={3}>
        <FormLabel fontSize="sm">Focus</FormLabel>
        <Select
          size="sm"
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          bg="gray.800"
          isDisabled={isRefreshing}
        >
          {focusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Leadership input</FormLabel>
        <Textarea
          size="sm"
          minH="84px"
          maxH="160px"
          resize="vertical"
          bg="gray.800"
          value={leadershipInput}
          onChange={(event) => setLeadershipInput(event.target.value)}
          placeholder="Add changes, goals, constraints, or questions for this cycle."
          isDisabled={isRefreshing}
        />
      </FormControl>
    </Box>
  );
};

export default StrategyRefreshPanel;
