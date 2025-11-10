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
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';

interface PersonalityTabProps {
  config: AgentConfiguration;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const PersonalityTab: React.FC<PersonalityTabProps> = ({
  config,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updatePersonalityTrait = (trait: string, value: number) => {
    updateConfig('personality', {
      ...config.personality,
      traits: {
        ...config.personality.traits,
        [trait]: value
      }
    });
  };

  const updateCommunicationStyle = (key: string, value: string) => {
    updateConfig('personality', {
      ...config.personality,
      communicationStyle: {
        ...config.personality.communicationStyle,
        [key]: value
      }
    });
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Personality Traits Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Heading size="sm">Personality Traits</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {Object.entries(config.personality.traits).map(([trait, value]) => (
              <FormControl key={trait}>
                <FormLabel textTransform="capitalize">
                  {trait.replace(/([A-Z])/g, ' $1')}
                </FormLabel>
                <Slider
                  value={value}
                  onChange={(val) => updatePersonalityTrait(trait, val)}
                  min={0}
                  max={100}
                  step={5}
                >
                  <SliderMark value={0} mt={2} fontSize="sm">
                    Low
                  </SliderMark>
                  <SliderMark value={50} mt={2} fontSize="sm" ml={-3}>
                    Medium
                  </SliderMark>
                  <SliderMark value={100} mt={2} fontSize="sm" ml={-6}>
                    High
                  </SliderMark>
                  <SliderMark
                    value={value}
                    mt={-8}
                    ml={-6}
                    fontSize="sm"
                    fontWeight="bold"
                    color="blue.500"
                  >
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

      {/* Communication Style Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Heading size="sm">Communication Style</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {Object.entries(config.personality.communicationStyle).map(([key, value]) => (
              <FormControl key={key}>
                <FormLabel textTransform="capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </FormLabel>
                <Input
                  value={value}
                  onChange={(e) => updateCommunicationStyle(key, e.target.value)}
                  placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                />
              </FormControl>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
