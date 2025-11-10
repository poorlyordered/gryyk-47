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
  CheckboxGroup,
  Checkbox,
  Wrap,
  WrapItem,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';

interface BehaviorTabProps {
  config: AgentConfiguration;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const BehaviorTab: React.FC<BehaviorTabProps> = ({
  config,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateBehaviorSettings = <K extends keyof AgentConfiguration['behaviorSettings']>(
    key: K,
    value: AgentConfiguration['behaviorSettings'][K]
  ) => {
    updateConfig('behaviorSettings', {
      ...config.behaviorSettings,
      [key]: value
    });
  };

  const updateContextSettings = <K extends keyof AgentConfiguration['contextSettings']>(
    key: K,
    value: AgentConfiguration['contextSettings'][K]
  ) => {
    updateConfig('contextSettings', {
      ...config.contextSettings,
      [key]: value
    });
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Consultation Behavior Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Heading size="sm">Consultation Behavior</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>
                Consultation Threshold ({config.behaviorSettings.consultationThreshold}%)
              </FormLabel>
              <Slider
                value={config.behaviorSettings.consultationThreshold}
                onChange={(val) => updateBehaviorSettings('consultationThreshold', val)}
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
              <FormLabel>
                Confidence Threshold ({config.behaviorSettings.confidenceThreshold}%)
              </FormLabel>
              <Slider
                value={config.behaviorSettings.confidenceThreshold}
                onChange={(val) => updateBehaviorSettings('confidenceThreshold', val)}
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
                onChange={(e) => updateBehaviorSettings('fallbackBehavior', e.target.value as any)}
              >
                <option value="conservative">Conservative - Provide safe advice</option>
                <option value="ask_human">Ask Human - Request human input</option>
                <option value="consult_all">Consult All - Ask all other agents</option>
              </Select>
              <FormHelperText>
                What the agent does when confidence is below threshold
              </FormHelperText>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Context Management Card */}
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
                onChange={(_, val) => updateContextSettings('memoryDepth', val)}
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
                onChange={(values) => updateContextSettings('contextualPriorities', values as string[])}
              >
                <Wrap>
                  <WrapItem>
                    <Checkbox value="recent_data">Recent Data</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="corporation_goals">Corp Goals</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="user_preferences">User Preferences</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="market_conditions">Market Conditions</Checkbox>
                  </WrapItem>
                  <WrapItem>
                    <Checkbox value="risk_factors">Risk Factors</Checkbox>
                  </WrapItem>
                </Wrap>
              </CheckboxGroup>
              <FormHelperText>
                Select which contexts the agent should prioritize
              </FormHelperText>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
