import React, { useState } from 'react';
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
import { StrategicMatrixDocument } from '../../types';
import { getCategoryColor, formatDate } from '../../utils/formatters';

// Local types
interface DocumentCardProps {
  document: StrategicMatrixDocument;
  onViewClick: (document: StrategicMatrixDocument) => void;
  onEditClick: (document: StrategicMatrixDocument) => void;
  onDeleteClick?: (id: string) => void;
}

/**
 * A self-contained card component for displaying a Strategic Matrix document
 * Includes all styling, event handling, and rendering logic
 */
const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onViewClick,
  onEditClick,
  onDeleteClick,
}) => {
  // Local state
  const [isHovered, setIsHovered] = useState(false);
  
  // Styling
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.200', 'gray.700');
  
  // Guard clause
  if (!document) return null;
  
  // Event handlers
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteClick && window.confirm('Are you sure you want to delete this document?')) {
      onDeleteClick(document.id as string);
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick(document);
  };
  
  const handleView = () => {
    onViewClick(document);
  };

  // Render
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      overflow="hidden"
      bg={bgColor}
      boxShadow="md"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg', bg: hoverBgColor }}
      onClick={handleView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      cursor="pointer"
    >
      <Flex p={4} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          <FileText size={20} />
          <Heading size="md" ml={2}>
            {document.title}
          </Heading>
        </Flex>
        <HStack spacing={2} opacity={isHovered ? 1 : 0.5} transition="opacity 0.2s">
          <IconButton
            aria-label="Edit document"
            icon={<Edit size={18} />}
            size="sm"
            onClick={handleEdit}
          />
          {document.id && onDeleteClick && (
            <IconButton
              aria-label="Delete document"
              icon={<Trash2 size={18} />}
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={handleDelete}
            />
          )}
        </HStack>
      </Flex>
      
      <Box p={4} pt={0}>
        <Flex mb={3} mt={1} justifyContent="space-between" alignItems="center">
          <Badge colorScheme={getCategoryColor(document.category)}>
            {document.category}
          </Badge>
          <Text fontSize="sm" color="gray.500">
            Updated: {formatDate(document.lastUpdated)}
          </Text>
        </Flex>
        
        <Text noOfLines={3}>{document.content}</Text>
      </Box>
    </Box>
  );
};

export default DocumentCard;
