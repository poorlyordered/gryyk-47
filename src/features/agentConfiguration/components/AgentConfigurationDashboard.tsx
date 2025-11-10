import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Heading,
  Text,
  Badge,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  useColorModeValue,
  Grid,
  Alert,
  AlertIcon
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
import { AgentConfiguration } from '../types';
import { useAgentConfiguration } from '../hooks/useAgentConfiguration';
import { AGENT_INFO } from '../constants/agentInfo';
import { ValidationDisplay } from './shared/ValidationDisplay';
import {
  BasicSettingsTab,
  PersonalityTab,
  BehaviorTab,
  TechnicalParametersTab,
  ToolsDataTab,
  OutputFormatTab,
  ScheduleTab
} from './tabs';

interface AgentConfigurationDashboardProps {
  corporationId: string;
  agentId: string;
  initialConfig?: AgentConfiguration;
  onSave: (config: AgentConfiguration) => Promise<void>;
  onCancel: () => void;
}

export const AgentConfigurationDashboard: React.FC<AgentConfigurationDashboardProps> = ({
  corporationId,
  agentId,
  initialConfig,
  onSave,
  onCancel
}) => {
  const {
    config,
    validation,
    isLoading,
    hasChanges,
    agentInfo,
    handleSave,
    handleReset,
    handleImport,
    handleExport,
    updateConfig
  } = useAgentConfiguration({
    agentId,
    corporationId,
    initialConfig,
    onSave
  });

  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const agent = agentInfo || AGENT_INFO[agentId as keyof typeof AGENT_INFO];

  const duplicateConfig = () => {
    const duplicated: AgentConfiguration = {
      ...config,
      id: `config-${agentId}-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateConfig('id', duplicated.id);
    updateConfig('version', 1);
    updateConfig('createdAt', duplicated.createdAt);
    updateConfig('updatedAt', duplicated.updatedAt);
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
                <MenuItem icon={<FiRefreshCw />} onClick={handleReset}>
                  Reset to Defaults
                </MenuItem>
                <MenuItem icon={<FiCopy />} onClick={duplicateConfig}>
                  Duplicate Configuration
                </MenuItem>
                <MenuItem icon={<FiDownload />} onClick={handleExport}>
                  Export Configuration
                </MenuItem>
                <MenuItem icon={<FiUpload />} onClick={handleImport}>
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
        {validation && <ValidationDisplay validation={validation} />}

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
            <TabPanel px={0}>
              <BasicSettingsTab
                config={config}
                agentInfo={agent}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <PersonalityTab
                config={config}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <BehaviorTab
                config={config}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <TechnicalParametersTab
                config={config}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <ToolsDataTab
                config={config}
                agentInfo={agent}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <OutputFormatTab
                config={config}
                updateConfig={updateConfig}
              />
            </TabPanel>

            <TabPanel px={0}>
              <ScheduleTab
                config={config}
                updateConfig={updateConfig}
              />
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
