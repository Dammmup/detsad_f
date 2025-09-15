import React, { useEffect, useState } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, 
  Checkbox, Button, CircularProgress, Alert, Stack, TextField, Pagination, ToggleButton, ToggleButtonGroup,
  Card, CardContent, Grid, Chip, Avatar, Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ViewList, ViewModule, Save, Download, Person, CheckCircle, Cancel, GridOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ruLocale from 'date-fns/locale/ru';
import * as XLSX from 'xlsx';
import { getGroups } from '../components/services/api/groups';
import { getUsers, User } from '../components/services/api/users';
import { useAuth } from '../components/context/AuthContext';
import { saveChildAttendance } from '../components/services/api/childAttendance';

interface AttendanceMark {
  [userId: string]: boolean;
}

const ChildrenAttendanceImproved: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceMark>({});
  const [comments, setComments] = useState<{[userId: string]: string}>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const navigate = useNavigate();

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'assistant';

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !currentUser || authLoading) {
        return;
      }
      
      setLoading(true);
      try {
        console.log('Loading groups and users for attendance...');
        const [groupList, userList] = await Promise.all([
          getGroups(),
          getUsers()
        ]);
        
        setGroups(groupList || []);
        const childrenList = userList.filter(u => u.type === 'child');
        setChildren(childrenList);
        
        console.log('[ATTENDANCE] Groups loaded:', groupList?.length || 0);
        console.log('[ATTENDANCE] Children loaded:', childrenList.length);
        
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

  // Pagination
  const totalPages = Math.ceil(filteredChildren.length / rowsPerPage);
  const paginatedChildren = filteredChildren.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleAttendanceChange = (userId: string, present: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [userId]: present
    }));
  };

  const handleCommentChange = (userId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [userId]: comment
    }));
  };

  const handleSave = async () => {
    if (!selectedGroup) {
      alert('Выберите группу для сохранения');
      return;
    }

    setSaving(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const savePromises = [];
      
      // Save attendance for each child
      for (const childId of Object.keys(attendance)) {
        if (attendance[childId] !== undefined) {
          savePromises.push(
            saveChildAttendance({
              childId,
              groupId: selectedGroup,
              date: dateString,
              status: attendance[childId] ? 'present' : 'absent',
              notes: comments[childId] || undefined
            })
          );
        }
      }
      
      if (savePromises.length === 0) {
        alert('Нет данных для сохранения');
        return;
      }

      await Promise.all(savePromises);
      alert(`Посещаемость сохранена успешно! Обновлено ${savePromises.length} записей.`);
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
    const dateStr = selectedDate.toLocaleDateString('ru-RU');
    
    // Создаем данные для экспорта
    const exportData = [];
    
    // Добавляем заголовок с названием группы
    exportData.push({
      'Имя': `Посещаемость группы "${selectedGroupName}" на ${dateStr}`
    });
    
    // Пустая строка
    exportData.push({});
    
    // Заголовки столбцов
    exportData.push({
      'Имя': 'Имя ребенка',
      'Присутствует': 'Присутствует',
      'Комментарий': 'Комментарий'
    });
    
    // Данные по детям
    filteredChildren.forEach(child => {
      exportData.push({
        'Имя': child.fullName,
        'Присутствует': attendance[child.id as string] ? 'Да' : 'Нет',
        'Комментарий': comments[child.id as string] || ''
      });
    });
    
    // Статистика
    exportData.push({});
    const presentCount = Object.values(attendance).filter(Boolean).length;
    exportData.push({
      'Имя': 'Статистика:'
    });
    exportData.push({
      'Имя': `Всего детей: ${filteredChildren.length}`
    });
    exportData.push({
      'Имя': `Присутствует: ${presentCount}`
    });
    exportData.push({
      'Имя': `Отсутствует: ${filteredChildren.length - presentCount}`
    });
    exportData.push({
      'Имя': `Процент посещаемости: ${filteredChildren.length > 0 ? Math.round((presentCount / filteredChildren.length) * 100) : 0}%`
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: true });
    
    // Настраиваем ширину столбцов
    ws['!cols'] = [
      { wch: 25 }, // Имя
      { wch: 15 }, // Присутствует
      { wch: 30 }  // Комментарий
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Посещаемость');
    
    const fileName = `Посещаемость_${selectedGroupName}_${selectedDate.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const renderTableView = () => (
    <Paper sx={{ mt: 2, height: '60vh', overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Ребенок</TableCell>
            <TableCell>Группа</TableCell>
            <TableCell align="center">Присутствует</TableCell>
            <TableCell>Комментарий</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedChildren.map((child) => (
            <TableRow key={child.id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {child.fullName.charAt(0)}
                  </Avatar>
                  {child.fullName}
                </Box>
              </TableCell>
              <TableCell>
                {groups.find(g => g.id === child.groupId)?.name || '-'}
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={attendance[child.id as string] || false}
                  onChange={(e) => handleAttendanceChange(child.id as string, e.target.checked)}
                  color="primary"
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Комментарий..."
                  value={comments[child.id   as string] || ''}
                  onChange={(e) => handleCommentChange(child.id as string, e.target.value)}
                  fullWidth
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  const renderListView = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {paginatedChildren.map((child) => (
        <Grid item xs={12} sm={6} md={4} key={child.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {child.fullName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{child.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {groups.find(g => g.id === child.groupId)?.name || '-'}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Checkbox
                  checked={attendance[child.id as string] || false}
                  onChange={(e) => handleAttendanceChange(child.id as string, e.target.checked)}
                  color="primary"
                />
                <Chip
                  icon={attendance[child.id as string] ? <CheckCircle /> : <Cancel />}
                  label={attendance[child.id as string] ? 'Присутствует' : 'Отсутствует'}
                  color={attendance[child.id as string] ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <TextField
                size="small"
                placeholder="Комментарий..."
                value={comments[child.id as string] || ''}
                onChange={(e) => handleCommentChange(child.id as string, e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

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
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Посещаемость детей
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Дата"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date || new Date())}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
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
            </Grid>

            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="table">
                    <ViewList />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ViewModule />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant="outlined"
                  startIcon={<GridOn />}
                  onClick={() => navigate('/app/children/attendance-grid')}
                  size="small"
                >
                  Сетка
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                >
                  Экспорт
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">Всего детей</Typography>
                <Typography variant="h4">{filteredChildren.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">Присутствуют</Typography>
                <Typography variant="h4">
                  {Object.values(attendance).filter(Boolean).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">Отсутствуют</Typography>
                <Typography variant="h4">
                  {filteredChildren.length - Object.values(attendance).filter(Boolean).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">Процент</Typography>
                <Typography variant="h4">
                  {filteredChildren.length > 0 
                    ? Math.round((Object.values(attendance).filter(Boolean).length / filteredChildren.length) * 100)
                    : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content */}
        {viewMode === 'table' ? renderTableView() : renderListView()}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ChildrenAttendanceImproved;
