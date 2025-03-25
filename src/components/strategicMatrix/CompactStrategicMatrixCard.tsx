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
import { StrategicMatrixDocument } from '../../types/strategicMatrix';

interface CompactStrategicMatrixCardProps {
  document: StrategicMatrixDocument;
  onClick: () => void;
}

const CompactStrategicMatrixCard: React.FC<CompactStrategicMatrixCardProps> = ({
  document,
  onClick,
}) => {
  const { title, content, category, lastUpdated } = document;
  
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');
  
  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      'Corporation Context': 'blue',
      'Active Context': 'green',
      'Asset Information': 'purple',
      'Diplomatic Relations': 'red',
      'Operational Details': 'orange',
      'Threat Analysis': 'pink',
      'Opportunity Assessment': 'teal',
    };
    
    return categories[category] || 'gray';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
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
      onClick={onClick}
      mb={2}
    >
      <Flex p={2} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" flex={1}>
          <FileText size={16} />
          <Heading size="sm" ml={2} noOfLines={1}>
            {title}
          </Heading>
        </Flex>
        <Badge colorScheme={getCategoryColor(category)} ml={2} fontSize="xs">
          {category}
        </Badge>
      </Flex>
      
      <Box px={2} pb={2}>
        <Text fontSize="xs" noOfLines={1} opacity={0.7}>
          {content}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
          Updated: {formatDate(lastUpdated)}
        </Text>
      </Box>
    </Box>
  );
};

export default CompactStrategicMatrixCard;
