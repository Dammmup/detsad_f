import React, { useEffect, useState } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, 
   Button, CircularProgress, Alert, Paper, IconButton, Tooltip, Card, CardContent, TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Save, Download, Person, CheckCircle, Cancel, CalendarToday } from '@mui/icons-material';
import ruLocale from 'date-fns/locale/ru';
import * as XLSX from 'xlsx';
import { getGroups } from '../components/services/api/groups';
import { getUsers, User } from '../components/services/api/users';
import { useAuth } from '../components/context/AuthContext';
import { 
  bulkSaveChildAttendance, 
  getChildAttendance, 
  convertGridToBulkRecords,
  ChildAttendanceRecord 
} from '../components/services/api/childAttendance';
import { exportChildrenAttendance, getCurrentPeriod } from '../components/services/api/excelExport';
import ExportMenuButton from '../components/ExportMenuButton';
import axios from 'axios';

interface AttendanceGridi {
  [childId: string]: {
    [date: string]: boolean;
  };
}

const AttendanceGrid: React.FC = () => {
  // Экспорт: скачать файл
  const handleExportDownload = () => {
    // records — массив ChildAttendanceRecord, который нужно получить из convertGridToBulkRecords
    const records = convertGridToBulkRecords(attendance, comments);
    const groupLabel = groups.find(g => (g.id || g._id) === selectedGroup)?.name || 'Неизвестная группа';
    exportChildrenAttendance(records, groupLabel, getCurrentPeriod());
  };



  // Экспорт: отправить на email
  const handleExportEmail = async () => {
    try {
      await axios.post('/exports/children-attendance', { action: 'email' });
      alert('Документ отправлен на почту администратора');
    } catch (e) {
      alert('Ошибка отправки на почту');
    }
  };


  const [groups, setGroups] = useState<any[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceGridi>({});
  const [comments, setComments] = useState<{[childId: string]: {[date: string]: string}}>({});
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const authContext: any = useAuth();
  const currentUser = authContext?.user;
  const isLoggedIn = authContext?.isLoggedIn;
  const authLoading = authContext?.loading;
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'assistant';

  // Генерируем дни месяца
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const fullDate = new Date(year, month, day);
      return {
        day,
        date: fullDate,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isWeekend: fullDate.getDay() === 0 || fullDate.getDay() === 6,
        isToday: fullDate.toDateString() === new Date().toDateString()
      };
    });
  };

  const monthDays = getDaysInMonth(selectedMonth);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !currentUser || authLoading) {
        return;
      }
      
      setLoading(true);
      try {
        console.log('Loading groups and users for attendance grid...');
        const [groupList, userList] = await Promise.all([
          getGroups(),
          getUsers()
        ]);
        
        setGroups(groupList || []);
        const childrenList = userList.filter(u => u.type === 'child');
        setChildren(childrenList);
        
        // Auto-select group for teachers
        if (!isAdmin && isTeacher && groupList?.length > 0) {
          const myGroup = groupList.find(g => g.teacher === currentUser.id);
          if (myGroup) {
            setSelectedGroup(myGroup.id as string || myGroup._id as string);
          }
        }
        
        setError(null);
      } catch (e: any) {
        console.error('Error loading attendance data:', e);
        setError(e?.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isLoggedIn, currentUser, authLoading]);

  // Filter children by selected group
  const filteredChildren = selectedGroup 
    ? children.filter(child => child.groupId === selectedGroup)
    : children;

  // Load existing attendance data when group or month changes
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!selectedGroup || !filteredChildren.length) {
        setAttendance({});
        setComments({});
        return;
      }

      setLoadingAttendance(true);
      try {
        const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        
        const records = await getChildAttendance({
          groupId: selectedGroup,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        // Convert records to grid format
        const attendanceGrid1: AttendanceGridi = {};
        const commentsGrid1: {[childId: string]: {[date: string]: string}} = {};
        
        records.forEach((record: ChildAttendanceRecord) => {
          const childId = record.childId;
          const date = record.date.split('T')[0]; // Get date part only
          
          if (!attendanceGrid1[childId]) {
            attendanceGrid1[childId] = {};
          }
          if (!commentsGrid1[childId]) {
            commentsGrid1[childId] = {};
          }
          
          attendanceGrid1[childId][date] = record.status === 'present';
          if (record.notes) {
            commentsGrid1[childId][date] = record.notes;
          }
        });
        
        setAttendance(attendanceGrid1);
        setComments(commentsGrid1);
      } catch (error: any) {
        console.error('Error loading attendance data:', error);
        setError('Ошибка загрузки данных посещаемости: ' + error.message);
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadAttendanceData();
  }, [selectedGroup, selectedMonth, filteredChildren.length]);

  const handleAttendanceToggle = (childId: string, dateString: string) => {
    setAttendance(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [dateString]: !prev[childId]?.[dateString]
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedGroup) {
      alert('Выберите группу для сохранения');
      return;
    }

    setSaving(true);
    try {
      // Convert grid format to bulk records
      const records = convertGridToBulkRecords(attendance, comments);
      
      if (records.length === 0) {
        alert('Нет данных для сохранения');
        return;
      }

      const result = await bulkSaveChildAttendance(records, selectedGroup);
      
      if (result.errorCount > 0) {
        console.warn('Some records failed to save:', result.errors);
        alert(`Сохранено ${result.success} записей. Ошибок: ${result.errorCount}`);
      } else {
        alert(`Посещаемость сохранена успешно! Обновлено ${result.success} записей.`);
      }
    } catch (e: any) {
      console.error('Error saving attendance:', e);
      alert('Ошибка сохранения: ' + (e?.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!selectedGroup) {
      alert('Выберите группу для экспорта');
      return;
    }

    const selectedGroupName = groups.find(g => (g.id || g._id) === selectedGroup)?.name || 'Неизвестная группа';
    const monthYear = selectedMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    
    // Создаем данные для экспорта
    const exportData = [];
    
    // Добавляем заголовок с названием группы
    const headerRow: any = {};
    headerRow['Ребенок'] = `Посещаемость группы "${selectedGroupName}" - ${monthYear}`;
    exportData.push(headerRow);
    
    // Пустая строка для разделения
    exportData.push({});
    
    // Заголовки столбцов
    const columnHeaders: any = {
      'Ребенок': 'Имя ребенка'
    };
    monthDays.forEach(day => {
      columnHeaders[`${day.day}`] = `${day.day}`;
    });
    exportData.push(columnHeaders);
    
    // Данные по детям
    filteredChildren.forEach(child => {
      const row: any = {
        'Ребенок': child.fullName
      };
      
      monthDays.forEach(day => {
        const isPresent = attendance[child.id as string]?.[day.dateString];
        row[`${day.day}`] = isPresent ? '✓' : (isPresent === false ? '✗' : '-');
      });
      
      exportData.push(row);
    });
    
    // Статистика
    exportData.push({});
    const stats = getAttendanceStats();
    exportData.push({
      'Ребенок': 'Статистика:'
    });
    exportData.push({
      'Ребенок': `Всего детей: ${filteredChildren.length}`
    });
    exportData.push({
      'Ребенок': `Посещений: ${stats.totalPresent}`
    });
    exportData.push({
      'Ребенок': `Процент посещаемости: ${stats.percentage}%`
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: true });
    
    // Настраиваем ширину столбцов
    const colWidths = [{ wch: 25 }]; // Столбец с именами
    monthDays.forEach(() => colWidths.push({ wch: 4 })); // Столбцы с днями
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Посещаемость');
    
    const fileName = `Посещаемость_${selectedGroupName}_${selectedMonth.toISOString().slice(0, 7)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getAttendanceStats = () => {
    let totalPresent = 0;
    let totalPossible = 0;
    
    filteredChildren.forEach(child => {
      monthDays.forEach(day => {
        if (!day.isWeekend) { // Считаем только рабочие дни
          totalPossible++;
          if (attendance[child.id as string]?.[day.dateString]) {
            totalPresent++;
          }
        }
      });
    });
    
    return {
      totalPresent,
      totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0
    };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
          Сетка посещаемости
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <DatePicker
              label="Месяц"
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || new Date())}
              views={['year', 'month']}
              renderInput={(params) => <TextField {...params} />}
            />
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Группа</InputLabel>
              <Select
                value={selectedGroup}
                label="Группа"
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <MenuItem value="">Все группы</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id || group._id} value={group.id || group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            
            <Box mb={2}>
              <ExportMenuButton
                onDownload={handleExportDownload}
                onSendEmail={handleExportEmail}
                label="Экспортировать табель"
              />
            </Box>
          </Box>
        </Paper>

        {/* Statistics */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={4}>
              <Box>
                <Typography variant="h6" color="primary">Всего детей</Typography>
                <Typography variant="h4">{filteredChildren.length}</Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="success.main">Посещений</Typography>
                <Typography variant="h4">{stats.totalPresent}</Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="info.main">Процент</Typography>
                <Typography variant="h4">{stats.percentage}%</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Attendance Grid */}
        <Paper sx={{ height: '70vh', overflow: 'auto', position: 'relative' }}>
          {loadingAttendance && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    position: 'sticky', 
                    left: 0, 
                    backgroundColor: 'background.paper',
                    zIndex: 2,
                    minWidth: 200
                  }}
                >
                  Ребенок
                </TableCell>
                {monthDays.map((day) => (
                  <TableCell 
                    key={day.day}
                    align="center"
                    sx={{
                      minWidth: 40,
                      backgroundColor: day.isWeekend ? 'action.hover' : 'inherit',
                      color: day.isToday ? 'primary.main' : 'inherit',
                      fontWeight: day.isToday ? 'bold' : 'normal'
                    }}
                  >
                    <Box>
                      <Typography variant="body2">{day.day}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChildren.map((child) => (
                <TableRow key={child.id} hover>
                  <TableCell 
                    sx={{ 
                      position: 'sticky', 
                      left: 0, 
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{child.fullName}</Typography>
                    </Box>
                  </TableCell>
                  {monthDays.map((day) => {
                    const isPresent = attendance[child.id as string]?.[day.dateString];
                    return (
                      <TableCell 
                        key={day.day} 
                        align="center"
                        sx={{
                          backgroundColor: day.isWeekend ? 'action.hover' : 'inherit',
                          cursor: day.isWeekend ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {day.isWeekend ? (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        ) : (
                          <Tooltip title={`${child.fullName} - ${day.date.toLocaleDateString('ru-RU')}`}>
                            <IconButton
                              size="small"
                              onClick={() => handleAttendanceToggle(child.id as string, day.dateString)}
                              color={isPresent ? 'success' : 'default'}
                            >
                              {isPresent ? <CheckCircle /> : <Cancel />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {filteredChildren.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Выберите группу для отображения детей
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceGrid;

