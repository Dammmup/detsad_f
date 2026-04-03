import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  ClickAwayListener,
  Chip,
  Paper,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ru';
import { useDate } from '../../../app/context/DateContext';
import { useAuth } from '../../../app/context/AuthContext';
import { Child } from '../../../shared/types/common';
import { CalendarEvent, CalendarEventCreate } from '../../../shared/types/calendar';
import childrenApi from '../../children/services/children';
import calendarEventsApi from '../services/calendarEvents';
import { getKindergartenSettings, KindergartenSettings } from '../../settings/services/settings';
import EventDialog from './EventDialog';

moment.locale('ru');

interface BirthdayAvatarProps {
  child: Child;
  currentYear: number;
}

const BirthdayAvatar: React.FC<BirthdayAvatarProps> = React.memo(({
  child,
  currentYear,
}) => {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  const getGroupName = (groupId: any) => {
    if (!groupId) return 'Без группы';
    if (typeof groupId === 'string') return groupId;
    if (typeof groupId === 'object' && groupId.name) return groupId.name;
    return 'Без группы';
  };

  const calculateAge = (birthday: string, year: number) => {
    const birthDate = moment(birthday);
    return year - birthDate.year();
  };

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div style={{ display: 'inline-block' }}>
        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={
            <Box>
              <Typography variant='body2'>{child.fullName}</Typography>
              <Typography variant='caption'>
                Группа: {getGroupName(child.groupId)}
              </Typography>
              <br />
              <Typography variant='caption' >
                Исполнится: {calculateAge(child.birthday as any, currentYear)}{' '}
                лет
              </Typography>
            </Box>
          }
          arrow
        >
          <Avatar
            onClick={(e) => {
              e.stopPropagation();
              handleTooltipOpen();
            }}
            src={child.photo || undefined}
            alt={child.fullName}
            sx={{
              width: 24,
              height: 24,
              border: '1px solid white',
              fontSize: '0.6rem',
              mb: 0.3,
              cursor: 'pointer',
            }}
          >
            {!child.photo && child.fullName?.charAt(0)}
          </Avatar>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
});

interface BirthdaysCalendarWidgetProps {
  onBirthdaysChange?: () => void;
}

