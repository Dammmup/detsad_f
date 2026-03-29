import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Sick as SickIcon,
  BeachAccess as VacationIcon,
  Schedule as LateIcon,
} from '@mui/icons-material';
import { getChildAttendance } from '../services/childAttendance';

interface ChildAttendanceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  groupId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  present: { label: 'Присутствовал', color: 'success', icon: <PresentIcon /> },
  absent: { label: 'Отсутствовал', color: 'error', icon: <AbsentIcon /> },
  sick: { label: 'Болел', color: 'warning', icon: <SickIcon /> },
  vacation: { label: 'Отпуск', color: 'info', icon: <VacationIcon /> },
  late: { label: 'Опоздание', color: 'warning', icon: <LateIcon /> },
};

const ChildAttendanceDetailsDialog: React.FC<ChildAttendanceDetailsDialogProps> = ({
  open,
  onClose,
  childId,
  childName,
  groupId,
}) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && childId) {
      loadAttendance();
    }
  }, [open, childId]);

  const loadAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const data = await getChildAttendance({
        childId,
        startDate: startDateStr,
        endDate,
      });

      const sortedRecords = (data || []).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecords(sortedRecords);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    sick: records.filter(r => r.status === 'sick').length,
    vacation: records.filter(r => r.status === 'vacation').length,
    late: records.filter(r => r.status === 'late').length,
  };

  const attendanceRate = stats.total > 0 
    ? Math.round((stats.present / stats.total) * 100) 
    : 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Посещаемость</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {childName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box py={4} textAlign="center">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
              <Chip 
                icon={<PresentIcon />} 
                label={`Присутствовал: ${stats.present}`} 
                color="success" 
                variant="outlined"
              />
              <Chip 
                icon={<AbsentIcon />} 
                label={`Отсутствовал: ${stats.absent}`} 
                color="error" 
                variant="outlined"
              />
              <Chip 
                icon={<SickIcon />} 
                label={`Болел: ${stats.sick}`} 
                color="warning" 
                variant="outlined"
              />
              <Chip 
                icon={<VacationIcon />} 
                label={`Отпуск: ${stats.vacation}`} 
                color="info" 
                variant="outlined"
              />
              <Chip 
                label={`Посещаемость: ${attendanceRate}%`}
                color={attendanceRate >= 80 ? 'success' : attendanceRate >= 50 ? 'warning' : 'error'}
                variant="filled"
              />
            </Box>

            {records.length === 0 ? (
              <Box py={4} textAlign="center">
                <Typography color="textSecondary">
                  Нет данных о посещаемости за последние 30 дней
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Дата</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>День недели</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Время</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Примечания</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => {
                    const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.absent;
                    const date = new Date(record.date);
                    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                    
                    return (
                      <TableRow key={record._id || record.date}>
                        <TableCell>
                          {date.toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          {dayNames[date.getDay()]}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={config.icon as React.ReactElement}
                            label={config.label}
                            color={config.color as any}
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          {record.actualStart && (
                            <Typography variant="body2">
                              {new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              {record.actualEnd && ` - ${new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.notes && (
                            <Typography variant="body2" color="textSecondary">
                              {record.notes}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChildAttendanceDetailsDialog;
