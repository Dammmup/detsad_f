import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from './Snackbar';
import SimpleLayout from './SimpleLayout';
import Login from '../pages/LoginSimple';
import Groups from '../pages/Children/Groups';
import StaffTimeTracking from '../pages/Staff/StaffTimeTracking';
import PayrollPage from '../pages/Staff/PayrollPage';
import Children from '../pages/Children/Children';
import Reports from '../pages/Reports';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';

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
                    <Route path="staff/timetracking" element={<StaffTimeTracking />} />
                    <Route path="reports/payroll" element={<PayrollPage isInReports={true} />} />
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
