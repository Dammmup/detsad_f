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
import Staff from '../pages/Staff';
import Groups from '../pages/Groups';
import Schedule from '../pages/Schedule';
import Attendance from '../pages/Attendance';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import Cyclogram from '../pages/Cyclogram';
import Children from '../pages/Children';
import ChildrenAttendance from '../pages/ChildrenAttendance';
import DocumentsTemplates from '../pages/DocumentsTemplates';
import ReportsUnified from '../pages/ReportsUnified';
import DocumentsUnified from '../pages/DocumentsUnified';

// Импорт Sidebar и структуры меню
import { Sidebar } from './Sidebar/Sidebar';
import sidebarStructure from './Sidebar/SidebarStructure';
import { useLocation } from 'react-router-dom';
import ChildrenReports from '../pages/ChildrenReports';
import StaffReports from '../pages/StaffReports';
import { logout } from './services/api/auth';
import { useNavigate } from 'react-router-dom';

interface SimpleLayoutProps {
  children?: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
            sx={{ mr: 2 }}
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
      <Sidebar location={location} structure={sidebarStructure} />
      
      {/* Основное содержимое */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />

            {/* Дети */}
            <Route path="children" element={<Children />} />
            <Route path="children/attendance" element={<ChildrenAttendance />} />
            <Route path="children/reports" element={<ChildrenReports />} />

            {/* Сотрудники */}
            <Route path="staff" element={<Staff/> } />
            <Route path="staff/schedule" element={<Schedule />} />
            <Route path="staff/attendance" element={<Attendance />} />
            <Route path="staff/reports" element={<StaffReports />} />

            {/* Документы */}
            <Route path="documents" element={<DocumentsUnified />} />
            <Route path="documents/templates" element={<DocumentsTemplates />} />

            {/* Отчеты */}
            <Route path="reports" element={<ReportsUnified />} />
            <Route path="reports/payroll" element={<div>Зарплаты (реализовать)</div>} />
            <Route path="reports/analytics" element={<div>Аналитика (реализовать)</div>} />

            {/* Организация/Настройки */}
            <Route path="groups" element={<Groups />} />
            <Route path="cyclogram" element={<Cyclogram />} />
            <Route path="settings" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default SimpleLayout;
