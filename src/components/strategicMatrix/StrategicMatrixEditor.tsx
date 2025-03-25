import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  Heading,
} from '@chakra-ui/react';
import { Save, X } from 'lucide-react';
import { StrategicMatrixDocument } from '../../types/strategicMatrix';

interface StrategicMatrixEditorProps {
  document?: StrategicMatrixDocument;
  onSave: (document: StrategicMatrixDocument) => void;
  onCancel: () => void;
}

const StrategicMatrixEditor: React.FC<StrategicMatrixEditorProps> = ({
  document,
  onSave,
  onCancel,
}) => {
  const isNewDocument = !document;
  const toast = useToast();
  
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [category, setCategory] = useState(document?.category || 'Active Context');

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Content is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedDocument: StrategicMatrixDocument = {
      id: document?.id,
      title: title.trim(),
      content: content.trim(),
      category,
      lastUpdated: new Date(),
    };

    onSave(updatedDocument);
  };

  return (
    <Box p={4} bg="gray.800" borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">{isNewDocument ? 'Create New Document' : 'Edit Document'}</Heading>
        
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Corporation Context">Corporation Context</option>
            <option value="Active Context">Active Context</option>
            <option value="Asset Information">Asset Information</option>
            <option value="Diplomatic Relations">Diplomatic Relations</option>
            <option value="Operational Details">Operational Details</option>
            <option value="Threat Analysis">Threat Analysis</option>
            <option value="Opportunity Assessment">Opportunity Assessment</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Content</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Document content"
            minH="200px"
            resize="vertical"
          />
        </FormControl>
        
        <HStack spacing={4} justify="flex-end">
          <Button
            leftIcon={<X size={18} />}
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            leftIcon={<Save size={18} />}
            colorScheme="brand"
            onClick={handleSave}
          >
            Save
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default StrategicMatrixEditor;
