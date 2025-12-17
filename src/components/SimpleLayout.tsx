import MenuItemsAdminPage from '../pages/MedCabinet/MenuItemsAdminPage';
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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


import Dashboard from '../pages/Dashboard';
import Staff from '../pages/Staff/Staff';
import Groups from '../pages/Children/Groups';
import Settings from '../pages/Settings';
import Cyclogram from '../pages/Cyclogram';
import Children from '../pages/Children/Children';


import { Sidebar } from './Sidebar/Sidebar';
import sidebarStructure from './Sidebar/SidebarStructure';
import { useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import StaffSchedule from '../pages/Staff/StaffSchedule';

import WeeklyAttendance from '../pages/Children/WeeklyAttendance';
import ReportsSalary from './reports/ReportsSalary';
import { logout, getCurrentUser } from '../services';
import Reports from '../pages/Reports';
import StaffAttendanceTracking from '../pages/Staff/StaffAttendanceTracking';
import { Documents } from '../pages/Documents';
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
import Qwen3Chat from './Qwen3Chat';
import ProfilePage from '../pages/Staff/ProfilePage';

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
                {getCurrentUser()?.fullName || ''}
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
            <Route path='staff' element={<Staff />} />
            <Route path='staff/schedule' element={<StaffSchedule />} />
            <Route
              path='staff/attendance'
              element={<StaffAttendanceTracking />}
            />
            <Route path='staff/reports' element={<Reports />} />
            {/* Документы */}
            <Route path='documents' element={<Documents />} />
            {/* Отчеты */}
            <Route path='reports' element={<Reports />} />
            <Route path='reports/payroll' element={<ReportsSalary />} />
            <Route path='reports/rent' element={<ReportsRent />} />

            {/* Организация/Настройки */}
            <Route path='groups' element={<Groups />} />
            <Route path='cyclogram' element={<Cyclogram />} />
            <Route path='settings' element={<Settings />} />
            <Route path='med/menu-admin' element={<MenuItemsAdminPage />} />

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
            <Route path='profile' element={<ProfilePage />} />

            {/* Fallback */}
            <Route path='*' element={<Dashboard />} />
          </Routes>
        </Container>
      </Box>
      <Qwen3Chat />
    </Box>
  );
};

export default SimpleLayout;
