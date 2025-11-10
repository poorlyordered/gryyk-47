import React from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

interface ConfigSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  mt?: number;
}

/**
 * Reusable section wrapper for configuration forms
 */
export const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  children,
  mt = 6
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box mt={mt} pt={4} borderTop="1px solid" borderColor={borderColor}>
      <Heading size="sm" mb={2}>
        {title}
      </Heading>
      {description && (
        <Text fontSize="sm" color="gray.500" mb={4}>
          {description}
        </Text>
      )}
      {children}
    </Box>
  );
};
