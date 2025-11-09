import React from 'react';
import { Box } from '@chakra-ui/react';
import { ESIPipelineDashboard } from '../features/esiPipeline/components/ESIPipelineDashboard';

export const ESIPipeline: React.FC = () => {
  return (
    <Box>
      <ESIPipelineDashboard />
    </Box>
  );
};