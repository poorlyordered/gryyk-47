import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  HStack,
  useToast,
  Heading,
  Text,
} from '@chakra-ui/react';
import { Save, RotateCcw } from 'lucide-react';
import { useChatStore } from '../../store/chat';
import { buildSystemMessage } from '../../services/openrouter';

const SystemPromptEditor: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useChatStore();
  const [content, setContent] = useState(systemPrompt.content);
  const toast = useToast();

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: 'System prompt cannot be empty',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSystemPrompt(content.trim());
    toast({
      title: 'System prompt saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleReset = () => {
    const defaultPrompt = buildSystemMessage(true);
    setContent(defaultPrompt);
    toast({
      title: 'System prompt reset to default',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={4} bg="gray.800" borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">System Prompt Editor</Heading>
        <Text fontSize="sm" color="gray.400">
          This is the system message sent to the AI model to define its behavior and capabilities.
          Edit with caution as it affects how the AI responds to your queries.
        </Text>
        
        <FormControl isRequired>
          <FormLabel>System Prompt</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="System prompt content"
            minH="300px"
            resize="vertical"
          />
        </FormControl>
        
        <Text fontSize="xs" color="gray.500">
          Last updated: {new Date(systemPrompt.lastUpdated).toLocaleString()}
        </Text>
        
        <HStack spacing={4} justify="flex-end">
          <Button
            leftIcon={<RotateCcw size={18} />}
            onClick={handleReset}
            variant="outline"
          >
            Reset to Default
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

export default SystemPromptEditor;
