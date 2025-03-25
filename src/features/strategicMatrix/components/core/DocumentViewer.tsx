import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
} from '@chakra-ui/react';
import { Edit } from 'lucide-react';
import { StrategicMatrixDocument } from '../../types';
import { getCategoryColor, formatDate } from '../../utils/formatters';

interface DocumentViewerProps {
  document: StrategicMatrixDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: StrategicMatrixDocument) => void;
}

/**
 * A self-contained viewer component for displaying a Strategic Matrix document
 * Includes all styling, event handling, and rendering logic
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
}) => {
  // Guard clause
  if (!document) return null;

  // Event handlers
  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.900">
        <ModalHeader>
          <Heading size="md">{document.title}</Heading>
          <Flex mt={2} justifyContent="space-between" alignItems="center">
            <Badge colorScheme={getCategoryColor(document.category)}>
              {document.category}
            </Badge>
            <Text fontSize="sm" color="gray.500">
              Updated: {formatDate(document.lastUpdated, 'long')}
            </Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            bg="gray.800"
            p={4}
            borderRadius="md"
            whiteSpace="pre-wrap"
          >
            {document.content}
          </Box>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={4}>
            {onEdit && (
              <Button 
                leftIcon={<Edit size={16} />} 
                colorScheme="brand" 
                variant="outline"
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentViewer;
