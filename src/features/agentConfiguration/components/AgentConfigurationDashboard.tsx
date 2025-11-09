import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Badge,
  Alert,
  AlertIcon,
  Progress,
  useToast,
  useColorModeValue,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
  Wrap,
  WrapItem,
  Checkbox,
  CheckboxGroup
} from '@chakra-ui/react';
import {
  FiSave,
  FiRefreshCw,
  FiCopy,
  FiDownload,
  FiUpload,
  FiEye,
  FiMoreVertical
} from 'react-icons/fi';
import { AgentConfiguration, ConfigurationValidation } from '../types';

interface AgentConfigurationDashboardProps {
  corporationId: string;
  agentId: string;
  initialConfig?: AgentConfiguration;
  onSave: (config: AgentConfiguration) => Promise<void>;
  onCancel: () => void;
}

const agentInfo = {
  'economic-specialist': {
    name: 'Economic Specialist',
    description: 'Focuses on ISK generation, investment opportunities, and financial optimization',
    defaultTools: ['getCorporationAnalysis', 'getMarketData', 'getCorporationWealth'],
    specialization: 'Financial analysis, market trends, profitability optimization'
  },
  'recruiting-specialist': {
    name: 'Recruiting Specialist', 
    description: 'Handles member recruitment, retention strategies, and onboarding processes',
    defaultTools: ['getCorporationAnalysis', 'getCorporationMembers'],
    specialization: 'Member management, recruitment strategies, retention analytics'
  },
  'market-specialist': {
    name: 'Market Specialist',
    description: 'Provides market intelligence, trading opportunities, and price analysis',
    defaultTools: ['getMarketData', 'getSystemInfo'],
    specialization: 'Market analysis, trading strategies, price forecasting'
  },
  'mining-specialist': {
    name: 'Mining Specialist',
    description: 'Optimizes mining operations, fleet compositions, and ore selection',
    defaultTools: ['getMarketData', 'getSystemInfo', 'getMiningInfo'],
    specialization: 'Mining optimization, fleet management, yield analysis'
  },
  'mission-specialist': {
    name: 'Mission Specialist',
    description: 'Advises on mission running, PvE strategies, and system navigation',
    defaultTools: ['getSystemInfo'],
    specialization: 'Mission planning, PvE strategies, system analysis'
  }
};

