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
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';

interface TechnicalParametersTabProps {
  config: AgentConfiguration;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const TechnicalParametersTab: React.FC<TechnicalParametersTabProps> = ({
  config,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateResponseParameter = <K extends keyof AgentConfiguration['responseParameters']>(
    key: K,
    value: AgentConfiguration['responseParameters'][K]
  ) => {
    updateConfig('responseParameters', {
      ...config.responseParameters,
      [key]: value
    });
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Response Generation Card */}
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
                onChange={(_, val) => updateResponseParameter('maxTokens', val)}
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
              <FormLabel>
                Temperature ({config.responseParameters.temperature})
              </FormLabel>
              <Slider
                value={config.responseParameters.temperature}
                onChange={(val) => updateResponseParameter('temperature', val)}
                min={0}
                max={2}
                step={0.1}
              >
                <SliderMark value={0} mt={2} fontSize="sm">
                  Focused
                </SliderMark>
                <SliderMark value={1} mt={2} fontSize="sm" ml={-3}>
                  Balanced
                </SliderMark>
                <SliderMark value={2} mt={2} fontSize="sm" ml={-6}>
                  Creative
                </SliderMark>
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
                onChange={(val) => updateResponseParameter('topP', val)}
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

      {/* Response Penalties Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Heading size="sm">Response Penalties</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>
                Presence Penalty ({config.responseParameters.presencePenalty})
              </FormLabel>
              <Slider
                value={config.responseParameters.presencePenalty}
                onChange={(val) => updateResponseParameter('presencePenalty', val)}
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
              <FormLabel>
                Frequency Penalty ({config.responseParameters.frequencyPenalty})
              </FormLabel>
              <Slider
                value={config.responseParameters.frequencyPenalty}
                onChange={(val) => updateResponseParameter('frequencyPenalty', val)}
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
  );
};
