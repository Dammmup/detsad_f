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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RestaurantIcon from '@mui/icons-material/Restaurant';

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
    link: '/app/salary',
    icon: <AssessmentIcon />,
  },
  {
    id: 'children',
    label: 'Дети',
    icon: <ChildCareIcon />,
    visibleFor: ['admin', 'manager', 'teacher', 'nurse', 'psychologist', 'music_teacher', 'physical_teacher'],
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
        visibleFor: ['admin', 'manager', 'director'],
        link: '/app/children/payments',
        icon: <AssessmentIcon />,
      }
    ],
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    icon: <PeopleIcon />,
    visibleFor: ['admin', 'manager', 'director'],
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
        link: '/app/salary',
        icon: <AssessmentIcon />,
        visibleFor: ['admin', 'manager']
      },

    ],
  },
  {
    id: 'rent',
    label: 'Аренда',
    visibleFor: ['admin', 'manager', 'director'],
    link: '/app/rent',
    icon: <AssessmentIcon />,
  },
  {
    id: 'documents',
    label: 'Документы',
    icon: <InsertDriveFileIcon />,
    link: '/app/documents',
    visibleFor: ['admin', 'manager', 'director', 'psychologist'],
  },

  {
    id: 'accounting',
    label: 'Бухгалтерия',
    icon: <AccountBalanceIcon />,
    link: '/app/accounting',
    visibleFor: ['admin', 'manager', 'director'],
  },
  {
    id: 'statistics',
    label: 'Статистика',
    icon: <AnalyticsIcon />,
    link: '/app/statistics',
    visibleFor: ['admin', 'manager', 'director'],
  },
  {
    id: 'organization',
    label: 'Организация',
    icon: <SettingsIcon />,
    visibleFor: ['admin', 'manager', 'director'],
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
    id: 'food-kitchen',
    label: 'Пищеблок',
    icon: <RestaurantIcon />,
    visibleFor: ['admin', 'manager', 'director', 'cook', 'nurse'],
    children: [
      {
        id: 'food-products',
        label: 'Учёт продуктов',
        link: '/app/food/products',
        icon: <AssessmentIcon />,
      },
      {
        id: 'food-calendar',
        label: 'Календарь меню',
        link: '/app/food/calendar',
        icon: <CalendarViewWeekIcon />,
      },
      {
        id: 'food-journals',
        label: 'Журналы пищеблока',
        link: '/app/med?tab=food',
        icon: <InsertDriveFileIcon />,
      },
    ],
  },
  medicalSidebarSection,
];


export const getFilteredSidebarStructure = (
  user: any
): SidebarItem[] => {
  const userRole = user?.role || 'staff';
  const accessControls = user?.accessControls;

  const checkVisibility = (item: SidebarItem) => {
    // Если есть индивидуальные права, проверяем их в первую очередь
    if (accessControls) {
      if (item.id === 'children' && accessControls.canSeeChildren !== undefined && accessControls.canSeeChildren !== null) {
        return accessControls.canSeeChildren;
      }
      if ((item.id === 'food-products' || item.id === 'food-calendar' || item.id === 'food-kitchen') && accessControls.canSeeFood !== undefined && accessControls.canSeeFood !== null) {
        return accessControls.canSeeFood;
      }
      if (item.id === 'rent' && accessControls.canSeeRent !== undefined && accessControls.canSeeRent !== null) {
        return accessControls.canSeeRent;
      }
      if (item.id === 'staff' && accessControls.canSeeStaff !== undefined && accessControls.canSeeStaff !== null) {
        return accessControls.canSeeStaff;
      }
      if (item.id === 'organization' && accessControls.canSeeSettings !== undefined && accessControls.canSeeSettings !== null) {
        return accessControls.canSeeSettings;
      }
    }

    // Если индивидуальных прав нет, используем стандартную логику по роли
    return !item.visibleFor || item.visibleFor.includes(userRole);
  };

  return sidebarStructure
    .filter(checkVisibility)
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(checkVisibility),
        };
      }
      return item;
    });
};

export default sidebarStructure;
