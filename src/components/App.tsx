import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from './Snackbar';
import SimpleLayout from './SimpleLayout';
import Login from '../pages/Login';
import Staff from '../pages/Staff';
import Groups from '../pages/Groups';
import Children from '../pages/Children';

import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import { StaffProvider } from './context/StaffContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export const App = () => {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <GroupsProvider>
          <StaffProvider>
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
          </StaffProvider>
        </GroupsProvider>
      </SnackbarProvider>
    </AuthProvider>
  );
};
