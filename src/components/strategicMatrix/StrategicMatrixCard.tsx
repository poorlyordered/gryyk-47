import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { Edit, FileText, Trash2 } from 'lucide-react';
import { StrategicMatrixDocument } from '../../types/strategicMatrix';

interface StrategicMatrixCardProps extends Omit<StrategicMatrixDocument, 'id'> {
  id?: string;
  onEdit: () => void;
  onDelete?: (id: string) => void;
}

const StrategicMatrixCard: React.FC<StrategicMatrixCardProps> = ({
  id,
  title,
  content,
  category,
  lastUpdated,
  onEdit,
  onDelete,
}) => {
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
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      overflow="hidden"
      bg={bgColor}
      boxShadow="md"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
    >
      <Flex p={4} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          <FileText size={20} />
          <Heading size="md" ml={2}>
            {title}
          </Heading>
        </Flex>
        <HStack spacing={2}>
          <IconButton
            aria-label="Edit document"
            icon={<Edit size={18} />}
            size="sm"
            onClick={onEdit}
          />
          {id && onDelete && (
            <IconButton
              aria-label="Delete document"
              icon={<Trash2 size={18} />}
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={() => onDelete(id)}
            />
          )}
        </HStack>
      </Flex>
      
      <Box p={4} pt={0}>
        <Flex mb={3} mt={1} justifyContent="space-between" alignItems="center">
          <Badge colorScheme={getCategoryColor(category)}>{category}</Badge>
          <Text fontSize="sm" color="gray.500">
            Updated: {formatDate(lastUpdated)}
          </Text>
        </Flex>
        
        <Text noOfLines={3}>{content}</Text>
      </Box>
    </Box>
  );
};

export default StrategicMatrixCard;
