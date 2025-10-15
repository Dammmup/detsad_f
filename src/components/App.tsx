import React from 'react';
import '../global-responsive.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from './Snackbar';
import SimpleLayout from './SimpleLayout';
import Login from '../pages/LoginSimple';
import Groups from '../pages/Children/Groups';
import StaffAttendanceTracking from '../pages/Staff/StaffAttendanceTracking';
import Children from '../pages/Children/Children';
import Reports from '../pages/Reports';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import ReportsSalary from './reports/ReportsSalary';
import Dashboard from '../pages/Dashboard';
import WeeklyAttendance from '../pages/Children/WeeklyAttendance';

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
                <SimpleLayout>
                  <Routes>
                    <Route path="staff/attendance" element={<StaffAttendanceTracking />} />
                    <Route path="reports/payroll" element={<ReportsSalary />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="children/attendance" element={<WeeklyAttendance />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                    <Route path="reports" element={<Reports />} />
                  </Routes>
                </SimpleLayout>
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