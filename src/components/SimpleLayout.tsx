import MenuItemsAdminPage from '../pages/MedCabinet/MenuItemsAdminPage';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography,
  Box, Container, CssBaseline, IconButton,
  Button, 
} from '@mui/material';
import {
  Menu as MenuIcon,

} from '@mui/icons-material';

// Импорт страниц
import Dashboard from '../pages/Dashboard';
import Staff from '../pages/Staff/Staff';
import Groups from '../pages/Children/Groups';
import Settings from '../pages/Settings';
import Cyclogram from '../pages/Cyclogram';
import Children from '../pages/Children/Children';

// Импорт Sidebar и структуры меню
import { Sidebar } from './Sidebar/Sidebar';
import sidebarStructure from './Sidebar/SidebarStructure';
import { useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ChildrenReports from '../pages/Children/ChildrenReports';
import StaffSchedule from '../pages/Staff/StaffSchedule';


import WeeklyAttendance from '../pages/Children/WeeklyAttendance';
import ReportsSalary from '../components/reports/ReportsSalary';
import { logout } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import Reports from '../pages/Reports';
import StaffAttendanceTracking from '../pages/Staff/StaffAttendanceTracking';
import { Documents } from '../pages/Documents';

// Импорт страниц медкабинета

import TubPositiveJournal from '../pages/MedCabinet/TubPositiveJournal';
import InfectiousDiseasesJournal from '../pages/MedCabinet/InfectiousDiseasesJournal';
import ContactInfectionJournal from '../pages/MedCabinet/ContactInfectionJournal';
import RiskGroupChildren from '../pages/MedCabinet/RiskGroupChildren';
import MedCabinetPage from '../pages/MedCabinet/MedCabinetPage';
import ChildHealthPassportPage from '../pages/MedCabinet/ChildHealthPassportPage';
import FoodNormsControlPage from '../pages/MedCabinet/FoodNormsControlPage';
import HelminthJournal from '../pages/MedCabinet/HelminthJournal';
import MantouxJournal from '../pages/MedCabinet/MantouxJournal';
import OrganolepticJournalPage from '../pages/MedCabinet/OrganolepticJournalPage';
import SomaticJournal from '../pages/MedCabinet/SomaticJournal';
import ReportsRent from './reports/ReportsRent';
import ChildPayments from '../pages/Children/ChildPayments';

interface SimpleLayoutProps {
  children?: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:768px)');

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Верхняя панель */}
      <AppBar position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 24px rgba(102, 126, 234, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            Система управления детским садом
          </Typography>
          <Button variant="outlined" color="secondary" onClick={handleLogout} sx={{ borderColor: 'white', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
            Выйти
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar с древовидной структурой */}
      {isMobile ? (
        <Sidebar 
          location={location} 
          structure={sidebarStructure} 
          variant="temporary" 
          open={drawerOpen} 
          onClose={toggleDrawer} 
        />
      ) : (
        <Sidebar 
          location={location} 
          structure={sidebarStructure} 
          variant="permanent" 
          open={true} 
        />
      )}

      {/* Основное содержимое */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            {/* Дети */}
            <Route path="children" element={<Children />} />
            <Route path="children/attendance" element={<WeeklyAttendance />} />
            <Route path="children/reports" element={<ChildrenReports />} />
            <Route path='children/payments' element={<ChildPayments/>}/>
            {/* Сотрудники */}
            <Route path="staff" element={<Staff />} />
            <Route path="staff/schedule" element={<StaffSchedule />} />
            <Route path="staff/attendance" element={<StaffAttendanceTracking />} />
            <Route path="staff/reports" element={<Reports />} />
            {/* Документы */}
            <Route path="documents" element={<Documents/>} />
            {/* Отчеты */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/payroll" element={<ReportsSalary />} />
            <Route path='reports/rent' element={<ReportsRent/>}/>

            {/* Организация/Настройки */}
            <Route path="groups" element={<Groups />} />
            <Route path="cyclogram" element={<Cyclogram />} />
            <Route path="settings" element={<Settings />} />
            <Route path="med/menu-admin" element={<MenuItemsAdminPage />} />


            {/* Медицинский кабинет и журналы */}
            <Route path="med" element={<MedCabinetPage />} />
            <Route path="med/passport" element={<ChildHealthPassportPage />} />
            <Route path="med/mantoux" element={<MantouxJournal />} />
            <Route path="med/somatic" element={<SomaticJournal />} />
            <Route path="med/helminth" element={<HelminthJournal />} />
            <Route path="med/infectious" element={<InfectiousDiseasesJournal />} />
            <Route path="med/contact-infection" element={<ContactInfectionJournal />} />
            <Route path="med/risk-group" element={<RiskGroupChildren />} />
            <Route path="med/tub-positive" element={<TubPositiveJournal />} />
            <Route path="med/organoleptic-journal" element={<OrganolepticJournalPage />} />
            <Route path="med/food-norms-control" element={<FoodNormsControlPage />} />

            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default SimpleLayout;
