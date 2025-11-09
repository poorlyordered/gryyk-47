import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Badge,
  Collapse,
  Icon,
  useDisclosure,
  Tooltip
} from '@chakra-ui/react';
import { FaChevronDown, FaChevronUp, FaRobot, FaInfoCircle } from 'react-icons/fa';
import { useChatStore } from '../../store/chat';

export default function OrchestrationControls() {
  const { isOpen, onToggle } = useDisclosure();
  const { orchestration, setOrchestrationSettings } = useChatStore();

  const handleOrchestrationToggle = (enabled: boolean) => {
    setOrchestrationSettings({ enabled });
  };

  const handleAutoDetectToggle = (autoDetect: boolean) => {
    setOrchestrationSettings({ autoDetect });
  };

  const handleSpecialistInsightsToggle = (showSpecialistInsights: boolean) => {
    setOrchestrationSettings({ showSpecialistInsights });
  };

  const handleConfidenceThresholdChange = (confidenceThreshold: number) => {
    setOrchestrationSettings({ confidenceThreshold: confidenceThreshold / 100 });
  };

  return (
    <Box bg="gray.800" borderRadius="lg" border="1px" borderColor="gray.700">
      {/* Header */}
      <HStack
        p={3}
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: 'gray.750' }}
        borderRadius="lg"
      >
        <Icon as={FaRobot} color="blue.400" />
        <Text fontWeight="medium" flex={1}>
          Gryyk-47 Orchestration
        </Text>
        <Badge
          colorScheme={orchestration.enabled ? 'green' : 'gray'}
          variant="subtle"
        >
          {orchestration.enabled ? 'Active' : 'Disabled'}
        </Badge>
        <Icon as={isOpen ? FaChevronUp : FaChevronDown} />
      </HStack>

      {/* Expanded Controls */}
      <Collapse in={isOpen} animateOpacity>
        <VStack spacing={4} p={4} pt={0}>
          {/* Master Toggle */}
          <FormControl display="flex" alignItems="center">
            <HStack flex={1} spacing={2}>
              <FormLabel htmlFor="orchestration-enabled" mb="0" fontSize="sm">
                Enable Multi-Agent Consultation
              </FormLabel>
              <Tooltip label="When enabled, Gryyk-47 can consult specialist agents for complex queries">
                <Box>
                  <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                </Box>
              </Tooltip>
            </HStack>
            <Switch
              id="orchestration-enabled"
              isChecked={orchestration.enabled}
              onChange={(e) => handleOrchestrationToggle(e.target.checked)}
              colorScheme="blue"
            />
          </FormControl>

          {/* Sub-settings (only when orchestration is enabled) */}
          {orchestration.enabled && (
            <>
              <FormControl display="flex" alignItems="center">
                <HStack flex={1} spacing={2}>
                  <FormLabel htmlFor="auto-detect" mb="0" fontSize="sm">
                    Auto-detect Complex Queries
                  </FormLabel>
                  <Tooltip label="Automatically use orchestration for strategic questions. When disabled, all queries use orchestration">
                    <Box>
                      <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                    </Box>
                  </Tooltip>
                </HStack>
                <Switch
                  id="auto-detect"
                  isChecked={orchestration.autoDetect}
                  onChange={(e) => handleAutoDetectToggle(e.target.checked)}
                  colorScheme="blue"
                  size="sm"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <HStack flex={1} spacing={2}>
                  <FormLabel htmlFor="specialist-insights" mb="0" fontSize="sm">
                    Show Specialist Insights
                  </FormLabel>
                  <Tooltip label="Display individual specialist contributions in the response">
                    <Box>
                      <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                    </Box>
                  </Tooltip>
                </HStack>
                <Switch
                  id="specialist-insights"
                  isChecked={orchestration.showSpecialistInsights}
                  onChange={(e) => handleSpecialistInsightsToggle(e.target.checked)}
                  colorScheme="blue"
                  size="sm"
                />
              </FormControl>

              <FormControl>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FormLabel fontSize="sm" mb="0">
                      Confidence Threshold
                    </FormLabel>
                    <Tooltip label="Minimum confidence level required for specialist recommendations to be included">
                      <Box>
                        <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                      </Box>
                    </Tooltip>
                  </HStack>
                  <Badge variant="outline" fontSize="xs">
                    {Math.round(orchestration.confidenceThreshold * 100)}%
                  </Badge>
                </HStack>
                <Slider
                  value={orchestration.confidenceThreshold * 100}
                  onChange={handleConfidenceThresholdChange}
                  min={50}
                  max={95}
                  step={5}
                  colorScheme="blue"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <HStack justify="space-between" fontSize="xs" color="gray.500" mt={1}>
                  <Text>Conservative</Text>
                  <Text>Permissive</Text>
                </HStack>
              </FormControl>
            </>
          )}

          {/* Info Text */}
          <Box fontSize="xs" color="gray.400" p={2} bg="gray.750" borderRadius="md">
            {orchestration.enabled ? (
              orchestration.autoDetect ? (
                <Text>
                  🤖 Gryyk-47 will automatically consult specialists for strategic queries like planning, recruitment, market analysis, and mining operations.
                </Text>
              ) : (
                <Text>
                  🤖 All queries will use multi-agent consultation with specialist insights.
                </Text>
              )
            ) : (
              <Text>
                💬 Using standard chat mode. Gryyk-47 will respond directly without specialist consultation.
              </Text>
            )}
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
}