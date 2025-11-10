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
  Switch,
  Tooltip,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiSettings,
  FiPlay,
  FiPause,
  FiMoreVertical
} from 'react-icons/fi';
import { PipelineConfigEditor } from './PipelineConfigEditor';
import { PipelineLogsViewer } from './PipelineLogsViewer';

interface DataSourceStatus {
  id: string;
  name: string;
  status: 'active' | 'disabled' | 'error';
  lastUpdate?: string;
  nextUpdate?: string;
  errors: number;
  recordsIngested?: number;
  dataSize?: number;
}

interface PipelineMetrics {
  totalRequests: number;
  avgDuration: number;
  totalDataSize: number;
  totalRecords: number;
  avgCacheHitRate: number;
  timeRange?: {
    start: string;
    end: string;
  };
}

export const ESIPipelineDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Mock data for demonstration
  useEffect(() => {
    const loadInitialData = () => {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setDataSources([
          {
            id: 'corp-basic-info',
            name: 'Corporation Basic Information',
            status: 'active',
            lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            nextUpdate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            errors: 0,
            recordsIngested: 1,
            dataSize: 2048
          },
          {
            id: 'corp-members',
            name: 'Corporation Members',
            status: 'active',
            lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            errors: 0,
            recordsIngested: 47,
            dataSize: 15360
          },
          {
            id: 'jita-market-orders',
            name: 'Jita Market Orders',
            status: 'active',
            lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            nextUpdate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            errors: 0,
            recordsIngested: 1247,
            dataSize: 524288
          },
          {
            id: 'market-prices',
            name: 'Market Prices',
            status: 'active',
            lastUpdate: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            nextUpdate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            errors: 1,
            recordsIngested: 8934,
            dataSize: 1048576
          },
          {
            id: 'sovereignty-map',
            name: 'Sovereignty Map',
            status: 'disabled',
            lastUpdate: undefined,
            nextUpdate: undefined,
            errors: 0,
            recordsIngested: 0,
            dataSize: 0
          }
        ]);

        setMetrics({
          totalRequests: 156,
          avgDuration: 1247,
          totalDataSize: 15728640, // ~15MB
          totalRecords: 10229,
          avgCacheHitRate: 73,
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        });

        setIsRunning(true);
        setIsLoading(false);
      }, 1000);
    };

    loadInitialData();
  }, []);

  const getStatusIcon = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'active': return FiCheckCircle;
      case 'disabled': return FiPause;
      case 'error': return FiXCircle;
      default: return FiClock;
    }
  };

  const getStatusColor = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'active': return 'green';
      case 'disabled': return 'gray';
      case 'error': return 'red';
      default: return 'yellow';
    }
  };

  const handleTogglePipeline = async () => {
    try {
      if (isRunning) {
        // Stop pipeline
        setIsRunning(false);
        toast({
          title: 'Pipeline Stopped',
          description: 'ESI data ingestion pipeline has been stopped',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Start pipeline
        setIsRunning(true);
        toast({
          title: 'Pipeline Started',
          description: 'ESI data ingestion pipeline has been started',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle pipeline state',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleDataSource = async (dataSourceId: string, enable: boolean) => {
    try {
      setDataSources(prev => prev.map(ds => 
        ds.id === dataSourceId 
          ? { ...ds, status: enable ? 'active' : 'disabled' }
          : ds
      ));

      toast({
        title: `Data Source ${enable ? 'Enabled' : 'Disabled'}`,
        description: `${dataSourceId} has been ${enable ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: `Failed to ${enable ? 'enable' : 'disable'} data source`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTriggerDataSource = async (dataSourceId: string) => {
    try {
      toast({
        title: 'Triggering Data Source',
        description: `Manually triggering ${dataSourceId}...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Update last update time
      setDataSources(prev => prev.map(ds => 
        ds.id === dataSourceId 
          ? { ...ds, lastUpdate: new Date().toISOString() }
          : ds
      ));
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger data source',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatTimeUntil = (timestamp: string): string => {
    const now = new Date();
    const future = new Date(timestamp);
    const diffMs = future.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return 'Overdue';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Loading ESI pipeline data...</Text>
      </Box>
    );
  }

  if (_error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error loading pipeline data</AlertTitle>
          <AlertDescription>{_error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  const activeSources = dataSources.filter(ds => ds.status === 'active').length;
  const errorSources = dataSources.filter(ds => ds.status === 'error').length;
  const totalRecords = dataSources.reduce((sum, ds) => sum + (ds.recordsIngested || 0), 0);
  const totalDataSize = dataSources.reduce((sum, ds) => sum + (ds.dataSize || 0), 0);

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg">ESI Data Pipeline</Heading>
            <Text color="gray.500">Automated EVE Online data ingestion and processing</Text>
          </VStack>
          <HStack spacing={3}>
            <Button
              leftIcon={isRunning ? <FiPause /> : <FiPlay />}
              colorScheme={isRunning ? 'red' : 'green'}
              onClick={handleTogglePipeline}
            >
              {isRunning ? 'Stop Pipeline' : 'Start Pipeline'}
            </Button>
            <Button leftIcon={<FiRefreshCw />} variant="outline">
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Status Overview */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel>Pipeline Status</StatLabel>
                <HStack>
                  <Icon as={isRunning ? FiCheckCircle : FiPause} 
                        color={isRunning ? 'green.500' : 'gray.500'} />
                  <StatNumber fontSize="lg">
                    {isRunning ? 'Running' : 'Stopped'}
                  </StatNumber>
                </HStack>
                <StatHelpText>
                  {activeSources} of {dataSources.length} sources active
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel>Records Ingested</StatLabel>
                <StatNumber>{totalRecords.toLocaleString()}</StatNumber>
                <StatHelpText>Last 24 hours</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel>Data Volume</StatLabel>
                <StatNumber>{formatBytes(totalDataSize)}</StatNumber>
                <StatHelpText>Total processed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel>Cache Hit Rate</StatLabel>
                <StatNumber>{metrics?.avgCacheHitRate || 0}%</StatNumber>
                <StatHelpText>Efficiency metric</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Error Alert */}
        {errorSources > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Data Source Errors</AlertTitle>
            <AlertDescription>
              {errorSources} data source{errorSources > 1 ? 's' : ''} 
              {errorSources > 1 ? ' are' : ' is'} experiencing errors
            </AlertDescription>
          </Alert>
        )}

        <Tabs>
          <TabList>
            <Tab>Data Sources ({dataSources.length})</Tab>
            <Tab>Performance Metrics</Tab>
            <Tab>Configuration</Tab>
            <Tab>Logs</Tab>
          </TabList>

          <TabPanels>
            {/* Data Sources Tab */}
            <TabPanel px={0}>
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
                {dataSources.map((dataSource) => (
                  <Card key={dataSource.id} 
                        bg={cardBg} 
                        borderColor={getStatusColor(dataSource.status)}
                        borderWidth={2}>
                    <CardHeader pb={2}>
                      <Flex align="start" justify="space-between">
                        <VStack align="start" spacing={1} flex={1}>
                          <Heading size="sm">{dataSource.name}</Heading>
                          <HStack>
                            <Icon as={getStatusIcon(dataSource.status)} 
                                  color={`${getStatusColor(dataSource.status)}.500`} />
                            <Badge colorScheme={getStatusColor(dataSource.status)}>
                              {dataSource.status.toUpperCase()}
                            </Badge>
                            {dataSource.errors > 0 && (
                              <Badge colorScheme="red">{dataSource.errors} errors</Badge>
                            )}
                          </HStack>
                        </VStack>
                        <Menu>
                          <MenuButton as={Button} size="sm" variant="ghost">
                            <FiMoreVertical />
                          </MenuButton>
                          <MenuList>
                            <MenuItem 
                              icon={<FiRefreshCw />}
                              onClick={() => handleTriggerDataSource(dataSource.id)}
                              isDisabled={dataSource.status !== 'active'}
                            >
                              Trigger Now
                            </MenuItem>
                            <MenuItem icon={<FiSettings />}>
                              Configure
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Enabled</Text>
                          <Switch 
                            isChecked={dataSource.status === 'active'}
                            onChange={(e) => handleToggleDataSource(dataSource.id, e.target.checked)}
                            colorScheme="blue"
                            size="sm"
                          />
                        </HStack>
                        
                        {dataSource.lastUpdate && (
                          <HStack justify="space-between" fontSize="sm">
                            <Text color="gray.500">Last Update</Text>
                            <Tooltip label={new Date(dataSource.lastUpdate).toLocaleString()}>
                              <Text>{formatTimeAgo(dataSource.lastUpdate)}</Text>
                            </Tooltip>
                          </HStack>
                        )}

                        {dataSource.nextUpdate && dataSource.status === 'active' && (
                          <HStack justify="space-between" fontSize="sm">
                            <Text color="gray.500">Next Update</Text>
                            <Text>{formatTimeUntil(dataSource.nextUpdate)}</Text>
                          </HStack>
                        )}

                        {dataSource.recordsIngested !== undefined && (
                          <HStack justify="space-between" fontSize="sm">
                            <Text color="gray.500">Records</Text>
                            <Text>{dataSource.recordsIngested.toLocaleString()}</Text>
                          </HStack>
                        )}

                        {dataSource.dataSize !== undefined && dataSource.dataSize > 0 && (
                          <HStack justify="space-between" fontSize="sm">
                            <Text color="gray.500">Data Size</Text>
                            <Text>{formatBytes(dataSource.dataSize)}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </TabPanel>

            {/* Performance Metrics Tab */}
            <TabPanel px={0}>
              {metrics && (
                <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                    <CardHeader>
                      <Heading size="sm">Request Performance</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Total Requests</Text>
                          <Text fontWeight="bold">{metrics.totalRequests}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Avg Duration</Text>
                          <Text fontWeight="bold">{metrics.avgDuration}ms</Text>
                        </HStack>
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm">Performance</Text>
                            <Text fontSize="sm">
                              {metrics.avgDuration < 1000 ? 'Excellent' : 
                               metrics.avgDuration < 3000 ? 'Good' : 'Slow'}
                            </Text>
                          </HStack>
                          <Progress 
                            value={Math.max(0, 100 - (metrics.avgDuration / 50))} 
                            colorScheme={metrics.avgDuration < 1000 ? 'green' : 
                                       metrics.avgDuration < 3000 ? 'yellow' : 'red'}
                            size="sm" 
                          />
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                    <CardHeader>
                      <Heading size="sm">Data Processing</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Total Records</Text>
                          <Text fontWeight="bold">{metrics.totalRecords.toLocaleString()}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Data Volume</Text>
                          <Text fontWeight="bold">{formatBytes(metrics.totalDataSize)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Avg Record Size</Text>
                          <Text fontWeight="bold">
                            {formatBytes(Math.round(metrics.totalDataSize / Math.max(1, metrics.totalRecords)))}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
                    <CardHeader>
                      <Heading size="sm">Cache Efficiency</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Hit Rate</Text>
                          <Text fontWeight="bold">{metrics.avgCacheHitRate}%</Text>
                        </HStack>
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm">Efficiency</Text>
                            <Text fontSize="sm">
                              {metrics.avgCacheHitRate > 80 ? 'Excellent' : 
                               metrics.avgCacheHitRate > 60 ? 'Good' : 'Poor'}
                            </Text>
                          </HStack>
                          <Progress 
                            value={metrics.avgCacheHitRate} 
                            colorScheme={metrics.avgCacheHitRate > 80 ? 'green' : 
                                       metrics.avgCacheHitRate > 60 ? 'yellow' : 'red'}
                            size="sm" 
                          />
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              )}
            </TabPanel>

            {/* Configuration Tab */}
            <TabPanel px={0}>
              <PipelineConfigEditor
                onSave={(config) => {
                  console.log('Pipeline configuration saved:', config);
                  // In a real implementation, this would update the actual pipeline config
                }}
              />
            </TabPanel>

            {/* Logs Tab */}
            <TabPanel px={0}>
              <PipelineLogsViewer />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};