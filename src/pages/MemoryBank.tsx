import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import MemoryBankList from '../components/memoryBank/MemoryBankList';

const MemoryBank: React.FC = () => {
  return (
    <Container maxW="container.xl" py={4}>
      <Box>
        <MemoryBankList />
      </Box>
    </Container>
  );
};

export default MemoryBank;
