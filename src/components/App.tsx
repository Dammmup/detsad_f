import React from 'react';
import '../global-responsive.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from './Snackbar';
import Login from '../pages/LoginSimple';
import Groups from '../pages/Children/Groups';
import StaffAttendanceTracking from '../pages/Staff/StaffAttendanceTracking';
import Children from '../pages/Children/Children';
import Reports from '../pages/Reports';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import ReportsSalary from './reports/ReportsSalary';
import ReportsRent from './reports/ReportsRent';
import Dashboard from '../pages/Dashboard';
import WeeklyAttendance from '../pages/Children/WeeklyAttendance';
import { Sidebar } from './Sidebar/Sidebar';
import { useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Container, IconButton, Button } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import sidebarStructure from './Sidebar/SidebarStructure';
import SimpleLayout from './SimpleLayout';

export const App = () => {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <GroupsProvider>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/children" element={<Children />} />
            
            {/* Защищенные маршруты */}
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <SimpleLayout />
              </ProtectedRoute>
            } />
            
            {/* Fallback для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </GroupsProvider>
      </SnackbarProvider>
    </AuthProvider>
  );
};
