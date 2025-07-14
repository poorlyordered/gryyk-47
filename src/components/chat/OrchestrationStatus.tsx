import React from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Icon,
  Flex,
  VStack,
  Progress,
  Tooltip
} from '@chakra-ui/react';
import { FaRobot, FaUsers, FaChartLine, FaGem, FaRocket, FaBrain } from 'react-icons/fa';

export interface OrchestrationStatusProps {
  isOrchestrated: boolean;
  specialistsConsulted?: string[];
  confidence?: number;
  responseTime?: number;
}

const agentIcons = {
  recruiting: FaUsers,
  economic: FaChartLine,
  market: FaGem,
  mining: FaRocket,
  mission: FaBrain
};

const agentColors = {
  recruiting: 'blue',
  economic: 'green',
  market: 'purple',
  mining: 'orange',
  mission: 'red'
};

export default function OrchestrationStatus({
  isOrchestrated,
  specialistsConsulted = [],
  confidence,
  responseTime
}: OrchestrationStatusProps) {
  if (!isOrchestrated) {
    return (
      <Box fontSize="xs" color="gray.500" mt={2}>
        <HStack spacing={1}>
          <Icon as={FaRobot} boxSize={3} />
          <Text>Standard response</Text>
        </HStack>
      </Box>
    );
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'green';
    if (conf >= 0.6) return 'yellow';
    return 'red';
  };

  return (
    <Box
      fontSize="xs"
      color="gray.400"
      mt={2}
      p={2}
      bg="blue.900"
      borderRadius="md"
      border="1px"
      borderColor="blue.700"
    >
      <VStack spacing={2} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={1}>
            <Icon as={FaRobot} color="blue.400" boxSize={3} />
            <Text color="blue.300" fontWeight="medium">
              Orchestrated Response
            </Text>
          </HStack>
          {responseTime && (
            <Text color="gray.400">
              {responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`}
            </Text>
          )}
        </HStack>

        {/* Specialists Consulted */}
        {specialistsConsulted.length > 0 && (
          <Box>
            <Text color="gray.300" mb={1}>
              Specialists consulted:
            </Text>
            <HStack spacing={1} flexWrap="wrap">
              {specialistsConsulted.map((specialist) => {
                const AgentIcon = agentIcons[specialist as keyof typeof agentIcons];
                const color = agentColors[specialist as keyof typeof agentColors];
                
                return (
                  <Tooltip
                    key={specialist}
                    label={`${specialist.charAt(0).toUpperCase() + specialist.slice(1)} Specialist`}
                  >
                    <Badge
                      colorScheme={color}
                      variant="subtle"
                      fontSize="xs"
                      px={2}
                      py={1}
                    >
                      <HStack spacing={1}>
                        {AgentIcon && <Icon as={AgentIcon} boxSize={2} />}
                        <Text>{specialist.charAt(0).toUpperCase() + specialist.slice(1)}</Text>
                      </HStack>
                    </Badge>
                  </Tooltip>
                );
              })}
            </HStack>
          </Box>
        )}

        {/* Confidence Level */}
        {confidence !== undefined && (
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text color="gray.300">
                Analysis confidence:
              </Text>
              <Badge
                colorScheme={getConfidenceColor(confidence)}
                variant="subtle"
                fontSize="xs"
              >
                {Math.round(confidence * 100)}%
              </Badge>
            </HStack>
            <Progress
              value={confidence * 100}
              colorScheme={getConfidenceColor(confidence)}
              size="sm"
              borderRadius="md"
            />
          </Box>
        )}

        {/* Info */}
        <Text color="gray.400" fontSize="2xs">
          This response was enhanced through multi-agent specialist consultation
        </Text>
      </VStack>
    </Box>
  );
}