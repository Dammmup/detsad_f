import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent,
  Tabs, Tab, Avatar, OutlinedInput, InputAdornment, Checkbox, ListItemText,
  Dialog
} from '@mui/material';
import {
  AccessTime, Edit, Visibility, Check,
   Schedule, Person, Search as SearchIcon
} from '@mui/icons-material';
import { getUsers } from '../../services/users';
import shiftsApi from '../../services/shifts';
import { staffAttendanceTrackingService } from '../../services/staffAttendanceTracking';
import {ShiftStatus, STATUS_TEXT, STATUS_COLORS, ROLE_TRANSLATIONS } from '../../types/common';


// Интерфейс для записей учета времени
interface TimeRecord {
  id: string;
  staffId: string | undefined;
  staffName: string;
  date: string;
 actualStart?: string;
  actualEnd?: string;
  status: 'checked_in' | 'checked_out' | 'on_break' | 'overtime' | 'absent' | 'scheduled';
  originalStatus?: ShiftStatus; // Добавляем оригинальный статус смены
  workDuration?: number;
 breakDuration?: number;
  overtimeDuration?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  penalties: {
    late: { minutes: number; amount: number; reason?: string };
    earlyLeave: { minutes: number; amount: number; reason?: string };
    unauthorized: { amount: number; reason?: string };
  };
  bonuses: {
    overtime: { minutes: number; amount: number };
    punctuality: { amount: number; reason?: string };
  };
  location?: {
    checkIn?: { address?: string };
    checkOut?: { address?: string };
  };
  notes?: string;
}

// Используем только смены (Shift) для учета посещаемости сотрудников

// Удаляем локальное определение roleTranslations, так как используем импортированные из common.ts

// Используем функцию translateRole из common.ts

