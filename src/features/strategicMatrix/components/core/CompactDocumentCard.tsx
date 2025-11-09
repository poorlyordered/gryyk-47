import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { StrategicMatrixDocument } from '../../types';
import { getCategoryColor, formatDate } from '../../utils/formatters';

interface CompactDocumentCardProps {
  document: StrategicMatrixDocument;
  onClick: (document: StrategicMatrixDocument) => void;
}

/**
 * A compact version of the document card for use in sidebars and panels
 * Includes all styling, event handling, and rendering logic
 */
const CompactDocumentCard: React.FC<CompactDocumentCardProps> = ({
  document,
  onClick,
}) => {
  // Styling
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');
  
  // Event handlers
  const handleClick = () => {
    onClick(document);
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      overflow="hidden"
      bg={bgColor}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-1px)', boxShadow: 'md', cursor: 'pointer' }}
      onClick={handleClick}
      mb={2}
    >
      <Flex p={2} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" flex={1}>
          <FileText size={16} />
          <Heading size="sm" ml={2} noOfLines={1}>
            {document.title}
          </Heading>
        </Flex>
        <Badge colorScheme={getCategoryColor(document.category)} ml={2} fontSize="xs">
          {document.category}
        </Badge>
      </Flex>
      
      <Box px={2} pb={2}>
        <Text fontSize="xs" noOfLines={1} opacity={0.7}>
          {document.content}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
          Updated: {formatDate(document.lastUpdated, 'short')}
        </Text>
      </Box>
    </Box>
  );
};

export default CompactDocumentCard;
