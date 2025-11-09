import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Collapse,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';
import { STRATEGIC_MATRIX_CATEGORIES, useStrategicMatrixStore } from '../../store';
import CompactDocumentCard from '../core/CompactDocumentCard';
import DocumentViewer from '../core/DocumentViewer';
import { StrategicMatrixDocument } from '../../types';

/**
 * A collapsible panel for displaying Strategic Matrix documents in the chat interface
 */
const CollapsiblePanel: React.FC = () => {
  // State for the panel
  const [isPanelExpanded, setIsPanelExpanded] = useState(() => {
    const savedState = localStorage.getItem('strategicMatrixPanelExpanded');
    return savedState ? JSON.parse(savedState) : false;
  });

  // State for individual category sections
  const [expandedSections, setExpandedSections] = useState(() => {
    const savedState = localStorage.getItem('strategicMatrixExpandedSections');
    return savedState ? JSON.parse(savedState) : {
      'Corporation Context': false,
      'Active Context': true, // Default expanded as it's the "source of truth"
      'Asset Information': false,
      'Diplomatic Relations': false,
      'Operational Details': false,
      'Threat Analysis': false,
      'Opportunity Assessment': false
    };
  });

  // State for the modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDocument, setSelectedDocument] = useState<StrategicMatrixDocument | null>(null);

  // Get documents from the store
  const documents = useStrategicMatrixStore(state => state.getFixedOrderDocuments());

  // Save panel state
  useEffect(() => {
    localStorage.setItem('strategicMatrixPanelExpanded', JSON.stringify(isPanelExpanded));
  }, [isPanelExpanded]);

  // Save expanded sections state
  useEffect(() => {
    localStorage.setItem('strategicMatrixExpandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  // Handle opening a document in the modal
  const handleOpenDocument = (document: StrategicMatrixDocument) => {
    setSelectedDocument(document);
    onOpen();
  };

  // Toggle a specific category section
  const toggleSection = (category: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.700"
      bg="gray.800"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Panel Header */}
      <Flex
        p={3}
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        cursor="pointer"
        borderBottomWidth={isPanelExpanded ? "1px" : "0"}
        borderBottomColor="gray.700"
      >
        <Flex alignItems="center">
          <Database size={18} />
          <Heading size="sm" ml={2}>
            Strategic Matrix
          </Heading>
        </Flex>
        <Button
          size="sm"
          variant="ghost"
          rightIcon={isPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        >
          {isPanelExpanded ? "Collapse" : "Expand"}
        </Button>
      </Flex>

      {/* Panel Content */}
      <Collapse in={isPanelExpanded} animateOpacity style={{ flex: 1, overflowY: 'auto' }}>
        <Box p={3} h="100%">
          <Accordion allowMultiple defaultIndex={[1]}>
            {STRATEGIC_MATRIX_CATEGORIES.map((category, index) => {
              const document = documents[index];
              return (
                <AccordionItem key={category} border="0">
                  <h2>
                    <AccordionButton
                      py={2}
                      _hover={{ bg: 'gray.700' }}
                      onClick={() => toggleSection(category)}
                    >
                      <Box flex="1" textAlign="left">
                        <Text fontWeight="medium">{category}</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} px={2}>
                    {document ? (
                      <CompactDocumentCard
                        document={document}
                        onClick={handleOpenDocument}
                      />
                    ) : (
                      <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                        No document available for this category.
                      </Text>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Box>
      </Collapse>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Box>
  );
};

export default CollapsiblePanel;
