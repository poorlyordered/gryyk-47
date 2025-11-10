import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Button,
  Grid,
  Text,
  Divider,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';

interface PipelineConfigEditorProps {
  onSave?: (config: PipelineConfigData) => void;
}

interface PipelineConfigData {
  enabled: boolean;
  maxConcurrentRequests: number;
  rateLimitBuffer: number;
  retryAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  errorThreshold: number;
  ragIntegration: {
    enabled: boolean;
    batchSize: number;
    processingDelay: number;
    includeMetadata: boolean;
  };
  storage: {
    cacheEnabled: boolean;
    cacheDuration: number;
    persistToMongoDB: boolean;
    compressionEnabled: boolean;
  };
  monitoring: {
    metricsEnabled: boolean;
    alertOnFailures: boolean;
    performanceTracking: boolean;
  };
}

const defaultConfig: PipelineConfigData = {
  enabled: true,
  maxConcurrentRequests: 5,
  rateLimitBuffer: 80,
  retryAttempts: 3,
  backoffStrategy: 'exponential',
  errorThreshold: 5,
  ragIntegration: {
    enabled: true,
    batchSize: 10,
    processingDelay: 100,
    includeMetadata: true
  },
  storage: {
    cacheEnabled: true,
    cacheDuration: 60,
    persistToMongoDB: true,
    compressionEnabled: false
  },
  monitoring: {
    metricsEnabled: true,
    alertOnFailures: true,
    performanceTracking: true
  }
};

