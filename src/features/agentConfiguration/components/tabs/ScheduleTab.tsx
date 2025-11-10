import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  Input,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import type { AgentConfiguration } from '../../types';

interface ScheduleTabProps {
  config: AgentConfiguration;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  config,
  updateConfig
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateActiveHours = <K extends keyof AgentConfiguration['scheduleSettings']['activeHours']>(
    key: K,
    value: AgentConfiguration['scheduleSettings']['activeHours'][K]
  ) => {
    updateConfig('scheduleSettings', {
      ...config.scheduleSettings,
      activeHours: {
        ...config.scheduleSettings.activeHours,
        [key]: value
      }
    });
  };

  const updateScheduleSettings = <K extends keyof AgentConfiguration['scheduleSettings']>(
    key: K,
    value: AgentConfiguration['scheduleSettings'][K]
  ) => {
    updateConfig('scheduleSettings', {
      ...config.scheduleSettings,
      [key]: value
    });
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
      {/* Active Hours Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Heading size="sm">Active Hours</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <FormControl>
                <FormLabel>Start Time</FormLabel>
                <Input
                  type="time"
                  value={config.scheduleSettings.activeHours.start}
                  onChange={(e) => updateActiveHours('start', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>End Time</FormLabel>
                <Input
                  type="time"
                  value={config.scheduleSettings.activeHours.end}
                  onChange={(e) => updateActiveHours('end', e.target.value)}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Timezone</FormLabel>
              <Select
                value={config.scheduleSettings.activeHours.timezone}
                onChange={(e) => updateActiveHours('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="Europe/London">GMT</option>
                <option value="Europe/Berlin">CET</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
              </Select>
              <FormHelperText>
                Time zone for active hours configuration
              </FormHelperText>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Emergency Override</FormLabel>
                <Switch
                  isChecked={config.scheduleSettings.emergencyOverride}
                  onChange={(e) => updateScheduleSettings('emergencyOverride', e.target.checked)}
                  colorScheme="red"
                />
              </HStack>
              <FormHelperText>
                Allow agent to respond outside active hours in emergencies
              </FormHelperText>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  );
};
