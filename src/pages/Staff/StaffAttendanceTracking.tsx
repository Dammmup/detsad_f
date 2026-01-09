import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tabs,
  Tab,
  Avatar,
  OutlinedInput,
  InputAdornment,
  Checkbox,
  ListItemText,
  Dialog,
} from '@mui/material';
import {
  AccessTime,
  Edit,
  Visibility,
  Check,
  Schedule,
  Person,
  Search as SearchIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ru';
import { useDate } from '../../components/context/DateContext';
import { getUsers } from '../../services/users';
import shiftsApi from '../../services/shifts';
import { staffAttendanceTrackingService } from '../../services/staffAttendanceTracking';
import {
  ShiftStatus,
  STATUS_TEXT,
  STATUS_COLORS,
  ROLE_TRANSLATIONS,
} from '../../types/common';
import {
  getKindergartenSettings,
  KindergartenSettings,
} from '../../services/settings';
import DateNavigator from '../../components/DateNavigator';
import { importStaffAttendance } from '../../services/importService';
import { useSnackbar } from 'notistack';

moment.locale('ru');

interface TimeRecord {
  id: string;
  staffId: string | undefined;
  staffName: string;
  date: string;
  actualStart?: string;
  actualEnd?: string;
  statuses: ShiftStatus[];
  workDuration?: number;
  lateMinutes?: number;
  notes?: string;
  amount: number;
  penalties: number;
}








const StaffAttendanceTracking: React.FC = () => {
  const { currentDate } = useDate();
  const { enqueueSnackbar } = useSnackbar();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
  const [isImporting, setIsImporting] = useState(false);

  // Рабочие часы из настроек
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });

  // Массовое обновление
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ actualStart: '', actualEnd: '', notes: '' });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);








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


  const availableRoles = Object.values(ROLE_TRANSLATIONS).sort();


  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };

  const getStaffName = useCallback(
    (staffId: string) => {
      const staff = staffList.find(
        (s) => s.id === staffId || s._id === staffId,
      );
      return staff?.fullName || 'Неизвестно';
    },
    [staffList],
  );


  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const settings = await getKindergartenSettings();
        const latePenaltyRate = settings.payroll?.latePenaltyRate || 50;

        // Сохраняем рабочие часы из настроек
        if (settings.workingHours) {
          setWorkingHours({
            start: settings.workingHours.start || '09:00',
            end: settings.workingHours.end || '18:00'
          });
        }

        const startDate = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
        const endDate = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
        let filters: any = {
          startDate,
          endDate,
        };
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;

        const response =
          await staffAttendanceTrackingService.getAllRecords(filters);
        const attendanceRecords = response.data;

        const shifts = await shiftsApi.getAll(filters);

        const attendanceMap = new Map();
        attendanceRecords.forEach((record: any) => {
          // Используем фиксированное смещение +5 для Алматы
          const localDate = moment(record.date).utcOffset(5).format('YYYY-MM-DD');
          const key = `${record.staffId._id || record.staffId}-${localDate}`;
          attendanceMap.set(key, record);
        });

        const allRecords: TimeRecord[] = [];

        // Вспомогательная функция для расчета рабочих дней в месяце
        const getWorkDays = (date: Date) => {
          const year = date.getFullYear();
          const month = date.getMonth();
          const lastDay = new Date(year, month + 1, 0).getDate();
          let count = 0;
          for (let d = 1; d <= lastDay; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
          }
          return count || 22;
        };

        const workDaysInMonth = getWorkDays(selectedDate);

        shifts.forEach((shift: any) => {
          // Исправлено: ищем запись посещаемости по ID сотрудника И ДАТЕ
          const attendanceRecord = attendanceRecords.find((r: any) => {
            const rStaffId = r.staffId._id || r.staffId;
            const sStaffId = shift.staffId._id || shift.staffId;
            const rDate = moment(r.date).utcOffset(5).format('YYYY-MM-DD');
            return rStaffId === sStaffId && rDate === shift.date;
          });

          const staffId = shift.staffId._id || shift.staffId;
          const staff = staffList.find((s) => s.id === staffId || s._id === staffId);
          const baseSalary = staff?.baseSalary || 180000;
          const salaryType = staff?.baseSalaryType || staff?.salaryType || 'month';
          const shiftRate = staff?.shiftRate || 0;

          let dailyAccrual = 0;
          if (salaryType === 'shift') {
            // Если shiftRate не задан, используем baseSalary как ставку за смену
            dailyAccrual = shiftRate > 0 ? shiftRate : baseSalary;
          } else {
            dailyAccrual = Math.round(baseSalary / workDaysInMonth);
          }

          if (attendanceRecord) {
            const currentStatuses: ShiftStatus[] = [];

            if (attendanceRecord.status) {
              currentStatuses.push(attendanceRecord.status as ShiftStatus);
            } else {
              if (attendanceRecord.actualStart && !attendanceRecord.actualEnd) {
                // Получаем текущее время по Алматы
                const now = new Date();
                const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
                const [curH, curM] = almatyTimeStr.split(':').map(Number);
                const currentAlmatyMinutes = curH * 60 + curM;

                const recordDate = moment(attendanceRecord.date);
                const isToday = moment().isSame(recordDate, 'day');

                const lateMin = attendanceRecord.lateMinutes || 0;

                // Добавляем статус опоздания если опоздал на 1.5+ часа (90 минут)
                if (lateMin >= 90) {
                  currentStatuses.push(ShiftStatus.late_arrival);
                }

                // Если это не сегодня - статус "не отметил уход"
                if (!isToday) {
                  currentStatuses.push(ShiftStatus.no_clock_out);
                } else {
                  // Если сегодня и время после 19:00 (1140 минут) - статус "не отметил уход"
                  if (currentAlmatyMinutes >= 19 * 60) {
                    currentStatuses.push(ShiftStatus.no_clock_out);
                  } else if (lateMin < 90) {
                    // "На работе" только если опоздание меньше 1.5 часов
                    currentStatuses.push(ShiftStatus.checked_in);
                  }
                }
              } else if (attendanceRecord.actualStart && attendanceRecord.actualEnd) {
                // Есть и приход и уход - смена завершена
                const lateMin = attendanceRecord.lateMinutes || 0;
                const earlyLeaveMin = attendanceRecord.earlyLeaveMinutes || 0;

                // Добавляем статус опоздания если опоздал на 1.5+ часа
                if (lateMin >= 90) {
                  currentStatuses.push(ShiftStatus.late_arrival);
                }
                // Добавляем статус раннего ухода если за 1.5+ часа до положенного
                if (earlyLeaveMin >= 90) {
                  currentStatuses.push(ShiftStatus.early_leave);
                }

                // Добавляем "Завершена" если нет других статусов
                if (currentStatuses.length === 0) {
                  currentStatuses.push(ShiftStatus.completed);
                }
              } else if (!attendanceRecord.actualStart && attendanceRecord.actualEnd) {
                // Есть уход, но НЕТ прихода - "Не отметил приход"
                currentStatuses.push(ShiftStatus.no_clock_in);
              } else {
                currentStatuses.push(ShiftStatus.absent);
              }
            }

            const lateMin = attendanceRecord.lateMinutes || 0;

            allRecords.push({
              id: attendanceRecord._id || attendanceRecord.id || '',
              staffId: staffId,
              staffName:
                attendanceRecord.staffId.fullName ||
                getStaffName(staffId),
              date: attendanceRecord.date,
              actualStart: attendanceRecord.actualStart
                ? new Date(attendanceRecord.actualStart).toLocaleTimeString(
                  'ru-RU',
                  { hour: '2-digit', minute: '2-digit' },
                )
                : undefined,
              actualEnd: attendanceRecord.actualEnd
                ? new Date(attendanceRecord.actualEnd).toLocaleTimeString(
                  'ru-RU',
                  { hour: '2-digit', minute: '2-digit' },
                )
                : undefined,
              statuses: currentStatuses,
              workDuration: attendanceRecord.workDuration,
              lateMinutes: lateMin,
              notes: attendanceRecord.notes || '',
              amount: (currentStatuses.includes(ShiftStatus.absent) || currentStatuses.includes(ShiftStatus.scheduled)) ? 0 : dailyAccrual,
              penalties: attendanceRecord.penalties || 0,
            });
          } else {
            const shiftStatus = (shift.status || 'scheduled') as ShiftStatus;
            let displayStatus: ShiftStatus = shiftStatus;

            // Определяем displayStatus на основе времени
            if (shiftStatus === 'scheduled') {
              const now = moment();
              const shiftDate = moment(shift.date);
              // Если день прошел и нет отметки прихода - "не отметил приход"
              if (now.isAfter(shiftDate.endOf('day'))) {
                displayStatus = ShiftStatus.no_clock_in;
              } else {
                // Если сегодня и рабочее время прошло (после 19:00) - тоже "не отметил приход"
                const isToday = now.isSame(shiftDate, 'day');
                if (isToday) {
                  const almatyTimeStr = now.toDate().toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
                  const [curH] = almatyTimeStr.split(':').map(Number);
                  if (curH >= 19) {
                    displayStatus = ShiftStatus.no_clock_in;
                  }
                }
              }
            } else {
              displayStatus = ({
                completed: ShiftStatus.checked_out,
                late: ShiftStatus.absent,
                absent: ShiftStatus.absent,
                in_progress: ShiftStatus.checked_in,
                pending_approval: ShiftStatus.absent
              } as any)[shiftStatus] || shiftStatus;
            }

            allRecords.push({
              id: `${shift.staffId._id || shift.staffId}_${shift.date}`, // Временный ID для смены
              staffId: shift.staffId._id || shift.staffId,
              staffName:
                shift.staffId.fullName ||
                getStaffName(shift.staffId._id || shift.staffId || ''),
              date: shift.date,
              actualStart: undefined,
              actualEnd: undefined,
              statuses: [displayStatus], // Используем displayStatus вместо shiftStatus
              workDuration: undefined,
              lateMinutes: 0,
              notes: displayStatus === ShiftStatus.no_clock_in
                ? 'Не отметил приход'
                : `Смена ${shiftStatus === 'completed' ? 'завершена' : 'запланирована'} по графику`,
              amount: (displayStatus === ShiftStatus.absent || displayStatus === ShiftStatus.scheduled || displayStatus === ShiftStatus.no_clock_in) ? 0 : dailyAccrual,
              penalties: 0,
            });
          }
        });

        attendanceRecords.forEach((record: any) => {
          // Используем фиксированное смещение +5 для Алматы
          const localDate = moment(record.date).utcOffset(5).format('YYYY-MM-DD');
          const key = `${record.staffId._id || record.staffId}-${localDate}`;
          const shiftExists = shifts.some(
            (shift: any) =>
              `${shift.staffId._id || shift.staffId}-${shift.date}` === key,
          );

          if (!shiftExists) {
            const staff = staffList.find(
              (s) => s.id === record.staffId._id || s.id === record.staffId,
            );
            const baseSalary = staff?.baseSalary || 180000;
            const salaryType = staff?.baseSalaryType || staff?.salaryType || 'month';
            const shiftRate = staff?.shiftRate || 0;

            let dailyAccrual = 0;
            if (salaryType === 'shift') {
              // Если shiftRate не задан, используем baseSalary как ставку за смену
              dailyAccrual = shiftRate > 0 ? shiftRate : baseSalary;
            } else {
              dailyAccrual = Math.round(baseSalary / workDaysInMonth);
            }

            const currentStatuses: ShiftStatus[] = [];
            if (record.status) {
              currentStatuses.push(record.status as ShiftStatus);
            } else {
              if (record.actualStart && !record.actualEnd) {
                // Получаем текущее время по Алматы
                const now = new Date();
                const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
                const [curH, curM] = almatyTimeStr.split(':').map(Number);
                const currentAlmatyMinutes = curH * 60 + curM;

                const recordDate = moment(record.date);
                const isToday = moment().isSame(recordDate, 'day');

                const lateMin = record.lateMinutes || 0;

                // Добавляем статус опоздания если опоздал на 1.5+ часа (90 минут)
                if (lateMin >= 90) {
                  currentStatuses.push(ShiftStatus.late_arrival);
                }

                // Если это не сегодня - статус "не отметил уход"
                if (!isToday) {
                  currentStatuses.push(ShiftStatus.no_clock_out);
                } else {
                  // Если сегодня и время после 19:00 (1140 минут) - статус "не отметил уход"
                  if (currentAlmatyMinutes >= 19 * 60) {
                    currentStatuses.push(ShiftStatus.no_clock_out);
                  } else if (lateMin < 90) {
                    // "На работе" только если опоздание меньше 1.5 часов
                    currentStatuses.push(ShiftStatus.checked_in);
                  }
                }
              } else if (record.actualStart && record.actualEnd) {
                // Есть и приход и уход - смена завершена
                const lateMin = record.lateMinutes || 0;
                const earlyLeaveMin = record.earlyLeaveMinutes || 0;

                // Добавляем статус опоздания если опоздал на 1.5+ часа
                if (lateMin >= 90) {
                  currentStatuses.push(ShiftStatus.late_arrival);
                }
                // Добавляем статус раннего ухода если за 1.5+ часа до положенного
                if (earlyLeaveMin >= 90) {
                  currentStatuses.push(ShiftStatus.early_leave);
                }

                // Добавляем "Завершена" если нет других статусов
                if (currentStatuses.length === 0) {
                  currentStatuses.push(ShiftStatus.completed);
                }
              } else if (!record.actualStart && record.actualEnd) {
                // Есть уход, но НЕТ прихода - "Не отметил приход"
                currentStatuses.push(ShiftStatus.no_clock_in);
              } else {
                currentStatuses.push(ShiftStatus.absent);
              }
            }

            const lateMin = record.lateMinutes || 0;
            const earlyLeaveMin = record.earlyLeaveMinutes || 0;

            allRecords.push({
              id: record._id || record.id || '',
              staffId: record.staffId._id || record.staffId,
              staffName:
                record.staffId.fullName ||
                getStaffName(record.staffId._id || record.staffId || ''),
              date: record.date,
              actualStart: record.actualStart
                ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : undefined,
              actualEnd: record.actualEnd
                ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : undefined,
              statuses: currentStatuses,
              workDuration: record.workDuration,
              lateMinutes: lateMin,
              notes: record.notes || '',
              amount: (currentStatuses.includes(ShiftStatus.absent) || currentStatuses.includes(ShiftStatus.scheduled)) ? 0 : dailyAccrual,
              penalties: record.penalties || 0,
            });
          }
        });

        let filteredRecords = [...allRecords];

        // Для ТАБЛИЦЫ фильтруем только выбранный день
        const selectedDayStr = moment(selectedDate).format('YYYY-MM-DD');
        filteredRecords = filteredRecords.filter(r => {
          const rDate = moment(r.date).format('YYYY-MM-DD');
          return rDate === selectedDayStr;
        });

        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          filteredRecords = filteredRecords.filter((record) =>
            record.staffName?.toLowerCase().includes(search),
          );
        }

        if (filterRole.length > 0) {
          filteredRecords = filteredRecords.filter((record) => {
            const staff = staffList.find(
              (s) => s.id === record.staffId || s._id === record.staffId,
            );
            const russianRole = staff
              ? ROLE_TRANSLATIONS[
              staff.role as keyof typeof ROLE_TRANSLATIONS
              ] || staff.role
              : '';
            return filterRole.includes(russianRole);
          });
        }

        setRecords(filteredRecords);
      } catch (e) {
        console.error('Error fetching records:', e);
        setRecords([]);
      }
    };
    fetchRecords();
  }, [
    selectedStaff,
    selectedDate,
    filterRole,
    searchTerm,
    staffList,
    getStaffName,
  ]);
















  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: new Date().toISOString().slice(0, 10),
    actualStart: '',
    actualEnd: '',
    status: 'checked_in',
    notes: '',
  });

  const handleOpenMarkDialog = () => {
    setMarkDialogOpen(true);
  };
  const handleCloseMarkDialog = () => {
    setMarkDialogOpen(false);
  };






  const handleMarkChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any,
  ) => {
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

  const handleCheckInSubmit = async (location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    try {

      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
          return (s.staffId as any)._id === currentStaffId;
        }
        return s.staffId === currentStaffId;
      });
      if (myShift) {



        if (myShift.id) {
          await shiftsApi.checkIn(myShift.id);
        }


        if (myShift.id) {
          await shiftsApi.checkIn(myShift.id);
        }
        setCheckInDialogOpen(false);



        const fetchRecords = async () => {
          const startDate = moment(currentDate).startOf('month');
          const endDate = moment(currentDate).endOf('month');
          let filters: any = {
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
          };
          if (selectedStaff !== 'all') filters.staffId = selectedStaff;

          const response =
            await staffAttendanceTrackingService.getAllRecords(filters);
          const updatedAttendanceRecords = response.data;
          const transformedRecords = updatedAttendanceRecords.map(
            (record: any) => ({
              id: record._id || record.id || '',
              staffId: record.staffId._id || record.staffId,
              staffName:
                record.staffId.fullName ||
                getStaffName(record.staffId._id || record.staffId || ''),
              date: record.date,
              actualStart: record.actualStart
                ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : undefined,
              actualEnd: record.actualEnd
                ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : undefined,
              statuses: record.status ? [record.status as ShiftStatus] : [],
              workDuration: record.workDuration,
              lateMinutes: record.lateMinutes || 0,
              notes: record.notes || '',
              amount: record.amount || 0,
            }),
          );
          setRecords(transformedRecords);
        };
        fetchRecords();
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  const handleCheckOutSubmit = async (location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    try {
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
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

        const fetchRecords = async () => {
          const startDate = moment(currentDate).startOf('month');
          const endDate = moment(currentDate).endOf('month');
          let filters: any = {
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
          };
          if (selectedStaff !== 'all') filters.staffId = selectedStaff;

          const response =
            await staffAttendanceTrackingService.getAllRecords(filters);
          const updatedAttendanceRecords = response.data;
          const transformedRecords = updatedAttendanceRecords.map(
            (record: any) => {
              const status =
                record.status ||
                (record.actualStart && !record.actualEnd
                  ? 'checked_in'
                  : record.actualEnd
                    ? 'checked_out'
                    : 'absent');

              return {
                id: record._id || record.id || '',
                staffId: record.staffId._id || record.staffId,
                staffName:
                  record.staffId.fullName ||
                  getStaffName(record.staffId._id || record.staffId || ''),
                date: record.date,
                actualStart: record.actualStart
                  ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : undefined,
                actualEnd: record.actualEnd
                  ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : undefined,
                statuses: status ? [status as ShiftStatus] : [],
                workDuration: record.workDuration,
                lateMinutes: record.lateMinutes || 0,
                notes: record.notes || '',
                amount: record.amount || 0,
                penalties: record.penalties || 0,
              };
            },
          );
          setRecords(transformedRecords);
        };
        fetchRecords();
      }
    } catch (error) {
      console.error('Error during check-out:', error);
    }
  };



  const handleMarkSubmit = async () => {
    try {

      await staffAttendanceTrackingService.createRecord({
        staffId: markForm.staffId,
        date: markForm.date,
        actualStart: markForm.actualStart,
        actualEnd: markForm.actualEnd,
        status: markForm.status as any,
        notes: markForm.notes,
      } as any);

      setMarkDialogOpen(false);

      const startDate = moment(currentDate).startOf('month');
      const endDate = moment(currentDate).endOf('month');
      let filters: any = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      if (selectedStaff !== 'all') filters.staffId = selectedStaff;


      const response =
        await staffAttendanceTrackingService.getAllRecords(filters);
      const attendanceRecords = response.data;


      const transformedRecords = attendanceRecords.map((record: any) => {

        return {
          id: record._id || record.id || '',
          staffId: record.staffId._id || record.staffId,
          staffName:
            record.staffId.fullName ||
            getStaffName(record.staffId._id || record.staffId || ''),
          date: record.date,
          actualStart: record.actualStart
            ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : undefined,
          actualEnd: record.actualEnd
            ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : undefined,
          status: record.status as ShiftStatus,
          workDuration: record.workDuration,
          lateMinutes: record.lateMinutes || 0,
          notes: record.notes || '',
          amount: record.amount || 0,
          penalties: record.penalties || 0,

        };
      });

      setRecords(transformedRecords);
    } catch { }
  };

  const calculateStats = () => {
    const totalRecords = records.length;

    const completedRecords = records.filter(
      (r) => r.statuses.includes(ShiftStatus.completed),
    ).length;
    const totalPenalties = records.reduce((sum, r) => sum + (r.penalties || 0), 0);
    const avgWorkHours =
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.workDuration || 0), 0) /
        records.length /
        60
        : 0;

    return {
      totalRecords,
      completedRecords,
      totalPenalties,
      avgWorkHours,
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const handleEditRecord = (record: TimeRecord) => {

    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;

    try {
      // Если ID содержит подчеркивание, значит это "пустышка" смены (формат staffId_date)
      // В этом случае нужно создать новую запись, а не обновлять существующую.
      const isNewRecord = selectedRecord.id.includes('_');

      let updatedRecord: { data: any };

      // Извлекаем только дату в формате YYYY-MM-DD (без времени и часового пояса)
      const dateOnly = moment(selectedRecord.date).format('YYYY-MM-DD');

      console.log('[SAVE-DEBUG] selectedRecord:', {
        id: selectedRecord.id,
        date: selectedRecord.date,
        dateOnly,
        actualStart: selectedRecord.actualStart,
        actualEnd: selectedRecord.actualEnd,
        isNewRecord
      });

      if (isNewRecord) {
        updatedRecord = await staffAttendanceTrackingService.createRecord({
          staffId: selectedRecord.staffId,
          date: dateOnly,
          actualStart: selectedRecord.actualStart
            ? new Date(`${dateOnly}T${selectedRecord.actualStart}:00`)
            : undefined,
          actualEnd: selectedRecord.actualEnd
            ? new Date(`${dateOnly}T${selectedRecord.actualEnd}:00`)
            : undefined,
          notes: selectedRecord.notes,
        } as any);
      } else {
        const updateData: any = {
          notes: selectedRecord.notes,
          lateMinutes: selectedRecord.lateMinutes,
        };

        // Добавляем actualStart только если он указан (не пустая строка)
        if (selectedRecord.actualStart) {
          updateData.actualStart = new Date(`${dateOnly}T${selectedRecord.actualStart}:00`);
        }
        // Добавляем actualEnd только если он указан
        if (selectedRecord.actualEnd) {
          updateData.actualEnd = new Date(`${dateOnly}T${selectedRecord.actualEnd}:00`);
        }

        console.log('[SAVE-DEBUG] updateData:', updateData);

        updatedRecord = await staffAttendanceTrackingService.updateRecord(
          selectedRecord.id,
          updateData,
        );
      }

      // Перезагружаем страницу для получения актуальных lateMinutes и статусов
      setEditDialogOpen(false);
      setSelectedRecord(null);

      alert('Запись успешно сохранена!');
      window.location.reload();

    } catch (e) {
      console.error('Error saving record:', e);
      alert('Ошибка сохранения записи');
    }
  };

  // Массовое обновление функции
  const handleSelectRecord = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Выбираем все записи
      const allIds = records
        .filter(r => r.id)
        .map(r => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      enqueueSnackbar('Выберите хотя бы одну запись', { variant: 'warning' });
      return;
    }

    setIsBulkUpdating(true);
    try {
      // Разделяем на существующие записи и запланированные (нужно создать)
      const existingIds = selectedIds.filter(id => !id.includes('_'));
      const plannedIds = selectedIds.filter(id => id.includes('_'));

      let successCount = 0;
      let errorCount = 0;

      // Обрабатываем запланированные записи - создаем новые
      for (const plannedId of plannedIds) {
        try {
          // Формат plannedId: staffId_date
          const [staffId, dateStr] = plannedId.split('_');

          // Формируем данные для создания
          const createData: any = {
            staffId,
            date: dateStr,
          };

          if (bulkForm.actualStart) {
            createData.actualStart = new Date(`${dateStr}T${bulkForm.actualStart}:00`);
          }
          if (bulkForm.actualEnd) {
            createData.actualEnd = new Date(`${dateStr}T${bulkForm.actualEnd}:00`);
          }
          if (bulkForm.notes) {
            createData.notes = bulkForm.notes;
          }

          await staffAttendanceTrackingService.createRecord(createData);
          successCount++;
        } catch (e) {
          console.error('Error creating record for:', plannedId, e);
          errorCount++;
        }
      }

      // Обрабатываем существующие записи через bulk update
      if (existingIds.length > 0) {
        // Передаем только время, бэкенд сам возьмет дату из записи
        const updateData: any = {
          ids: existingIds,
          // Передаем время как строку, бэкенд применит к дате каждой записи
          timeStart: bulkForm.actualStart || undefined,
          timeEnd: bulkForm.actualEnd || undefined,
          notes: bulkForm.notes || undefined
        };

        const response = await staffAttendanceTrackingService.bulkUpdate(updateData);
        successCount += response.data.success || 0;
        errorCount += response.data.errors || 0;
      }

      enqueueSnackbar(
        `Обработано: ${successCount} записей${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`,
        { variant: errorCount > 0 ? 'warning' : 'success' }
      );

      setBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkForm({ actualStart: '', actualEnd: '', notes: '' });

      // Перезагружаем данные
      window.location.reload();
    } catch (e: any) {
      console.error('Error bulk updating:', e);
      enqueueSnackbar(e.response?.data?.error || 'Ошибка массового обновления', { variant: 'error' });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {

      await staffAttendanceTrackingService.deleteRecord(id);


      const startDate = moment(currentDate).startOf('month');
      const endDate = moment(currentDate).endOf('month');
      let filters: any = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      if (selectedStaff !== 'all') filters.staffId = selectedStaff;


      const response =
        await staffAttendanceTrackingService.getAllRecords(filters);
      const attendanceRecords = response.data;


      const transformedRecords = attendanceRecords.map((record: any) => {
        return {
          id: record._id || record.id || '',
          staffId: record.staffId._id || record.staffId,
          staffName:
            record.staffId.fullName ||
            getStaffName(record.staffId._id || record.staffId || ''),
          date: record.date,
          actualStart: record.actualStart
            ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : undefined,
          actualEnd: record.actualEnd
            ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : undefined,
          statuses: record.status ? [record.status as ShiftStatus] : [],
          workDuration: record.workDuration,
          lateMinutes: record.lateMinutes || 0,
          notes: record.notes || '',
          amount: record.amount || 0,
          penalties: record.penalties || 0,
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
              <Typography variant='h6' color='primary'>
                Всего записей
              </Typography>
              <Typography variant='h4'>{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='success.main'>
                Завершено
              </Typography>
              <Typography variant='h4'>{stats.completedRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='error.main'>
                Вычеты
              </Typography>
              <Typography variant='h4'>{formatCurrency(stats.totalPenalties)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Кнопка массового обновления */}
      {selectedIds.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`Выбрано: ${selectedIds.length}`}
            color="primary"
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Инициализируем форму значениями из настроек
              setBulkForm({
                actualStart: workingHours.start,
                actualEnd: workingHours.end,
                notes: ''
              });
              setBulkDialogOpen(true);
            }}
            startIcon={<Check />}
          >
            Массовое обновление
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setSelectedIds([])}
          >
            Снять выбор
          </Button>
        </Box>
      )}

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < records.filter(r => !r.id.includes('_')).length}
                  checked={selectedIds.length > 0 && selectedIds.length === records.filter(r => !r.id.includes('_')).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Смена</TableCell>
              <TableCell>Время работы</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align='right'>Начислено</TableCell>
              <TableCell align='right'>Вычеты</TableCell>
              <TableCell align='right'>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} selected={selectedIds.includes(record.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(record.id)}
                    onChange={(e) => handleSelectRecord(record.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center'>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    {record.staffName || getStaffName(record.staffId || '')}
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(record.date).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant='body2'>Смена</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Приход: {record.actualStart || '-'}
                      <br />
                      Уход: {record.actualEnd || '-'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant='body2'>
                      {formatTime(record.workDuration || 0)}
                    </Typography>
                    {record.lateMinutes !== undefined && record.lateMinutes > 0 && (
                      <Chip
                        label={`Опоздание: ${record.lateMinutes}м`}
                        size='small'
                        color='warning'
                        sx={{ mr: 0.5, mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {record.statuses.map((status) => (
                      <Chip
                        key={status}
                        label={STATUS_TEXT[status] || status || '–'}
                        color={(STATUS_COLORS[status] || 'default') as any}
                        size='small'
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color='success.main'>
                    {formatCurrency(record.amount || 0)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color='error.main'>
                    {formatCurrency(record.penalties || 0)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <IconButton
                    size='small'
                    onClick={() => handleEditRecord(record)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    <Visibility />
                  </IconButton>
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
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' component='h1' gutterBottom>
          <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
          Учет рабочего времени
        </Typography>
        <Box>
          <Button
            variant='contained'
            startIcon={<Schedule />}
            onClick={handleOpenMarkDialog}
            sx={{ mr: 1 }}
          >
            Создать смену
          </Button>
          <Button
            variant='outlined'
            startIcon={isImporting ? <AccessTime /> : <FileUploadIcon />}
            onClick={async () => {
              try {
                setIsImporting(true);
                const year = moment(currentDate).year();
                const result = await importStaffAttendance(year);
                if (result.success) {
                  enqueueSnackbar(`Импорт завершён: смен ${result.stats.shiftsCreated || 0}, посещаемость ${result.stats.attendanceCreated || 0}`, { variant: 'success' });
                } else {
                  enqueueSnackbar(result.error || 'Ошибка импорта', { variant: 'error' });
                }
              } catch (error: any) {
                enqueueSnackbar(error?.message || 'Ошибка импорта', { variant: 'error' });
              } finally {
                setIsImporting(false);
              }
            }}
            disabled={isImporting}
          >
            {isImporting ? 'Импорт...' : 'Импорт'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <DateNavigator />
        <Box display='flex' flexWrap='wrap' gap={2} alignItems='center' p={2}>
          {/* Выбор даты */}
          <TextField
            label='Дата'
            type='date'
            size='small'
            value={moment(selectedDate).format('YYYY-MM-DD')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            sx={{ minWidth: '180px' }}
            InputLabelProps={{ shrink: true }}
          />
          {(tabValue === 3 || tabValue === 4) && (
            <TextField
              label='Дата'
              type='date'
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
              label='Сотрудник'
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <MenuItem value='all'>Все сотрудники</MenuItem>
              {staffList.map((staff: any) => (
                <MenuItem key={staff.id} value={staff.id}>
                  {staff.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Фильтр по имени */}
          <TextField
            placeholder='Поиск по имени...'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Фильтр по роли */}
          <FormControl size='small' sx={{ minWidth: '200px' }}>
            <InputLabel id='role-filter-label'>Фильтр по должности</InputLabel>
            <Select
              labelId='role-filter-label'
              multiple
              value={filterRole}
              onChange={handleFilterRoleChange}
              input={<OutlinedInput label='Фильтр по должности' />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size='small' />
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
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label='Обзор' />
        </Tabs>
        <Box sx={{ p: 3 }}>{tabValue === 0 && renderOverviewTab()}</Box>
      </Paper>

      {/* Mark Dialog */}
      <Dialog open={markDialogOpen} onClose={handleCloseMarkDialog}>
        <DialogTitle>Отметить рабочее время</DialogTitle>
        <DialogContent>
          {/* TODO: добавить поля для выбора сотрудника, даты, времени, статуса, комментария */}
          <TextField
            label='Сотрудник'
            name='staffId'
            select
            value={markForm.staffId}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
          >
            {staffList.map((staff: any) => (
              <MenuItem key={staff.id} value={staff.id}>
                {staff.fullName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label='Дата'
            name='date'
            type='date'
            value={markForm.date}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Время прихода'
            name='actualStart'
            type='time'
            value={markForm.actualStart}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Время ухода'
            name='actualEnd'
            type='time'
            value={markForm.actualEnd}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Статус'
            name='status'
            select
            value={markForm.status}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
          >
            <MenuItem value='checked_in'>Пришел</MenuItem>
            <MenuItem value='checked_out'>Ушел</MenuItem>
            <MenuItem value='on_break'>Перерыв</MenuItem>
            <MenuItem value='overtime'>Переработка</MenuItem>
            <MenuItem value='absent'>Отсутствует</MenuItem>
            <MenuItem value='late'>Опоздание</MenuItem>
            <MenuItem value='pending_approval'>Ожидает подтверждения</MenuItem>
          </TextField>
          <TextField
            label='Комментарий'
            name='notes'
            value={markForm.notes}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Отмена</Button>
          <Button variant='contained' onClick={handleMarkSubmit}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Редактировать запись</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label='Сотрудник'
                  value={selectedRecord.staffName || ''}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Дата'
                  type='date'
                  value={selectedRecord.date || ''}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Статус'
                  select
                  value={selectedRecord.statuses[0] || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev
                        ? {
                          ...prev,
                          statuses: [e.target.value as ShiftStatus],
                        }
                        : null,
                    )
                  }
                  fullWidth
                >
                  {Object.entries(STATUS_TEXT).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                  <MenuItem value='late'>Опоздание</MenuItem>
                  <MenuItem value='pending_approval'>
                    Ожидает подтверждения
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Время прихода'
                  type='time'
                  value={selectedRecord.actualStart || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, actualStart: e.target.value } : null,
                    )
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Время ухода'
                  type='time'
                  value={selectedRecord.actualEnd || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, actualEnd: e.target.value } : null,
                    )
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Примечания'
                  multiline
                  rows={3}
                  value={selectedRecord.notes || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, notes: e.target.value } : null,
                    )
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant='contained' onClick={handleSaveRecord}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
      >
        <DialogTitle>Отметить приход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить приход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={() => handleCheckInSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog
        open={checkOutDialogOpen}
        onClose={() => setCheckOutDialogOpen(false)}
      >
        <DialogTitle>Отметить уход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить уход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={() => handleCheckOutSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Массовое обновление ({selectedIds.length} записей)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Укажите новое время прихода и ухода для выбранных записей.
            Оставьте поле пустым, чтобы не изменять его.
            Опоздания и штрафы будут пересчитаны автоматически.
          </Typography>
          <TextField
            label="Время прихода"
            type="time"
            fullWidth
            sx={{ mb: 2 }}
            value={bulkForm.actualStart}
            onChange={(e) => setBulkForm(prev => ({ ...prev, actualStart: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время ухода"
            type="time"
            fullWidth
            sx={{ mb: 2 }}
            value={bulkForm.actualEnd}
            onChange={(e) => setBulkForm(prev => ({ ...prev, actualEnd: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Примечание"
            multiline
            rows={2}
            fullWidth
            value={bulkForm.notes}
            onChange={(e) => setBulkForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={handleBulkUpdate}
            disabled={isBulkUpdating || (!bulkForm.actualStart && !bulkForm.actualEnd && !bulkForm.notes)}
            startIcon={isBulkUpdating ? <Schedule /> : <Check />}
          >
            {isBulkUpdating ? 'Обновление...' : 'Обновить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAttendanceTracking;
