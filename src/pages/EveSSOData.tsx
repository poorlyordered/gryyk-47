import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Tag, Code } from '@chakra-ui/react';
import { useAuthStore } from '../store/auth';

interface EveSSORecord {
  characterId: string;
  characterName: string;
  corporationId?: string;
  corporationName?: string;
  scopes: string[];
  timestamp: string;
  rawESIVerify: Record<string, unknown>;
}

const EveSSOData: React.FC = () => {
  interface TokenDataWithCharacterId {
    characterId?: string;
  }
  interface CharacterWithId {
    characterId?: string;
    id?: string | number;
  }
  const tokenData = useAuthStore((state) => state.tokenData) as TokenDataWithCharacterId | undefined;
  const character = useAuthStore((state) => state.character) as CharacterWithId | undefined;
  const [records, setRecords] = useState<EveSSORecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Robust extraction of characterId
  const characterId =
    (tokenData && tokenData.characterId) ||
    (character && character.characterId) ||
    (character && character.id !== undefined ? String(character.id) : undefined);

  useEffect(() => {
    const fetchData = async () => {
      if (!characterId) {
        setError('No characterId found in authentication data.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/.netlify/functions/get-eve-sso-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setRecords(data.records || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch SSO data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [characterId]);

  return (
    <Box maxW="3xl" mx="auto" mt={8} p={4}>
      <Heading size="lg" mb={4}>EVE SSO Authentication History</Heading>
      {loading && <Spinner />}
      {error && <Text color="red.500">{error}</Text>}
      {!loading && !error && records.length === 0 && (
        <Text>No SSO authentication records found for your character.</Text>
      )}
      <Accordion allowMultiple>
        {records.map((rec, idx) => (
          <AccordionItem key={rec.timestamp + idx}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <b>{rec.characterName}</b> ({rec.characterId}) &mdash; {rec.corporationName || 'No Corp'}<br />
                <Text fontSize="sm" color="gray.500">{new Date(rec.timestamp).toLocaleString()}</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Text fontWeight="bold" mb={2}>Scopes:</Text>
              <Box mb={2} flexWrap="wrap">
                {rec.scopes.map((scope) => (
                  <Tag key={scope} colorScheme="blue" mr={1} mb={1}>{scope}</Tag>
                ))}
              </Box>
              <Text fontWeight="bold" mt={4}>Raw ESI Verify Data:</Text>
              <Code display="block" whiteSpace="pre" p={2} w="100%" maxH="300px" overflow="auto">
                {JSON.stringify(rec.rawESIVerify, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

export default EveSSOData;