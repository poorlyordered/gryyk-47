import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Switch,
  Box,
  Badge,
  Tooltip,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { FaInfoCircle, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { type AgentToolConfig } from '../../types/agent-config';

interface ToolManagementProps {
  tools: AgentToolConfig[];
  onToolsChange: (updatedTools: AgentToolConfig[]) => void;
}

export function ToolManagement({ tools, onToolsChange }: ToolManagementProps) {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleToolToggle = (toolId: string, enabled: boolean) => {
    const updatedTools = tools.map(tool =>
      tool.toolId === toolId ? { ...tool, enabled } : tool
    );
    onToolsChange(updatedTools);
  };

  const handleEnableAll = () => {
    const updatedTools = tools.map(tool => ({ ...tool, enabled: true }));
    onToolsChange(updatedTools);
  };

  const handleDisableAll = () => {
    const updatedTools = tools.map(tool => ({ ...tool, enabled: false }));
    onToolsChange(updatedTools);
  };

  const enabledCount = tools.filter(tool => tool.enabled).length;

  return (
    <VStack spacing={4} align="stretch">
      {/* Tool Overview */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="medium">
            Tool Status Overview
          </Text>
          <HStack spacing={2}>
            <Badge colorScheme="green" variant="subtle">
              {enabledCount} Active
            </Badge>
            <Badge colorScheme="gray" variant="subtle">
              {tools.length - enabledCount} Inactive
            </Badge>
          </HStack>
        </VStack>
        
        <HStack spacing={2}>
          <Button
            size="xs"
            variant="outline"
            colorScheme="green"
            onClick={handleEnableAll}
            isDisabled={enabledCount === tools.length}
            leftIcon={<Icon as={FaToggleOn} />}
          >
            Enable All
          </Button>
          <Button
            size="xs"
            variant="outline"
            colorScheme="red"
            onClick={handleDisableAll}
            isDisabled={enabledCount === 0}
            leftIcon={<Icon as={FaToggleOff} />}
          >
            Disable All
          </Button>
        </HStack>
      </HStack>

      {/* Individual Tools */}
      <SimpleGrid columns={{ base: 1 }} spacing={3}>
        {tools.map((tool) => (
          <Card
            key={tool.toolId}
            bg={cardBg}
            borderWidth="1px"
            borderColor={tool.enabled ? 'green.200' : borderColor}
            transition="all 0.2s"
            opacity={tool.enabled ? 1 : 0.7}
          >
            <CardBody p={4}>
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={1} flex={1}>
                  <HStack>
                    <Text fontWeight="medium" fontSize="sm">
                      {tool.toolName}
                    </Text>
                    <Badge
                      colorScheme={tool.enabled ? 'green' : 'gray'}
                      size="sm"
                    >
                      {tool.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="xs" color="gray.600" lineHeight="short">
                    {tool.description}
                  </Text>

                  {/* Tool Parameters Display */}
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <Box mt={2}>
                      <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={1}>
                        Parameters:
                      </Text>
                      <HStack spacing={1} flexWrap="wrap">
                        {Object.keys(tool.parameters).slice(0, 3).map((param) => (
                          <Badge key={param} size="xs" variant="outline" colorScheme="blue">
                            {param}
                          </Badge>
                        ))}
                        {Object.keys(tool.parameters).length > 3 && (
                          <Tooltip
                            label={`Additional parameters: ${Object.keys(tool.parameters).slice(3).join(', ')}`}
                            placement="top"
                          >
                            <Badge size="xs" variant="outline" colorScheme="gray">
                              +{Object.keys(tool.parameters).length - 3} more
                            </Badge>
                          </Tooltip>
                        )}
                      </HStack>
                    </Box>
                  )}
                </VStack>

                <VStack spacing={2} align="center">
                  <Switch
                    isChecked={tool.enabled}
                    onChange={(e) => handleToolToggle(tool.toolId, e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  />
                  
                  <Tooltip
                    label="Tool configuration and usage information"
                    placement="left"
                  >
                    <Icon
                      as={FaInfoCircle}
                      color="gray.400"
                      boxSize={3}
                      cursor="help"
                    />
                  </Tooltip>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Tool Management Tips */}
      <Box p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md" borderWidth="1px" borderColor="blue.200">
        <Text fontSize="xs" color="blue.700" fontWeight="medium" mb={1}>
          💡 Tool Management Tips
        </Text>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="blue.600">
            • Disable unused tools to improve response speed and reduce complexity
          </Text>
          <Text fontSize="xs" color="blue.600">
            • Enable specialized tools only when needed for specific scenarios
          </Text>
          <Text fontSize="xs" color="blue.600">
            • Tools with parameters may require additional configuration in advanced settings
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}