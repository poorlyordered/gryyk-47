import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Card,
  CardBody,
  HStack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaRobot, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { AgentDashboard } from '../components/agents/AgentDashboard';
import { DEFAULT_AGENT_CONFIGS, type AgentConfig } from '../types/agent-config';

export default function AgentManagement() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Mock orchestration stats - would come from actual service
  const orchestrationStats = {
    totalQueries: 142,
    averageResponseTime: 2.3,
    agentUtilization: {
      recruiting: 0.15,
      economic: 0.35,
      market: 0.28,
      mining: 0.42,
      mission: 0.22
    },
    memoryUsage: {
      totalExperiences: 89,
      totalDecisions: 34,
      totalPatterns: 12
    },
    recentActivity: [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        query: 'Optimize mining fleet composition',
        agentsConsulted: ['mining', 'economic'],
        success: true
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        query: 'Recruitment strategy for new miners',
        agentsConsulted: ['recruiting', 'mining'],
        success: true
      }
    ]
  };

  const systemStats = [
    {
      label: 'Total Queries',
      value: orchestrationStats.totalQueries,
      helpText: 'Processed this week',
      icon: FaRobot,
      color: 'blue'
    },
    {
      label: 'Avg Response Time',
      value: `${orchestrationStats.averageResponseTime}s`,
      helpText: 'Including specialist consultation',
      icon: FaClock,
      color: 'green'
    },
    {
      label: 'Active Specialists',
      value: Object.keys(DEFAULT_AGENT_CONFIGS).length,
      helpText: 'Highsec specialists online',
      icon: FaCheckCircle,
      color: 'purple'
    },
    {
      label: 'Memory Patterns',
      value: orchestrationStats.memoryUsage.totalPatterns,
      helpText: 'Learned patterns detected',
      icon: FaExclamationTriangle,
      color: 'orange'
    }
  ];

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Gryyk-47 Agent Management
          </Heading>
          <Text color="gray.600" mb={4}>
            Monitor and configure your hierarchical AI specialist network
          </Text>
          
          <HStack spacing={4} mb={6}>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              Orchestrator Online
            </Badge>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              {Object.keys(DEFAULT_AGENT_CONFIGS).length} Specialists Active
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
              Memory Learning Enabled
            </Badge>
          </HStack>
        </Box>

        {/* System Overview Stats */}
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="md" mb={4}>System Performance Overview</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {systemStats.map((stat, index) => (
                <Stat key={index}>
                  <HStack>
                    <Icon as={stat.icon} color={`${stat.color}.500`} boxSize={5} />
                    <StatLabel>{stat.label}</StatLabel>
                  </HStack>
                  <StatNumber color={`${stat.color}.500`}>{stat.value}</StatNumber>
                  <StatHelpText>{stat.helpText}</StatHelpText>
                </Stat>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Memory System Overview */}
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="md" mb={4}>Memory & Learning System</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat>
                <StatLabel>Stored Experiences</StatLabel>
                <StatNumber color="blue.500">{orchestrationStats.memoryUsage.totalExperiences}</StatNumber>
                <StatHelpText>Agent operational memories</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Strategic Decisions</StatLabel>
                <StatNumber color="green.500">{orchestrationStats.memoryUsage.totalDecisions}</StatNumber>
                <StatHelpText>Tracked outcomes & results</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Pattern Recognition</StatLabel>
                <StatNumber color="purple.500">{orchestrationStats.memoryUsage.totalPatterns}</StatNumber>
                <StatHelpText>Cross-domain insights identified</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Agent Dashboard */}
        <AgentDashboard orchestrationStats={orchestrationStats} />
      </VStack>
    </Container>
  );
}