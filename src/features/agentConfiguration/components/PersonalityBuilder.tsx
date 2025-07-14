import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Badge,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  useColorModeValue,
  Flex,
  Spacer,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  Checkbox,
  CheckboxGroup,
  Divider
} from '@chakra-ui/react';
import {
  FiUser,
  FiSettings,
  FiMessageSquare,
  FiZap,
  FiEye,
  FiSave,
  FiRefreshCw,
  FiCopy,
  FiPlay,
  FiEdit3,
  FiPlus,
  FiMinus,
  FiHelpCircle
} from 'react-icons/fi';
import { AgentPersonality, PersonalityBuilder as PersonalityBuilderType, ConfigurationValidation } from '../types';

interface PersonalityBuilderProps {
  initialPersonality?: Partial<AgentPersonality>;
  templates?: AgentPersonality[];
  onSave: (personality: AgentPersonality) => Promise<void>;
  onTest?: (personality: AgentPersonality) => Promise<string>;
  onCancel: () => void;
}

const defaultPersonality: PersonalityBuilderType['data'] = {
  basics: {
    name: '',
    description: '',
    baseTemplate: ''
  },
  traits: {
    formality: 50,
    enthusiasm: 50,
    riskTolerance: 50,
    detailLevel: 50,
    proactivity: 50
  },
  communication: {
    greeting: '',
    responsePrefix: '',
    uncertaintyPhrase: '',
    recommendationIntro: '',
    farewellNote: ''
  },
  specialization: {
    primaryFocus: [],
    expertise: [],
    preferredTools: [],
    contextPriorities: []
  }
};

const traitDescriptions = {
  formality: {
    low: 'Casual, relaxed tone',
    mid: 'Professional but approachable',
    high: 'Formal, business-like tone'
  },
  enthusiasm: {
    low: 'Calm, measured responses',
    mid: 'Balanced energy level',
    high: 'Energetic, exciting tone'
  },
  riskTolerance: {
    low: 'Conservative, cautious advice',
    mid: 'Balanced risk assessment',
    high: 'Bold, aggressive strategies'
  },
  detailLevel: {
    low: 'Brief, concise responses',
    mid: 'Adequate detail level',
    high: 'Comprehensive explanations'
  },
  proactivity: {
    low: 'Reactive, waits for questions',
    mid: 'Suggests when appropriate',
    high: 'Proactive recommendations'
  }
};

const suggestedFocus = [
  'efficiency', 'innovation', 'risk management', 'user experience', 
  'data analysis', 'strategic planning', 'problem solving', 'communication',
  'market insights', 'resource optimization', 'team collaboration', 'automation'
];

const suggestedExpertise = [
  'market analysis', 'financial planning', 'recruitment', 'mining operations',
  'mission planning', 'logistics', 'combat tactics', 'industry', 'research',
  'diplomacy', 'security', 'fleet management', 'economic modeling'
];

const suggestedTools = [
  'market_data', 'esi_api', 'rag_search', 'analytics', 'calculator',
  'planner', 'optimizer', 'validator', 'simulator', 'monitor'
];

const suggestedPriorities = [
  'recent_data', 'user_goals', 'corporation_culture', 'market_conditions',
  'risk_factors', 'time_constraints', 'resource_availability', 'member_feedback'
];

