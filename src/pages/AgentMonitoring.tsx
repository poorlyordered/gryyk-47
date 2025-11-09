import React from 'react';
import { Box } from '@chakra-ui/react';
import { AgentHealthDashboard } from '../features/agentMonitoring';

export const AgentMonitoring: React.FC = () => {
  return (
    <Box>
      <AgentHealthDashboard />
    </Box>
  );
};