import type {
  AgentConfiguration,
  AgentPersonality,
  CorporationProfile,
  ConfigurationValidation,
  ValidationError,
  ValidationWarning
} from '../types';

/**
 * Validate response parameters
 */
export const validateResponseParameters = (
  config: AgentConfiguration
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Temperature validation
  if (config.responseParameters.temperature < 0 || config.responseParameters.temperature > 2) {
    errors.push({
      field: 'responseParameters.temperature',
      message: 'Temperature must be between 0 and 2',
      severity: 'error'
    });
  }

  // Max tokens validation
  if (config.responseParameters.maxTokens < 100 || config.responseParameters.maxTokens > 4000) {
    warnings.push({
      field: 'responseParameters.maxTokens',
      message: 'Max tokens outside recommended range (500-2000)',
      recommendation: 'Consider using 500-2000 tokens for optimal performance'
    });
  }

  // Top P validation
  if (config.responseParameters.topP < 0 || config.responseParameters.topP > 1) {
    errors.push({
      field: 'responseParameters.topP',
      message: 'Top P must be between 0 and 1',
      severity: 'error'
    });
  }

  // Frequency penalty validation
  if (config.responseParameters.frequencyPenalty < -2 || config.responseParameters.frequencyPenalty > 2) {
    errors.push({
      field: 'responseParameters.frequencyPenalty',
      message: 'Frequency penalty must be between -2 and 2',
      severity: 'error'
    });
  }

  return { errors, warnings };
};

/**
 * Validate behavior settings
 */
export const validateBehaviorSettings = (
  config: AgentConfiguration
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Threshold validation
  if (config.behaviorSettings.consultationThreshold < 0 || config.behaviorSettings.consultationThreshold > 100) {
    errors.push({
      field: 'behaviorSettings.consultationThreshold',
      message: 'Consultation threshold must be between 0 and 100',
      severity: 'error'
    });
  }

  if (config.behaviorSettings.confidenceThreshold < 0 || config.behaviorSettings.confidenceThreshold > 100) {
    errors.push({
      field: 'behaviorSettings.confidenceThreshold',
      message: 'Confidence threshold must be between 0 and 100',
      severity: 'error'
    });
  }

  // High thresholds warning
  if (config.behaviorSettings.consultationThreshold > 90 && config.behaviorSettings.confidenceThreshold > 90) {
    warnings.push({
      field: 'behaviorSettings',
      message: 'Very high thresholds may reduce agent responsiveness',
      recommendation: 'Consider lowering thresholds for more active participation'
    });
  }

  // Max retries validation
  if (config.behaviorSettings.maxRetries < 0 || config.behaviorSettings.maxRetries > 10) {
    warnings.push({
      field: 'behaviorSettings.maxRetries',
      message: 'Max retries outside recommended range (1-5)',
      recommendation: 'Consider using 1-5 retries for optimal reliability'
    });
  }

  return { errors, warnings };
};

/**
 * Validate tools configuration
 */
export const validateTools = (
  config: AgentConfiguration
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (config.tools.length === 0) {
    warnings.push({
      field: 'tools',
      message: 'No tools configured for this agent',
      recommendation: 'Add at least one tool to enable agent capabilities'
    });
  }

  if (config.tools.length > 20) {
    warnings.push({
      field: 'tools',
      message: 'Large number of tools may impact performance',
      recommendation: 'Consider limiting to essential tools (10-15) for better performance'
    });
  }

  return { errors, warnings };
};

/**
 * Calculate validation score
 */
export const calculateValidationScore = (
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number => {
  return Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));
};

/**
 * Generate validation suggestions
 */
export const generateSuggestions = (
  validation: { errors: ValidationError[]; warnings: ValidationWarning[]; score: number }
): string[] => {
  const suggestions: string[] = [];

  if (validation.warnings.length > 0) {
    suggestions.push('Review warnings for optimization opportunities');
  }

  if (validation.score < 80) {
    suggestions.push('Consider using a configuration template for better defaults');
  }

  if (validation.errors.length > 0) {
    suggestions.push('Fix all validation errors before saving');
  }

  if (validation.score >= 90) {
    suggestions.push('Configuration looks good! Ready to deploy.');
  }

  return suggestions;
};

/**
 * Validate entire agent configuration
 */
export const validateConfiguration = (config: AgentConfiguration): ConfigurationValidation => {
  const responseValidation = validateResponseParameters(config);
  const behaviorValidation = validateBehaviorSettings(config);
  const toolsValidation = validateTools(config);

  const allErrors = [
    ...responseValidation.errors,
    ...behaviorValidation.errors,
    ...toolsValidation.errors
  ];

  const allWarnings = [
    ...responseValidation.warnings,
    ...behaviorValidation.warnings,
    ...toolsValidation.warnings
  ];

  const score = calculateValidationScore(allErrors, allWarnings);
  const suggestions = generateSuggestions({ errors: allErrors, warnings: allWarnings, score });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    score,
    suggestions
  };
};

/**
 * Validate personality configuration
 */
export const validatePersonality = (personality: AgentPersonality): ConfigurationValidation => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate trait ranges
  Object.entries(personality.traits).forEach(([trait, value]) => {
    if (value < 0 || value > 100) {
      errors.push({
        field: `traits.${trait}`,
        message: `${trait} must be between 0 and 100`,
        severity: 'error'
      });
    }
  });

  // Validate communication style
  if (!personality.communicationStyle.greeting || personality.communicationStyle.greeting.trim().length === 0) {
    warnings.push({
      field: 'communicationStyle.greeting',
      message: 'No greeting defined',
      recommendation: 'Add a greeting to improve user experience'
    });
  }

  const score = calculateValidationScore(errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions: generateSuggestions({ errors, warnings, score })
  };
};

/**
 * Validate corporation profile
 */
export const validateCorporationProfile = (profile: CorporationProfile): ConfigurationValidation => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields validation
  if (!profile.name || profile.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Corporation name is required',
      severity: 'error'
    });
  }

  if (!profile.corporationId || profile.corporationId.trim().length === 0) {
    errors.push({
      field: 'corporationId',
      message: 'Corporation ID is required',
      severity: 'error'
    });
  }

  if (!profile.type) {
    errors.push({
      field: 'type',
      message: 'Corporation type is required',
      severity: 'error'
    });
  }

  // Warnings for optional but recommended fields
  if (!profile.culture.values || profile.culture.values.length === 0) {
    warnings.push({
      field: 'culture.values',
      message: 'No corporation values defined',
      recommendation: 'Define corporation values to improve agent alignment'
    });
  }

  if (!profile.operationalParameters.primaryActivities || profile.operationalParameters.primaryActivities.length === 0) {
    warnings.push({
      field: 'operationalParameters.primaryActivities',
      message: 'No primary activities defined',
      recommendation: 'Define primary activities to optimize agent recommendations'
    });
  }

  const score = calculateValidationScore(errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions: generateSuggestions({ errors, warnings, score })
  };
};
