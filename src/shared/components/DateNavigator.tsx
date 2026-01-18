import React from 'react';
import { useDate } from '../../app/context/DateContext';
import { Button, Typography, Box } from '@mui/material';
import moment from 'moment';
import 'moment/locale/ru';

moment.locale('ru');

const DateNavigator = () => {
  const { currentDate, setCurrentDate } = useDate();

  const handlePrevMonth = () => {
    setCurrentDate(
      moment(currentDate).subtract(1, 'month').startOf('month').toDate(),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      moment(currentDate).add(1, 'month').startOf('month').toDate(),
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
      <Typography variant='h6' sx={{ mx: 2, textTransform: 'capitalize' }}>
        {moment(currentDate).format('MMMM YYYY')}
      </Typography>
      <Button onClick={handleNextMonth}>&gt;</Button>
    </Box>
  );
};

export default DateNavigator;
