import React from 'react';
import { useDate } from './context/DateContext';
import { Button, Typography, Box } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const DateNavigator = () => {
  const { currentDate, setCurrentDate } = useDate();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
      }}
    >
      <Button onClick={handlePrevMonth}>&lt;</Button>
      <Typography variant='h6' sx={{ mx: 2 }}>
        {format(currentDate, 'LLLL yyyy', { locale: ru })}
      </Typography>
      <Button onClick={handleNextMonth}>&gt;</Button>
    </Box>
  );
};

export default DateNavigator;