export const AgentConfigurationDashboard: React.FC<AgentConfigurationDashboardProps> = ({
  corporationId,
  agentId,
  initialConfig,
  onSave,
  onCancel
}) => {
  const [config, setConfig] = useState<AgentConfiguration>(initialConfig || createDefaultConfig(agentId, corporationId));
  const [validation, setValidation] = useState<ConfigurationValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const agent = agentInfo[agentId as keyof typeof agentInfo];

  useEffect(() => {
    validateConfiguration();
  }, [config]);

  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(initialConfig));
  }, [config, initialConfig]);

  const validateConfiguration = () => {
    // Mock validation - in production, this would call the configuration manager
    const errors: ConfigurationValidation['errors'] = [];
    const warnings: ConfigurationValidation['warnings'] = [];

    // Validate response parameters
    if (config.responseParameters.temperature < 0 || config.responseParameters.temperature > 2) {
      errors.push({
        field: 'responseParameters.temperature',
        message: 'Temperature must be between 0 and 2',
        severity: 'error'
      });
    }

    if (config.responseParameters.maxTokens < 100 || config.responseParameters.maxTokens > 4000) {
      warnings.push({
        field: 'responseParameters.maxTokens',
        message: 'Max tokens outside recommended range (500-2000)',
        recommendation: 'Consider using 500-2000 tokens for optimal performance'
      });
    }

    if (config.behaviorSettings.consultationThreshold > 90 && config.behaviorSettings.confidenceThreshold > 90) {
      warnings.push({
        field: 'behaviorSettings',
        message: 'Very high thresholds may reduce agent responsiveness',
        recommendation: 'Consider lowering thresholds for more active participation'
      });
    }

    const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      suggestions: [
        ...(warnings.length > 0 ? ['Review warnings for optimization opportunities'] : []),
        ...(score < 80 ? ['Consider using a configuration template for better defaults'] : [])
      ]
    });
  };

  const handleSave = async () => {
    if (!validation?.isValid) {
      toast({
        title: 'Configuration Invalid',
        description: 'Please fix validation errors before saving',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(config);
      setHasChanges(false);
      toast({
        title: 'Configuration Saved',
        description: `${agent.name} configuration has been updated`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        ...newConfig,
        updatedAt: new Date().toISOString(),
        version: prev.version + 1
      };
    });
  };

  const resetToDefaults = () => {
    setConfig(createDefaultConfig(agentId, corporationId));
    toast({
      title: 'Configuration Reset',
      description: 'Configuration has been reset to defaults',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const duplicateConfig = () => {
    const duplicated = {
      ...config,
      id: `config-${agentId}-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConfig(duplicated);
    toast({
      title: 'Configuration Duplicated',
      description: 'Configuration has been duplicated as a new version',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Heading size="lg">{agent.name} Configuration</Heading>
              <Badge colorScheme={config.isEnabled ? 'green' : 'gray'}>
                {config.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </HStack>
            <Text color="gray.500">{agent.description}</Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<FiEye />}
              variant="outline"
              onClick={onPreviewOpen}
            >
              Preview
            </Button>
            <Menu>
              <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="outline" />
              <MenuList>
                <MenuItem icon={<FiRefreshCw />} onClick={resetToDefaults}>
                  Reset to Defaults
                </MenuItem>
                <MenuItem icon={<FiCopy />} onClick={duplicateConfig}>
                  Duplicate Configuration
                </MenuItem>
                <MenuItem icon={<FiDownload />}>
                  Export Configuration
                </MenuItem>
                <MenuItem icon={<FiUpload />}>
                  Import Configuration
                </MenuItem>
              </MenuList>
            </Menu>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              leftIcon={<FiSave />}
              colorScheme="blue"
              onClick={handleSave}
              isLoading={isLoading}
              isDisabled={!hasChanges || !validation?.isValid}
            >
              Save Changes
            </Button>
          </HStack>
        </Flex>

        {/* Validation Status */}
        {validation && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <HStack justify="space-between" align="center">
                <HStack>
                  <Box
                    w={3}
                    h={3}
                    rounded="full"
                    bg={validation.isValid ? 'green.500' : validation.errors.length > 0 ? 'red.500' : 'yellow.500'}
                  />
                  <Text fontWeight="bold">
                    Configuration Quality: {validation.score}/100
                  </Text>
                  {validation.errors.length > 0 && (
                    <Badge colorScheme="red">{validation.errors.length} errors</Badge>
                  )}
                  {validation.warnings.length > 0 && (
                    <Badge colorScheme="yellow">{validation.warnings.length} warnings</Badge>
                  )}
                </HStack>
                <Progress value={validation.score} colorScheme="blue" size="sm" w="200px" />
              </HStack>
              
              {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                <VStack align="stretch" spacing={2} mt={4}>
                  {validation.errors.map((error, index) => (
                    <Alert key={index} status="error" size="sm">
                      <AlertIcon />
                      <Text fontSize="sm">{error.message}</Text>
                    </Alert>
                  ))}
                  {validation.warnings.map((warning, index) => (
                    <Alert key={index} status="warning" size="sm">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm">{warning.message}</Text>
                        <Text fontSize="xs" color="gray.600">{warning.recommendation}</Text>
                      </VStack>
                    </Alert>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        )}

        {/* Configuration Tabs */}
        <Tabs>
          <TabList>
            <Tab>Basic Settings</Tab>
            <Tab>Personality</Tab>
            <Tab>Behavior</Tab>
            <Tab>Technical Parameters</Tab>
            <Tab>Tools & Data</Tab>
            <Tab>Output Format</Tab>
            <Tab>Schedule</Tab>
          </TabList>

          <TabPanels>
            {/* Basic Settings */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Agent Status</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Agent Enabled</FormLabel>
                          <Switch
                            isChecked={config.isEnabled}
                            onChange={(e) => updateConfig('isEnabled', e.target.checked)}
                            colorScheme="blue"
                          />
                        </HStack>
                        <FormHelperText>
                          When disabled, this agent won't participate in consultations
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Custom Instructions</FormLabel>
                        <Textarea
                          value={config.customInstructions}
                          onChange={(e) => updateConfig('customInstructions', e.target.value)}
                          placeholder="Additional instructions for this agent..."
                          rows={4}
                        />
                        <FormHelperText>
                          Custom instructions that will be added to the agent's prompt
                        </FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Agent Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Agent ID:</Text>
                        <Code fontSize="sm">{config.agentId}</Code>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Version:</Text>
                        <Text fontSize="sm">{config.version}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Specialization:</Text>
                        <Text fontSize="sm">{agent.specialization}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Last Updated:</Text>
                        <Text fontSize="sm">{new Date(config.updatedAt).toLocaleDateString()}</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Personality */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Personality Traits</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {Object.entries(config.personality.traits).map(([trait, value]) => (
                        <FormControl key={trait}>
                          <FormLabel textTransform="capitalize">{trait.replace(/([A-Z])/g, ' $1')}</FormLabel>
                          <Slider
                            value={value}
                            onChange={(val) => updateConfig(`personality.traits.${trait}`, val)}
                            min={0}
                            max={100}
                            step={5}
                          >
                            <SliderMark value={0} mt={2} fontSize="sm">Low</SliderMark>
                            <SliderMark value={50} mt={2} fontSize="sm" ml={-3}>Medium</SliderMark>
                            <SliderMark value={100} mt={2} fontSize="sm" ml={-6}>High</SliderMark>
                            <SliderMark value={value} mt={-8} ml={-6} fontSize="sm" fontWeight="bold" color="blue.500">
                              {value}
                            </SliderMark>
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                          </Slider>
                        </FormControl>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Communication Style</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {Object.entries(config.personality.communicationStyle).map(([key, value]) => (
                        <FormControl key={key}>
                          <FormLabel textTransform="capitalize">{key.replace(/([A-Z])/g, ' $1')}</FormLabel>
                          <Input
                            value={value}
                            onChange={(e) => updateConfig(`personality.communicationStyle.${key}`, e.target.value)}
                            placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          />
                        </FormControl>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Behavior Settings */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Consultation Behavior</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <FormControl>
                        <FormLabel>Consultation Threshold ({config.behaviorSettings.consultationThreshold}%)</FormLabel>
                        <Slider
                          value={config.behaviorSettings.consultationThreshold}
                          onChange={(val) => updateConfig('behaviorSettings.consultationThreshold', val)}
                          min={0}
                          max={100}
                          step={5}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>
                          How uncertain the agent must be before consulting other agents
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Confidence Threshold ({config.behaviorSettings.confidenceThreshold}%)</FormLabel>
                        <Slider
                          value={config.behaviorSettings.confidenceThreshold}
                          onChange={(val) => updateConfig('behaviorSettings.confidenceThreshold', val)}
                          min={0}
                          max={100}
                          step={5}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>
                          Minimum confidence required to provide advice
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Fallback Behavior</FormLabel>
                        <Select
                          value={config.behaviorSettings.fallbackBehavior}
                          onChange={(e) => updateConfig('behaviorSettings.fallbackBehavior', e.target.value)}
                        >
                          <option value="conservative">Conservative - Provide safe advice</option>
                          <option value="ask_human">Ask Human - Request human input</option>
                          <option value="consult_all">Consult All - Ask all other agents</option>
                        </Select>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Context Management</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Memory Depth</FormLabel>
                        <NumberInput
                          value={config.contextSettings.memoryDepth}
                          onChange={(_, val) => updateConfig('contextSettings.memoryDepth', val)}
                          min={1}
                          max={50}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>
                          Number of previous conversations to consider for context
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Context Priorities</FormLabel>
                        <CheckboxGroup
                          value={config.contextSettings.contextualPriorities}
                          onChange={(values) => updateConfig('contextSettings.contextualPriorities', values)}
                        >
                          <Wrap>
                            <WrapItem><Checkbox value="recent_data">Recent Data</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="corporation_goals">Corp Goals</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="user_preferences">User Preferences</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="market_conditions">Market Conditions</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="risk_factors">Risk Factors</Checkbox></WrapItem>
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Technical Parameters */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Response Generation</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Max Tokens</FormLabel>
                        <NumberInput
                          value={config.responseParameters.maxTokens}
                          onChange={(_, val) => updateConfig('responseParameters.maxTokens', val)}
                          min={100}
                          max={4000}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Maximum length of agent responses</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Temperature ({config.responseParameters.temperature})</FormLabel>
                        <Slider
                          value={config.responseParameters.temperature}
                          onChange={(val) => updateConfig('responseParameters.temperature', val)}
                          min={0}
                          max={2}
                          step={0.1}
                        >
                          <SliderMark value={0} mt={2} fontSize="sm">Focused</SliderMark>
                          <SliderMark value={1} mt={2} fontSize="sm" ml={-3}>Balanced</SliderMark>
                          <SliderMark value={2} mt={2} fontSize="sm" ml={-6}>Creative</SliderMark>
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>Controls randomness in responses</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Top P ({config.responseParameters.topP})</FormLabel>
                        <Slider
                          value={config.responseParameters.topP}
                          onChange={(val) => updateConfig('responseParameters.topP', val)}
                          min={0}
                          max={1}
                          step={0.05}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>Controls diversity of word choices</FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Response Penalties</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Presence Penalty ({config.responseParameters.presencePenalty})</FormLabel>
                        <Slider
                          value={config.responseParameters.presencePenalty}
                          onChange={(val) => updateConfig('responseParameters.presencePenalty', val)}
                          min={-2}
                          max={2}
                          step={0.1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>Penalizes repeated topics</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Frequency Penalty ({config.responseParameters.frequencyPenalty})</FormLabel>
                        <Slider
                          value={config.responseParameters.frequencyPenalty}
                          onChange={(val) => updateConfig('responseParameters.frequencyPenalty', val)}
                          min={-2}
                          max={2}
                          step={0.1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <FormHelperText>Penalizes repeated words</FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Tools & Data */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Available Tools</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="sm" color="gray.500">
                        Configure which tools this agent can use during consultations
                      </Text>
                      
                      <CheckboxGroup
                        value={config.toolsEnabled}
                        onChange={(values) => updateConfig('toolsEnabled', values)}
                      >
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="bold" fontSize="sm">Core Tools</Text>
                          <Checkbox value="queryKnowledgeBase">Query Knowledge Base</Checkbox>
                          <Checkbox value="manageKnowledgeBase">Manage Knowledge Base</Checkbox>
                          
                          <Text fontWeight="bold" fontSize="sm" mt={4}>Specialized Tools</Text>
                          {agent.defaultTools.map(tool => (
                            <Checkbox key={tool} value={tool}>
                              {tool.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Checkbox>
                          ))}
                        </VStack>
                      </CheckboxGroup>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Data Sources</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>RAG Sources</FormLabel>
                        <CheckboxGroup
                          value={config.ragSources}
                          onChange={(values) => updateConfig('ragSources', values)}
                        >
                          <Wrap>
                            <WrapItem><Checkbox value="general">General Knowledge</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="economic">Economic Data</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="recruiting">Recruiting Info</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="market">Market Data</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="mining">Mining Info</Checkbox></WrapItem>
                            <WrapItem><Checkbox value="mission">Mission Data</Checkbox></WrapItem>
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel>ESI Data Sources</FormLabel>
                        <CheckboxGroup
                          value={config.esiDataSources}
                          onChange={(values) => updateConfig('esiDataSources', values)}
                        >
                          <VStack align="start" spacing={1}>
                            <Checkbox value="corp-basic-info">Corporation Info</Checkbox>
                            <Checkbox value="corp-members">Corporation Members</Checkbox>
                            <Checkbox value="market-prices">Market Prices</Checkbox>
                            <Checkbox value="jita-market-orders">Jita Market Orders</Checkbox>
                            <Checkbox value="system-info">System Information</Checkbox>
                          </VStack>
                        </CheckboxGroup>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Output Format */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Response Formatting</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Use Markdown</FormLabel>
                          <Switch
                            isChecked={config.outputFormatting.useMarkdown}
                            onChange={(e) => updateConfig('outputFormatting.useMarkdown', e.target.checked)}
                          />
                        </HStack>
                        <FormHelperText>Format responses with markdown</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Include Confidence</FormLabel>
                          <Switch
                            isChecked={config.outputFormatting.includeConfidence}
                            onChange={(e) => updateConfig('outputFormatting.includeConfidence', e.target.checked)}
                          />
                        </HStack>
                        <FormHelperText>Show confidence levels in responses</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Show Sources</FormLabel>
                          <Switch
                            isChecked={config.outputFormatting.showSources}
                            onChange={(e) => updateConfig('outputFormatting.showSources', e.target.checked)}
                          />
                        </HStack>
                        <FormHelperText>Include data sources in responses</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Include Timestamps</FormLabel>
                          <Switch
                            isChecked={config.outputFormatting.includeTimestamps}
                            onChange={(e) => updateConfig('outputFormatting.includeTimestamps', e.target.checked)}
                          />
                        </HStack>
                        <FormHelperText>Add timestamps to responses</FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Schedule */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardHeader>
                    <Heading size="sm">Active Hours</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <FormControl>
                          <FormLabel>Start Time</FormLabel>
                          <Input
                            type="time"
                            value={config.scheduleSettings.activeHours.start}
                            onChange={(e) => updateConfig('scheduleSettings.activeHours.start', e.target.value)}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>End Time</FormLabel>
                          <Input
                            type="time"
                            value={config.scheduleSettings.activeHours.end}
                            onChange={(e) => updateConfig('scheduleSettings.activeHours.end', e.target.value)}
                          />
                        </FormControl>
                      </HStack>

                      <FormControl>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          value={config.scheduleSettings.activeHours.timezone}
                          onChange={(e) => updateConfig('scheduleSettings.activeHours.timezone', e.target.value)}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">GMT</option>
                          <option value="Europe/Berlin">CET</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <FormLabel mb={0}>Emergency Override</FormLabel>
                          <Switch
                            isChecked={config.scheduleSettings.emergencyOverride}
                            onChange={(e) => updateConfig('scheduleSettings.emergencyOverride', e.target.checked)}
                          />
                        </HStack>
                        <FormHelperText>Allow agent to respond outside active hours for emergencies</FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Preview Modal */}
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Configuration Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Text>This shows how your agent will behave with the current configuration</Text>
                </Alert>
                
                <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontWeight="bold">Sample Response Preview:</Text>
                      <Box p={3} bg="gray.50" rounded="md">
                        <Text fontSize="sm">
                          {config.personality.communicationStyle.greeting} {agentId.replace('-specialist', '')} analysis. 
                          {config.personality.communicationStyle.responsePrefix} here are my recommendations for your corporation's strategy...
                        </Text>
                      </Box>
                      
                      <Text fontWeight="bold">Personality Profile:</Text>
                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        <Text fontSize="sm">Formality: {config.personality.traits.formality}%</Text>
                        <Text fontSize="sm">Enthusiasm: {config.personality.traits.enthusiasm}%</Text>
                        <Text fontSize="sm">Risk Tolerance: {config.personality.traits.riskTolerance}%</Text>
                        <Text fontSize="sm">Detail Level: {config.personality.traits.detailLevel}%</Text>
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPreviewClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

function createDefaultConfig(agentId: string, corporationId: string): AgentConfiguration {
  return {
    id: `config-${agentId}-${Date.now()}`,
    agentId,
    corporationId,
    isEnabled: true,
    personality: {
      id: 'professional-efficient',
      name: 'Professional & Efficient',
      description: 'Business-focused, clear communication, efficient responses',
      traits: {
        formality: 75,
        enthusiasm: 50,
        riskTolerance: 45,
        detailLevel: 70,
        proactivity: 65
      },
      communicationStyle: {
        greeting: 'Hello! I\'m here to assist with your',
        responsePrefix: 'Based on current data and analysis,',
        uncertaintyPhrase: 'While I cannot be certain without additional data,',
        recommendationIntro: 'I recommend the following approach:',
        farewellNote: 'Feel free to ask if you need any clarification or additional analysis.'
      },
      specialization: {
        primaryFocus: ['efficiency', 'data-driven decisions', 'risk management'],
        expertise: ['analysis', 'planning', 'optimization'],
        preferredTools: ['analytics', 'esi_data', 'rag_search'],
        contextPriorities: ['recent_data', 'corporation_goals', 'risk_factors']
      }
    },
    customInstructions: '',
    toolsEnabled: agentInfo[agentId as keyof typeof agentInfo]?.defaultTools || [],
    toolsDisabled: [],
    ragSources: ['general', agentId.replace('-specialist', '')],
    esiDataSources: ['corp-basic-info', 'corp-members'],
    responseParameters: {
      maxTokens: 1500,
      temperature: 0.7,
      topP: 0.9,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    },
    behaviorSettings: {
      consultationThreshold: 70,
      confidenceThreshold: 80,
      escalationRules: ['low_confidence', 'conflicting_data', 'high_risk'],
      fallbackBehavior: 'conservative'
    },
    contextSettings: {
      memoryDepth: 10,
      contextualPriorities: ['recent_data', 'corporation_goals', 'risk_factors'],
      ignoredTopics: [],
      specializedKnowledge: {}
    },
    outputFormatting: {
      useMarkdown: true,
      includeConfidence: true,
      showSources: true,
      includeTimestamps: false,
      customTemplates: {}
    },
    scheduleSettings: {
      activeHours: {
        start: '00:00',
        end: '23:59',
        timezone: 'UTC'
      },
      maintenanceWindows: [],
      emergencyOverride: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
}