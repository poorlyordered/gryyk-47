import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Select,
  InputGroup,
  Input,
  InputRightElement,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { Plus, Search, Filter } from 'lucide-react';
import DocumentCard from '../core/DocumentCard';
import DocumentEditor from '../core/DocumentEditor';
import DocumentViewer from '../core/DocumentViewer';
import { StrategicMatrixDocument } from '../../types';
import { useStrategicMatrixDocument } from '../../hooks/useStrategicMatrixDocument';
import { useStrategicMatrixFilters } from '../../hooks/useStrategicMatrixFilters';
import { STRATEGIC_MATRIX_CATEGORIES } from '../../store';

/**
 * A composite component that displays a list of Strategic Matrix documents
 * with filtering, sorting, and CRUD operations
 */
const StrategicMatrixList: React.FC = () => {
  // Hooks
  const { 
    documents, 
    createDocument, 
    saveDocument, 
    removeDocument,
    isLoading,
    error
  } = useStrategicMatrixDocument();
  
  const {
    searchTerm,
    categoryFilter,
    setSearchTerm,
    setCategoryFilter,
    filteredDocuments
  } = useStrategicMatrixFilters(documents);
  
  // State
  const [selectedDocument, setSelectedDocument] = useState<StrategicMatrixDocument | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null);
  
  // Disclosures
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Handlers
  const handleCreateNew = () => {
    setSelectedDocument(undefined);
    setViewMode('edit');
    onOpen();
  };

  const handleEdit = (document: StrategicMatrixDocument) => {
    setSelectedDocument(document);
    setViewMode('edit');
    onOpen();
  };

  const handleView = (document: StrategicMatrixDocument) => {
    setSelectedDocument(document);
    setViewMode('view');
    onOpen();
  };

  const handleSave = async (document: StrategicMatrixDocument) => {
    const isNew = !document.id;
    const success = document.id 
      ? await saveDocument(document)
      : await createDocument(document);
    
    if (success) {
      toast({
        title: isNew ? 'Document created' : 'Document updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await removeDocument(id);
    if (success) {
      toast({
        title: 'Document deleted',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedDocument(undefined);
    setViewMode(null);
    onClose();
  };

  // Render
  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Strategic Matrix</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="brand"
          onClick={handleCreateNew}
          isLoading={isLoading}
        >
          New Document
        </Button>
      </Flex>

      <HStack spacing={4} mb={6}>
        <InputGroup size="md">
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            pr="4.5rem"
          />
          <InputRightElement width="4.5rem">
            <Search size={18} />
          </InputRightElement>
        </InputGroup>

        <Select
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          maxW="250px"
          icon={<Filter size={18} />}
        >
          {STRATEGIC_MATRIX_CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </Select>
      </HStack>

      {error && (
        <Box bg="red.900" color="white" p={4} borderRadius="md" mb={6}>
          <Text>{error}</Text>
        </Box>
      )}

      {filteredDocuments.length === 0 ? (
        <VStack spacing={4} p={8} textAlign="center">
          <Text>No documents found.</Text>
          <Button
            variant="outline"
            leftIcon={<Plus size={18} />}
            onClick={handleCreateNew}
          >
            Create New Document
          </Button>
        </VStack>
      ) : (
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={6}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onViewClick={handleView}
              onEditClick={handleEdit}
              onDeleteClick={handleDelete}
            />
          ))}
        </Grid>
      )}

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900">
          <ModalCloseButton />
          <ModalBody p={6}>
            {viewMode === 'edit' ? (
              <DocumentEditor
                document={selectedDocument}
                onSave={handleSave}
                onCancel={handleCloseModal}
              />
            ) : viewMode === 'view' && selectedDocument ? (
              <DocumentViewer
                document={selectedDocument}
                isOpen={true}
                onClose={handleCloseModal}
                onEdit={() => {
                  setViewMode('edit');
                }}
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StrategicMatrixList;