const BirthdaysCalendarWidget: React.FC<BirthdaysCalendarWidgetProps> = React.memo(() => {
  const { currentDate } = useDate();
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<KindergartenSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние для диалога
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const canManageEvents = user?.role === 'admin' || user?.role === 'manager';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startOfMonth = moment(currentDate).startOf('month').toISOString();
      const endOfMonth = moment(currentDate).endOf('month').toISOString();

      const [childrenList, eventsList, settingsData] = await Promise.all([
        childrenApi.getAll(),
        calendarEventsApi.getAll({ startDate: startOfMonth, endDate: endOfMonth }),
        getKindergartenSettings()
      ]);

      setChildren(childrenList);
      setCalendarEvents(eventsList);
      setSettings(settingsData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daysData = useMemo(() => {
    const start = moment(currentDate).startOf('month');
    const end = moment(currentDate).endOf('month');
    const daysInMonth: Date[] = [];

    let dayTemp = start.clone();
    while (dayTemp.isSameOrBefore(end)) {
      daysInMonth.push(dayTemp.toDate());
      dayTemp.add(1, 'day');
    }

    return daysInMonth.map((dayDate) => {
      const currentDayMoment = moment(dayDate);
      const dayStr = currentDayMoment.format('YYYY-MM-DD');

      // Дети с днем рождения
      const childrenWithBirthday = Array.isArray(children) ? children.filter((child) => {
        if (!child.birthday) return false;
        const birth = moment(child.birthday);
        return (
          birth.date() === currentDayMoment.date() &&
          birth.month() === currentDayMoment.month()
        );
      }) : [];

      // События этого дня
      const dayEvents = Array.isArray(calendarEvents) ? calendarEvents.filter(e => 
        moment(e.date).isSame(currentDayMoment, 'day')
      ) : [];

      // Проверка на выходной/праздник
      // 0 - Пн, 1 - Вт... 5 - Сб, 6 - Вс в ISO. Moment.js: 1 - Пн... 7 - Вс (isoWeekday)
      const dayOfWeek = currentDayMoment.isoWeekday().toString(); // "1" - "7"
      
      // Если настройки еще не загружены или список рабочих дней пуст, используем стандарт Пн-Пт (1-5)
      const workingDays = settings?.workingDays?.length ? settings.workingDays : ['1', '2', '3', '4', '5'];
      const isWeekend = !workingDays.includes(dayOfWeek);
      
      const isHolidayInSettings = settings?.holidays?.includes(dayStr);
      const isManualHoliday = dayEvents.some(e => e.type === 'holiday');

      return { 
        day: dayDate, 
        children: childrenWithBirthday,
        events: dayEvents,
        isNonWorkingDay: isWeekend || isHolidayInSettings || isManualHoliday
      };
    });
  }, [children, calendarEvents, settings, currentDate]);

  const startWeekDay = useMemo(() => (moment(currentDate).startOf('month').day() + 6) % 7, [currentDate]);

  const handleDayClick = (dayDate: Date, existingEvent?: CalendarEvent) => {
    if (!canManageEvents) return;
    
    if (existingEvent) {
      setSelectedEvent(existingEvent);
      setSelectedDate(null);
    } else {
      setSelectedEvent(null);
      setSelectedDate(dayDate);
    }
    setDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: CalendarEventCreate) => {
    try {
      if (selectedEvent) {
        await calendarEventsApi.update(selectedEvent._id || selectedEvent.id!, eventData);
      } else {
        await calendarEventsApi.create(eventData);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await calendarEventsApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

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
      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}
      >
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Календарь событий
          </Typography>
        </Box>

        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography color='error'>{error}</Typography>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography>Загрузка...</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={0.5} sx={{ mb: 1 }}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                <Grid item xs={12 / 7} key={index} sx={{ textAlign: 'center' }}>
                  <Typography variant='caption' color='textSecondary' sx={{ fontWeight: 'bold' }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={0.5}>
                {Array.from({ length: startWeekDay }).map((_, idx) => (
                  <Grid item xs={12 / 7} key={`empty-${idx}`} />
                ))}

                {daysData.map((dayData, index) => {
                  const day = dayData.day;
                  const isCurrentMonth = moment(day).isSame(currentDate, 'month');
                  const hasBirthdays = dayData.children.length > 0;
                  const isToday = moment(day).isSame(new Date(), 'day');
                  const isNonWorking = dayData.isNonWorkingDay;
                  const dayEvents = dayData.events;

                  return (
                    <Grid item xs={12 / 7} key={index}>
                      <Paper
                        elevation={0}
                        onClick={() => handleDayClick(day)}
                        sx={{
                          height: 120,
                          display: 'flex',
                          flexDirection: 'column',
                          p: 0.5,
                          backgroundColor: isNonWorking ? '#ffebee' : (hasBirthdays ? '#e8f5e9' : 'inherit'),
                          border: isToday ? '2px solid #1976d2' : '1px solid #f0f0f0',
                          borderRadius: 1,
                          opacity: isCurrentMonth ? 1 : 0.4,
                          position: 'relative',
                          cursor: canManageEvents ? 'pointer' : 'default',
                          '&:hover': canManageEvents ? {
                            backgroundColor: isNonWorking ? '#ffcdd2' : '#f5f5f5',
                            borderColor: 'primary.main'
                          } : {}
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            variant='caption'
                            sx={{
                              fontWeight: isToday ? 'bold' : 'normal',
                              color: isNonWorking ? '#d32f2f' : (isToday ? 'primary.main' : 'inherit'),
                            }}
                          >
                            {moment(day).format('D')}
                          </Typography>
                          
                          {canManageEvents && !dayEvents.length && (
                            <AddIcon sx={{ fontSize: 14, opacity: 0, '.MuiPaper-root:hover &': { opacity: 0.5 } }} />
                          )}
                        </Box>

                        {/* Праздники и события */}
                        <Box sx={{ mt: 0.5, mb: 0.5, width: '100%', overflow: 'hidden' }}>
                          {dayEvents.map((evt) => (
                            <Tooltip key={evt._id || evt.id} title={evt.title}>
                              <Box
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDayClick(day, evt);
                                }}
                                sx={{
                                  backgroundColor: evt.type === 'holiday' ? '#ef5350' : '#42a5f5',
                                  color: 'white',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  fontSize: '0.65rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  mb: 0.2,
                                  cursor: 'pointer'
                                }}
                              >
                                {evt.title}
                              </Box>
                            </Tooltip>
                          ))}
                        </Box>

                        {/* Фото именинников */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.2,
                            justifyContent: 'center'
                          }}
                        >
                          {dayData.children.slice(0, 4).map((child) => (
                            <BirthdayAvatar
                              key={child._id || child.id}
                              child={child}
                              currentYear={currentDate.getFullYear()}
                            />
                          ))}
                          {dayData.children.length > 4 && (
                            <Typography sx={{ fontSize: '0.6rem' }}>
                              +{dayData.children.length - 4}
                            </Typography>
                          )}
                        </Box>

                        {/* Индикатор торта */}
                        {hasBirthdays && (
                          <Box sx={{ position: 'absolute', bottom: 1, right: 2 }}>
                            <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>🎂</Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Box>
        )}
      </CardContent>

      <EventDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={selectedDate}
      />
    </Card>
  );
});

export default BirthdaysCalendarWidget;
