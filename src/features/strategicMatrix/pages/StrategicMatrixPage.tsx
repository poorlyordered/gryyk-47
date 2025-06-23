import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import StrategicMatrixList from '../components/composite/StrategicMatrixList';

/**
 * The main page component for the Strategic Matrix feature
 */
const StrategicMatrixPage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={4}>
      <Box>
        <StrategicMatrixList />
      </Box>
    </Container>
  );
};

export default StrategicMatrixPage;
