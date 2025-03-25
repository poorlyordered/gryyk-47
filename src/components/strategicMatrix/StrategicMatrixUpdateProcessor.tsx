import React, { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useChatStore } from '../../store/chat';
import { useStrategicMatrixStore, STRATEGIC_MATRIX_CATEGORIES } from '../../store/strategicMatrix';

/**
 * This component processes chat messages to detect and handle Strategic Matrix update commands.
 * It doesn't render any UI elements but works in the background to monitor messages.
 */
const StrategicMatrixUpdateProcessor: React.FC = () => {
  const { messages } = useChatStore();
  const { updateDocument, getDocumentsByCategory, addDocument } = useStrategicMatrixStore();
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

    // Get existing documents for this category
    const existingDocs = getDocumentsByCategory(category);
    
    if (existingDocs.length > 0) {
      // Update the most recent document
      const mostRecentDoc = existingDocs.reduce((latest, current) => {
        return new Date(latest.lastUpdated) > new Date(current.lastUpdated) ? latest : current;
      });
      
      updateDocument({
        ...mostRecentDoc,
        content: newContent.trim(),
        lastUpdated: new Date(),
      });
      
      toast({
        title: 'Strategic Matrix Updated',
        description: `Updated ${category} document: ${mostRecentDoc.title}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create a new document if none exists
      addDocument({
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
  }, [messages, updateDocument, getDocumentsByCategory, addDocument, toast]);

  // This component doesn't render anything
  return null;
};

export default StrategicMatrixUpdateProcessor;
