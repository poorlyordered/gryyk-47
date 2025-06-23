import React, { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useChatStore } from '../../../../store/chat';
import { useStrategicMatrixDocument } from '../../hooks/useStrategicMatrixDocument';
import { STRATEGIC_MATRIX_CATEGORIES } from '../../store';

/**
 * This component processes chat messages to detect and handle Strategic Matrix update commands.
 * It doesn't render any UI elements but works in the background to monitor messages.
 */
const UpdateProcessor: React.FC = () => {
  const { messages } = useChatStore();
  const { saveDocument, createDocument, getLatestDocument } = useStrategicMatrixDocument();
  const toast = useToast();

  // Process messages to detect and handle Strategic Matrix update commands
  useEffect(() => {
    if (messages.length === 0) return;

    // Get the latest assistant message
    const latestMessages = [...messages].reverse();
    const latestAssistantMessage = latestMessages.find(msg => msg.sender === 'assistant');
    
    if (!latestAssistantMessage) return;

    // Check if the message contains an update command
    const content = latestAssistantMessage.content;
    const updateCommandRegex = /EXECUTE STRATEGIC MATRIX UPDATE: ([^\n]+)\n([\s\S]+)/i;
    const match = content.match(updateCommandRegex);

    if (!match) return;

    // Extract category and content from the command
    const [, categoryRaw, newContent] = match;
    const category = categoryRaw.trim();

    // Validate the category
    if (!STRATEGIC_MATRIX_CATEGORIES.includes(category)) {
      console.error(`Invalid Strategic Matrix category: ${category}`);
      toast({
        title: 'Update Failed',
        description: `Invalid Strategic Matrix category: ${category}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Get existing document for this category
    const existingDoc = getLatestDocument(category);
    
    if (existingDoc) {
      // Update the existing document
      saveDocument({
        ...existingDoc,
        content: newContent.trim(),
        lastUpdated: new Date(),
      });
      
      toast({
        title: 'Strategic Matrix Updated',
        description: `Updated ${category} document: ${existingDoc.title}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create a new document if none exists
      createDocument({
        title: `${category} Information`,
        content: newContent.trim(),
        category: category,
        lastUpdated: new Date(),
      });
      
      toast({
        title: 'Strategic Matrix Created',
        description: `Created new ${category} document`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [messages, saveDocument, createDocument, getLatestDocument, toast]);

  // This component doesn't render anything
  return null;
};

export default UpdateProcessor;
