import {
  Box,
  Container,
  Heading,
  VStack,
  Select,
  Button,
  Text,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Spinner,
  Badge,
  HStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chat';
import { fetchAvailableModels } from '../services/openrouter';
import type { ModelOption } from '../types/chat';

export default function AdminSettings() {
  const toast = useToast();
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [selectedDefaultModel, setSelectedDefaultModel] = useState<string>('');

  const { selectedModel, setSelectedModel, availableModels: storedModels } = useChatStore();

  useEffect(() => {
    // Initialize with current selection
    setSelectedDefaultModel(selectedModel);
    setAvailableModels(storedModels);
  }, [selectedModel, storedModels]);

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels();

      // Filter for recommended models (you can customize this filter)
      const filteredModels = models.filter(model => {
        const id = model.id.toLowerCase();
        return (
          id.includes('grok') ||
          id.includes('claude') ||
          id.includes('gpt') ||
          id.includes('llama') ||
          id.includes('mistral') ||
          id.includes('gemini')
        );
      });

      setAvailableModels(filteredModels);

      toast({
        title: 'Models loaded',
        description: `Found ${filteredModels.length} available models from OpenRouter`,
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
      description: `Default model set to ${availableModels.find(m => m.id === selectedDefaultModel)?.name}`,
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Admin Settings</Heading>
          <Text color="gray.400">
            Configure AI models and system preferences for Gryyk-47
          </Text>
        </Box>

        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <Heading size="md">AI Model Configuration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Current Model</Text>
                  <Badge colorScheme="blue" mt={2}>
                    {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
                  </Badge>
                </Box>
                <Button
                  onClick={handleFetchModels}
                  isLoading={isLoadingModels}
                  colorScheme="teal"
                  leftIcon={isLoadingModels ? <Spinner size="sm" /> : undefined}
                >
                  {isLoadingModels ? 'Loading...' : 'Refresh Models from OpenRouter'}
                </Button>
              </HStack>

              <Divider />

              <FormControl>
                <FormLabel>Default AI Model</FormLabel>
                <Select
                  value={selectedDefaultModel}
                  onChange={(e) => setSelectedDefaultModel(e.target.value)}
                  placeholder="Select a model"
                  bg="gray.700"
                  borderColor="gray.600"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.id}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  {selectedDefaultModel && availableModels.find(m => m.id === selectedDefaultModel)?.description}
                </FormHelperText>
              </FormControl>

              {availableModels.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Available Models ({availableModels.length})</Text>
                  <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto" p={2} bg="gray.900" borderRadius="md">
                    {availableModels.map((model) => (
                      <Box
                        key={model.id}
                        p={3}
                        bg={model.id === selectedDefaultModel ? 'blue.900' : 'gray.800'}
                        borderRadius="md"
                        borderWidth={1}
                        borderColor={model.id === selectedDefaultModel ? 'blue.500' : 'gray.700'}
                      >
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="bold">{model.name}</Text>
                            <Text fontSize="sm" color="gray.400">{model.id}</Text>
                          </Box>
                          {model.id === selectedModel && (
                            <Badge colorScheme="green">Active</Badge>
                          )}
                        </HStack>
                        {model.description && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {model.description}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              <HStack justify="flex-end">
                <Button
                  colorScheme="blue"
                  onClick={handleSaveSettings}
                  isDisabled={!selectedDefaultModel || selectedDefaultModel === selectedModel}
                >
                  Save Settings
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <Heading size="md">Model Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Models are fetched directly from OpenRouter's API. You can select any available model
                that you have access to with your API key.
              </Text>
              <Text fontSize="sm" color="gray.400">
                Note: Model availability and pricing depends on your OpenRouter account tier and API key permissions.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
