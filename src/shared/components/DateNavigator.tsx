import React from 'react';
import { useDate } from '../../app/context/DateContext';
import { Button, Typography, Box } from '@mui/material';
import moment from 'moment';
import 'moment/locale/ru';

moment.locale('ru');

interface DateNavigatorProps {
  viewType?: 'month' | 'week' | 'day';
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ viewType = 'month' }) => {
  const { currentDate, setCurrentDate } = useDate();

  const handlePrevMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month').startOf('month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, 'month').startOf('month').toDate());
  };

  const handlePrevWeek = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'week').toDate());
  };

  const handleNextWeek = () => {
    setCurrentDate(moment(currentDate).add(1, 'week').toDate());
  };

  const renderTitle = () => {
    const mDate = moment(currentDate);
    if (viewType === 'week') {
      const start = mDate.clone().startOf('isoWeek');
      const end = mDate.clone().endOf('isoWeek');
      return `${start.format('DD.MM')} - ${end.format('DD.MM.YYYY')}`;
    }
    return mDate.format('MMMM YYYY');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
        gap: 1
      }}
    >
      <Button onClick={handlePrevMonth} title="Предыдущий месяц" sx={{ minWidth: '40px' }}>&lt;&lt;</Button>
      <Button onClick={handlePrevWeek} title="Предыдущая неделя" sx={{ minWidth: '40px' }}>&lt;</Button>

      <Typography variant='h6' sx={{ mx: 2, textTransform: 'capitalize', minWidth: '150px', textAlign: 'center' }}>
        {renderTitle()}
      </Typography>

      <Button onClick={handleNextWeek} title="Следующая неделя" sx={{ minWidth: '40px' }}>&gt;</Button>
      <Button onClick={handleNextMonth} title="Следующий месяц" sx={{ minWidth: '40px' }}>&gt;&gt;</Button>
    </Box>
  );
};

export default DateNavigator;
