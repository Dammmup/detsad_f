import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SettingsIcon from '@mui/icons-material/Settings';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TableChartIcon from '@mui/icons-material/TableChart';

export interface SidebarItem {
  label: string;
  link?: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
}

const sidebarStructure: SidebarItem[] = [
  {
    label: 'Главная',
    link: '/app',
    icon: <DashboardIcon />,
  },
  {
    label: 'Дети',
    icon: <ChildCareIcon />,
    children: [
      { label: 'Список детей', link: '/app/children', icon: <PeopleIcon /> },
      { label: 'Группы', link: '/app/groups', icon: <GroupIcon /> },
      { label: 'Посещаемость', link: '/app/children/attendance', icon: <AssignmentIndIcon /> },
    ],
  },
  {
    label: 'Сотрудники',
    icon: <PeopleIcon />,
    children: [
      { label: 'Список сотрудников', link: '/app/staff', icon: <PeopleIcon /> },
      { label: 'Расписание/Смены', link: '/app/staff/schedule', icon: <ScheduleIcon /> },
      { label: 'Табель', link: '/app/staff/attendance', icon: <AssignmentIndIcon /> },
    ],
  },
  {
    label: 'Документы',
    icon: <InsertDriveFileIcon />,
    children: [
      { label: 'Все документы', link: '/app/documents', icon: <InsertDriveFileIcon /> },
      { label: 'Шаблоны', link: '/app/documents/templates', icon: <TableChartIcon /> },
    ],
  },
  {
    label: 'Отчеты',
    icon: <AssessmentIcon />,
    children: [
      { label: 'Все отчеты', link: '/app/reports', icon: <AssessmentIcon /> },
      { label: 'Зарплаты', link: '/app/reports/payroll', icon: <AssessmentIcon /> },
      { label: 'Аналитика', link: '/app/reports/analytics', icon: <AssessmentIcon /> },
    ],
  },
  {
    label: 'Организация',
    icon: <SettingsIcon />,
    children: [
      { label: 'Группы', link: '/app/groups', icon: <GroupIcon /> },
      { label: 'Циклограммы', link: '/app/cyclogram', icon: <ScheduleIcon /> },
      { label: 'Настройки', link: '/app/settings', icon: <SettingsIcon /> },
    ],
  },

];

export default sidebarStructure;