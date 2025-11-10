import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
  Card,
  CardBody,
  Flex,
  Code,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiTrash2, FiDownload, FiPause, FiPlay } from 'react-icons/fi';
import { eventBus } from '../../../core/event-bus';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  event: string;
  message: string;
  data?: any;
}

const LOG_EVENT_TYPES = [
  'esi:pipeline:started',
  'esi:pipeline:stopped',
  'esi:data:ingested',
  'esi:data:error',
  'rag:ingest:batch',
  'esi:pipeline:metric',
  'esi:call:executed'
];

export const PipelineLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const logBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const logItemBg = useColorModeValue('white', 'gray.800');
  const logDataBg = useColorModeValue('gray.100', 'gray.900');

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    if (!isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, isPaused]);

  // Subscribe to event bus events
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Pipeline started
    const unsubStart = eventBus.on('esi:pipeline:started', (data: any) => {
      addLog({
        level: 'success',
        event: 'esi:pipeline:started',
        message: `Pipeline started with ${data?.dataSources || 0} data sources`,
        data
      });
    });
    unsubscribers.push(unsubStart);

    // Pipeline stopped
    const unsubStop = eventBus.on('esi:pipeline:stopped', (data: any) => {
      addLog({
        level: 'info',
        event: 'esi:pipeline:stopped',
        message: 'Pipeline stopped',
        data
      });
    });
    unsubscribers.push(unsubStop);

    // Data ingested
    const unsubIngested = eventBus.on('esi:data:ingested', (data: any) => {
      addLog({
        level: 'success',
        event: 'esi:data:ingested',
        message: `Successfully ingested ${data?.recordsIngested || 0} records from ${data?.dataSourceId || 'unknown'}`,
        data
      });
    });
    unsubscribers.push(unsubIngested);

    // Data error
    const unsubError = eventBus.on('esi:data:error', (data: any) => {
      addLog({
        level: 'error',
        event: 'esi:data:error',
        message: `Error ingesting data from ${data?.dataSourceId || 'unknown'}: ${data?.error || 'Unknown error'}`,
        data
      });
    });
    unsubscribers.push(unsubError);

    // RAG batch ingestion
    const unsubRag = eventBus.on('rag:ingest:batch', (data: any) => {
      addLog({
        level: 'info',
        event: 'rag:ingest:batch',
        message: `RAG batch ${data?.batchIndex + 1 || 0}/${data?.totalBatches || 0} ingested for ${data?.dataSourceId || 'unknown'}`,
        data
      });
    });
    unsubscribers.push(unsubRag);

    // Pipeline metrics
    const unsubMetric = eventBus.on('esi:pipeline:metric', (data: any) => {
      addLog({
        level: 'debug',
        event: 'esi:pipeline:metric',
        message: `Metric recorded: ${data?.dataSource || 'unknown'} - ${data?.requestDuration || 0}ms, ${data?.recordsProcessed || 0} records`,
        data
      });
    });
    unsubscribers.push(unsubMetric);

    // ESI call executed
    const unsubEsiCall = eventBus.on('esi:call:executed', (data: any) => {
      addLog({
        level: 'debug',
        event: 'esi:call:executed',
        message: `ESI call: ${data?.endpoint || 'unknown'} - ${data?.duration || 0}ms`,
        data
      });
    });
    unsubscribers.push(unsubEsiCall);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.event.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(log => log.event === eventFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, eventFilter]);

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (isPaused) return;

    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log
    };

    setLogs(prev => {
      const updated = [...prev, newLog];
      // Keep only last 500 logs
      return updated.slice(-500);
    });
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const exportLogs = () => {
    const logsText = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.event}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esi-pipeline-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'success': return 'green';
      case 'info': return 'blue';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'debug': return 'gray';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Controls */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <Flex gap={3} wrap="wrap" align="center">
            {/* Search */}
            <InputGroup maxW="300px">
              <InputLeftElement>
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {/* Level Filter */}
            <Select
              maxW="150px"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              icon={<FiFilter />}
            >
              <option value="all">All Levels</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </Select>

            {/* Event Filter */}
            <Select
              maxW="200px"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              {LOG_EVENT_TYPES.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </Select>

            <Box flex={1} />

            {/* Action Buttons */}
            <HStack spacing={2}>
              <Tooltip label={isPaused ? 'Resume' : 'Pause'}>
                <IconButton
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                  icon={isPaused ? <FiPlay /> : <FiPause />}
                  variant="outline"
                  onClick={() => setIsPaused(!isPaused)}
                  colorScheme={isPaused ? 'green' : 'blue'}
                />
              </Tooltip>
              <Tooltip label="Export Logs">
                <IconButton
                  aria-label="Export Logs"
                  icon={<FiDownload />}
                  variant="outline"
                  onClick={exportLogs}
                  isDisabled={filteredLogs.length === 0}
                />
              </Tooltip>
              <Tooltip label="Clear Logs">
                <IconButton
                  aria-label="Clear Logs"
                  icon={<FiTrash2 />}
                  variant="outline"
                  colorScheme="red"
                  onClick={clearLogs}
                  isDisabled={logs.length === 0}
                />
              </Tooltip>
            </HStack>
          </Flex>

          {/* Stats */}
          <HStack mt={3} spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Total: {logs.length}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Filtered: {filteredLogs.length}
            </Text>
            {isPaused && (
              <Badge colorScheme="yellow">PAUSED</Badge>
            )}
          </HStack>
        </CardBody>
      </Card>

      {/* Logs Display */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <Box
            maxH="600px"
            overflowY="auto"
            bg={logBg}
            p={4}
            borderRadius="md"
            fontFamily="monospace"
            fontSize="sm"
          >
            {filteredLogs.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                {logs.length === 0
                  ? 'No logs yet. Logs will appear here when pipeline events occur.'
                  : 'No logs match your filters.'}
              </Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {filteredLogs.map((log) => (
                  <Box
                    key={log.id}
                    p={3}
                    bg={logItemBg}
                    borderRadius="md"
                    borderLeft="4px solid"
                    borderLeftColor={`${getLevelColor(log.level)}.500`}
                    _hover={{ shadow: 'sm' }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={3} align="start">
                      <Text color="gray.500" minW="90px">
                        {formatTimestamp(log.timestamp)}
                      </Text>
                      <Badge colorScheme={getLevelColor(log.level)} minW="70px" textAlign="center">
                        {log.level.toUpperCase()}
                      </Badge>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="medium">{log.message}</Text>
                        <Code fontSize="xs" colorScheme="gray">
                          {log.event}
                        </Code>
                        {log.data && (
                          <Box
                            mt={2}
                            p={2}
                            bg={logDataBg}
                            borderRadius="md"
                            fontSize="xs"
                            maxW="100%"
                            overflowX="auto"
                          >
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                          </Box>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                ))}
                <div ref={logsEndRef} />
              </VStack>
            )}
          </Box>
        </CardBody>
      </Card>
    </VStack>
  );
};
