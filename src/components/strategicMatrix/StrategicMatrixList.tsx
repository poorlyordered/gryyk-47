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
import StrategicMatrixCard from './StrategicMatrixCard';
import StrategicMatrixEditor from './StrategicMatrixEditor';
import { StrategicMatrixDocument } from '../../types/strategicMatrix';
import { useStrategicMatrixStore } from '../../store/strategicMatrix';

const StrategicMatrixList: React.FC = () => {
  const { 
    documents, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useStrategicMatrixStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingDocument, setEditingDocument] = useState<StrategicMatrixDocument | undefined>(undefined);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleCreateNew = () => {
    setEditingDocument(undefined);
    onOpen();
  };

  const handleEdit = (document: StrategicMatrixDocument) => {
    setEditingDocument(document);
    onOpen();
  };

  const handleSave = (document: StrategicMatrixDocument) => {
    if (document.id) {
      // Update existing document
      updateDocument(document);
      toast({
        title: 'Document updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new document
      addDocument(document);
      toast({
        title: 'Document created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
      toast({
        title: 'Document deleted',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Strategic Matrix</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="brand"
          onClick={handleCreateNew}
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
          <option value="Corporation Context">Corporation Context</option>
          <option value="Active Context">Active Context</option>
          <option value="Asset Information">Asset Information</option>
          <option value="Diplomatic Relations">Diplomatic Relations</option>
          <option value="Operational Details">Operational Details</option>
          <option value="Threat Analysis">Threat Analysis</option>
          <option value="Opportunity Assessment">Opportunity Assessment</option>
        </Select>
      </HStack>

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
            <StrategicMatrixCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              content={doc.content}
              category={doc.category}
              lastUpdated={doc.lastUpdated}
              onEdit={() => handleEdit(doc)}
              onDelete={handleDelete}
            />
          ))}
        </Grid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900">
          <ModalCloseButton />
          <ModalBody p={6}>
            <StrategicMatrixEditor
              document={editingDocument}
              onSave={handleSave}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StrategicMatrixList;
