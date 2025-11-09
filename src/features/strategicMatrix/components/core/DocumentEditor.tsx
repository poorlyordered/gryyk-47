import React, { useState, useEffect } from 'react';
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
import { StrategicMatrixDocument } from '../../types';
import { STRATEGIC_MATRIX_CATEGORIES } from '../../store';

interface DocumentEditorProps {
  document?: StrategicMatrixDocument;
  onSave: (document: StrategicMatrixDocument) => void;
  onCancel: () => void;
}

/**
 * A self-contained editor component for creating and editing Strategic Matrix documents
 * Includes all form handling, validation, and submission logic
 */
const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onSave,
  onCancel,
}) => {
  const isNewDocument = !document?.id;
  const toast = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(STRATEGIC_MATRIX_CATEGORIES[1]); // Default to Active Context
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with document data if editing
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      setCategory(document.category || STRATEGIC_MATRIX_CATEGORIES[1]);
    }
  }, [document]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedDocument: StrategicMatrixDocument = {
        id: document?.id,
        title: title.trim(),
        content: content.trim(),
        category,
        lastUpdated: new Date(),
      };

      onSave(updatedDocument);
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: 'Failed to save document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={4} bg="gray.800" borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">{isNewDocument ? 'Create New Document' : 'Edit Document'}</Heading>
        
        <FormControl isRequired isInvalid={!!errors.title}>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
          />
          {errors.title && (
            <Box color="red.300" fontSize="sm" mt={1}>
              {errors.title}
            </Box>
          )}
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {STRATEGIC_MATRIX_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.content}>
          <FormLabel>Content</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Document content"
            minH="200px"
            resize="vertical"
          />
          {errors.content && (
            <Box color="red.300" fontSize="sm" mt={1}>
              {errors.content}
            </Box>
          )}
        </FormControl>
        
        <HStack spacing={4} justify="flex-end">
          <Button
            leftIcon={<X size={18} />}
            onClick={onCancel}
            variant="outline"
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            leftIcon={<Save size={18} />}
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DocumentEditor;
