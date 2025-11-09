import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  Grid,
  GridItem,
  VStack,
  HStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { AgentHealth, SystemHealth, AgentAlert } from '../types';
import { useAgentMonitoring } from '../hooks/useAgentMonitoring';

export const AgentHealthDashboard: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const toast = useToast();
  
  const {
    systemHealth,
    agentHealths,
    alerts,
    isLoading,
    error,
    acknowledgeAlert,
    resolveAlert,
    refreshHealth
  } = useAgentMonitoring();

  const getStatusColor = (status: AgentHealth['status']) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'orange';
      case 'offline': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: AgentHealth['status']) => {
    switch (status) {
      case 'healthy': return FiCheckCircle;
      case 'degraded': return FiAlertTriangle;
      case 'unhealthy': return FiXCircle;
      case 'offline': return FiXCircle;
      default: return FiActivity;
    }
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const success = action === 'acknowledge' 
        ? await acknowledgeAlert(alertId)
        : await resolveAlert(alertId);
      
      if (success) {
        toast({
          title: `Alert ${action}d`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: `Failed to ${action} alert`,
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Loading agent health data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error loading health data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg">Agent Health Dashboard</Heading>
          <Button onClick={refreshHealth} size="sm" colorScheme="blue">
            Refresh
          </Button>
        </HStack>

        {/* System Overview */}
        {systemHealth && (
          <Card>
            <CardHeader>
              <Heading size="md">System Health Overview</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <VStack spacing={2}>
                  <HStack>
                    <Icon as={getStatusIcon(systemHealth.overallStatus)} 
                          color={getStatusColor(systemHealth.overallStatus)} />
                    <Text fontWeight="bold">Overall Status</Text>
                  </HStack>
                  <Badge colorScheme={getStatusColor(systemHealth.overallStatus)} size="lg">
                    {systemHealth.overallStatus.toUpperCase()}
                  </Badge>
                </VStack>

                <Stat>
                  <StatLabel>Active Agents</StatLabel>
                  <StatNumber>{agentHealths.filter(a => a.status !== 'offline').length}</StatNumber>
                  <StatHelpText>of {agentHealths.length} total</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Active Alerts</StatLabel>
                  <StatNumber color="red.500">
                    {alerts.filter(a => !a.acknowledged && !a.resolvedAt).length}
                  </StatNumber>
                  <StatHelpText>unacknowledged</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>ESI Rate Limit</StatLabel>
                  <StatNumber>{systemHealth.esiIntegration.rateLimitRemaining}</StatNumber>
                  <StatHelpText>calls remaining</StatHelpText>
                </Stat>
              </Grid>
            </CardBody>
          </Card>
        )}

        <Tabs>
          <TabList>
            <Tab>Agent Status</Tab>
            <Tab>System Components</Tab>
            <Tab>Alerts ({alerts.filter(a => !a.resolvedAt).length})</Tab>
            <Tab>Performance Metrics</Tab>
          </TabList>

          <TabPanels>
            {/* Agent Status Tab */}
            <TabPanel>
              <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                {agentHealths.map((agent) => (
                  <Card key={agent.agentId} 
                        borderColor={getStatusColor(agent.status)}
                        borderWidth={2}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Heading size="sm">{agent.name}</Heading>
                          <HStack>
                            <Icon as={getStatusIcon(agent.status)} 
                                  color={getStatusColor(agent.status)} />
                            <Badge colorScheme={getStatusColor(agent.status)}>
                              {agent.status.toUpperCase()}
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Response Time</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {agent.responseTime}ms
                          </Text>
                        </HStack>
                        
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm">Success Rate</Text>
                            <Text fontSize="sm">{agent.successRate.toFixed(1)}%</Text>
                          </HStack>
                          <Progress value={agent.successRate} colorScheme="green" size="sm" />
                        </Box>

                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm">Error Rate</Text>
                            <Text fontSize="sm">{agent.errorRate.toFixed(1)}%</Text>
                          </HStack>
                          <Progress value={agent.errorRate} colorScheme="red" size="sm" />
                        </Box>

                        <HStack justify="space-between" fontSize="sm">
                          <Text>Memory Usage</Text>
                          <Text>{agent.memoryUsage.toFixed(1)}MB</Text>
                        </HStack>

                        <HStack justify="space-between" fontSize="sm">
                          <Text>Last Seen</Text>
                          <Text>{new Date(agent.lastSeen).toLocaleTimeString()}</Text>
                        </HStack>

                        {agent.lastError && (
                          <Alert status="error" size="sm">
                            <AlertIcon />
                            <Text fontSize="xs">{agent.lastError}</Text>
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </TabPanel>

            {/* System Components Tab */}
            <TabPanel>
              {systemHealth && (
                <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Orchestrator</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Status</Text>
                          <Badge colorScheme={getStatusColor(systemHealth.orchestrator.status)}>
                            {systemHealth.orchestrator.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Active Consultations</Text>
                          <Text fontSize="sm">{systemHealth.orchestrator.activeConsultations}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Queue Length</Text>
                          <Text fontSize="sm">{systemHealth.orchestrator.queueLength}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Avg Time</Text>
                          <Text fontSize="sm">{Math.round(systemHealth.orchestrator.avgConsultationTime)}ms</Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">RAG System</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Status</Text>
                          <Badge colorScheme={getStatusColor(systemHealth.ragSystem.status)}>
                            {systemHealth.ragSystem.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Index Size</Text>
                          <Text fontSize="sm">{Math.round(systemHealth.ragSystem.indexSize / 1000)}K docs</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Query Latency</Text>
                          <Text fontSize="sm">{Math.round(systemHealth.ragSystem.queryLatency)}ms</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Indexing</Text>
                          <Badge colorScheme={systemHealth.ragSystem.indexingActive ? "blue" : "gray"}>
                            {systemHealth.ragSystem.indexingActive ? "ACTIVE" : "IDLE"}
                          </Badge>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">ESI Integration</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Status</Text>
                          <Badge colorScheme={getStatusColor(systemHealth.esiIntegration.status)}>
                            {systemHealth.esiIntegration.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Rate Limit</Text>
                          <Text fontSize="sm">{systemHealth.esiIntegration.rateLimitRemaining} calls</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Cache Hit Rate</Text>
                          <Text fontSize="sm">{systemHealth.esiIntegration.cacheHitRate.toFixed(1)}%</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Avg Response</Text>
                          <Text fontSize="sm">{Math.round(systemHealth.esiIntegration.avgResponseTime)}ms</Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              )}
            </TabPanel>

            {/* Alerts Tab */}
            <TabPanel>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Time</Th>
                      <Th>Agent</Th>
                      <Th>Severity</Th>
                      <Th>Message</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {alerts.slice(0, 20).map((alert) => (
                      <Tr key={alert.id}>
                        <Td fontSize="sm">
                          <VStack align="start" spacing={0}>
                            <Text>{new Date(alert.timestamp).toLocaleDateString()}</Text>
                            <Text color="gray.500">{new Date(alert.timestamp).toLocaleTimeString()}</Text>
                          </VStack>
                        </Td>
                        <Td fontSize="sm">
                          {agentHealths.find(a => a.agentId === alert.agentId)?.name || alert.agentId}
                        </Td>
                        <Td>
                          <Badge colorScheme={
                            alert.severity === 'critical' ? 'red' :
                            alert.severity === 'warning' ? 'yellow' : 'blue'
                          }>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td fontSize="sm" maxW="300px">
                          <Text noOfLines={2}>{alert.message}</Text>
                        </Td>
                        <Td>
                          {alert.resolvedAt ? (
                            <Badge colorScheme="green">RESOLVED</Badge>
                          ) : alert.acknowledged ? (
                            <Badge colorScheme="blue">ACKNOWLEDGED</Badge>
                          ) : (
                            <Badge colorScheme="red">ACTIVE</Badge>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            {!alert.acknowledged && !alert.resolvedAt && (
                              <Button
                                size="xs"
                                onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                              >
                                Ack
                              </Button>
                            )}
                            {!alert.resolvedAt && (
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleAlertAction(alert.id, 'resolve')}
                              >
                                Resolve
                              </Button>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Performance Metrics Tab */}
            <TabPanel>
              <Text>Performance metrics and detailed analytics will be implemented here.</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};