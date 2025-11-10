import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  Textarea,
  Text,
  Code,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';
import type { AgentMetadata } from '../../constants/agentInfo';

interface BasicSettingsTabProps {
  config: AgentConfiguration;
  agentInfo: AgentMetadata | undefined;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const BasicSettingsTab: React.FC<BasicSettingsTabProps> = ({
  config,
  agentInfo,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
      {/* Agent Status Card */}
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

      {/* Agent Information Card */}
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
              <Text fontSize="sm">{agentInfo?.specialization}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">Last Updated:</Text>
              <Text fontSize="sm">
                {new Date(config.updatedAt).toLocaleDateString()}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
