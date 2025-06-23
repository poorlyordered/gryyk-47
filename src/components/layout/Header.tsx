import {
  Box,
  Flex,
  Button,
  Heading,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Bot, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const Header = () => {
  const { isAuthenticated, character } = useAuthStore();

  return (
    <Box bg="gray.800" px={4} borderBottom="1px" borderColor="gray.700">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <RouterLink to="/">
            <HStack>
              <Bot size={24} />
              <Heading size="md">Gryyk-47</Heading>
            </HStack>
          </RouterLink>
        </HStack>

        <Flex alignItems="center">
          {isAuthenticated && character ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <Avatar
                  size="sm"
                  name={character.name}
                  src={character.portrait}
                />
              </MenuButton>
              <MenuList>
<<<<<<< HEAD
                <MenuItem 
                  icon={<LogOut size={16} />} 
=======
                <MenuItem
                  as={RouterLink}
                  to="/profile/eve-sso"
                >
                  EVE SSO Data
                </MenuItem>
                <MenuItem
                  icon={<LogOut size={16} />}
>>>>>>> 1ed7324 (Initial commit)
                  as={RouterLink}
                  to="/logout"
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button
              as={RouterLink}
              to="/"
              variant="solid"
              colorScheme="brand"
              size="sm"
            >
              Login with EVE Online
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
