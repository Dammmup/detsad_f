import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import moment, { Moment } from 'moment';
import 'moment/locale/ru'; // Import Russian locale for Moment.js

const MenuCalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Moment | null>(moment());

  // Set Moment.js locale globally if not already done in the app
  moment.locale('ru');

  const handleDateChange = (newDate: Moment | null) => {
    setSelectedDate(newDate);
    // Here you would typically fetch menu details for the newDate
    console.log('Selected date:', newDate?.format('YYYY-MM-DD'));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Календарь меню
      </Typography>

      <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="ru">
          <DateCalendar
            value={selectedDate}
            onChange={handleDateChange}
            views={['day']} // Only show day view for selection
          />
        </LocalizationProvider>

        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Меню на {selectedDate ? selectedDate.format('LL') : 'выбранную дату'}
          </Typography>
          {selectedDate ? (
            <Box>
              {/* Placeholder for daily menu details */}
              <Typography variant="h6">Завтрак:</Typography>
              <Typography>Каша овсяная, Чай</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Обед:</Typography>
              <Typography>Суп куриный, Пюре картофельное с котлетой, Компот</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Полдник:</Typography>
              <Typography>Йогурт, Фрукты</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Ужин:</Typography>
              <Typography>Запеканка творожная, Кефир</Typography>

              {/* Add more details as needed */}
            </Box>
          ) : (
            <Typography>Выберите дату, чтобы просмотреть меню.</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MenuCalendarPage;
