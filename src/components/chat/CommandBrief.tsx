import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  GridItem,
  HStack,
  ListItem,
  Skeleton,
  Text,
  Tooltip,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { AlertTriangle, Brain, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { CommandBriefSnapshot, CommandBriefStatus } from '../../types/commandBrief';
import { getCommandBriefSourceCount } from '../../services/command-brief';

interface CommandBriefProps {
  snapshot: CommandBriefSnapshot | null;
  isLoading: boolean;
  onRefresh: () => void;
  canRefresh: boolean;
}

const statusLabels: Record<CommandBriefStatus, string> = {
  queued: 'Queued',
  raw_captured: 'Raw Captured',
  processing: 'Processing',
  processed: 'Processed',
  failed: 'Failed',
  unavailable: 'Unavailable',
  absent: 'No Request',
};

const statusColor: Record<CommandBriefStatus, string> = {
  queued: 'yellow',
  raw_captured: 'yellow',
  processing: 'yellow',
  processed: 'green',
  failed: 'red',
  unavailable: 'red',
  absent: 'gray',
};

function formatDate(value?: string) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

function formatConfidence(value?: number) {
  if (typeof value !== 'number') return 'Unknown';
  return `${Math.round(value * 100)}%`;
}

function getStatusMessage(snapshot: CommandBriefSnapshot | null) {
  if (!snapshot) return 'Loading command brief status...';

  switch (snapshot.status) {
    case 'processed':
      return snapshot.freshness === 'stale'
        ? 'Latest processed brief is available but may be stale.'
        : 'Latest processed brief is ready.';
    case 'queued':
    case 'raw_captured':
    case 'processing':
      return snapshot.brief
        ? 'Newer research is processing; showing the latest processed brief as context.'
        : 'Research is processing in OvernightDesk.';
    case 'failed':
      return snapshot.brief
        ? 'Latest research failed; showing the previous processed brief as context.'
        : 'Latest research failed before a processed brief was available.';
    case 'unavailable':
      return snapshot.brief
        ? 'Command brief lookup failed; showing the previous processed brief as context.'
        : 'Command brief lookup failed.';
    case 'absent':
      return 'No OvernightDesk research request is available yet.';
    default:
      return 'Command brief status is unknown.';
  }
}

function SectionList({ title, items }: { title: string; items?: string[] }) {
  const visibleItems = items?.filter(Boolean) || [];
  if (!visibleItems.length) return null;

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        {title}
      </Text>
      <UnorderedList spacing={1} color="gray.200" fontSize="sm" pl={2}>
        {visibleItems.map((item) => (
          <ListItem key={item}>{item}</ListItem>
        ))}
      </UnorderedList>
    </Box>
  );
}

const CommandBrief: React.FC<CommandBriefProps> = ({
  snapshot,
  isLoading,
  onRefresh,
  canRefresh,
}) => {
  const briefDocument = snapshot?.brief;
  const brief = briefDocument?.brief;
  const status = snapshot?.status || 'absent';
  const sourceCount = getCommandBriefSourceCount(briefDocument || null);
  const statusTone = status === 'processed' ? 'success' : statusColor[status] === 'red' ? 'error' : 'info';

  return (
    <Box bg="gray.900" borderRadius="lg" borderWidth="1px" borderColor="gray.700" p={4}>
      <HStack justify="space-between" align="start" spacing={3} mb={3}>
        <HStack align="start" spacing={3}>
          <Box color="cyan.300" pt={1}>
            <Brain size={20} />
          </Box>
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              Command Brief
            </Text>
            <Text fontSize="sm" color="gray.400">
              Current operating context from processed OvernightDesk intelligence
            </Text>
          </Box>
        </HStack>
        <Tooltip label="Refresh the latest status and processed brief. This does not queue research." placement="top" hasArrow>
          <Button
            size="sm"
            colorScheme="cyan"
            leftIcon={<RefreshCw size={16} />}
            onClick={onRefresh}
            isLoading={isLoading}
            isDisabled={!canRefresh}
          >
            Refresh
          </Button>
        </Tooltip>
      </HStack>

      <Alert status={statusTone} variant="subtle" bg="gray.800" borderRadius="md" mb={3}>
        <AlertIcon as={statusColor[status] === 'red' ? AlertTriangle : status === 'processed' ? CheckCircle2 : Clock} />
        <AlertDescription fontSize="sm">
          {getStatusMessage(snapshot)}
          {snapshot?.errorMessage ? ` ${snapshot.errorMessage}` : ''}
        </AlertDescription>
      </Alert>

      <HStack spacing={2} flexWrap="wrap" mb={3}>
        <Badge colorScheme={statusColor[status]}>{statusLabels[status]}</Badge>
        {snapshot?.freshness && <Badge colorScheme={snapshot.freshness === 'stale' ? 'orange' : 'blue'}>{snapshot.freshness}</Badge>}
        {briefDocument?.model && <Badge colorScheme="purple">{briefDocument.model}</Badge>}
        {brief && <Badge colorScheme="cyan">{formatConfidence(brief.confidence)} confidence</Badge>}
        {briefDocument && <Badge colorScheme="gray">{sourceCount} sources</Badge>}
      </HStack>

      {isLoading && !snapshot ? (
        <VStack align="stretch" spacing={2}>
          <Skeleton height="18px" />
          <Skeleton height="18px" />
          <Skeleton height="18px" width="70%" />
        </VStack>
      ) : brief ? (
        <VStack align="stretch" spacing={3}>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            <GridItem>
              <Text fontSize="xs" color="gray.500">Created</Text>
              <Text fontSize="sm">{formatDate(briefDocument?.createdAt)}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="xs" color="gray.500">Sources</Text>
              <Text fontSize="sm">{sourceCount}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="xs" color="gray.500">Next Decision</Text>
              <Text fontSize="sm">{snapshot?.nextHumanDecision}</Text>
            </GridItem>
          </Grid>

          <Divider borderColor="gray.700" />

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={1}>
              Executive Summary
            </Text>
            <Text fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
              {brief.executiveSummary || brief.briefMarkdown || 'No summary was provided.'}
            </Text>
          </Box>

          <SectionList
            title="Strategic Impacts"
            items={brief.strategicImpacts?.map((impact) => impact.impact)}
          />
          <SectionList title="Recommended Actions" items={brief.recommendedActions} />
          <SectionList title="Watchlist" items={brief.watchlist} />
        </VStack>
      ) : (
        <Text fontSize="sm" color="gray.400">
          Gryyk has no processed command brief to display yet. Chat remains available while research is absent or processing.
        </Text>
      )}
    </Box>
  );
};

export default CommandBrief;
