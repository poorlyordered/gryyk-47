import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  Card,
  CardBody,
  Flex,
  Spacer,
  Badge,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSettings,
  FiUser,
  FiDownload,
  FiBriefcase
} from 'react-icons/fi';
import {
  ConfigurationManager,
  CorporationProfileWizard,
  AgentConfigurationDashboard,
  PersonalityBuilder,
  AgentCustomization,
  CorporationProfile,
  AgentConfiguration,
  AgentPersonality
} from '../features/agentConfiguration';
import { useAuthStore } from '../store/auth';

const AgentConfigurationPage: React.FC = () => {
  const [configManager] = useState(() => new ConfigurationManager());
  const [currentCorporation, setCurrentCorporation] = useState<CorporationProfile | null>(null);
  const [agentCustomization, setAgentCustomization] = useState<AgentCustomization | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [personalities, setPersonalities] = useState<AgentPersonality[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const {
    isOpen: isProfileWizardOpen,
    onOpen: onProfileWizardOpen,
    onClose: onProfileWizardClose
  } = useDisclosure();

  const {
    isOpen: isPersonalityBuilderOpen,
    onOpen: onPersonalityBuilderOpen,
    onClose: onPersonalityBuilderClose
  } = useDisclosure();

  const {
    isOpen: isAgentDashboardOpen,
    onOpen: onAgentDashboardOpen,
    onClose: onAgentDashboardClose
  } = useDisclosure();

  const { user } = useAuthStore();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load default personalities
      const defaultPersonalities = configManager.getPersonalities();
      setPersonalities(defaultPersonalities);

      // Try to load existing corporation profile for this user
      // In a real app, this would come from the user's session or API
      const corporationId = user?.corporationId || 'demo-corp-123';
      const existingCustomization = configManager.getAllConfigurations(corporationId);
      
      if (existingCustomization) {
        setCurrentCorporation(existingCustomization.corporationProfile);
        setAgentCustomization(existingCustomization);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleCreateCorporationProfile = async (profile: Omit<CorporationProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProfile = await configManager.createCorporationProfile(profile);
      setCurrentCorporation(newProfile);
      
      // Load the full customization
      const customization = configManager.getAllConfigurations(newProfile.corporationId);
      setAgentCustomization(customization || null);
      
      onProfileWizardClose();
      toast({
        title: 'Corporation Profile Created',
        description: 'Your corporation profile and default agent configurations have been created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to create corporation profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSavePersonality = async (personality: AgentPersonality) => {
    try {
      const savedPersonality = await configManager.createPersonality(personality);
      setPersonalities(prev => [...prev, savedPersonality]);
      onPersonalityBuilderClose();
      toast({
        title: 'Personality Saved',
        description: `"${personality.name}" has been added to your personality library`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to save personality',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestPersonality = async (personality: AgentPersonality): Promise<string> => {
    // Mock test implementation - in a real app, this would test with actual AI
    const _testScenario = "Analyze the current Jita market conditions for Tritanium and provide a recommendation.";
    
    const mockResponse = `${personality.communicationStyle.greeting} market analysis!

${personality.communicationStyle.responsePrefix} the Tritanium market in Jita is showing moderate volatility. Current prices are fluctuating between 5.2 and 5.8 ISK per unit.

${personality.communicationStyle.recommendationIntro}
- Consider buying if prices drop below 5.3 ISK/unit
- Monitor trading volume for stability indicators
- ${personality.traits.riskTolerance > 60 ? 'Take advantage of price dips for bulk purchases' : 'Wait for price stabilization before large investments'}

${personality.communicationStyle.farewellNote}`;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return mockResponse;
  };

  const handleSaveAgentConfiguration = async (config: AgentConfiguration) => {
    if (!currentCorporation) return;

    try {
      await configManager.updateAgentConfiguration(
        currentCorporation.corporationId,
        config.agentId,
        config,
        user?.id || 'system',
        'Updated from dashboard'
      );

      // Reload customization
      const updatedCustomization = configManager.getAllConfigurations(currentCorporation.corporationId);
      setAgentCustomization(updatedCustomization || null);

      onAgentDashboardClose();
      toast({
        title: 'Configuration Saved',
        description: `Agent configuration has been updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to save agent configuration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportConfiguration = async () => {
    if (!currentCorporation) return;

    try {
      const exportData = await configManager.exportConfiguration(currentCorporation.corporationId);
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCorporation.ticker}-agent-config.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Configuration Exported',
        description: 'Your configuration has been downloaded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (_error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export configuration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openAgentConfiguration = (agentId: string) => {
    setSelectedAgent(agentId);
    onAgentDashboardOpen();
  };

  if (!currentCorporation) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" mb={4}>Agent Configuration</Heading>
            <Text color="gray.500" mb={8}>
              Configure your corporation's AI agents and personalities
            </Text>
          </Box>

          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                To get started, you need to create a corporation profile. This will define your 
                corporation's culture, goals, and operational parameters that guide your AI agents.
              </AlertDescription>
            </Box>
          </Alert>

          <Card bg={cardBg}>
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <FiBriefcase size={48} color="gray" />
                <Heading size="md">Create Corporation Profile</Heading>
                <Text color="gray.500">
                  Set up your corporation's profile to configure AI agent behavior
                </Text>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  size="lg"
                  onClick={onProfileWizardOpen}
                >
                  Create Profile
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Corporation Profile Wizard Modal */}
        <Modal isOpen={isProfileWizardOpen} onClose={onProfileWizardClose} size="xl">
          <ModalOverlay />
          <ModalContent maxW="900px">
            <ModalCloseButton />
            <ModalBody p={0}>
              <CorporationProfileWizard
                onComplete={handleCreateCorporationProfile}
                onCancel={onProfileWizardClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex align="center">
          <Box>
            <Heading size="lg">Agent Configuration</Heading>
            <Text color="gray.500">
              {currentCorporation.name} [{currentCorporation.ticker}]
            </Text>
          </Box>
          <Spacer />
          <HStack>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              onClick={handleExportConfiguration}
            >
              Export
            </Button>
            <Button
              leftIcon={<FiUser />}
              variant="outline"
              onClick={onPersonalityBuilderOpen}
            >
              New Personality
            </Button>
            <Button
              leftIcon={<FiSettings />}
              variant="outline"
              onClick={onProfileWizardOpen}
            >
              Edit Profile
            </Button>
          </HStack>
        </Flex>

        {/* Main Content */}
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Agent Overview</Tab>
            <Tab>Personalities</Tab>
            <Tab>Analytics</Tab>
          </TabList>

          <TabPanels>
            {/* Agent Overview */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Agents Configured</AlertTitle>
                    <AlertDescription>
                      Your agents are ready and configured according to your corporation profile.
                    </AlertDescription>
                  </Box>
                </Alert>

                {agentCustomization && (
                  <VStack spacing={4} align="stretch">
                    {Object.entries(agentCustomization.agentConfigurations).map(([agentId, config]) => (
                      <Card key={agentId} bg={cardBg}>
                        <CardBody>
                          <Flex align="center">
                            <Box flex="1">
                              <HStack mb={2}>
                                <Heading size="md">
                                  {agentId.replace('-specialist', '').replace(/^\w/, c => c.toUpperCase())} Specialist
                                </Heading>
                                <Badge colorScheme={config.isEnabled ? 'green' : 'red'}>
                                  {config.isEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </HStack>
                              <Text color="gray.500" mb={3}>
                                Personality: {config.personality.name}
                              </Text>
                              <Text fontSize="sm">
                                {config.customInstructions.slice(0, 100)}...
                              </Text>
                            </Box>
                            <Button
                              leftIcon={<FiSettings />}
                              onClick={() => openAgentConfiguration(agentId)}
                            >
                              Configure
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </VStack>
            </TabPanel>

            {/* Personalities */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Personality Library</Heading>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={onPersonalityBuilderOpen}
                  >
                    Create Personality
                  </Button>
                </Flex>

                <VStack spacing={4} align="stretch">
                  {personalities.map(personality => (
                    <Card key={personality.id} bg={cardBg}>
                      <CardBody>
                        <Flex align="center">
                          <Box flex="1">
                            <Heading size="sm" mb={2}>{personality.name}</Heading>
                            <Text color="gray.500" fontSize="sm" mb={3}>
                              {personality.description}
                            </Text>
                            <HStack spacing={2}>
                              <Badge size="sm">Formality: {personality.traits.formality}</Badge>
                              <Badge size="sm">Enthusiasm: {personality.traits.enthusiasm}</Badge>
                              <Badge size="sm">Risk Tolerance: {personality.traits.riskTolerance}</Badge>
                            </HStack>
                          </Box>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </TabPanel>

            {/* Analytics */}
            <TabPanel>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Analytics Coming Soon</AlertTitle>
                  <AlertDescription>
                    Agent performance analytics and usage insights will be available here.
                  </AlertDescription>
                </Box>
              </Alert>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modals */}
      
      {/* Corporation Profile Wizard */}
      <Modal isOpen={isProfileWizardOpen} onClose={onProfileWizardClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalCloseButton />
          <ModalBody p={0}>
            <CorporationProfileWizard
              onComplete={handleCreateCorporationProfile}
              onCancel={onProfileWizardClose}
              initialData={currentCorporation}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Personality Builder */}
      <Modal isOpen={isPersonalityBuilderOpen} onClose={onPersonalityBuilderClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="1000px">
          <ModalCloseButton />
          <ModalBody p={0}>
            <PersonalityBuilder
              templates={personalities}
              onSave={handleSavePersonality}
              onTest={handleTestPersonality}
              onCancel={onPersonalityBuilderClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Agent Configuration Dashboard */}
      <Modal isOpen={isAgentDashboardOpen} onClose={onAgentDashboardClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            {selectedAgent && agentCustomization && (
              <AgentConfigurationDashboard
                corporationId={currentCorporation.corporationId}
                agentId={selectedAgent}
                initialConfig={agentCustomization.agentConfigurations[selectedAgent]}
                onSave={handleSaveAgentConfiguration}
                onCancel={onAgentDashboardClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AgentConfigurationPage;