import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  Chip,
  Paper,
  IconButton,
  useTheme
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Child } from '../types/common';
import childrenApi from '../services/children';

interface BirthdaysCalendarWidgetProps {
  onBirthdaysChange?: () => void;
}

const BirthdaysCalendarWidget: React.FC<BirthdaysCalendarWidgetProps> = ({ onBirthdaysChange }) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Загрузка детей ===
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      setError(null);
      try {
        const childrenList = await childrenApi.getAll();
        setChildren(childrenList);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных');
        console.error('Error fetching children:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // === Получение детей с днями рождения в текущем месяце ===
  const getChildrenWithBirthdays = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start, end });

    return daysInMonth.map((day) => {
      const childrenWithBirthday = children.filter((child) => {
        if (!child.birthday) return false;
        const birth = new Date(child.birthday);
        return (
          birth.getDate() === day.getDate() &&
          birth.getMonth() === day.getMonth()
        );
      });

      return { day, children: childrenWithBirthday };
    });
  };

  // === Расчёт возраста (на следующий день рождения) ===
  const calculateAge = (birthday: string, year: number = new Date().getFullYear()) => {
    const birthDate = new Date(birthday);
    return year - birthDate.getFullYear();
  };

  // === Название группы ===
  const getGroupName = (groupId: any) => {
    if (!groupId) return 'Без группы';
    if (typeof groupId === 'string') return groupId;
    if (typeof groupId === 'object' && groupId.name) return groupId.name;
    return 'Без группы';
  };

  // === Смена месяца ===
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysWithBirthdays = getChildrenWithBirthdays(currentDate);
  const startWeekDay = (startOfMonth(currentDate).getDay() + 6) % 7; // Пн = 0

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        },
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* === Заголовок === */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: '1px solid #dee2e6',
          }}
        >
 
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" sx={{ minWidth: 120, textAlign: 'center' }}>
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </Typography>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* === Ошибка / загрузка === */}
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography>Загрузка...</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* === Заголовки дней недели === */}
            <Grid container spacing={0.5} sx={{ mb: 1 }}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                <Grid item xs={12 / 7} key={index} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* === Календарь === */}
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={0.5}>
                {/* Пустые ячейки в начале месяца */}
                {Array.from({ length: startWeekDay }).map((_, idx) => (
                  <Grid item xs={12 / 7} key={`empty-${idx}`} />
                ))}

                {daysWithBirthdays.map((dayData, index) => {
                  const day = dayData.day;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const hasBirthdays = dayData.children.length > 0;

                  return (
                    <Grid item xs={12 / 7} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          height: 110,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          p: 0.5,
                          backgroundColor: hasBirthdays ? '#e8f5e9' : 'inherit',
                          border: hasBirthdays ? '2px solid #4caf50' : '1px solid #e0e0e0',
                          borderRadius: 1,
                          opacity: isCurrentMonth ? 1 : 0.5,
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
                            color: isSameDay(day, new Date()) ? 'primary.main' : 'inherit',
                            alignSelf: 'flex-start',
                            mb: 0.5,
                          }}
                        >
                          {format(day, 'd')}
                        </Typography>

                        {/* Фото детей */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          {dayData.children.slice(0, 3).map((child) => (
                            <Tooltip
                              key={child._id || child.id}
                              title={
                                <Box>
                                  <Typography variant="body2">{child.fullName}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Группа: {getGroupName(child.groupId)}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Исполнится: {calculateAge(child.birthday as any, currentDate.getFullYear())} лет
                                  </Typography>
                                </Box>
                              }
                              arrow
                            >
                              <Avatar
                                src={child.photo || undefined}
                                alt={child.fullName}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  border: '1px solid white',
                                  fontSize: '0.6rem',
                                  mb: 0.3,
                                }}
                              >
                                {!child.photo && child.fullName?.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}

                          {dayData.children.length > 3 && (
                            <Chip
                              label={`+${dayData.children.length - 3}`}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.5rem',
                                minWidth: 16,
                                mt: 0.5,
                              }}
                            />
                          )}
                        </Box>

                        {/* Индикатор 🎂 */}
                        {hasBirthdays && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              left: 0,
                              right: 0,
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6rem',
                                color: '#4caf50',
                                fontWeight: 'bold',
                              }}
                            >
                              🎂
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* === Легенда === */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>А</Avatar>
                <Typography variant="caption">День рождения</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdaysCalendarWidget;
