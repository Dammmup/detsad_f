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
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TodayIcon from '@mui/icons-material/Today';

export interface SidebarItem {
  id: string;
  label: string;
  link?: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
  visibleFor?: string[];
}

const sidebarStructure: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Главная',
    link: '/app',
    icon: <DashboardIcon />,
    // Доступно всем
  },
  {
    id: 'profile',
    label: 'Профиль',
    link: '/app/profile',
    icon: <AccountCircleIcon />,
    // Доступно всем
  },
  {
    id: 'my-salary',
    label: 'Моя зарплата',
    link: '/app/my-salary',
    icon: <AssessmentIcon />,
    visibleFor: ['admin', 'manager', 'teacher', 'assistant', 'nurse', 'cook', 'cleaner', 'security', 'psychologist', 'music_teacher', 'physical_teacher', 'staff', 'intern'],
    // Доступно сотрудникам с разрешением на просмотр зарплаты
  },
  {
    id: 'children',
    label: 'Дети',
    icon: <ChildCareIcon />,
    visibleFor: ['admin', 'manager', 'teacher', 'assistant', 'nurse', 'psychologist', 'music_teacher', 'physical_teacher'],
    children: [
      {
        id: 'children-list',
        label: 'Список детей',
        link: '/app/children',
        icon: <PeopleIcon />,
      },
      {
        id: 'children-groups',
        label: 'Группы',
        link: '/app/groups',
        icon: <GroupIcon />,
      },
      {
        id: 'children-attendance',
        label: 'Посещаемость (неделя)',
        visibleFor: ['admin', 'manager', 'director'],
        link: '/app/children/attendance',
        icon: <CalendarViewWeekIcon />,
      },
      {
        id: 'children-daily-attendance',
        label: 'Посещаемость',
        visibleFor: ['teacher', 'assistant'],
        link: '/app/children/daily-attendance',
        icon: <TodayIcon />,
      },
      {
        id: 'children-payments',
        label: 'Оплаты за посещение',
        visibleFor: ['admin', 'manager'],
        link: '/app/children/payments',
        icon: <AssessmentIcon />,
      }
    ],
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    icon: <PeopleIcon />,
    visibleFor: ['admin', 'manager'],
    children: [
      {
        id: 'staff-list',
        label: 'Список сотрудников',
        link: '/app/staff',
        icon: <PeopleIcon />,
      },
      {
        id: 'staff-schedule',
        label: 'Смены',
        link: '/app/staff/schedule',
        icon: <ScheduleIcon />,
      },
      {
        id: 'staff-attendance-tracking',
        label: 'Учет рабочего времени',
        link: '/app/staff/attendance',
        icon: <AssignmentIndIcon />,
      },
      {
        id: 'reports-payroll',
        label: 'Зарплаты',
        link: '/app/reports/payroll',
        icon: <AssessmentIcon />,
      },

    ],
  },
  {
    id: 'rent',
    label: 'Аренда',
    visibleFor: ['admin', 'manager'],
    link: '/app/rent',
    icon: <AssessmentIcon />,
  },
  {
    id: 'documents',
    label: 'Документы',
    icon: <InsertDriveFileIcon />,
    link: '/app/documents',
    visibleFor: ['admin', 'manager', 'psychologist'],
  },

  {
    id: 'statistics',
    label: 'Статистика',
    icon: <AnalyticsIcon />,
    link: '/app/statistics',
    visibleFor: ['admin'],
  },
  {
    id: 'organization',
    label: 'Организация',
    icon: <SettingsIcon />,
    visibleFor: ['admin', 'manager'],
    children: [
      {
        id: 'organization-cyclogram',
        label: 'Циклограммы',
        link: '/app/cyclogram',
        icon: <ScheduleIcon />,
      },
      {
        id: 'organization-settings',
        label: 'Настройки',
        link: '/app/settings',
        icon: <SettingsIcon />,
        visibleFor: ['admin'],
      },
    ],
  },
  {
    id: 'food-products',
    label: 'Учёт продуктов',
    link: '/app/food/products',
    icon: <AssessmentIcon />,
    visibleFor: ['admin', 'cook'],
  },
  {
    id: 'food-calendar',
    label: 'Календарь меню',
    link: '/app/food/calendar',
    icon: <CalendarViewWeekIcon />,
    visibleFor: ['admin', 'cook'],
  },
  medicalSidebarSection,
];


export const getFilteredSidebarStructure = (
  userRole: string = 'staff',
): SidebarItem[] => {
  return sidebarStructure
    .filter((item) => !item.visibleFor || item.visibleFor.includes(userRole))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(
            (child) => !child.visibleFor || child.visibleFor.includes(userRole),
          ),
        };
      }
      return item;
    });
};

export default sidebarStructure;
