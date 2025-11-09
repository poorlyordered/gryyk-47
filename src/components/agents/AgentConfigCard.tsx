import React, { useState } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Button,
  Divider,
  Box,
  Badge,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip
} from '@chakra-ui/react';
import { AVAILABLE_MODELS, type AgentConfig } from '../../types/agent-config';
import { ToolManagement } from './ToolManagement';

interface AgentConfigCardProps {
  agent: AgentConfig;
  onConfigChange: (updatedAgent: AgentConfig) => void;
}

export function AgentConfigCard({ agent, onConfigChange }: AgentConfigCardProps) {
  const [localConfig, setLocalConfig] = useState<AgentConfig>(agent);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  const handleConfigUpdate = (field: keyof AgentConfig, value: any) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    setHasChanges(true);
  };

  const handleToolUpdate = (updatedTools: typeof agent.tools) => {
    const updated = { ...localConfig, tools: updatedTools };
    setLocalConfig(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedAgent = {
      ...localConfig,
      lastUpdated: new Date().toISOString()
    };
    onConfigChange(updatedAgent);
    setHasChanges(false);
    
    toast({
      title: 'Configuration Saved',
      description: `${agent.displayName} settings have been updated.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleReset = () => {
    setLocalConfig(agent);
    setHasChanges(false);
    
    toast({
      title: 'Configuration Reset',
      description: `${agent.displayName} settings have been reset to defaults.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const getModelDescription = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId)?.description || 'Unknown model';
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Basic Configuration */}
      <Box>
        <Text fontWeight="semibold" mb={3}>Basic Configuration</Text>
        
        <VStack spacing={3} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm">Agent Status</FormLabel>
            <Switch
              isChecked={localConfig.enabled}
              onChange={(e) => handleConfigUpdate('enabled', e.target.checked)}
              colorScheme="green"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {localConfig.enabled ? 'Agent is active and available for consultation' : 'Agent is disabled'}
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">AI Model</FormLabel>
            <Select
              value={localConfig.model}
              onChange={(e) => handleConfigUpdate('model', e.target.value)}
              size="sm"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {getModelDescription(localConfig.model)}
            </Text>
          </FormControl>

          <FormControl>
            <HStack justify="space-between" mb={2}>
              <FormLabel fontSize="sm" mb={0}>Temperature</FormLabel>
              <Badge variant="outline" fontSize="xs">
                {localConfig.temperature}
              </Badge>
            </HStack>
            <Slider
              value={localConfig.temperature}
              min={0}
              max={1}
              step={0.1}
              onChange={(value) => handleConfigUpdate('temperature', value)}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <HStack justify="space-between" fontSize="xs" color="gray.500" mt={1}>
              <Text>Conservative</Text>
              <Text>Creative</Text>
            </HStack>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Max Tokens</FormLabel>
            <NumberInput
              value={localConfig.maxTokens}
              onChange={(valueString) => handleConfigUpdate('maxTokens', parseInt(valueString) || 2000)}
              min={500}
              max={8000}
              step={100}
              size="sm"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Maximum response length (500-8000 tokens)
            </Text>
          </FormControl>
        </VStack>
      </Box>

      <Divider />

      {/* Tool Management */}
      <Accordion defaultIndex={[]} allowMultiple>
        <AccordionItem border="none">
          <AccordionButton px={0} py={2}>
            <Box flex="1" textAlign="left">
              <Text fontWeight="semibold">Tool Configuration</Text>
              <Text fontSize="sm" color="gray.600">
                Manage available tools and capabilities
              </Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pb={0}>
            <ToolManagement
              tools={localConfig.tools}
              onToolsChange={handleToolUpdate}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Divider />

      {/* Status Information */}
      <Box>
        <Text fontWeight="semibold" mb={3}>Status Information</Text>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Current Status</Text>
            <Badge 
              colorScheme={
                localConfig.status === 'active' ? 'green' :
                localConfig.status === 'inactive' ? 'gray' :
                localConfig.status === 'error' ? 'red' : 'orange'
              }
            >
              {localConfig.status}
            </Badge>
          </HStack>
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Last Updated</Text>
            <Text>{new Date(localConfig.lastUpdated).toLocaleString()}</Text>
          </HStack>
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Active Tools</Text>
            <Text>{localConfig.tools.filter(tool => tool.enabled).length} / {localConfig.tools.length}</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Action Buttons */}
      {hasChanges && (
        <>
          <Divider />
          <HStack spacing={3}>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={handleSave}
              flex={1}
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              flex={1}
            >
              Reset
            </Button>
          </HStack>
        </>
      )}
    </VStack>
  );
}