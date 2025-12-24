import React from 'react';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HealingIcon from '@mui/icons-material/Healing';
import BugReportIcon from '@mui/icons-material/BugReport';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ListAltIcon from '@mui/icons-material/ListAlt';

export const medicalSidebarSection = {
  id: 'medical-cabinet',
  label: 'Медицинский кабинет',
  icon: <LocalHospitalIcon />,
  link: '/app/med',
  children: [
    {
      id: 'organoleptic',
      label: 'Органолептический журнал',
      link: '/app/med/organoleptic-journal',
      icon: <AssignmentIcon />,
    },
    {
      id: 'food_norms_control',
      label: 'Контроль норм питания',
      link: '/app/med/food-norms-control',
      icon: <ListAltIcon />,
    },
    {
      id: 'perishable_brak',
      label: 'Бракераж скоропортящихся',
      link: '/app/med/perishable-brak',
      icon: <HealingIcon />,
    },
    {
      id: 'product_certificate',
      label: 'Сертификаты продуктов',
      link: '/app/med/food-certificates',
      icon: <AssignmentIcon />,
    },
    {
      id: 'detergent_log',
      label: 'Моющие средства',
      link: '/app/med/detergents',
      icon: <BugReportIcon />,
    },
    {
      id: 'food_stock_log',
      label: 'Склад продуктов',
      link: '/app/med/food-stock',
      icon: <GroupWorkIcon />,
    },
    {
      id: 'food_staff_health',
      label: 'Здоровье работников',
      link: '/app/med/canteen-staff-health',
      icon: <HealingIcon />,
    },
  ],
};
