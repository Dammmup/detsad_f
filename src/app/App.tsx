import React from 'react';
import '../global-responsive.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from '../shared/components/Snackbar';
import Login from '../pages/LoginSimple';
import Groups from '../modules/children/pages/Groups';
import Children from '../modules/children/pages/Children';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import { DateProvider } from './context/DateContext';
import ErrorBoundary from '../shared/components/ErrorBoundary';

import SimpleLayout from './SimpleLayout';

export const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SnackbarProvider>
          <DateProvider>
            <GroupsProvider>
              <Routes>
                {/* Публичные маршруты */}
                <Route path='/login' element={<Login />} />
                <Route path='/groups' element={<Groups />} />
                <Route path='/children' element={<Children />} />

                {/* Защищенные маршруты */}
                <Route
                  path='/'
                  element={<Navigate to='/app/dashboard' replace />}
                />
                <Route
                  path='/app/*'
                  element={
                    <ProtectedRoute>
                      <SimpleLayout />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback для неизвестных маршрутов */}
                <Route path='*' element={<Navigate to='/login' replace />} />
              </Routes>
            </GroupsProvider>
          </DateProvider>
        </SnackbarProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
