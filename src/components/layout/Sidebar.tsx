import React from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  Link,
  Divider,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { MessageSquare, Settings, Database, LogOut, Bot, Activity, Zap, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const Sidebar = () => {
  const location = useLocation();

  interface NavItemProps {
    icon: React.ElementType;
    children: React.ReactNode;
    to: string;
  }

  const NavItem = ({ icon, children, to }: NavItemProps) => {
    const isActive = location.pathname === to;

    return (
      <Link
        as={RouterLink}
        to={to}
        style={{ textDecoration: 'none' }}
        _focus={{ boxShadow: 'none' }}
      >
        <Flex
          align="center"
          p="4"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          bg={isActive ? 'brand.700' : 'transparent'}
          _hover={{
            bg: 'brand.700',
          }}
        >
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
          <Text>{children}</Text>
        </Flex>
      </Link>
    );
  };

  const { isAuthenticated } = useAuthStore();

  return (
    <Box
      bg="gray.800"
      w="60"
      h="calc(100vh - 4rem)"
      pos="sticky"
      top="4rem"
      borderRight="1px"
      borderColor="gray.700"
    >
      <VStack spacing={1} align="stretch" py={4} h="full">
        <NavItem icon={MessageSquare} to="/chat">
          Chat
        </NavItem>
        <NavItem icon={LayoutDashboard} to="/dashboard">
          CEO Dashboard
        </NavItem>
        <NavItem icon={Database} to="/strategic-matrix">
          Strategic Matrix
        </NavItem>
        <NavItem icon={Bot} to="/agent-configuration">
          Agent Configuration
        </NavItem>
        <NavItem icon={Activity} to="/agent-monitoring">
          Agent Monitoring
        </NavItem>
        <NavItem icon={Zap} to="/esi-pipeline">
          ESI Pipeline
        </NavItem>
        <NavItem icon={Settings} to="/system-prompt">
          System Prompt
        </NavItem>
        
        <Spacer />
        
        {isAuthenticated && (
          <>
            <Divider my={2} />
            <NavItem icon={LogOut} to="/logout">
              Logout
            </NavItem>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar;
