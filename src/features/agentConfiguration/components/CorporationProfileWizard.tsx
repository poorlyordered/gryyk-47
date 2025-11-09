import React, { useState } from 'react';
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
  Select,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useToast,
  CheckboxGroup,
  Checkbox,
  RadioGroup,
  Radio,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Flex,
  Spacer,
  useColorModeValue
} from '@chakra-ui/react';
import { CorporationProfile } from '../types';

interface CorporationProfileWizardProps {
  onComplete: (profile: Omit<CorporationProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<CorporationProfile>;
}

type WizardStep = 'basic' | 'type' | 'culture' | 'operations' | 'preferences' | 'review';

const steps = [
  { id: 'basic', title: 'Basic Info', description: 'Corporation details' },
  { id: 'type', title: 'Type & Focus', description: 'Corporation type and activities' },
  { id: 'culture', title: 'Culture', description: 'Values and traditions' },
  { id: 'operations', title: 'Operations', description: 'Operational parameters' },
  { id: 'preferences', title: 'Preferences', description: 'AI behavior preferences' },
  { id: 'review', title: 'Review', description: 'Final review' }
];

export const CorporationProfileWizard: React.FC<CorporationProfileWizardProps> = ({
  onComplete,
  onCancel,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [formData, setFormData] = useState<Partial<CorporationProfile>>({
    name: '',
    ticker: '',
    corporationId: '',
    type: 'highsec_industrial',
    timezone: 'UTC',
    language: 'en',
    culture: {
      values: [],
      goals: [],
      prohibitions: [],
      traditions: []
    },
    operationalParameters: {
      mainTimeZone: 'UTC',
      primaryActivities: [],
      riskProfile: 'moderate',
      decisionMakingStyle: 'democratic',
      memberExperienceLevel: 'mixed'
    },
    preferences: {
      responseLength: 'moderate',
      analysisDepth: 'standard',
      proactiveAlerts: true,
      realTimeUpdates: true,
      customNotifications: []
    },
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [currentTagType, setCurrentTagType] = useState<'values' | 'goals' | 'prohibitions' | 'traditions'>('values');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const stepIndex = steps.findIndex(step => step.id === currentStep);

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic':
        if (!formData.name?.trim()) newErrors.name = 'Corporation name is required';
        if (!formData.ticker?.trim()) newErrors.ticker = 'Corporation ticker is required';
        if (!formData.corporationId?.trim()) newErrors.corporationId = 'Corporation ID is required';
        break;
      case 'type':
        if (!formData.type) newErrors.type = 'Corporation type is required';
        if (!formData.operationalParameters?.primaryActivities?.length) {
          newErrors.primaryActivities = 'At least one primary activity is required';
        }
        break;
      case 'culture':
        if (!formData.culture?.values?.length) {
          newErrors.values = 'At least one value is recommended';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id as WizardStep);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as WizardStep);
    }
  };

  const handleComplete = () => {
    if (validateStep(currentStep)) {
      onComplete(formData as Omit<CorporationProfile, 'id' | 'createdAt' | 'updatedAt'>);
      toast({
        title: 'Corporation Profile Created',
        description: 'Your corporation profile has been successfully created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const addTag = (type: 'values' | 'goals' | 'prohibitions' | 'traditions') => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        culture: {
          ...prev.culture!,
          [type]: [...(prev.culture?.[type] || []), newTag.trim()]
        }
      }));
      setNewTag('');
    }
  };

  const removeTag = (type: 'values' | 'goals' | 'prohibitions' | 'traditions', index: number) => {
    setFormData(prev => ({
      ...prev,
      culture: {
        ...prev.culture!,
        [type]: prev.culture?.[type]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof typeof prev],
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Corporation Name</FormLabel>
              <Input
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter corporation name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.ticker}>
              <FormLabel>Corporation Ticker</FormLabel>
              <Input
                value={formData.ticker || ''}
                onChange={(e) => updateField('ticker', e.target.value.toUpperCase())}
                placeholder="CORP"
                maxLength={5}
              />
              <FormErrorMessage>{errors.ticker}</FormErrorMessage>
              <FormHelperText>Corporation ticker (usually 3-5 characters)</FormHelperText>
            </FormControl>

            <FormControl isInvalid={!!errors.corporationId}>
              <FormLabel>Corporation ID</FormLabel>
              <Input
                value={formData.corporationId || ''}
                onChange={(e) => updateField('corporationId', e.target.value)}
                placeholder="98388312"
                type="number"
              />
              <FormErrorMessage>{errors.corporationId}</FormErrorMessage>
              <FormHelperText>Your EVE Online corporation ID</FormHelperText>
            </FormControl>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Timezone</FormLabel>
                <Select
                  value={formData.timezone || 'UTC'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">GMT</option>
                  <option value="Europe/Berlin">CET</option>
                  <option value="Asia/Tokyo">JST</option>
                  <option value="Australia/Sydney">AEST</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select
                  value={formData.language || 'en'}
                  onChange={(e) => updateField('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                </Select>
              </FormControl>
            </HStack>
          </VStack>
        );

      case 'type':
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.type}>
              <FormLabel>Corporation Type</FormLabel>
              <Select
                value={formData.type || ''}
                onChange={(e) => updateField('type', e.target.value)}
              >
                <option value="highsec_industrial">Highsec Industrial</option>
                <option value="highsec_mining">Highsec Mining</option>
                <option value="nullsec_sov">Nullsec Sovereignty</option>
                <option value="lowsec_faction_warfare">Lowsec Faction Warfare</option>
                <option value="wormhole">Wormhole Space</option>
                <option value="mercenary">Mercenary</option>
                <option value="trading">Trading</option>
                <option value="newbro_friendly">Newbro Friendly</option>
                <option value="veteran_elite">Veteran Elite</option>
              </Select>
              <FormErrorMessage>{errors.type}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.primaryActivities}>
              <FormLabel>Primary Activities</FormLabel>
              <CheckboxGroup
                value={formData.operationalParameters?.primaryActivities || []}
                onChange={(values) => updateField('operationalParameters.primaryActivities', values)}
              >
                <Wrap>
                  <WrapItem><Checkbox value="mining">Mining</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="manufacturing">Manufacturing</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="trading">Trading</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="missions">Mission Running</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="exploration">Exploration</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="pvp">PvP</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="pve">PvE</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="research">Research</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="hauling">Hauling</Checkbox></WrapItem>
                  <WrapItem><Checkbox value="recruitment">Recruitment</Checkbox></WrapItem>
                </Wrap>
              </CheckboxGroup>
              <FormErrorMessage>{errors.primaryActivities}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Risk Profile</FormLabel>
              <RadioGroup
                value={formData.operationalParameters?.riskProfile || 'moderate'}
                onChange={(value) => updateField('operationalParameters.riskProfile', value)}
              >
                <HStack spacing={6}>
                  <Radio value="conservative">Conservative</Radio>
                  <Radio value="moderate">Moderate</Radio>
                  <Radio value="aggressive">Aggressive</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Decision Making Style</FormLabel>
              <RadioGroup
                value={formData.operationalParameters?.decisionMakingStyle || 'democratic'}
                onChange={(value) => updateField('operationalParameters.decisionMakingStyle', value)}
              >
                <VStack align="start">
                  <Radio value="democratic">Democratic - Group decisions</Radio>
                  <Radio value="hierarchical">Hierarchical - Leadership decides</Radio>
                  <Radio value="consensus">Consensus - Everyone agrees</Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Member Experience Level</FormLabel>
              <RadioGroup
                value={formData.operationalParameters?.memberExperienceLevel || 'mixed'}
                onChange={(value) => updateField('operationalParameters.memberExperienceLevel', value)}
              >
                <HStack spacing={6}>
                  <Radio value="newbro">Newbro Focused</Radio>
                  <Radio value="mixed">Mixed Experience</Radio>
                  <Radio value="veteran">Veteran Only</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </VStack>
        );

      case 'culture':
        return (
          <VStack spacing={6} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Define Your Corporation Culture</AlertTitle>
                <AlertDescription>
                  Help your AI agents understand your corporation's values, goals, and traditions.
                  This will improve their recommendations and alignment with your culture.
                </AlertDescription>
              </Box>
            </Alert>

            {(['values', 'goals', 'prohibitions', 'traditions'] as const).map((type) => (
              <FormControl key={type} isInvalid={type === 'values' && !!errors.values}>
                <FormLabel textTransform="capitalize">{type}</FormLabel>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Input
                      value={currentTagType === type ? newTag : ''}
                      onChange={(e) => {
                        setCurrentTagType(type);
                        setNewTag(e.target.value);
                      }}
                      placeholder={`Add ${type.slice(0, -1)}...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag(type);
                        }
                      }}
                    />
                    <Button onClick={() => addTag(type)} isDisabled={!newTag.trim()}>
                      Add
                    </Button>
                  </HStack>
                  
                  <Wrap>
                    {formData.culture?.[type]?.map((item, index) => (
                      <WrapItem key={index}>
                        <Tag size="md" colorScheme="blue">
                          <TagLabel>{item}</TagLabel>
                          <TagCloseButton onClick={() => removeTag(type, index)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </VStack>
                {type === 'values' && <FormErrorMessage>{errors.values}</FormErrorMessage>}
              </FormControl>
            ))}
          </VStack>
        );

      case 'preferences':
        return (
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Response Length</FormLabel>
              <RadioGroup
                value={formData.preferences?.responseLength || 'moderate'}
                onChange={(value) => updateField('preferences.responseLength', value)}
              >
                <VStack align="start">
                  <Radio value="brief">Brief - Concise answers</Radio>
                  <Radio value="moderate">Moderate - Balanced detail</Radio>
                  <Radio value="detailed">Detailed - Comprehensive explanations</Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Analysis Depth</FormLabel>
              <RadioGroup
                value={formData.preferences?.analysisDepth || 'standard'}
                onChange={(value) => updateField('preferences.analysisDepth', value)}
              >
                <VStack align="start">
                  <Radio value="quick">Quick - Fast basic analysis</Radio>
                  <Radio value="standard">Standard - Thorough analysis</Radio>
                  <Radio value="comprehensive">Comprehensive - Deep dive analysis</Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            <VStack align="stretch" spacing={4}>
              <Checkbox
                isChecked={formData.preferences?.proactiveAlerts || false}
                onChange={(e) => updateField('preferences.proactiveAlerts', e.target.checked)}
              >
                Proactive Alerts - Get notified of opportunities and issues
              </Checkbox>

              <Checkbox
                isChecked={formData.preferences?.realTimeUpdates || false}
                onChange={(e) => updateField('preferences.realTimeUpdates', e.target.checked)}
              >
                Real-time Updates - Receive live market and corporation data
              </Checkbox>
            </VStack>
          </VStack>
        );

      case 'review':
        return (
          <VStack spacing={6} align="stretch">
            <Alert status="success">
              <AlertIcon />
              <Box>
                <AlertTitle>Ready to Create Profile</AlertTitle>
                <AlertDescription>
                  Review your corporation profile below. You can modify any settings after creation.
                </AlertDescription>
              </Box>
            </Alert>

            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <Heading size="md">Corporation Profile Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Name:</Text>
                    <Text>{formData.name} [{formData.ticker}]</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Type:</Text>
                    <Text>{formData.type?.replace(/_/g, ' ')}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Primary Activities:</Text>
                    <Text>{formData.operationalParameters?.primaryActivities?.join(', ')}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Values:</Text>
                    <Text>{formData.culture?.values?.slice(0, 3).join(', ')}{(formData.culture?.values?.length || 0) > 3 ? '...' : ''}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Risk Profile:</Text>
                    <Text textTransform="capitalize">{formData.operationalParameters?.riskProfile}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Corporation Profile Setup</Heading>
          <Text color="gray.500">Configure your corporation's AI assistant behavior</Text>
        </Box>

        {/* Progress */}
        <Box>
          <Stepper index={stepIndex} colorScheme="blue">
            {steps.map((step, index) => (
              <Step key={step.id}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody p={8}>
            {renderStepContent()}
          </CardBody>
        </Card>

        {/* Navigation */}
        <Flex>
          <Button
            variant="outline"
            onClick={stepIndex === 0 ? onCancel : handlePrevious}
          >
            {stepIndex === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Spacer />
          <Button
            colorScheme="blue"
            onClick={currentStep === 'review' ? handleComplete : handleNext}
          >
            {currentStep === 'review' ? 'Create Profile' : 'Next'}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};