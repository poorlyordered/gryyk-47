import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { Newspaper, Search } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useChatStore } from '../../store/chat';
import { runResearchPull } from '../../services/research-pull';

const focusOptions = [
  'All strategic areas',
  'Expansion and patch changes',
  'Market and economy',
  'Industry and mining',
  'Recruiting and community',
  'Risk and warfare',
];

const ResearchPullPanel: React.FC = () => {
  const [focus, setFocus] = useState(focusOptions[0]);
  const [isPulling, setIsPulling] = useState(false);
  const corporationId = useAuthStore((state) => state.character?.corporation?.id?.toString());
  const addMessage = useChatStore((state) => state.addMessage);
  const toast = useToast();

  const handlePull = async () => {
    if (!corporationId || isPulling) return;

    setIsPulling(true);
    addMessage({
      sender: 'system',
      content: `Research pull started. Focus: ${focus}. Pulling official EVE news and asking Gryyk to process strategic impact...`,
    });

    try {
      const result = await runResearchPull({
        corporationId,
        focus,
        limit: 12,
      });

      const actions = result.brief.recommendedActions?.length
        ? `\n\nRecommended actions:\n${result.brief.recommendedActions.map((action) => `- ${action}`).join('\n')}`
        : '';
      const watchlist = result.brief.watchlist?.length
        ? `\n\nWatchlist:\n${result.brief.watchlist.map((item) => `- ${item}`).join('\n')}`
        : '';
      const sourceList = result.items
        .slice(0, 6)
        .map((item) => `- ${item.title} (${item.url})`)
        .join('\n');

      addMessage({
        sender: 'assistant',
        content: `# Research Brief\n\n${result.brief.briefMarkdown}${actions}${watchlist}\n\nMemory captured: ${result.brief.memory}\n\nSources processed: ${result.itemCount}\n${sourceList}`,
      });

      toast({
        title: 'Research brief complete',
        description: 'Official EVE news was processed and saved to strategy memory.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Research pull failed';
      addMessage({
        sender: 'system',
        content: `Research pull failed: ${message}`,
      });
      toast({
        title: 'Research pull failed',
        description: message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <Box p={4} bg="gray.900" borderRadius="lg">
      <HStack justify="space-between" mb={3}>
        <HStack>
          <Newspaper size={18} />
          <Text fontWeight="semibold">Research Pull</Text>
        </HStack>
        <Tooltip
          label="Pull official EVE news and use Gryyk to summarize strategic impact, opportunities, risks, and actions."
          placement="top"
          hasArrow
          maxW="320px"
        >
          <Button
            size="sm"
            colorScheme="cyan"
            leftIcon={<Search size={16} />}
            onClick={handlePull}
            isLoading={isPulling}
            isDisabled={!corporationId}
          >
            Pull
          </Button>
        </Tooltip>
      </HStack>

      <FormControl>
        <FormLabel fontSize="sm">Focus</FormLabel>
        <Select
          size="sm"
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          bg="gray.800"
          isDisabled={isPulling}
        >
          {focusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ResearchPullPanel;
