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
} from '@chakra-ui/react';
import { StrategicMatrixDocument } from '../../types/strategicMatrix';

interface StrategicMatrixViewerModalProps {
  document: StrategicMatrixDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const StrategicMatrixViewerModal: React.FC<StrategicMatrixViewerModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!document) return null;

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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
              Updated: {formatDate(document.lastUpdated)}
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
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StrategicMatrixViewerModal;
