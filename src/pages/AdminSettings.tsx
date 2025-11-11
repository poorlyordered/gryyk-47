import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  Text,
  useToast,
  FormControl,
  FormHelperText,
  Badge,
  HStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Select as ChakraSelect,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useChatStore } from '../store/chat';
import { fetchAvailableModels } from '../services/openrouter';
import type { ModelOption } from '../types/chat';

export default function AdminSettings() {
  const toast = useToast();
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [allModels, setAllModels] = useState<ModelOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedDefaultModel, setSelectedDefaultModel] = useState<string>('');

  const { selectedModel, setSelectedModel, availableModels: storedModels } = useChatStore();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const searchBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    setSelectedDefaultModel(selectedModel);
    if (storedModels.length > 0) {
      setAllModels(storedModels);
    }
  }, [selectedModel, storedModels]);

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels();
      setAllModels(models);

      toast({
        title: 'Models loaded',
        description: `Found ${models.length} available models from OpenRouter`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error loading models',
        description: error instanceof Error ? error.message : 'Failed to fetch models',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Extract unique providers from model IDs
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    allModels.forEach(model => {
      const provider = model.id.split('/')[0];
      if (provider) providerSet.add(provider);
    });
    return Array.from(providerSet).sort();
  }, [allModels]);

  // Filter and search models
  const filteredModels = useMemo(() => {
    return allModels.filter(model => {
      const matchesSearch = searchTerm === '' ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesProvider = providerFilter === 'all' || model.id.startsWith(providerFilter + '/');

      return matchesSearch && matchesProvider;
    });
  }, [allModels, searchTerm, providerFilter]);

  // Group models by category
  const recommendedModels = useMemo(() => {
    return filteredModels.filter(model => {
      const id = model.id.toLowerCase();
      return id.includes('grok') || id.includes('claude') || id.includes('gpt-4');
    });
  }, [filteredModels]);

  const handleSaveSettings = () => {
    if (!selectedDefaultModel) {
      toast({
        title: 'No model selected',
        description: 'Please select a default model',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setSelectedModel(selectedDefaultModel);

    toast({
      title: 'Settings saved',
      description: `Default model set to ${allModels.find(m => m.id === selectedDefaultModel)?.name}`,
      status: 'success',
      duration: 3000,
    });
  };

  const ModelCard = ({ model }: { model: ModelOption }) => (
    <Box
      p={4}
      bg={model.id === selectedDefaultModel ? 'blue.900' : cardBg}
      borderRadius="md"
      borderWidth={2}
      borderColor={model.id === selectedDefaultModel ? 'blue.500' : borderColor}
      cursor="pointer"
      onClick={() => setSelectedDefaultModel(model.id)}
      _hover={{ bg: hoverBg, transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={2}>
        <VStack align="start" spacing={1} flex={1}>
          <HStack>
            <Text fontWeight="bold" fontSize="md">{model.name}</Text>
            {model.id === selectedModel && (
              <Badge colorScheme="green" ml={2}>Active</Badge>
            )}
            {model.id === selectedDefaultModel && model.id !== selectedModel && (
              <Badge colorScheme="blue" ml={2}>Selected</Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500" fontFamily="mono">{model.id}</Text>
        </VStack>
      </HStack>
      {model.description && (
        <Text fontSize="sm" color="gray.400" mt={2}>
          {model.description}
        </Text>
      )}
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>AI Model Configuration</Heading>
          <Text color="gray.400">
            Browse and select from all available OpenRouter models
          </Text>
        </Box>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">Model Selection</Heading>
                <HStack mt={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Current Model:</Text>
                    <Badge colorScheme="green" mt={1}>
                      {allModels.find(m => m.id === selectedModel)?.name || selectedModel}
                    </Badge>
                  </Box>
                  {selectedDefaultModel && selectedDefaultModel !== selectedModel && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Selected Model:</Text>
                      <Badge colorScheme="blue" mt={1}>
                        {allModels.find(m => m.id === selectedDefaultModel)?.name || selectedDefaultModel}
                      </Badge>
                    </Box>
                  )}
                </HStack>
              </Box>
              <Button
                onClick={handleFetchModels}
                isLoading={isLoadingModels}
                colorScheme="teal"
                leftIcon={<FiRefreshCw />}
                size="md"
              >
                {isLoadingModels ? 'Loading...' : 'Refresh Models'}
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Search and Filter Controls */}
              <HStack spacing={4}>
                <FormControl flex={2}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search models by name, ID, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg={searchBg}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl flex={1}>
                  <ChakraSelect
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    bg={searchBg}
                  >
                    <option value="all">All Providers ({allModels.length})</option>
                    {providers.map(provider => (
                      <option key={provider} value={provider}>
                        {provider} ({allModels.filter(m => m.id.startsWith(provider + '/')).length})
                      </option>
                    ))}
                  </ChakraSelect>
                </FormControl>
              </HStack>

              {/* Results Summary */}
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Showing {filteredModels.length} of {allModels.length} models
                </Text>
                {searchTerm && (
                  <Button size="xs" variant="ghost" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </HStack>

              <Divider />

              {/* Model Tabs */}
              <Tabs colorScheme="blue">
                <TabList>
                  <Tab>Recommended ({recommendedModels.length})</Tab>
                  <Tab>All Models ({filteredModels.length})</Tab>
                </TabList>

                <TabPanels>
                  {/* Recommended Models */}
                  <TabPanel px={0}>
                    {recommendedModels.length > 0 ? (
                      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                        {recommendedModels.map(model => (
                          <ModelCard key={model.id} model={model} />
                        ))}
                      </Grid>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text color="gray.500">No recommended models found</Text>
                      </Box>
                    )}
                  </TabPanel>

                  {/* All Models */}
                  <TabPanel px={0}>
                    {filteredModels.length > 0 ? (
                      <VStack spacing={3} align="stretch" maxH="600px" overflowY="auto" pr={2}>
                        {filteredModels.map(model => (
                          <ModelCard key={model.id} model={model} />
                        ))}
                      </VStack>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text color="gray.500">
                          {allModels.length === 0
                            ? 'Click "Refresh Models" to load available models from OpenRouter'
                            : 'No models match your search criteria'
                          }
                        </Text>
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Divider />

              {/* Save Button */}
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  {selectedDefaultModel && (
                    <>
                      Selected: <strong>{allModels.find(m => m.id === selectedDefaultModel)?.name}</strong>
                    </>
                  )}
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={handleSaveSettings}
                  isDisabled={!selectedDefaultModel || selectedDefaultModel === selectedModel}
                  size="lg"
                >
                  {selectedDefaultModel === selectedModel ? 'Current Model' : 'Save Settings'}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Information Card */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <Heading size="sm">About OpenRouter Models</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm">
                OpenRouter provides access to a wide variety of AI models from different providers.
                Click on any model card to select it as your default.
              </Text>
              <Text fontSize="sm" color="gray.500">
                <strong>Note:</strong> Model availability and pricing depends on your OpenRouter account tier.
                Some models may require additional permissions or credits.
              </Text>
              <Text fontSize="sm" color="gray.500">
                <strong>Recommended models</strong> are pre-filtered for optimal performance with Gryyk-47.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
