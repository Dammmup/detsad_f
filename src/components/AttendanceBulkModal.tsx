import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  Grid,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import childrenApi, { Child } from '../services/children';
import { bulkSaveChildAttendance } from '../services/childAttendance';

interface AttendanceBulkModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess: () => void;
}

const ATTENDANCE_STATUSES = {
  present: 'Присутствует',
  absent: 'Отсутствует',
  sick: 'Болеет',
  vacation: 'Отпуск',
} as const;

type AttendanceStatus = keyof typeof ATTENDANCE_STATUSES;

const AttendanceBulkModal: React.FC<AttendanceBulkModalProps> = ({
  open,
  onClose,
  groupId,
  onSuccess,
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>('present');
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fetchChildren = useCallback(async () => {
    try {
      const childrenList = await childrenApi.getAll();
      const filteredChildren = childrenList.filter((child) => {
        if (typeof child.groupId === 'object' && child.groupId !== null) {
          return (
            (child.groupId as any)._id === groupId ||
            (child.groupId as any).id === groupId
          );
        } else {
          return child.groupId === groupId;
        }
      });
      setChildren(filteredChildren);
      setSelectedChildren(filteredChildren.map((child) => child.id!));
    } catch (err: any) {
      setError('Не удалось загрузить список детей');
      console.error('Error fetching children:', err);
    }
  }, [groupId]);
  useEffect(() => {
    if (open && groupId) {
      fetchChildren();
    }
  }, [open, groupId]);

  const handleChildToggle = (childId: string) => {
    if (selectedChildren.includes(childId)) {
      setSelectedChildren(selectedChildren.filter((id) => id !== childId));
    } else {
      setSelectedChildren([...selectedChildren, childId]);
    }
  };

  const handleSelectAllChildren = () => {
    if (selectedChildren.length === children.length) {
      setSelectedChildren([]);
    } else {
      setSelectedChildren(children.map((child) => child.id!));
    }
  };

  const handleDateRangeChange = () => {
    if (dateRange.start && dateRange.end) {
      const dates: Date[] = [];
      const currentDate = new Date(dateRange.start);

      while (currentDate <= dateRange.end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setSelectedDates(dates);
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<AttendanceStatus>) => {
    setSelectedStatus(e.target.value as AttendanceStatus);
  };

  const handleSave = async () => {
    if (selectedChildren.length === 0 || selectedDates.length === 0) {
      setError('Пожалуйста, выберите детей и даты');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const records = selectedChildren.flatMap((childId) => {
        return selectedDates.map((date) => {
          return {
            childId,
            date: date.toISOString().split('T')[0],
            status: selectedStatus,
            notes: notes || undefined,
          };
        });
      });

      await bulkSaveChildAttendance(records, groupId);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении посещаемости');
      console.error('Error saving bulk attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedChildren([]);
    setSelectedDates([]);
    setDateRange({ start: null, end: null });
    setSelectedStatus('present');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1.5rem',
        }}
      >
        Массовое назначение посещаемости
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <DatePicker<Date>
                label='Начальная дата'
                value={dateRange.start}
                onChange={(newValue: Date | null) =>
                  setDateRange({ ...dateRange, start: newValue })
                }
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker<Date>
                label='Конечная дата'
                value={dateRange.end}
                onChange={(newValue: Date | null) =>
                  setDateRange({ ...dateRange, end: newValue })
                }
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </Grid>

          <Button
            onClick={handleDateRangeChange}
            variant='outlined'
            sx={{ mb: 2 }}
            disabled={!dateRange.start || !dateRange.end}
          >
            Применить диапазон дат
          </Button>

          <Box sx={{ mb: 3 }}>
            <Typography variant='h6' sx={{ mb: 1 }}>
              Выбранные даты:
            </Typography>
            {selectedDates.length > 0 ? (
              <Box
                sx={{
                  maxHeight: 150,
                  overflow: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {selectedDates.map((date, index) => (
                  <Typography key={index} variant='body2'>
                    {date.toLocaleDateString('ru-RU')}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Даты не выбраны
              </Typography>
            )}
          </Box>
        </LocalizationProvider>

        <FormControl fullWidth margin='dense' sx={{ mb: 2 }}>
          <InputLabel>Статус посещаемости</InputLabel>
          <Select
            value={selectedStatus}
            onChange={handleStatusChange}
            label='Статус посещаемости'
            variant='outlined'
          >
            {Object.entries(ATTENDANCE_STATUSES).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin='dense'
          label='Примечания'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
          variant='outlined'
        />

        <Box sx={{ mb: 2 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            sx={{ mb: 1 }}
          >
            <Typography variant='h6'>Дети</Typography>
            <Button onClick={handleSelectAllChildren} size='small'>
              {selectedChildren.length === children.length
                ? 'Снять выделение'
                : 'Выделить всех'}
            </Button>
          </Box>

          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid #ccc',
              borderRadius: 1,
              p: 1,
            }}
          >
            {children.map((child) => (
              <Box
                key={child.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.5,
                  borderBottom: '1px solid #eee',
                }}
              >
                <Checkbox
                  checked={selectedChildren.includes(child.id!)}
                  onChange={() => handleChildToggle(child.id!)}
                />
                <ListItemText primary={child.fullName} />
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          p: 2,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: '#6c757d',
            '&:hover': {
              backgroundColor: '#e9ecef',
            },
          }}
        >
          Отмена
        </Button>

        <Button
          onClick={handleSave}
          variant='contained'
          disabled={
            loading ||
            selectedChildren.length === 0 ||
            selectedDates.length === 0
          }
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '10px 24px',
            borderRadius: '25px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Сохранить'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceBulkModal;
