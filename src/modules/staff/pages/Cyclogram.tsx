import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import DayConstructor from './DayConstructor';
import AuditLogButton from '../../../shared/components/AuditLogButton';

const Cyclogram: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h5' display='flex' alignItems='center'>
          <ScheduleIcon sx={{ mr: 1 }} /> Циклограмма
        </Typography>
        <AuditLogButton entityType="dailySchedule" />
      </Box>

      {/* Вкладки */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label='Конструктор дня' />
      </Tabs>

      {/* Вкладка Конструктор дня */}
      {tabValue === 0 && (
        <DayConstructor />
      )}
    </Paper>
  );
};

export default Cyclogram;
