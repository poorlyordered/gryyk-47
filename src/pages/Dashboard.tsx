import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { Users, Wallet, Building2, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface CEODashboardData {
  corporationInfo: {
    name: string;
    ticker: string;
    member_count: number;
    tax_rate: number;
    ceo_id: number;
    alliance_id?: number;
    date_founded: string;
  };
  wallets?: Array<{
    division: number;
    balance: number;
  }>;
  memberTracking?: Array<{
    character_id: number;
    logon_date?: string;
    logoff_date?: string;
  }>;
  structures?: Array<{
    structure_id: number;
    state: string;
    fuel_expires?: string;
  }>;
  metrics: {
    totalWalletBalance: number;
    activeMembers: number;
    totalStructures: number;
    onlineStructures: number;
  };
  fetchedAt: string;
}

const Dashboard = () => {
  const { character, tokenData } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!character?.corporation?.id) {
        setError('No corporation data available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📊 Fetching CEO dashboard data...');

        const response = await fetch('/.netlify/functions/ceo-dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            corporationId: character.corporation.id,
            accessToken: tokenData?.accessToken
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Dashboard data received:', data);
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('❌ Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [character, tokenData]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center" justify="center" minH="60vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text>Loading CEO Dashboard...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Dashboard Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
        </Alert>
      </Container>
    );
  }

  const formatISK = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B ISK`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M ISK`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K ISK`;
    }
    return `${value.toFixed(2)} ISK`;
  };

  const activityPercentage = dashboardData.corporationInfo.member_count > 0
    ? (dashboardData.metrics.activeMembers / dashboardData.corporationInfo.member_count) * 100
    : 0;

  const structureHealthPercentage = dashboardData.metrics.totalStructures > 0
    ? (dashboardData.metrics.onlineStructures / dashboardData.metrics.totalStructures) * 100
    : 0;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size="xl">
              {dashboardData.corporationInfo.name}
              <Badge ml={3} fontSize="lg" colorScheme="blue">
                {dashboardData.corporationInfo.ticker}
              </Badge>
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Last updated: {new Date(dashboardData.fetchedAt).toLocaleString()}
            </Text>
          </HStack>
          <Text color="gray.600">
            Founded: {new Date(dashboardData.corporationInfo.date_founded).toLocaleDateString()}
            {dashboardData.corporationInfo.alliance_id && ` • Alliance ID: ${dashboardData.corporationInfo.alliance_id}`}
          </Text>
        </Box>

        {/* Key Metrics Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {/* Total Members */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <Box color="blue.500">
                    <Users size={24} />
                  </Box>
                  <StatLabel>Total Members</StatLabel>
                </HStack>
                <StatNumber>{dashboardData.corporationInfo.member_count}</StatNumber>
                <StatHelpText>
                  {dashboardData.metrics.activeMembers} active (7d)
                </StatHelpText>
                <Progress
                  value={activityPercentage}
                  size="sm"
                  colorScheme={activityPercentage > 50 ? 'green' : 'yellow'}
                  mt={2}
                  borderRadius="full"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {activityPercentage.toFixed(0)}% activity rate
                </Text>
              </Stat>
            </CardBody>
          </Card>

          {/* Total Wallet Balance */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <Box color="green.500">
                    <Wallet size={24} />
                  </Box>
                  <StatLabel>Treasury</StatLabel>
                </HStack>
                <StatNumber fontSize="2xl">
                  {formatISK(dashboardData.metrics.totalWalletBalance)}
                </StatNumber>
                <StatHelpText>
                  {dashboardData.wallets?.length || 0} divisions
                </StatHelpText>
                {dashboardData.wallets && dashboardData.wallets.length > 0 && (
                  <VStack align="stretch" mt={2} spacing={1}>
                    {dashboardData.wallets.slice(0, 3).map((wallet) => (
                      <HStack key={wallet.division} justify="space-between" fontSize="xs">
                        <Text color="gray.500">Division {wallet.division}:</Text>
                        <Text fontWeight="medium">{formatISK(wallet.balance)}</Text>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Stat>
            </CardBody>
          </Card>

          {/* Tax Rate */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <Box color="purple.500">
                    <TrendingUp size={24} />
                  </Box>
                  <StatLabel>Tax Rate</StatLabel>
                </HStack>
                <StatNumber>{(dashboardData.corporationInfo.tax_rate * 100).toFixed(1)}%</StatNumber>
                <StatHelpText>Corporation tax</StatHelpText>
                <Divider my={2} />
                <VStack align="stretch" spacing={1}>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.500">Estimated Monthly:</Text>
                    <Text fontWeight="medium" color="green.500">
                      {formatISK(dashboardData.metrics.totalWalletBalance * 0.05)}
                    </Text>
                  </HStack>
                </VStack>
              </Stat>
            </CardBody>
          </Card>

          {/* Structures */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <Box color="orange.500">
                    <Building2 size={24} />
                  </Box>
                  <StatLabel>Structures</StatLabel>
                </HStack>
                <StatNumber>{dashboardData.metrics.totalStructures}</StatNumber>
                <StatHelpText>
                  {dashboardData.metrics.onlineStructures} online
                </StatHelpText>
                {dashboardData.metrics.totalStructures > 0 && (
                  <>
                    <Progress
                      value={structureHealthPercentage}
                      size="sm"
                      colorScheme={structureHealthPercentage === 100 ? 'green' : 'orange'}
                      mt={2}
                      borderRadius="full"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {structureHealthPercentage.toFixed(0)}% operational
                    </Text>
                  </>
                )}
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Permissions Notice */}
        {!dashboardData.wallets && !dashboardData.memberTracking && !dashboardData.structures && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Limited Data Access</AlertTitle>
              <AlertDescription>
                To see wallet balances, member tracking, and structure status, you need CEO/Director permissions
                and must re-authenticate with the expanded scopes.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Member Activity Section */}
        {dashboardData.memberTracking && dashboardData.memberTracking.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Member Activity</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Showing {dashboardData.memberTracking.length} tracked members
              </Text>
              {/* Add member activity visualization here */}
              <Text fontSize="sm" color="gray.500">
                Active in last 7 days: {dashboardData.metrics.activeMembers} members
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default Dashboard;
