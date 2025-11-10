import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  CheckboxGroup,
  Checkbox,
  Wrap,
  WrapItem,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';
import type { AgentMetadata } from '../../constants/agentInfo';

interface ToolsDataTabProps {
  config: AgentConfiguration;
  agentInfo: AgentMetadata | undefined;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const ToolsDataTab: React.FC<ToolsDataTabProps> = ({
  config,
  agentInfo,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Available Tools Card */}
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
              value={config.toolsEnabled || config.tools}
              onChange={(values) => {
                updateConfig('toolsEnabled', values as string[]);
                updateConfig('tools', values as string[]);
              }}
            >
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="sm">Core Tools</Text>
                <Checkbox value="queryKnowledgeBase">Query Knowledge Base</Checkbox>
                <Checkbox value="manageKnowledgeBase">Manage Knowledge Base</Checkbox>

                <Text fontWeight="bold" fontSize="sm" mt={4}>Specialized Tools</Text>
                {agentInfo?.defaultTools.map(tool => (
                  <Checkbox key={tool} value={tool}>
                    {tool.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Checkbox>
                ))}
              </VStack>
            </CheckboxGroup>
          </VStack>
        </CardBody>
      </Card>

      {/* Data Sources Card */}
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
                onChange={(values) => updateConfig('ragSources', values as string[])}
              >
                <Wrap>
                  <WrapItem>
                    <Checkbox value="general">General Knowledge</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="economic">Economic Data</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="recruiting">Recruiting Info</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="market">Market Data</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="mining">Mining Info</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="mission">Mission Data</Checkbox>
                  </WrapItem>
                </Wrap>
              </CheckboxGroup>
              <Text fontSize="xs" color="gray.500" mt={2}>
                Select which knowledge bases the agent can query
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>ESI Data Sources</FormLabel>
              <CheckboxGroup
                value={config.esiDataSources}
                onChange={(values) => updateConfig('esiDataSources', values as string[])}
              >
                <VStack align="start" spacing={1}>
                  <Checkbox value="corp-basic-info">Corporation Info</Checkbox>
                  <Checkbox value="corp-members">Corporation Members</Checkbox>
                  <Checkbox value="market-prices">Market Prices</Checkbox>
                  <Checkbox value="jita-market-orders">Jita Market Orders</Checkbox>
                  <Checkbox value="system-info">System Information</Checkbox>
                </VStack>
              </CheckboxGroup>
              <Text fontSize="xs" color="gray.500" mt={2}>
                Select which EVE Online ESI endpoints the agent can access
              </Text>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
