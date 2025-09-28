import React from 'react';
import { medicalSidebarSection } from './MedicalSidebarSection';
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
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';

export interface SidebarItem {
  id: string;
  label: string;
  link?: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
}

const sidebarStructure: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Главная',
    link: '/app',
    icon: <DashboardIcon />,
  },
  {
    id: 'children',
    label: 'Дети',
    icon: <ChildCareIcon />,
    children: [
      { id: 'children-list', label: 'Список детей', link: '/app/children', icon: <PeopleIcon /> },
      { id: 'children-groups', label: 'Группы', link: '/app/groups', icon: <GroupIcon /> },
      { id: 'children-attendance', label: 'Посещаемость', link: '/app/children/attendance', icon: <CalendarViewWeekIcon /> },
    ],
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    icon: <PeopleIcon />,
    children: [
      { id: 'staff-list', label: 'Список сотрудников', link: '/app/staff', icon: <PeopleIcon /> },
      { id: 'staff-schedule', label: 'Смены', link: '/app/staff/schedule', icon: <ScheduleIcon /> },
      { id: 'staff-attendance-tracking', label: 'Учет рабочего времени', link: '/app/staff/attendance', icon: <AssignmentIndIcon /> },
    ],
  },
  {
    id: 'documents',
    label: 'Документы',
    icon: <InsertDriveFileIcon />,
    children: [
      { id: 'documents-all', label: 'Все документы', link: '/app/documents', icon: <InsertDriveFileIcon /> },
      { id: 'documents-templates', label: 'Шаблоны', link: '/app/documents/templates', icon: <TableChartIcon /> },
    ],
  },
  {
    id: 'reports',
    label: 'Отчеты',
    icon: <AssessmentIcon />,
    children: [
      { id: 'reports-all', label: 'Все отчеты', link: '/app/reports', icon: <AssessmentIcon /> },
      { id: 'reports-payroll', label: 'Зарплаты', link: '/app/reports/payroll', icon: <AssessmentIcon /> },
      { id: 'reports-analytics', label: 'Аналитика', link: '/app/reports/analytics', icon: <AssessmentIcon /> },
     
    ],
  },
  {
    id: 'organization',
    label: 'Организация',
    icon: <SettingsIcon />, 
    children: [
      { id: 'organization-groups', label: 'Группы', link: '/app/groups', icon: <GroupIcon /> },
      { id: 'organization-cyclogram', label: 'Циклограммы', link: '/app/cyclogram', icon: <ScheduleIcon /> },
      { id: 'organization-settings', label: 'Настройки', link: '/app/settings', icon: <SettingsIcon /> },
    ],
  },
  medicalSidebarSection,
];

export default sidebarStructure;