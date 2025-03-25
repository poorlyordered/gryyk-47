import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import StrategicMatrixList from '../components/strategicMatrix/StrategicMatrixList';

const StrategicMatrix: React.FC = () => {
  return (
    <Container maxW="container.xl" py={4}>
      <Box>
        <StrategicMatrixList />
      </Box>
    </Container>
  );
};

export default StrategicMatrix;
