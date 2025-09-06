import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

// Components
import Dot from './components/Dot';

const structure = [
  { 
    id: 0, 
    label: 'Главная', 
    link: '/app/kindergarten/dashboard', 
    icon: <DashboardIcon /> 
  },
  {
    id: 1,
    label: 'Учет времени',
    link: '/app/time-tracking',
    icon: <AccessTimeIcon />,
    children: [
      {
        label: 'Отметка времени',
        link: '/app/time-tracking/clock',
        icon: <Dot size="small" color="success" />,
      },
      {
        label: 'Мой табель',
        link: '/app/time-tracking/timesheet',
        icon: <Dot size="small" color="primary" />,
      },
      {
        label: 'Расписание смен',
        link: '/app/time-tracking/schedule',
        icon: <Dot size="small" color="info" />,
      },
    ],
  },
  { 
    id: 2,
    label: 'Детский сад',
    link: '/app/kindergarten',
    icon: <SchoolIcon />,
    children: [
      {
        label: 'Группы',
        link: '/app/kindergarten/groups',
        icon: <Dot size="small" color="primary" />,
      },
      {
        label: 'Сотрудники',
        link: '/app/kindergarten/staff',
        icon: <Dot size="small" color="primary" />,
      },
      {
        label: 'Посещаемость',
        link: '/app/kindergarten/attendance',
        icon: <Dot size="small" color="warning" />,
      },
    ],
  },
  {
    id: 3,
    label: 'Управление',
    link: '/app/management',
    icon: <CalendarTodayIcon />,
    children: [
      {
        label: 'Планирование смен',
        link: '/app/management/shifts',
        icon: <Dot size="small" color="primary" />,
      },
      {
        label: 'Циклограмма',
        link: '/app/management/cyclogram',
        icon: <Dot size="small" color="info" />,
      },
      {
        label: 'Отпуска',
        link: '/app/management/leaves',
        icon: <Dot size="small" color="secondary" />,
      },
      {
        label: 'Локации',
        link: '/app/management/locations',
        icon: <Dot size="small" color="success" />,
      },
    ],
  },
  {
    id: 4,
    label: 'Отчеты',
    link: '/app/reports',
    icon: <AssessmentIcon />,
    children: [
      {
        label: 'Рабочее время',
        link: '/app/reports/time',
        icon: <Dot size="small" color="primary" />,
      },

      {
        label: 'Зарплата',
        link: '/app/reports/payroll',
        icon: <Dot size="small" color="success" />,
      },
      {
        label: 'Аналитика',
        link: '/app/reports/analytics',
        icon: <Dot size="small" color="info" />,
      },
    ],
  },
  { id: 2, type: 'divider' },
  { 
    id: 3, 
    label: 'Профиль', 
    link: '/app/profile', 
    icon: <AccountCircleIcon /> 
  },
  { 
    id: 4, 
    label: 'Настройки', 
    link: '/app/settings', 
    icon: <SettingsIcon /> 
  },
  { id: 5, type: 'divider' },
  { 
    id: 6, 
    label: 'Выход', 
    link: '/login', 
    icon: <ExitToAppIcon /> 
  },
];

export default structure;
