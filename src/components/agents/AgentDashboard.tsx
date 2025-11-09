import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Card,
  CardBody,
  CardHeader,
  Button,
  Collapse,
  Icon,
  useColorModeValue,
  Flex,
  Spacer,
  Switch,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { FaChevronDown, FaChevronUp, FaCog, FaRobot, FaChartLine, FaUsers, FaGem, FaRocket } from 'react-icons/fa';
import { DEFAULT_AGENT_CONFIGS, type AgentConfig, type OrchestrationStats } from '../../types/agent-config';
import { AgentConfigCard } from './AgentConfigCard';

interface AgentDashboardProps {
  orchestrationStats: OrchestrationStats;
}

const agentIcons = {
  recruiting: FaUsers,
  economic: FaChartLine,
  market: FaGem,
  mining: FaRocket,
  mission: FaRobot
};

const agentColors = {
  recruiting: 'blue',
  economic: 'green',
  market: 'purple',
  mining: 'orange',
  mission: 'red'
};

export function AgentDashboard({ orchestrationStats }: AgentDashboardProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [orchestrationEnabled, setOrchestrationEnabled] = useState(true);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAgentToggle = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  const getAgentStatus = (agentId: string) => {
    const utilization = orchestrationStats.agentUtilization[agentId] || 0;
    if (utilization > 0.3) return { status: 'busy', color: 'orange' };
    if (utilization > 0.1) return { status: 'active', color: 'green' };
    return { status: 'idle', color: 'gray' };
  };

  const getUtilizationText = (utilization: number) => {
    if (utilization > 0.4) return 'High Activity';
    if (utilization > 0.2) return 'Moderate Activity';
    if (utilization > 0.05) return 'Low Activity';
    return 'Standby';
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Orchestration Control */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Flex align="center">
            <Heading size="md">Orchestration Control</Heading>
            <Spacer />
            <FormControl display="flex" alignItems="center" w="auto">
              <FormLabel htmlFor="orchestration-toggle" mb="0" mr={3}>
                Auto-Orchestration
              </FormLabel>
              <Switch 
                id="orchestration-toggle"
                isChecked={orchestrationEnabled}
                onChange={(e) => setOrchestrationEnabled(e.target.checked)}
                colorScheme="blue"
              />
            </FormControl>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <Text color="gray.600" mb={3}>
            {orchestrationEnabled 
              ? 'Gryyk-47 will automatically consult specialists based on query complexity and domain expertise.'
              : 'Manual mode - Gryyk-47 will operate without specialist consultation.'
            }
          </Text>
          <Badge 
            colorScheme={orchestrationEnabled ? 'green' : 'gray'} 
            px={3} 
            py={1} 
            borderRadius="full"
          >
            {orchestrationEnabled ? 'Orchestration Active' : 'Orchestration Disabled'}
          </Badge>
        </CardBody>
      </Card>

      {/* Specialist Agents Grid */}
      <Box>
        <Heading size="md" mb={4}>Highsec Specialist Agents</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {Object.entries(DEFAULT_AGENT_CONFIGS).map(([agentId, config]) => {
            const agentConfig: AgentConfig = { id: agentId, ...config };
            const { status, color } = getAgentStatus(agentId);
            const utilization = orchestrationStats.agentUtilization[agentId] || 0;
            const AgentIcon = agentIcons[agentId as keyof typeof agentIcons];
            const agentColor = agentColors[agentId as keyof typeof agentColors];

            return (
              <Card 
                key={agentId} 
                bg={cardBg} 
                borderWidth="1px" 
                borderColor={borderColor}
                transition="all 0.2s"
                _hover={{ borderColor: `${agentColor}.300`, shadow: 'md' }}
              >
                <CardHeader pb={2}>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={AgentIcon} color={`${agentColor}.500`} boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Heading size="sm">{config.displayName}</Heading>
                        <Badge colorScheme={color} size="sm">
                          {status}
                        </Badge>
                      </VStack>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAgentToggle(agentId)}
                      leftIcon={<Icon as={expandedAgent === agentId ? FaChevronUp : FaChevronDown} />}
                    >
                      <Icon as={FaCog} />
                    </Button>
                  </HStack>
                </CardHeader>

                <CardBody pt={0}>
                  <Text fontSize="sm" color="gray.600" mb={3} noOfLines={2}>
                    {config.description}
                  </Text>

                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between" fontSize="sm">
                      <Text>Activity Level</Text>
                      <Text color={`${color}.500`} fontWeight="medium">
                        {getUtilizationText(utilization)}
                      </Text>
                    </HStack>
                    <Progress 
                      value={utilization * 100} 
                      colorScheme={color} 
                      size="sm" 
                      borderRadius="md"
                    />

                    <HStack justify="space-between" fontSize="sm">
                      <Text>Tools Available</Text>
                      <Badge colorScheme={agentColor} variant="subtle">
                        {config.tools.filter(tool => tool.enabled).length} active
                      </Badge>
                    </HStack>

                    <HStack justify="space-between" fontSize="sm">
                      <Text>Model</Text>
                      <Text fontFamily="mono" fontSize="xs" color="gray.500">
                        {config.model}
                      </Text>
                    </HStack>
                  </VStack>

                  <Collapse in={expandedAgent === agentId} animateOpacity>
                    <Box mt={4} pt={4} borderTop="1px" borderColor={borderColor}>
                      <AgentConfigCard 
                        agent={agentConfig}
                        onConfigChange={(updatedAgent) => {
                          console.log('Agent config updated:', updatedAgent);
                          // TODO: Implement config persistence
                        }}
                      />
                    </Box>
                  </Collapse>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Recent Activity */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Recent Orchestration Activity</Heading>
        </CardHeader>
        <CardBody>
          {orchestrationStats.recentActivity.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {orchestrationStats.recentActivity.slice(0, 5).map((activity, index) => (
                <Box key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                      {activity.query}
                    </Text>
                    <Badge colorScheme={activity.success ? 'green' : 'red'} size="sm">
                      {activity.success ? 'Success' : 'Failed'}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" fontSize="xs" color="gray.500">
                    <Text>
                      Specialists: {activity.agentsConsulted.join(', ')}
                    </Text>
                    <Text>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={4}>
              No recent orchestration activity
            </Text>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}