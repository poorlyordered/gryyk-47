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
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';

interface OutputFormatTabProps {
  config: AgentConfiguration;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const OutputFormatTab: React.FC<OutputFormatTabProps> = ({
  config,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateOutputFormatting = <K extends keyof AgentConfiguration['outputFormatting']>(
    key: K,
    value: AgentConfiguration['outputFormatting'][K]
  ) => {
    updateConfig('outputFormatting', {
      ...config.outputFormatting,
      [key]: value
    });
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Response Formatting Card */}
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
                  onChange={(e) => updateOutputFormatting('useMarkdown', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              <FormHelperText>Format responses with markdown</FormHelperText>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Include Confidence</FormLabel>
                <Switch
                  isChecked={config.outputFormatting.includeConfidence}
                  onChange={(e) => updateOutputFormatting('includeConfidence', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              <FormHelperText>Show confidence levels in responses</FormHelperText>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Show Sources</FormLabel>
                <Switch
                  isChecked={config.outputFormatting.showSources}
                  onChange={(e) => updateOutputFormatting('showSources', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              <FormHelperText>Include data sources in responses</FormHelperText>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Include Timestamps</FormLabel>
                <Switch
                  isChecked={config.outputFormatting.includeTimestamps}
                  onChange={(e) => updateOutputFormatting('includeTimestamps', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              <FormHelperText>Add timestamps to responses</FormHelperText>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