export const PipelineConfigEditor: React.FC<PipelineConfigEditorProps> = ({ onSave }) => {
  const [config, setConfig] = useState<PipelineConfigData>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateConfig = <K extends keyof PipelineConfigData>(
    key: K,
    value: PipelineConfigData[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNestedConfig = <
    K extends keyof PipelineConfigData,
    NK extends keyof PipelineConfigData[K]
  >(
    key: K,
    nestedKey: NK,
    value: PipelineConfigData[K][NK]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      onSave?.(config);
      setHasChanges(false);
      toast({
        title: 'Configuration Saved',
        description: 'Pipeline configuration has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(false);
    toast({
      title: 'Configuration Reset',
      description: 'Configuration has been reset to defaults',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={3}>
        <Button
          leftIcon={<FiRefreshCw />}
          variant="outline"
          onClick={handleReset}
          isDisabled={!hasChanges}
        >
          Reset to Defaults
        </Button>
        <Button
          leftIcon={<FiSave />}
          colorScheme="blue"
          onClick={handleSave}
          isDisabled={!hasChanges}
        >
          Save Configuration
        </Button>
      </HStack>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Pipeline Settings */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader pb={3}>
            <Heading size="sm">Pipeline Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Pipeline Enabled</FormLabel>
                <Switch
                  isChecked={config.enabled}
                  onChange={(e) => updateConfig('enabled', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Max Concurrent Requests</FormLabel>
                <NumberInput
                  value={config.maxConcurrentRequests}
                  onChange={(_, value) => updateConfig('maxConcurrentRequests', value)}
                  min={1}
                  max={20}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Maximum simultaneous ESI requests</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Rate Limit Buffer (%)</FormLabel>
                <NumberInput
                  value={config.rateLimitBuffer}
                  onChange={(_, value) => updateConfig('rateLimitBuffer', value)}
                  min={10}
                  max={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Percentage of ESI rate limit to use</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Retry Attempts</FormLabel>
                <NumberInput
                  value={config.retryAttempts}
                  onChange={(_, value) => updateConfig('retryAttempts', value)}
                  min={0}
                  max={10}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Number of retry attempts on failure</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Backoff Strategy</FormLabel>
                <Select
                  value={config.backoffStrategy}
                  onChange={(e) => updateConfig('backoffStrategy', e.target.value as 'linear' | 'exponential')}
                >
                  <option value="linear">Linear</option>
                  <option value="exponential">Exponential</option>
                </Select>
                <FormHelperText>Retry delay calculation method</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Error Threshold</FormLabel>
                <NumberInput
                  value={config.errorThreshold}
                  onChange={(_, value) => updateConfig('errorThreshold', value)}
                  min={1}
                  max={20}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Auto-disable source after this many errors</FormHelperText>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* RAG Integration */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader pb={3}>
            <Heading size="sm">RAG Integration</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>RAG Integration Enabled</FormLabel>
                <Switch
                  isChecked={config.ragIntegration.enabled}
                  onChange={(e) => updateNestedConfig('ragIntegration', 'enabled', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <Divider />

              <FormControl isDisabled={!config.ragIntegration.enabled}>
                <FormLabel>Batch Size</FormLabel>
                <NumberInput
                  value={config.ragIntegration.batchSize}
                  onChange={(_, value) => updateNestedConfig('ragIntegration', 'batchSize', value)}
                  min={1}
                  max={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Documents per ingestion batch</FormHelperText>
              </FormControl>

              <FormControl isDisabled={!config.ragIntegration.enabled}>
                <FormLabel>Processing Delay (ms)</FormLabel>
                <NumberInput
                  value={config.ragIntegration.processingDelay}
                  onChange={(_, value) => updateNestedConfig('ragIntegration', 'processingDelay', value)}
                  min={0}
                  max={5000}
                  step={50}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Delay between batches</FormHelperText>
              </FormControl>

              <FormControl display="flex" alignItems="center" isDisabled={!config.ragIntegration.enabled}>
                <FormLabel mb={0} flex={1}>Include Metadata</FormLabel>
                <Switch
                  isChecked={config.ragIntegration.includeMetadata}
                  onChange={(e) => updateNestedConfig('ragIntegration', 'includeMetadata', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <Box p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                <Text fontSize="sm" color={useColorModeValue('blue.800', 'blue.200')}>
                  RAG integration allows AI agents to query ingested ESI data for context-aware responses.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Storage Settings */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader pb={3}>
            <Heading size="sm">Storage Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Cache Enabled</FormLabel>
                <Switch
                  isChecked={config.storage.cacheEnabled}
                  onChange={(e) => updateNestedConfig('storage', 'cacheEnabled', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl isDisabled={!config.storage.cacheEnabled}>
                <FormLabel>Cache Duration (minutes)</FormLabel>
                <NumberInput
                  value={config.storage.cacheDuration}
                  onChange={(_, value) => updateNestedConfig('storage', 'cacheDuration', value)}
                  min={1}
                  max={1440}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>How long to cache ESI responses</FormHelperText>
              </FormControl>

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Persist to MongoDB</FormLabel>
                <Switch
                  isChecked={config.storage.persistToMongoDB}
                  onChange={(e) => updateNestedConfig('storage', 'persistToMongoDB', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Compression Enabled</FormLabel>
                <Switch
                  isChecked={config.storage.compressionEnabled}
                  onChange={(e) => updateNestedConfig('storage', 'compressionEnabled', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <Box p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                <Text fontSize="sm" color={useColorModeValue('green.800', 'green.200')}>
                  Caching reduces ESI API calls and improves response times. MongoDB persistence enables historical analysis.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Monitoring Settings */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader pb={3}>
            <Heading size="sm">Monitoring Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Metrics Enabled</FormLabel>
                <Switch
                  isChecked={config.monitoring.metricsEnabled}
                  onChange={(e) => updateNestedConfig('monitoring', 'metricsEnabled', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Alert on Failures</FormLabel>
                <Switch
                  isChecked={config.monitoring.alertOnFailures}
                  onChange={(e) => updateNestedConfig('monitoring', 'alertOnFailures', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>Performance Tracking</FormLabel>
                <Switch
                  isChecked={config.monitoring.performanceTracking}
                  onChange={(e) => updateNestedConfig('monitoring', 'performanceTracking', e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <Divider />

              <Box p={3} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="md">
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('purple.800', 'purple.200')}>
                    Active Monitoring
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('purple.700', 'purple.300')}>
                    • Request duration tracking
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('purple.700', 'purple.300')}>
                    • Cache hit rate analysis
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('purple.700', 'purple.300')}>
                    • Rate limit monitoring
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('purple.700', 'purple.300')}>
                    • Error rate tracking
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </VStack>
  );
};
