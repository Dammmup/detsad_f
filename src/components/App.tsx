import React from 'react';
import '../global-responsive.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from './Snackbar';
import Login from '../pages/LoginSimple';
import Groups from '../pages/Children/Groups';
import Children from '../pages/Children/Children';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import { DateProvider } from './context/DateContext';

import SimpleLayout from './SimpleLayout';

export const App = () => {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <DateProvider>
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
        </DateProvider>
      </SnackbarProvider>
    </AuthProvider>
  );
};