export const PersonalityBuilder: React.FC<PersonalityBuilderProps> = ({
  initialPersonality,
  templates = [],
  onSave,
  onTest,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<PersonalityBuilderType['step']>('basics');
  const [builderData, setBuilderData] = useState<PersonalityBuilderType['data']>(defaultPersonality);
  const [validation, setValidation] = useState<ConfigurationValidation>({
    isValid: false,
    errors: [],
    warnings: [],
    score: 0,
    suggestions: []
  });
  const [isTestingPersonality, setIsTestingPersonality] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isTestOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const steps = [
    { id: 'basics', title: 'Basics', icon: FiUser },
    { id: 'traits', title: 'Traits', icon: FiSettings },
    { id: 'communication', title: 'Communication', icon: FiMessageSquare },
    { id: 'specialization', title: 'Specialization', icon: FiZap },
    { id: 'review', title: 'Review', icon: FiEye }
  ];

  const stepIndex = steps.findIndex(step => step.id === currentStep);

  useEffect(() => {
    if (initialPersonality) {
      setBuilderData({
        basics: {
          name: initialPersonality.name || '',
          description: initialPersonality.description || '',
          baseTemplate: ''
        },
        traits: initialPersonality.traits || defaultPersonality.traits,
        communication: initialPersonality.communicationStyle || defaultPersonality.communication,
        specialization: initialPersonality.specialization || defaultPersonality.specialization
      });
    }
  }, [initialPersonality]);

  useEffect(() => {
    validateCurrentData();
  }, [builderData]);

  const validateCurrentData = () => {
    const errors: ConfigurationValidation['errors'] = [];
    const warnings: ConfigurationValidation['warnings'] = [];

    // Validate basics
    if (!builderData.basics.name.trim()) {
      errors.push({
        field: 'basics.name',
        message: 'Personality name is required',
        severity: 'error'
      });
    }

    if (!builderData.basics.description.trim()) {
      warnings.push({
        field: 'basics.description',
        message: 'Description helps users understand this personality',
        recommendation: 'Add a brief description of how this personality behaves'
      });
    }

    // Validate traits
    Object.entries(builderData.traits).forEach(([trait, value]) => {
      if (value < 0 || value > 100) {
        errors.push({
          field: `traits.${trait}`,
          message: `${trait} must be between 0 and 100`,
          severity: 'error'
        });
      }
    });

    // Check for extreme trait combinations
    if (builderData.traits.formality > 80 && builderData.traits.enthusiasm > 80) {
      warnings.push({
        field: 'traits',
        message: 'High formality with high enthusiasm may seem inconsistent',
        recommendation: 'Consider balancing formality and enthusiasm for natural communication'
      });
    }

    // Validate communication
    if (!builderData.communication.greeting.trim()) {
      warnings.push({
        field: 'communication.greeting',
        message: 'No greeting message defined',
        recommendation: 'Add a greeting to improve user experience'
      });
    }

    // Validate specialization
    if (builderData.specialization.primaryFocus.length === 0) {
      warnings.push({
        field: 'specialization.primaryFocus',
        message: 'No primary focus areas defined',
        recommendation: 'Define focus areas to guide agent behavior'
      });
    }

    const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      suggestions: generateSuggestions(builderData, warnings)
    });
  };

  const generateSuggestions = (data: PersonalityBuilderType['data'], warnings: ConfigurationValidation['warnings']): string[] => {
    const suggestions: string[] = [];

    if (data.traits.formality < 30 && data.traits.enthusiasm > 70) {
      suggestions.push('This combination creates a friendly, casual personality - great for community engagement');
    }

    if (data.traits.riskTolerance > 70 && data.traits.detailLevel < 40) {
      suggestions.push('High risk tolerance with low detail might lead to hasty decisions - consider increasing detail level');
    }

    if (data.traits.proactivity > 80) {
      suggestions.push('Very proactive personalities work well for strategic planning and market monitoring');
    }

    return suggestions;
  };

  const updateBasics = (field: keyof PersonalityBuilderType['data']['basics'], value: string) => {
    setBuilderData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: value
      }
    }));
  };

  const updateTrait = (trait: keyof PersonalityBuilderType['data']['traits'], value: number) => {
    setBuilderData(prev => ({
      ...prev,
      traits: {
        ...prev.traits,
        [trait]: value
      }
    }));
  };

  const updateCommunication = (field: keyof PersonalityBuilderType['data']['communication'], value: string) => {
    setBuilderData(prev => ({
      ...prev,
      communication: {
        ...prev.communication,
        [field]: value
      }
    }));
  };

  const addToSpecialization = (category: keyof PersonalityBuilderType['data']['specialization'], item: string) => {
    if (item.trim() && !builderData.specialization[category].includes(item.trim())) {
      setBuilderData(prev => ({
        ...prev,
        specialization: {
          ...prev.specialization,
          [category]: [...prev.specialization[category], item.trim()]
        }
      }));
    }
  };

  const removeFromSpecialization = (category: keyof PersonalityBuilderType['data']['specialization'], index: number) => {
    setBuilderData(prev => ({
      ...prev,
      specialization: {
        ...prev.specialization,
        [category]: prev.specialization[category].filter((_, i) => i !== index)
      }
    }));
  };

  const applyTemplate = (template: AgentPersonality) => {
    setBuilderData({
      basics: {
        name: template.name,
        description: template.description,
        baseTemplate: template.id
      },
      traits: template.traits,
      communication: template.communicationStyle,
      specialization: template.specialization
    });

    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template successfully`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleTestPersonality = async () => {
    if (!onTest) return;

    setIsTestingPersonality(true);
    try {
      const personality = buildPersonalityObject();
      const result = await onTest(personality);
      setTestResult(result);
      onTestOpen();
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to test personality',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTestingPersonality(false);
    }
  };

  const buildPersonalityObject = (): AgentPersonality => {
    return {
      id: `personality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: builderData.basics.name,
      description: builderData.basics.description,
      traits: builderData.traits,
      communicationStyle: builderData.communication,
      specialization: builderData.specialization
    };
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors before saving',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const personality = buildPersonalityObject();
      await onSave(personality);
      toast({
        title: 'Personality Saved',
        description: `"${personality.name}" has been saved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save personality',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getTraitDescription = (trait: keyof typeof traitDescriptions, value: number): string => {
    if (value < 35) return traitDescriptions[trait].low;
    if (value < 65) return traitDescriptions[trait].mid;
    return traitDescriptions[trait].high;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={validation.errors.some(e => e.field === 'basics.name')}>
              <FormLabel>Personality Name</FormLabel>
              <Input
                value={builderData.basics.name}
                onChange={(e) => updateBasics('name', e.target.value)}
                placeholder="e.g., Friendly Analyst, Strategic Advisor"
              />
              <FormErrorMessage>
                {validation.errors.find(e => e.field === 'basics.name')?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={builderData.basics.description}
                onChange={(e) => updateBasics('description', e.target.value)}
                placeholder="Describe how this personality behaves and communicates"
                rows={3}
              />
              <FormHelperText>
                Help users understand when to use this personality
              </FormHelperText>
            </FormControl>

            {templates.length > 0 && (
              <FormControl>
                <FormLabel>Start from Template</FormLabel>
                <VStack align="stretch" spacing={2}>
                  {templates.map(template => (
                    <Card key={template.id} size="sm" variant="outline">
                      <CardBody>
                        <Flex align="center">
                          <Box flex="1">
                            <Text fontWeight="medium">{template.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {template.description}
                            </Text>
                          </Box>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => applyTemplate(template)}
                          >
                            Apply
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </FormControl>
            )}
          </VStack>
        );

      case 'traits':
        return (
          <VStack spacing={8} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Personality Traits</AlertTitle>
                <AlertDescription>
                  Adjust the sliders to define how this personality behaves. Each trait affects communication style and decision making.
                </AlertDescription>
              </Box>
            </Alert>

            {Object.entries(builderData.traits).map(([trait, value]) => (
              <FormControl key={trait}>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel textTransform="capitalize" mb={0}>
                    {trait.replace(/([A-Z])/g, ' $1')}
                  </FormLabel>
                  <Badge colorScheme="blue">{value}</Badge>
                </Flex>
                <Slider
                  value={value}
                  onChange={(val) => updateTrait(trait as keyof typeof builderData.traits, val)}
                  min={0}
                  max={100}
                  step={5}
                >
                  <SliderMark value={0} mt={2} fontSize="sm">0</SliderMark>
                  <SliderMark value={50} mt={2} ml={-2} fontSize="sm">50</SliderMark>
                  <SliderMark value={100} mt={2} ml={-4} fontSize="sm">100</SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color="gray.500" mt={3}>
                  {getTraitDescription(trait as keyof typeof traitDescriptions, value)}
                </Text>
              </FormControl>
            ))}
          </VStack>
        );

      case 'communication':
        return (
          <VStack spacing={6} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Communication Style</AlertTitle>
                <AlertDescription>
                  Define how this personality communicates. These phrases will be used in different contexts.
                </AlertDescription>
              </Box>
            </Alert>

            {Object.entries(builderData.communication).map(([field, value]) => (
              <FormControl key={field}>
                <FormLabel textTransform="capitalize">
                  {field.replace(/([A-Z])/g, ' $1')}
                </FormLabel>
                <Textarea
                  value={value}
                  onChange={(e) => updateCommunication(field as keyof typeof builderData.communication, e.target.value)}
                  placeholder={getPlaceholderForField(field)}
                  rows={2}
                />
                <FormHelperText>
                  {getHelpTextForField(field)}
                </FormHelperText>
              </FormControl>
            ))}
          </VStack>
        );

      case 'specialization':
        return (
          <VStack spacing={6} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Specialization Areas</AlertTitle>
                <AlertDescription>
                  Define what this personality focuses on and excels at. This guides decision making and tool usage.
                </AlertDescription>
              </Box>
            </Alert>

            {(['primaryFocus', 'expertise', 'preferredTools', 'contextPriorities'] as const).map(category => (
              <FormControl key={category}>
                <FormLabel textTransform="capitalize">
                  {category.replace(/([A-Z])/g, ' $1')}
                </FormLabel>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Select
                      placeholder={`Select ${category.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          addToSpecialization(category, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      {getSuggestionsForCategory(category).map(suggestion => (
                        <option key={suggestion} value={suggestion}>
                          {suggestion}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  
                  <Wrap>
                    {builderData.specialization[category].map((item, index) => (
                      <WrapItem key={index}>
                        <Tag size="md" colorScheme="blue">
                          <TagLabel>{item}</TagLabel>
                          <TagCloseButton onClick={() => removeFromSpecialization(category, index)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </VStack>
              </FormControl>
            ))}
          </VStack>
        );

      case 'review':
        return (
          <VStack spacing={6} align="stretch">
            <Alert status={validation.isValid ? 'success' : 'warning'}>
              <AlertIcon />
              <Box>
                <AlertTitle>Personality Review</AlertTitle>
                <AlertDescription>
                  {validation.isValid 
                    ? 'Your personality is ready to save!' 
                    : 'Please review and fix any issues before saving.'}
                </AlertDescription>
              </Box>
            </Alert>

            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{builderData.basics.name || 'Unnamed Personality'}</Heading>
                  <Badge colorScheme={validation.score > 80 ? 'green' : validation.score > 60 ? 'yellow' : 'red'}>
                    Score: {validation.score}/100
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Text>{builderData.basics.description}</Text>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="medium" mb={2}>Trait Summary:</Text>
                    <Wrap>
                      {Object.entries(builderData.traits).map(([trait, value]) => (
                        <WrapItem key={trait}>
                          <Tag size="sm">
                            <TagLabel>{trait}: {value}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>

                  {builderData.specialization.primaryFocus.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Primary Focus:</Text>
                      <Text fontSize="sm">{builderData.specialization.primaryFocus.join(', ')}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {validation.errors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>Errors to Fix:</AlertTitle>
                  <VStack align="start" mt={2}>
                    {validation.errors.map((error, index) => (
                      <Text key={index} fontSize="sm">• {error.message}</Text>
                    ))}
                  </VStack>
                </Box>
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Recommendations:</AlertTitle>
                  <VStack align="start" mt={2}>
                    {validation.warnings.map((warning, index) => (
                      <Text key={index} fontSize="sm">• {warning.recommendation}</Text>
                    ))}
                  </VStack>
                </Box>
              </Alert>
            )}

            {validation.suggestions.length > 0 && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Suggestions:</AlertTitle>
                  <VStack align="start" mt={2}>
                    {validation.suggestions.map((suggestion, index) => (
                      <Text key={index} fontSize="sm">• {suggestion}</Text>
                    ))}
                  </VStack>
                </Box>
              </Alert>
            )}
          </VStack>
        );

      default:
        return null;
    }
  };

  const getPlaceholderForField = (field: string): string => {
    const placeholders = {
      greeting: "Hello! I'm here to help with your...",
      responsePrefix: "Based on my analysis,",
      uncertaintyPhrase: "While I'm not completely certain,",
      recommendationIntro: "I recommend the following approach:",
      farewellNote: "Feel free to ask if you need more help!"
    };
    return placeholders[field as keyof typeof placeholders] || '';
  };

  const getHelpTextForField = (field: string): string => {
    const helpTexts = {
      greeting: "How the agent introduces itself to users",
      responsePrefix: "Standard opening for analytical responses",
      uncertaintyPhrase: "How to express uncertainty or limitations",
      recommendationIntro: "How to introduce recommendations",
      farewellNote: "Closing message for conversations"
    };
    return helpTexts[field as keyof typeof helpTexts] || '';
  };

  const getSuggestionsForCategory = (category: keyof PersonalityBuilderType['data']['specialization']): string[] => {
    const suggestions = {
      primaryFocus: suggestedFocus,
      expertise: suggestedExpertise,
      preferredTools: suggestedTools,
      contextPriorities: suggestedPriorities
    };
    return suggestions[category] || [];
  };

  return (
    <Box maxW="900px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Personality Builder</Heading>
          <Text color="gray.500">Create and customize agent personalities</Text>
        </Box>

        {/* Progress */}
        <Box>
          <HStack justify="space-between" mb={4}>
            {steps.map((step, index) => (
              <VStack key={step.id} spacing={2} align="center" flex={1}>
                <IconButton
                  aria-label={step.title}
                  icon={<step.icon />}
                  isRound
                  size="sm"
                  colorScheme={index <= stepIndex ? 'blue' : 'gray'}
                  variant={index === stepIndex ? 'solid' : 'outline'}
                  onClick={() => setCurrentStep(step.id as PersonalityBuilderType['step'])}
                />
                <Text fontSize="sm" fontWeight={index === stepIndex ? 'medium' : 'normal'}>
                  {step.title}
                </Text>
              </VStack>
            ))}
          </HStack>
          <Progress value={(stepIndex + 1) / steps.length * 100} colorScheme="blue" />
        </Box>

        {/* Content */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody p={8}>
            {renderStepContent()}
          </CardBody>
        </Card>

        {/* Actions */}
        <Flex>
          <Button
            variant="outline"
            onClick={stepIndex === 0 ? onCancel : () => setCurrentStep(steps[stepIndex - 1].id as PersonalityBuilderType['step'])}
          >
            {stepIndex === 0 ? 'Cancel' : 'Previous'}
          </Button>
          
          <Spacer />
          
          <HStack>
            <Button
              leftIcon={<FiEye />}
              variant="outline"
              onClick={onPreviewOpen}
            >
              Preview
            </Button>
            
            {onTest && (
              <Button
                leftIcon={<FiPlay />}
                variant="outline"
                onClick={handleTestPersonality}
                isLoading={isTestingPersonality}
                loadingText="Testing..."
              >
                Test
              </Button>
            )}
            
            {currentStep === 'review' ? (
              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                onClick={handleSave}
                isDisabled={!validation.isValid}
              >
                Save Personality
              </Button>
            ) : (
              <Button
                colorScheme="blue"
                onClick={() => setCurrentStep(steps[stepIndex + 1].id as PersonalityBuilderType['step'])}
              >
                Next
              </Button>
            )}
          </HStack>
        </Flex>
      </VStack>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Personality Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontWeight="medium">Name:</Text>
                <Text>{builderData.basics.name || 'Unnamed Personality'}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium">Description:</Text>
                <Text>{builderData.basics.description || 'No description'}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium">Sample Greeting:</Text>
                <Text fontStyle="italic">
                  "{builderData.communication.greeting || 'Hello! How can I help you today?'}"
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium">Trait Profile:</Text>
                <VStack align="stretch" spacing={2} mt={2}>
                  {Object.entries(builderData.traits).map(([trait, value]) => (
                    <HStack key={trait} justify="space-between">
                      <Text fontSize="sm" textTransform="capitalize">
                        {trait.replace(/([A-Z])/g, ' $1')}:
                      </Text>
                      <Text fontSize="sm">
                        {getTraitDescription(trait as keyof typeof traitDescriptions, value)} ({value})
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPreviewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Test Results Modal */}
      <Modal isOpen={isTestOpen} onClose={onTestClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Personality Test Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Text fontWeight="medium" mb={3}>Test Response:</Text>
              <Box
                p={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderRadius="md"
                whiteSpace="pre-wrap"
              >
                {testResult}
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTestClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};