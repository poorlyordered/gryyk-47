import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Text,
  Progress,
  Badge,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import type { ConfigurationValidation } from '../../types';

interface ValidationDisplayProps {
  validation: ConfigurationValidation | null;
}

/**
 * Display validation results with errors, warnings, and score
 */
export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation }) => {
  if (!validation) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Validation Score */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="medium">Configuration Score</Text>
          <Badge colorScheme={getScoreColor(validation.score)}>
            {validation.score}/100 - {getScoreLabel(validation.score)}
          </Badge>
        </HStack>
        <Progress
          value={validation.score}
          colorScheme={getScoreColor(validation.score)}
          size="sm"
          borderRadius="md"
        />
      </Box>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold" mb={2}>
              {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''} Found
            </Text>
            <List spacing={1}>
              {validation.errors.map((error, index) => (
                <ListItem key={index} fontSize="sm">
                  <ListIcon as={FiAlertCircle} color="red.500" />
                  <strong>{error.field}:</strong> {error.message}
                </ListItem>
              ))}
            </List>
          </Box>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold" mb={2}>
              {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
            </Text>
            <List spacing={1}>
              {validation.warnings.map((warning, index) => (
                <ListItem key={index} fontSize="sm">
                  <ListIcon as={FiAlertTriangle} color="yellow.500" />
                  <Box>
                    <Text>
                      <strong>{warning.field}:</strong> {warning.message}
                    </Text>
                    {warning.recommendation && (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Recommendation: {warning.recommendation}
                      </Text>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        </Alert>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && (
        <Alert
          status={validation.isValid ? 'success' : 'info'}
          borderRadius="md"
        >
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold" mb={2}>Suggestions</Text>
            <List spacing={1}>
              {validation.suggestions.map((suggestion, index) => (
                <ListItem key={index} fontSize="sm">
                  <ListIcon as={FiCheckCircle} color={validation.isValid ? 'green.500' : 'blue.500'} />
                  {suggestion}
                </ListItem>
              ))}
            </List>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};
