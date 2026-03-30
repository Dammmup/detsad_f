import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { CalendarEvent, CalendarEventType, CalendarEventCreate } from '../../../shared/types/calendar';
import moment from 'moment';

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEventCreate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
}

const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  event,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEventType>('event');
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setType(event.type);
      setDate(moment(event.date).format('YYYY-MM-DD'));
    } else if (selectedDate) {
      setTitle('');
      setDescription('');
      setType('event');
      setDate(moment(selectedDate).format('YYYY-MM-DD'));
    }
  }, [event, selectedDate, open]);

  const handleSave = async () => {
    if (!title || !date) return;

    setLoading(true);
    try {
      await onSave({
        title,
        description,
        type,
        date,
      });
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?._id && !event?.id) return;
    
    setLoading(true);
    try {
      if (onDelete) {
        await onDelete(event._id || event.id || '');
      }
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {event ? 'Редактировать событие' : 'Добавить событие'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Тип"
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEventType)}
            >
              <MenuItem value="event">Мероприятие</MenuItem>
              <MenuItem value="holiday">Праздник (выходной)</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Описание"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          {event && onDelete && (
            <Button color="error" onClick={handleDelete} disabled={loading}>
              Удалить
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !title || !date}
          >
            Сохранить
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