const StaffAttendanceTracking: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState('');


  // Удаляем локальное определение statusLabels, так как используем импортированные из common.ts

  // Удаляем локальное определение attendanceStatusColors, так как используем импортированные из common.ts

  // Удаляем локальное определение attendanceStatusLabels, так как используем импортированные из common.ts

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getUsers();
  setStaffList(users.filter((user: any) => user.active === true));
      } catch {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, []);

  // 🇷🇺 Список доступных ролей на русском языке (автоматически из переводов)
  const availableRoles = Object.values(ROLE_TRANSLATIONS).sort();
  
  // Обработчик для фильтра ролей
  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };

  const getStaffName = useCallback((staffId: string) => {
    const staff = staffList.find(s => s.id === staffId || s._id === staffId);
    return staff?.fullName || 'Неизвестно';
 }, [staffList]);

  // Загрузка смен сотрудников (учет посещаемости)
          useEffect(() => {
            const fetchRecords = async () => {
              try {
                let filters: any = {};
                if (selectedStaff !== 'all') filters.staffId = selectedStaff;
                if (dateRange.from) filters.startDate = dateRange.from;
                if (dateRange.to) filters.endDate = dateRange.to;
                
                // Загружаем данные об учете посещаемости
                const response = await staffAttendanceTrackingService.getAllRecords(filters);
                const attendanceRecords = response.data;
                
                // Загружаем все смены в указанный период для отображения назначенных смен
                const shifts = await shiftsApi.getAll(filters);
                
                // Создаем мапу для быстрого поиска записей посещаемости по дате и сотруднику
                const attendanceMap = new Map();
                attendanceRecords.forEach((record: any) => {
                  const key = `${record.staffId._id || record.staffId}-${new Date(record.date).toISOString().split('T')[0]}`;
                  attendanceMap.set(key, record);
                });
                
                // Объединяем данные смен и посещаемости
                const allRecords: TimeRecord[] = [];
                
                // Добавляем все смены, включая те, по которым нет данных посещаемости
                shifts.forEach((shift: any) => {
                  const attendanceRecord = attendanceMap.get(`${shift.staffId._id || shift.staffId}-${shift.date}`);
                  
                  if (attendanceRecord) {
                    // Если есть запись посещаемости, используем её данные
                    const statusMap: Record<string, TimeRecord['status']> = {
                      'scheduled': 'scheduled', // Запланированная смена - сотрудник еще не пришел
                      'completed': 'checked_out',
                      'in_progress': 'checked_in',
                      'late': 'absent',
                      'pending_approval': 'absent'
                    };
                    
                    allRecords.push({
                      id: attendanceRecord._id || attendanceRecord.id || '',
                      staffId: attendanceRecord.staffId._id || attendanceRecord.staffId,
                      staffName: attendanceRecord.staffId.fullName || getStaffName(attendanceRecord.staffId._id || attendanceRecord.staffId || ''),
                      date: attendanceRecord.date,
                      actualStart: attendanceRecord.actualStart ? new Date(attendanceRecord.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                      actualEnd: attendanceRecord.actualEnd ? new Date(attendanceRecord.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                      status: statusMap[attendanceRecord.status] || attendanceRecord.status,
                      originalStatus: attendanceRecord.status as ShiftStatus, // Сохраняем оригинальный статус для проверки
                      workDuration: attendanceRecord.workDuration,
                      breakDuration: attendanceRecord.breakDuration,
                      overtimeDuration: attendanceRecord.overtimeDuration,
                      lateMinutes: attendanceRecord.lateMinutes,
                      earlyLeaveMinutes: attendanceRecord.earlyLeaveMinutes,
                      notes: attendanceRecord.notes || '',
                      penalties: attendanceRecord.penalties || {
                        late: { minutes: 0, amount: 0 },
                        earlyLeave: { minutes: 0, amount: 0 },
                        unauthorized: { amount: 0 }
                      },
                      bonuses: attendanceRecord.bonuses || {
                        overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
                        punctuality: { amount: 0 }
                      }
                    });
                  } else {
                    // Если нет записи посещаемости, создаем запись только на основе смены
                    allRecords.push({
                      id: shift._id || shift.id || '',
                      staffId: shift.staffId._id || shift.staffId,
                      staffName: shift.staffId.fullName || getStaffName(shift.staffId._id || shift.staffId || ''),
                      date: shift.date,
                      actualStart: undefined,
                      actualEnd: undefined,
                      status: 'scheduled', // Статус смены - запланирована
                      originalStatus: shift.status as ShiftStatus,
                      workDuration: undefined,
                      breakDuration: undefined,
                      overtimeDuration: undefined,
                      lateMinutes: undefined,
                      earlyLeaveMinutes: undefined,
                      notes: `Смена: ${shift.startTime} - ${shift.endTime}`,
                      penalties: {
                        late: { minutes: 0, amount: 0 },
                        earlyLeave: { minutes: 0, amount: 0 },
                        unauthorized: { amount: 0 }
                      },
                      bonuses: {
                        overtime: { minutes: 0, amount: 0 },
                        punctuality: { amount: 0 }
                      }
                    });
                  }
                });
                
                // Добавляем записи посещаемости, которые не связаны с конкретными сменами (если есть)
                attendanceRecords.forEach((record: any) => {
                  const key = `${record.staffId._id || record.staffId}-${new Date(record.date).toISOString().split('T')[0]}`;
                  const shiftExists = shifts.some((shift: any) =>
                    `${shift.staffId._id || shift.staffId}-${shift.date}` === key
                  );
                  
                  if (!shiftExists) {
                    const statusMap: Record<string, TimeRecord['status']> = {
                      'scheduled': 'scheduled', // Запланированная смена - сотрудник еще не пришел
                      'completed': 'checked_out',
                      'in_progress': 'checked_in',
                      'late': 'absent',
                      'pending_approval': 'absent'
                    };
                    
                    allRecords.push({
                      id: record._id || record.id || '',
                      staffId: record.staffId._id || record.staffId,
                      staffName: record.staffId.fullName || getStaffName(record.staffId._id || record.staffId || ''),
                      date: record.date,
                      actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                      actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                      status: statusMap[record.status] || record.status,
                      originalStatus: record.status as ShiftStatus, // Сохраняем оригинальный статус для проверки
                      workDuration: record.workDuration,
                      breakDuration: record.breakDuration,
                      overtimeDuration: record.overtimeDuration,
                      lateMinutes: record.lateMinutes,
                      earlyLeaveMinutes: record.earlyLeaveMinutes,
                      notes: record.notes || '',
                      penalties: record.penalties || {
                        late: { minutes: 0, amount: 0 },
                        earlyLeave: { minutes: 0, amount: 0 },
                        unauthorized: { amount: 0 }
                      },
                      bonuses: record.bonuses || {
                        overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
                        punctuality: { amount: 0 }
                      }
                    });
                  }
                });
                
                // Фильтрация по роли и имени
                let filteredRecords = [...allRecords];
                
                // Фильтрация по поисковой строке
                if (searchTerm) {
                  const search = searchTerm.toLowerCase();
                  filteredRecords = filteredRecords.filter(record =>
                    record.staffName?.toLowerCase().includes(search)
                  );
                }
                
                // Фильтрация по роли
                if (filterRole.length > 0) {
                  filteredRecords = filteredRecords.filter(record => {
                    const staff = staffList.find(s => s.id === record.staffId || (s._id === record.staffId));
                    const russianRole = staff ? ROLE_TRANSLATIONS[staff.role as keyof typeof ROLE_TRANSLATIONS] || staff.role : '';
                    return filterRole.includes(russianRole);
                  });
                }
                
                setRecords(filteredRecords);
              } catch (e) {
                console.error('Error fetching records:', e);
                setRecords([]);
              } finally {
              }
            };
            fetchRecords();
          }, [selectedStaff, dateRange, filterRole, searchTerm, staffList, getStaffName]);
  
  const calculateWorkDuration = (start: string, end: string, breakTime: number = 0) => {
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return Math.max(0, endTotalMinutes - startTotalMinutes - breakTime);
  };

  // Диалог отметки времени
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: new Date().toISOString().slice(0, 10),
    actualStart: '',
    actualEnd: '',
    status: 'checked_in',
    notes: ''
  });

  const handleOpenMarkDialog = () => {
    setMarkDialogOpen(true);
  };
  const handleCloseMarkDialog = () => {
    setMarkDialogOpen(false);
  };

  // ...
  
  // Вставьте этот блок в JSX диалога (DialogContent)
  // Адрес учреждения

  const handleMarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setMarkForm({ ...markForm, [name]: value });
  };


  const handleCheckIn = async (staffId: string) => {
    try {
      setCurrentStaffId(staffId);
      setCheckInDialogOpen(true);
    } catch (error) {
      console.error('Error initiating check-in:', error);
    }
  };

  const handleCheckInSubmit = async (location?: { latitude: number; longitude: number; address?: string }) => {
    try {
      // Найти смену для текущего сотрудника и даты
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find(s => {
        // staffId может быть как строкой, так и объектом с _id
        if (typeof s.staffId === 'object' && s.staffId !== null && '_id' in s.staffId) {
          return (s.staffId as any)._id === currentStaffId;
        }
        return s.staffId === currentStaffId;
      });
      if (myShift) {
        // Проверяем, опаздывает ли сотрудник
        const now = new Date();
        const shiftDate = new Date(`${myShift.date} ${myShift.startTime}`);
        const lateMinutes = Math.max(0, Math.floor((now.getTime() - shiftDate.getTime()) / (1000 * 60)));
        
        // Определяем статус на основе опоздания
        if (myShift.id) {
          await shiftsApi.checkIn(myShift.id);
        }
        setCheckInDialogOpen(false);
        // Обновить записи
        
        // Обновляем записи, чтобы отразить изменения
        const fetchRecords = async () => {
          let filters: any = {};
          if (selectedStaff !== 'all') filters.staffId = selectedStaff;
          if (dateRange.from) filters.startDate = dateRange.from;
          if (dateRange.to) filters.endDate = dateRange.to;
          // Загружаем обновленные данные об учете посещаемости
          const response = await staffAttendanceTrackingService.getAllRecords(filters);
          const updatedAttendanceRecords = response.data;
          const transformedRecords = updatedAttendanceRecords.map((record: any) => ({
            id: record._id || record.id || '',
            staffId: record.staffId._id || record.staffId,
            staffName: record.staffId.fullName || getStaffName(record.staffId._id || record.staffId || ''),
            date: record.date,
            actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            status: ({
              'scheduled': 'absent',
              'completed': 'checked_out',
              'in_progress': 'checked_in',
              'late': 'absent',
              'pending_approval': 'absent'
            } as Record<string, TimeRecord['status']>)[record.status] || record.status,
            originalStatus: record.status as ShiftStatus,
            workDuration: record.workDuration,
            breakDuration: record.breakDuration,
            overtimeDuration: record.overtimeDuration,
            lateMinutes: record.lateMinutes,
            earlyLeaveMinutes: record.earlyLeaveMinutes,
            notes: record.notes || '',
            penalties: record.penalties || { late: { minutes: 0, amount: 0 }, earlyLeave: { minutes: 0, amount: 0 }, unauthorized: { amount: 0 } },
            bonuses: record.bonuses || { overtime: { minutes: 0, amount: 0 }, punctuality: { amount: 0 } }
          }));
          setRecords(transformedRecords);
        };
        fetchRecords();
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
 };

  const handleCheckOutSubmit = async (location?: { latitude: number; longitude: number; address?: string }) => {
    try {
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find(s => {
        // staffId может быть как строкой, так и объектом с _id
        if (typeof s.staffId === 'object' && s.staffId !== null && '_id' in s.staffId) {
          return (s.staffId as any)._id === currentStaffId;
        }
        return s.staffId === currentStaffId;
      });
      if (myShift) {
        if (myShift.id) {
          if (myShift.id) {
            await shiftsApi.checkOut(myShift.id);
          }
        }
        setCheckOutDialogOpen(false);
        // Обновить записи
        const fetchRecords = async () => {
          let filters: any = {};
          if (selectedStaff !== 'all') filters.staffId = selectedStaff;
          if (dateRange.from) filters.startDate = dateRange.from;
          if (dateRange.to) filters.endDate = dateRange.to;
          // Загружаем обновленные данные об учете посещаемости
          const response = await staffAttendanceTrackingService.getAllRecords(filters);
          const updatedAttendanceRecords = response.data;
          const transformedRecords = updatedAttendanceRecords.map((record: any) => ({
            id: record._id || record.id || '',
            staffId: record.staffId._id || record.staffId,
            staffName: record.staffId.fullName || getStaffName(record.staffId._id || record.staffId || ''),
            date: record.date,
            actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            status: record.actualStart && !record.actualEnd ? 'checked_in' :
                    record.actualStart && record.actualEnd ? 'checked_out' : 'absent',
            workDuration: record.workDuration,
            breakDuration: record.breakDuration,
            overtimeDuration: record.overtimeDuration,
            lateMinutes: record.lateMinutes,
            earlyLeaveMinutes: record.earlyLeaveMinutes,
            notes: record.notes || '',
            penalties: record.penalties || { late: { minutes: 0, amount: 0 }, earlyLeave: { minutes: 0, amount: 0 }, unauthorized: { amount: 0 } },
            bonuses: record.bonuses || { overtime: { minutes: 0, amount: 0 }, punctuality: { amount: 0 } }
          }));
          setRecords(transformedRecords);
        };
        fetchRecords();
      }
    } catch (error) {
      console.error('Error during check-out:', error);
    }
  };

  // Состояние для проверки "в зоне"

  const handleMarkSubmit = async () => {
      try {
        // Создаем новую запись учета посещаемости через API
        await staffAttendanceTrackingService.createRecord({
          staffId: markForm.staffId,
          date: markForm.date,
          actualStart: markForm.actualStart,
          actualEnd: markForm.actualEnd,
          status: markForm.status as any,
          notes: markForm.notes
        } as any); // Используем as any, чтобы обойти строгую типизацию
        
        setMarkDialogOpen(false);
        setMarkForm({
          staffId: '',
          date: new Date().toISOString().slice(0, 10),
          actualStart: '',
          actualEnd: '',
          status: 'checked_in',
          notes: ''
        });
        
        // Обновляем записи
        let filters: any = {};
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;
        if (dateRange.from) filters.startDate = dateRange.from;
        if (dateRange.to) filters.endDate = dateRange.to;
        
        // Загружаем данные об учете посещаемости
        const response = await staffAttendanceTrackingService.getAllRecords(filters);
        const attendanceRecords = response.data;
        
        // Преобразуем данные учета посещаемости для отображения в таблице
        const transformedRecords = attendanceRecords.map((record: any) => {
          // Определяем статус на основе наличия actualStart и actualEnd
          let timeRecordStatus: TimeRecord['status'] = 'absent';
          if (record.actualStart && !record.actualEnd) {
            timeRecordStatus = 'checked_in';
          } else if (record.actualStart && record.actualEnd) {
            timeRecordStatus = 'checked_out';
          }
          
          return {
            id: record._id || record.id || '',
            staffId: record.staffId._id || record.staffId,
            staffName: record.staffId.fullName || getStaffName(record.staffId._id || record.staffId || ''),
            date: record.date,
            actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            status: timeRecordStatus,
            workDuration: record.workDuration,
            breakDuration: record.breakDuration,
            overtimeDuration: record.overtimeDuration,
            lateMinutes: record.lateMinutes,
            earlyLeaveMinutes: record.earlyLeaveMinutes,
            notes: record.notes || '',
            // Инициализируем penalties и bonuses как пустые объекты для смен
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
              punctuality: { amount: 0 }
            }
          };
        });
        
        setRecords(transformedRecords);
      } catch {}
    };

  const calculateStats = () => {
    const totalRecords = records.length;
    // Для статусов TimeRecord используем правильное значение
    const completedRecords = records.filter(r => r.status === 'checked_out').length;
    const totalPenalties = records.reduce((sum, r) =>
      sum + (r.penalties?.late?.amount || 0) + (r.penalties?.earlyLeave?.amount || 0) + (r.penalties?.unauthorized?.amount || 0), 0
    );
    const totalBonuses = records.reduce((sum, r) =>
      sum + (r.bonuses?.overtime?.amount || 0) + (r.bonuses?.punctuality?.amount || 0), 0
    );
    const avgWorkHours = records.length > 0
      ? records.reduce((sum, r) => sum + (r.workDuration || 0), 0) / records.length / 60
      : 0;

    return { totalRecords, completedRecords, totalPenalties, totalBonuses, avgWorkHours };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const handleEditRecord = (record: TimeRecord) => {
    // Убедимся, что selectedRecord имеет актуальный статус
    setSelectedRecord(record);
    setEditDialogOpen(true);
 };

  const handleSaveRecord = async () => {
      if (!selectedRecord) return;
      
      try {
        // Обновляем запись учета посещаемости через API
        const updatedRecord = await staffAttendanceTrackingService.updateRecord(selectedRecord.id, {
          actualStart: selectedRecord.actualStart ? new Date(`${selectedRecord.date}T${selectedRecord.actualStart}`) : undefined,
          actualEnd: selectedRecord.actualEnd ? new Date(`${selectedRecord.date}T${selectedRecord.actualEnd}`) : undefined,
          notes: selectedRecord.notes,
          // Убираем поле status, так как оно больше не существует в модели
          lateMinutes: selectedRecord.lateMinutes,
          earlyLeaveMinutes: selectedRecord.earlyLeaveMinutes
        });
        
        // Обновляем только конкретную запись в состоянии, а не все
        setRecords(prevRecords =>
          prevRecords.map(record =>
            record.id === selectedRecord.id
              ? {
                  ...updatedRecord.data,
                  actualStart: updatedRecord.data.actualStart ? new Date(updatedRecord.data.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                  actualEnd: updatedRecord.data.actualEnd ? new Date(updatedRecord.data.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
                  staffName: updatedRecord.data.staffId?.fullName || getStaffName(updatedRecord.data.staffId || ''),
                  // Обновляем отображаемый статус в соответствии с новым оригинальным статусом
                  status: ({
                                       'scheduled': 'absent',
                                       'completed': 'checked_out',
                                       'absent': 'absent',
                                       'checked_out': 'checked_out',
                                       'in_progress': 'in_progress',
                                       'late': 'absent',
                                       'pending_approval': 'absent'
                                     }[updatedRecord.data.status as keyof typeof STATUS_TEXT] || 'checked_in') as 'checked_in' | 'checked_out' | 'absent'
                }
              : record
          )
        );
        
        setEditDialogOpen(false);
        setSelectedRecord(null);
      } catch (e) {
        console.error('Error saving record:', e);
      }
    };

  const handleDeleteRecord = async (id: string) => {
      try {
        // Удаляем запись учета посещаемости через API
        await staffAttendanceTrackingService.deleteRecord(id);
        
        // Обновляем записи
        let filters: any = {};
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;
        if (dateRange.from) filters.startDate = dateRange.from;
        if (dateRange.to) filters.endDate = dateRange.to;
        
        // Загружаем данные об учете посещаемости
        const response = await staffAttendanceTrackingService.getAllRecords(filters);
        const attendanceRecords = response.data;
        
        // Преобразуем данные учета посещаемости для отображения в таблице
        const transformedRecords = attendanceRecords.map((record: any) => {
          // Определяем статус на основе наличия actualStart и actualEnd
          let timeRecordStatus: TimeRecord['status'] = 'absent';
          if (record.actualStart && !record.actualEnd) {
            timeRecordStatus = 'checked_in';
          } else if (record.actualStart && record.actualEnd) {
            timeRecordStatus = 'checked_out';
          }
          
          return {
            id: record._id || record.id || '',
            staffId: record.staffId._id || record.staffId,
            staffName: record.staffId.fullName || getStaffName(record.staffId._id || record.staffId || ''),
            date: record.date,
            actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
            status: timeRecordStatus,
            workDuration: record.workDuration,
            breakDuration: record.breakDuration,
            overtimeDuration: record.overtimeDuration,
            lateMinutes: record.lateMinutes,
            earlyLeaveMinutes: record.earlyLeaveMinutes,
            notes: record.notes || '',
            // Инициализируем penalties и bonuses как пустые объекты для смен
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
              punctuality: { amount: 0 }
            }
          };
        });
        
        setRecords(transformedRecords);
      } catch (e) {
        console.error('Error deleting record:', e);
      }
   };


  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Всего записей</Typography>
              <Typography variant="h4">{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Завершено</Typography>
              <Typography variant="h4">{stats.completedRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Штрафы</Typography>
              <Typography variant="h5">{formatCurrency(stats.totalPenalties)}</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
  
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Смена</TableCell>
              <TableCell>Время работы</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Адрес</TableCell>
              <TableCell align="right">Штрафы</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    {record.staffName || getStaffName(record.staffId || '')}
                  </Box>
                </TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                                <Box>
                                  <Typography variant="body2">Смена</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Приход: {record.actualStart ? new Date(`1970-01-01T${record.actualStart}`).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-'}<br/>
                                    Уход: {record.actualEnd ? new Date(`1970-01-01T${record.actualEnd}`).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </Typography>
                                </Box>
                              </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{formatTime(record.workDuration || 0)}</Typography>
                    {record.penalties?.late?.minutes > 0 && (
                                        <Chip
                                          label={`Опоздание: ${record.penalties.late.minutes}м`}
                                          size="small"
                                          color="warning"
                                          sx={{ mr: 0.5, mt: 0.5 }}
                                        />
                                      )}
                                      {record.penalties?.earlyLeave?.minutes > 0 && (
                                        <Chip
                                          label={`Ранний уход: ${record.penalties.earlyLeave.minutes}м`}
                                          size="small"
                                          color="warning"
                                          sx={{ mr: 0.5, mt: 0.5 }}
                                        />
                                      )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_TEXT[record.status as keyof typeof STATUS_TEXT] || STATUS_TEXT[record.originalStatus as keyof typeof STATUS_TEXT] || record.status}
                    color={STATUS_COLORS[record.originalStatus as keyof typeof STATUS_COLORS] as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error">
                    {formatCurrency(
                      (record.penalties?.late?.amount || 0) +
                      (record.penalties?.earlyLeave?.amount || 0) +
                      (record.penalties?.unauthorized?.amount || 0)
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(
                      (record.bonuses?.overtime?.amount || 0) +
                      (record.bonuses?.punctuality?.amount || 0)
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditRecord(record)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteRecord(record.id)}>
                    <Visibility />
                  </IconButton>
                  {record.originalStatus === 'scheduled' && (
                    <IconButton
                      size="small"
                      onClick={() => record.staffId && handleCheckIn(record.staffId)}
                      title="Отметить приход"
                    >
                      <Check />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
  

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
          Учет рабочего времени
        </Typography>
        <Box>
          <Button variant="contained" startIcon={<Schedule />} onClick={handleOpenMarkDialog} sx={{ mr: 1 }}>
            Создать смену
          </Button>
      
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {tabValue !== 3 && tabValue !== 4 && (
            <>
              <TextField
                label="Дата с"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="Дата по"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
            </>
          )}
          {(tabValue === 3 || tabValue === 4) && (
            <TextField
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          )}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Сотрудник</InputLabel>
            <Select
              value={selectedStaff}
              label="Сотрудник"
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <MenuItem value="all">Все сотрудники</MenuItem>
              {staffList.map((staff: any) => (
                <MenuItem key={staff.id} value={staff.id}>{staff.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Фильтр по имени */}
          <TextField
            placeholder="Поиск по имени..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Фильтр по роли */}
          <FormControl size="small" sx={{ minWidth: '200px' }}>
            <InputLabel id="role-filter-label">Фильтр по должности</InputLabel>
            <Select
              labelId="role-filter-label"
              multiple
              value={filterRole}
              onChange={handleFilterRoleChange}
              input={<OutlinedInput label="Фильтр по должности" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  <Checkbox checked={filterRole.indexOf(role) > -1} />
                  <ListItemText primary={role} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Обзор" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderOverviewTab()}
        </Box>
      </Paper>

      {/* Mark Dialog */}
      <Dialog open={markDialogOpen} onClose={handleCloseMarkDialog}>
        <DialogTitle>Отметить рабочее время</DialogTitle>
        <DialogContent>
          {/* TODO: добавить поля для выбора сотрудника, даты, времени, статуса, комментария */}
          <TextField
            label="Сотрудник"
            name="staffId"
            select
            value={markForm.staffId}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
          >
            {staffList.map((staff: any) => (
              <MenuItem key={staff.id} value={staff.id}>{staff.fullName}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Дата"
            name="date"
            type="date"
            value={markForm.date}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время прихода"
            name="actualStart"
            type="time"
            value={markForm.actualStart}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время ухода"
            name="actualEnd"
            type="time"
            value={markForm.actualEnd}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Статус"
            name="status"
            select
            value={markForm.status}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="checked_in">Пришел</MenuItem>
            <MenuItem value="checked_out">Ушел</MenuItem>
            <MenuItem value="on_break">Перерыв</MenuItem>
            <MenuItem value="overtime">Переработка</MenuItem>
            <MenuItem value="absent">Отсутствует</MenuItem>
            <MenuItem value="late">Опоздание</MenuItem>
            <MenuItem value="pending_approval">Ожидает подтверждения</MenuItem>
          </TextField>
          <TextField
            label="Комментарий"
            name="notes"
            value={markForm.notes}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleMarkSubmit}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать запись</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Сотрудник"
                  value={selectedRecord.staffName || ''}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Дата"
                  type="date"
                  value={selectedRecord.date || ''}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Статус"
                  select
                  value={selectedRecord.originalStatus || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? {...prev, originalStatus: e.target.value as ShiftStatus} : null)}
                  fullWidth
                >
                  {Object.entries(STATUS_TEXT).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                  <MenuItem value="late">Опоздание</MenuItem>
                  <MenuItem value="pending_approval">Ожидает подтверждения</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Время прихода"
                  type="time"
                  value={selectedRecord.actualStart || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? {...prev, actualStart: e.target.value} : null)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Время ухода"
                  type="time"
                  value={selectedRecord.actualEnd || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? {...prev, actualEnd: e.target.value} : null)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Примечания"
                  multiline
                  rows={3}
                  value={selectedRecord.notes || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? {...prev, notes: e.target.value} : null)}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveRecord}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onClose={() => setCheckInDialogOpen(false)}>
        <DialogTitle>Отметить приход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить приход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={() => handleCheckInSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialogOpen} onClose={() => setCheckOutDialogOpen(false)}>
        <DialogTitle>Отметить уход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить уход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={() => handleCheckOutSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAttendanceTracking;