import MenuItemsAdminPage from '../modules/food/pages/MenuItemsAdminPage';
import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  CssBaseline,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountCircleIcon, ExitToApp as ExitToAppIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';


import Dashboard from '../modules/dashboard/pages/Dashboard';
import Staff from '../modules/staff/pages/Staff';
import Groups from '../modules/children/pages/Groups';
import Settings from '../modules/settings/pages/Settings';
import Cyclogram from '../modules/staff/pages/Cyclogram';
import Children from '../modules/children/pages/Children';


import { Sidebar } from '../shared/components/Sidebar/Sidebar';
import sidebarStructure from '../shared/components/Sidebar/SidebarStructure';
import { useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import StaffSchedule from '../modules/staff/pages/StaffSchedule';

import WeeklyAttendance from '../modules/children/pages/WeeklyAttendance';
import ReportsSalary from '../modules/reports/components/PayrollList';
import { logout, getCurrentUser } from '../services';
import ReportsWidget from '../modules/reports/components/ReportsWidget';
import StaffAttendanceTracking from '../modules/staff/pages/StaffAttendanceTracking';
import { Documents } from '../modules/documents/pages/Documents';
import TubPositiveJournal from '../modules/medicine/pages/TubPositiveJournal';
import InfectiousDiseasesJournal from '../modules/medicine/pages/InfectiousDiseasesJournal';
import ContactInfectionJournal from '../modules/medicine/pages/ContactInfectionJournal';
import RiskGroupChildren from '../modules/medicine/pages/RiskGroupChildren';
import MedCabinetPage from '../modules/medicine/pages/MedCabinetPage';
import ChildHealthPassportPage from '../modules/medicine/pages/ChildHealthPassportPage';
import FoodNormsControlPage from '../modules/food/pages/FoodNormsControlPage';
import HelminthJournal from '../modules/medicine/pages/HelminthJournal';
import MantouxJournal from '../modules/medicine/pages/MantouxJournal';
import OrganolepticJournalPage from '../modules/food/pages/OrganolepticJournalPage';
import SomaticJournal from '../modules/medicine/pages/SomaticJournal';
import PerishableBrakPage from '../modules/food/pages/PerishableBrakPage';
import ProductCertificatePage from '../modules/food/pages/ProductCertificatePage';
import DetergentLogPage from '../modules/medicine/pages/DetergentLogPage';
import FoodStockLogPage from '../modules/food/pages/FoodStockLogPage';
import FoodStaffHealthPage from '../modules/food/pages/FoodStaffHealthPage';
import ReportsRent from '../modules/reports/components/RentReport';
import ChildPayments from '../modules/children/pages/ChildPayments';
import Qwen3Chat from '../modules/ai/components/Qwen3Chat';
import ProfilePage from '../modules/staff/pages/ProfilePage';
import ProductAccountingPage from '../modules/food/pages/ProductAccountingPage';
import Statistics from '../modules/dashboard/pages/Statistics';
import MenuCalendarPage from '../modules/food/pages/MenuCalendarPage';
import PushNotificationPrompt from '../shared/components/PushNotificationPrompt';

interface SimpleLayoutProps {
  children?: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/app/profile');
    handleMenuClose();
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    handleMenuClose();
  };

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || 'staff';
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Верхняя панель */}
      <AppBar
        position='fixed'
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 24px rgba(102, 126, 234, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color='inherit'
              aria-label='open drawer'
              edge='start'
              onClick={toggleDrawer}
              sx={{ mr: 1, display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              <Typography
                variant='h6'
                noWrap
                component='div'
                sx={{ fontWeight: 600, letterSpacing: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Система управления детским садом
              </Typography>
              <Typography
                variant='subtitle2'
                noWrap
                component='div'
                sx={{ fontWeight: 400, letterSpacing: 0.5, opacity: 0.9, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
              >
                {currentUser?.fullName || ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => navigate('/app/profile')}
              sx={{
                mr: 1,
                borderColor: 'white',
                color: 'white',
                '&:hover': { background: 'rgba(255,255,0.08)' },
                display: { xs: 'none', sm: 'inline-flex' },
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            >
              Профиль
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={handleLogout}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { background: 'rgba(255,255,0.08)' },
                display: { xs: 'none', sm: 'inline-flex' },
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            >
              Выйти
            </Button>
            {/* Mobile menu for profile/logout options */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5 }}>
              <IconButton
                color='inherit'
                onClick={handleMenuOpen}
                title="Меню"
                size="small"
              >
                <MoreVertIcon sx={{ color: 'white', fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
        {/* Dropdown menu for mobile */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
        >
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Профиль</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Выйти</ListItemText>
          </MenuItem>
        </Menu>
      </AppBar>

      {/* Sidebar с древовидной структурой */}
      <Sidebar
        location={location}
        structure={sidebarStructure}
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={isMobile ? toggleDrawer : undefined}
      />

      {/* Основное содержимое */}
      <Box component='main' sx={{
        flexGrow: 1,
        p: 3,
        ...(isMobile && drawerOpen ? { overflow: 'hidden' } : {})
      }}>
        <Toolbar />
        <Container maxWidth='lg'>
          <Routes>
            <Route path='dashboard' element={<Dashboard />} />
            {/* Дети */}
            <Route path='children' element={<Children />} />
            <Route path='children/attendance' element={<WeeklyAttendance />} />
            <Route path='children/payments' element={<ChildPayments />} />
            {/* Сотрудники */}
            <Route path='staff' element={isAdminOrManager ? <Staff /> : <Navigate to="/app/dashboard" />} />
            <Route path='staff/schedule' element={<StaffSchedule />} />
            <Route
              path='staff/attendance'
              element={<StaffAttendanceTracking />}
            />
            <Route path='staff/reports' element={isAdminOrManager ? <ReportsWidget /> : <Navigate to="/app/dashboard" />} />
            {/* Документы */}
            <Route path='documents' element={<Documents />} />
            {/* Отчеты */}
            <Route path='reports' element={isAdminOrManager ? <ReportsWidget /> : <Navigate to="/app/dashboard" />} />
            <Route path='reports/payroll' element={isAdminOrManager ? <ReportsSalary /> : <Navigate to="/app/dashboard" />} />
            <Route path='rent' element={isAdminOrManager ? <ReportsRent /> : <Navigate to="/app/dashboard" />} />

            {/* Статистика */}
            <Route path='statistics' element={userRole === 'admin' ? <Statistics /> : <Navigate to="/app/dashboard" />} />

            {/* Организация/Настройки */}
            <Route path='groups' element={<Groups />} />
            <Route path='cyclogram' element={<Cyclogram />} />
            <Route path='settings' element={userRole === 'admin' ? <Settings /> : <Navigate to="/app/dashboard" />} />
            <Route path='food/products' element={isAdminOrManager || userRole === 'cook' ? <ProductAccountingPage /> : <Navigate to="/app/dashboard" />} />
            <Route path='food/calendar' element={isAdminOrManager || userRole === 'cook' ? <MenuCalendarPage /> : <Navigate to="/app/dashboard" />} />
            <Route path='med/menu-admin' element={isAdminOrManager ? <MenuItemsAdminPage /> : <Navigate to="/app/dashboard" />} />

            {/* Медицинский кабинет и журналы */}
            <Route path='med' element={<MedCabinetPage />} />
            <Route path='med/passport' element={<ChildHealthPassportPage />} />
            <Route path='med/mantoux' element={<MantouxJournal />} />
            <Route path='med/somatic' element={<SomaticJournal />} />
            <Route path='med/helminth' element={<HelminthJournal />} />
            <Route
              path='med/infectious'
              element={<InfectiousDiseasesJournal />}
            />
            <Route
              path='med/contact-infection'
              element={<ContactInfectionJournal />}
            />
            <Route path='med/risk-group' element={<RiskGroupChildren />} />
            <Route path='med/tub-positive' element={<TubPositiveJournal />} />
            <Route
              path='med/organoleptic-journal'
              element={<OrganolepticJournalPage />}
            />
            <Route
              path='med/food-norms-control'
              element={<FoodNormsControlPage />}
            />
            <Route
              path='med/perishable-brak'
              element={<PerishableBrakPage />}
            />
            <Route
              path='med/food-certificates'
              element={<ProductCertificatePage />}
            />
            <Route
              path='med/detergents'
              element={<DetergentLogPage />}
            />
            <Route
              path='med/food-stock'
              element={<FoodStockLogPage />}
            />
            <Route
              path='med/canteen-staff-health'
              element={<FoodStaffHealthPage />}
            />
            <Route path='profile' element={<ProfilePage />} />
            <Route path='my-salary' element={<ReportsSalary personalOnly={true} />} />

            {/* Fallback */}
            <Route path='*' element={<Dashboard />} />
          </Routes>
        </Container>
      </Box>
      <Qwen3Chat />
      <PushNotificationPrompt />
    </Box>
  );
};

export default SimpleLayout;
