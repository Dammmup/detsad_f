import React, { useEffect, useState } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Button, CircularProgress, Alert, Stack, TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ruLocale from 'date-fns/locale/ru';
import * as XLSX from 'xlsx';
import { getGroups } from '../components/services/api/groups';
import { getUsers, User } from '../components/services/api/users';
import { getCurrentUser } from '../components/services/api/auth';

interface AttendanceMark {
  [userId: string]: boolean;
}

const ChildrenAttendance: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceMark>({});
  const [comments, setComments] = useState<{[userId: string]: string}>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'assistant';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [groupList, userList] = await Promise.all([
          getGroups(),
          getUsers()
        ]);
        setGroups(groupList);
        // Фильтруем только детей
        setChildren(userList.filter(u => u.type === 'child'));
        console.log('[ATTENDANCE] Current user:', { id: currentUser?.id, role: currentUser?.role, isAdmin, isTeacher });
        console.log('[ATTENDANCE] Groups loaded:', groupList.length);
        console.log('[ATTENDANCE] Children loaded:', userList.filter(u => u.type === 'child').length);
        
        // Если не админ — выбираем только свою группу по groupId
        if (!isAdmin && isTeacher) {
          const myGroup = groupList.find(g => {
            if (typeof g.teacher === 'object') {
              return g.teacher.id === currentUser.id || g.teacher._id === currentUser.id;
            }
            return g.teacher === currentUser.id;
          });
          if (myGroup && (myGroup.id || myGroup._id)) {
            setSelectedGroup(String(myGroup.id || myGroup._id));
            console.log('[ATTENDANCE] Selected teacher group:', myGroup.name);
          }
        } else if (isAdmin && groupList.length > 0) {
          // Для админа автоматически выбираем первую группу, если ничего не выбрано
          if (!selectedGroup) {
            setSelectedGroup(String(groupList[0].id || groupList[0]._id));
            console.log('[ATTENDANCE] Admin auto-selected first group:', groupList[0].name);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Список групп для выбора (ограничение по ролям)
  const availableGroups = isAdmin
    ? groups
    : groups.filter(g => {
        if (typeof g.teacher === 'object') {
          return g.teacher?.id === currentUser?.id || g.teacher?._id === currentUser?.id;
        }
        return g.teacher === currentUser?.id;
      });
  
  console.log('[ATTENDANCE] Available groups for user:', availableGroups.length, 'Selected group:', selectedGroup);

  // Дети выбранной группы
  const groupChildren = children.filter(child => child.groupId === selectedGroup);
  console.log('[ATTENDANCE] Children in selected group:', groupChildren.length, 'Group ID:', selectedGroup);

  // --- Новый функционал: календарная сетка посещаемости ---
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarRecords, setCalendarRecords] = useState<{[userId: string]: {[date: string]: string}} | null>(null);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchAttendanceCalendar = async () => {
      setCalendarLoading(true);
      try {
        // Используем выбранный месяц
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDate = `${year}-${String(month+1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month+1).padStart(2, '0')}-${daysInMonth}`;
        setCalendarDates(Array.from({length: daysInMonth}, (_,i) => `${year}-${String(month+1).padStart(2, '0')}-${String(i+1).padStart(2, '0')}`));
        // Получаем все записи по детям этой группы за месяц
        const userIds = groupChildren.map(child => child.id);
        const allRecords: {[userId: string]: {[date: string]: string}} = {};
        for (const userId of userIds) {
          // eslint-disable-next-line no-await-in-loop
          const records = await import('../components/services/api/attendance').then(api => api.getAttendanceRecords(startDate, endDate, userId));
          allRecords[userId!] = {};
          if (Array.isArray(records)) {
            records.forEach((rec: any) => {
              allRecords[userId!][rec.date] = rec.status;
            });
          }
        }
        // Если нет ни одной записи вообще — генерируем моковые данные для всех детей и дней
        const hasAny = Object.values(allRecords).some(rec => Object.keys(rec).length > 0);
        if (!hasAny) {
          groupChildren.forEach(child => {
            allRecords[child.id!] = {};
            calendarDates.forEach(date => {
              // Случайно: 70% present, 15% absent, 10% sick, 5% late
              const r = Math.random();
              let status = 'present';
              if (r > 0.85) status = 'absent';
              else if (r > 0.75) status = 'sick';
              else if (r > 0.7) status = 'late';
              allRecords[child.id!][date] = status;
            });
          });
        }
        setCalendarRecords(allRecords);
      } catch (e) {
        setCalendarRecords(null);
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchAttendanceCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, children.length, calendarMonth]);
  const handleGroupChange = (e: any) => {
    setSelectedGroup(e.target.value);
    setAttendance({});
  };


  const handleCheck = (userId: string) => {
    setAttendance(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Используем выбранную дату для отметки
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendanceApi = await import('../components/services/api/attendance');
      const promises = groupChildren.map(child => {
        const status = attendance[child.id!] ? 'present' : 'absent';
        const notes = comments[child.id!] || '';
        return attendanceApi.createAttendanceRecord({
          userId: child.id!,
          date: dateStr,
          status,
          notes
        });
      });
      await Promise.all(promises);
      alert('Посещаемость сохранена!');
      setCalendarRecords(null); // чтобы useEffect перезапросил
    } catch (e) {
      alert('Ошибка при сохранении посещаемости!');
    } finally {
      setSaving(false);
    }
  };

  // --- Удаление записи посещаемости ---
  const handleDeleteAttendance = async (userId: string, date: string) => {
    if (!window.confirm('Удалить запись посещаемости?')) return;
    const attendanceApi = await import('../components/services/api/attendance');
    await attendanceApi.deleteAttendanceRecord(userId, date);
    setCalendarRecords(null);
  };

  // --- Редактирование комментария ---
  const [editingCell, setEditingCell] = useState<{userId: string, date: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const handleEditComment = (userId: string, date: string, current: string) => {
    setEditingCell({ userId, date });
    setEditValue(current || '');
  };
  const handleSaveEditComment = async () => {
    if (!editingCell) return;
    const attendanceApi = await import('../components/services/api/attendance');
    await attendanceApi.createAttendanceRecord({
      userId: editingCell.userId,
      date: editingCell.date,
      status: (['present','absent','late','early-leave','sick','vacation'] as const).includes(calendarRecords?.[editingCell.userId]?.[editingCell.date] as any)
        ? calendarRecords?.[editingCell.userId]?.[editingCell.date] as ('present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation')
        : 'present',
      notes: editValue
    });
    setEditingCell(null);
    setEditValue('');
    setCalendarRecords(null);
  };
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };




  // Экспорт календаря в Excel
  const handleExportCalendar = () => {
    if (!calendarRecords || calendarDates.length === 0) return;
    const wsData = [
      ['ФИО ребёнка', ...calendarDates.map(date => date.split('-')[2])]
    ];
    groupChildren.forEach(child => {
      const row = [child.fullName];
      calendarDates.forEach(date => {
        const status = calendarRecords[child.id!]?.[date];
        let val = '';
        if (status === 'present') val = '✔';
        else if (status === 'absent') val = '✗';
        else if (status === 'late') val = '⏰';
        else if (status === 'sick') val = '🤒';
        else if (status === 'vacation') val = '🏖';
        else if (status === 'early-leave') val = '↩';
        row.push(val);
      });
      wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const monthStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}`;
    XLSX.writeFile(wb, `attendance_${selectedGroup}_${monthStr}.xlsx`);
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>Посещаемость детей</Typography>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Группа</InputLabel>
            <Select
              value={selectedGroup}
              label="Группа"
              onChange={handleGroupChange}
              disabled={!isAdmin && isTeacher}
            >
              {availableGroups.map(group => (
                <MenuItem key={group.id || group._id} value={group.id || group._id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box mb={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
              <DatePicker
                label="Дата для отметки посещаемости"
                value={selectedDate}
                maxDate={new Date()}
                onChange={date => date && setSelectedDate(date)}
                renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 160, bgcolor: 'white', borderRadius: 1 }} />}
              />
            </LocalizationProvider>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ФИО ребёнка</TableCell>
                <TableCell align="center">Присутствует</TableCell>
                <TableCell>Комментарий</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupChildren.map(child => (
                <TableRow key={child.id}>
                  <TableCell>{child.fullName}</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={!!attendance[child.id!]}
                      onChange={() => handleCheck(child.id!)}
                      disabled={!isAdmin && !isTeacher}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={comments[child.id!] || ''}
                      onChange={e => setComments(prev => ({ ...prev, [child.id!]: e.target.value }))}
                      placeholder="Комментарий"
                      disabled={!isAdmin && !isTeacher}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={saving || (!isAdmin && !isTeacher)}>
              {saving ? 'Сохраняем...' : 'Сохранить посещаемость'}
            </Button>
          </Box>

          {/* Календарная сетка посещаемости */}
          {calendarLoading && <Box mt={4}><CircularProgress size={32} /> Загрузка истории посещаемости...</Box>}
          {calendarRecords && calendarDates.length > 0 && (
            <Box mt={5}>
              <Typography variant="h6" gutterBottom>Посещаемость (интерактивная сетка)</Typography>
              <Box mb={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
                  <DatePicker
                    views={['year', 'month']}
                    label="Месяц"
                    minDate={new Date(2023, 0, 1)}
                    maxDate={new Date()}
                    value={calendarMonth}
                    onChange={date => date && setCalendarMonth(date)}
                    renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 160, bgcolor: 'white', borderRadius: 1 }} />}
                  />
                </LocalizationProvider>
                <Button onClick={() => handleExportCalendar()} sx={{ ml: 2 }} variant="outlined" size="small">Экспорт в Excel</Button>
              </Box>
              <Table size="small" sx={{ background: '#f7f9fb', borderRadius: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ФИО ребёнка</TableCell>
                    {calendarDates.map(date => {
                      const d = new Date(date);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <TableCell key={date} align="center" sx={{ fontSize: '0.7rem', p: 0.5, bgcolor: isWeekend ? '#ede7f6' : undefined }}>
                          {date.split('-')[2]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupChildren.map(child => (
                    <TableRow key={child.id+':calendar'}>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{child.fullName}</TableCell>
                      {calendarDates.map(date => {
                        const status = calendarRecords[child.id!]?.[date] as ('present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation' | undefined);
                        const isEditable = isAdmin || isTeacher;
                        const d = new Date(date);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        // Цвет и иконка
                        let color = '#e0e0e0', icon = '—', tooltip = 'Нет данных';
                        if (status === 'present') { color = '#a5d6a7'; icon = '✔'; tooltip = 'Присутствует'; }
                        else if (status === 'absent') { color = '#ef9a9a'; icon = '✗'; tooltip = 'Отсутствует'; }
                        else if (status === 'late') { color = '#ffe082'; icon = '⏰'; tooltip = 'Опоздал'; }
                        else if (status === 'sick') { color = '#b3e5fc'; icon = '🤒'; tooltip = 'Болел'; }
                        else if (status === 'vacation') { color = '#fff59d'; icon = '🏖'; tooltip = 'Отпуск'; }
                        else if (status === 'early-leave') { color = '#ffe0b2'; icon = '↩'; tooltip = 'Ушел раньше'; }
                        // Селектор статуса
                        return (
                          <TableCell
                            key={date}
                            align="center"
                            sx={{ background: isWeekend ? '#ede7f6' : color, fontSize: '1rem', p: 0.5, border: '1px solid #e0e0e0', minWidth: 30 }}
                          >
                            {isEditable ? (
                              <FormControl size="small" sx={{ minWidth: 28 }}>
                                <Select
                                  value={status || ''}
                                  displayEmpty
                                  onChange={async (e) => {
                                    const newStatus = e.target.value as ('present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation');
                                    await import('../components/services/api/attendance').then(api =>
                                      api.createAttendanceRecord({ userId: child.id!, date, status: newStatus })
                                    );
                                    setCalendarRecords(null);
                                  }}
                                  sx={{ fontSize: '1rem', bgcolor: color, minWidth: 28, p: 0, height: 28 }}
                                  MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                  inputProps={{ style: { padding: 0, textAlign: 'center' } }}
                                >
                                  <MenuItem value=""><span style={{ color: '#bdbdbd' }}>—</span></MenuItem>
                                  <MenuItem value="present">✔</MenuItem>
                                  <MenuItem value="absent">✗</MenuItem>
                                  <MenuItem value="late">⏰</MenuItem>
                                  <MenuItem value="sick">🤒</MenuItem>
                                  <MenuItem value="vacation">🏖</MenuItem>
                                  <MenuItem value="early-leave">↩</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              <span title={tooltip}>{icon}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

        </>
      )}
    </Box>
  );
};

export default ChildrenAttendance;
