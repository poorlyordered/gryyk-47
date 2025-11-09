import React from 'react';
import { Box, Button, Text, HStack, VStack, Heading, useToast, Code } from '@chakra-ui/react';
import { Check, X, FileText } from 'lucide-react';
import { useChatStore } from '../../store/chat';
import { useStrategicMatrixStore } from '../../features/strategicMatrix';

const UpdateProposal: React.FC = () => {
  const { proposedUpdate, setProposedUpdate } = useChatStore(state => ({
    proposedUpdate: state.workflow.proposedUpdate,
    setProposedUpdate: state.setProposedUpdate,
  }));
  const { updateDocument, getDocumentById } = useStrategicMatrixStore();
  const toast = useToast();

  if (!proposedUpdate) {
    return null;
  }

  const { documentId, documentType, content, reason } = proposedUpdate;
  const originalDocument = getDocumentById(documentId);

  const handleAccept = async () => {
    if (!originalDocument) {
      toast({
        title: 'Error',
        description: 'Original document not found to apply update.',
        status: 'error',
      });
      return;
    }
    
    try {
      await updateDocument({ ...originalDocument, content });
      toast({
        title: 'Update Successful',
        description: `Document "${documentType}" has been updated.`,
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: `Could not update document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      });
    } finally {
      setProposedUpdate(null);
    }
  };

  const handleReject = () => {
    setProposedUpdate(null);
    toast({
      title: 'Update Rejected',
      status: 'info',
    });
  };

  return (
    <Box p={4} bg="brand.800" borderRadius="lg" mb={4} borderWidth={1} borderColor="brand.600">
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Heading size="sm">AI Suggestion: Update Strategic Document</Heading>
          <HStack>
            <Button size="sm" colorScheme="red" onClick={handleReject} leftIcon={<X size={16} />}>
              Reject
            </Button>
            <Button size="sm" colorScheme="green" onClick={handleAccept} leftIcon={<Check size={16} />}>
              Accept
            </Button>
          </HStack>
        </HStack>
        <Text fontSize="sm">
          The AI has proposed an update based on the recent conversation.
        </Text>
        <Box bg="gray.900" p={3} borderRadius="md">
            <HStack mb={2}>
                <FileText size={16} />
                <Text fontWeight="bold">Document:</Text>
                <Code>{documentType}</Code>
            </HStack>
            <Text fontSize="sm" color="gray.400"><strong>Reason:</strong> {reason}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default UpdateProposal; 