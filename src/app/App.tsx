import React, { useEffect } from 'react';
import '../global-responsive.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from '../shared/components/Snackbar';
import Login from '../pages/LoginSimple';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { GroupsProvider } from './context/GroupsContext';
import { ChildrenProvider } from './context/ChildrenContext';
import { StaffProvider } from './context/StaffContext';
import { DateProvider } from './context/DateContext';
import ErrorBoundary from '../shared/components/ErrorBoundary';

import SimpleLayout from './SimpleLayout';

export const App = () => {
  useEffect(() => {
    // Сбрасываем бейдж при входе в приложение или когда оно становится активным
    const clearBadge = () => {
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch((err: any) => {
          console.error('Error clearing app badge:', err);
        });
      }
    };

    // Сбрасываем при загрузке
    clearBadge();

    // Сбрасываем при возвращении в приложение (focus)
    window.addEventListener('focus', clearBadge);
    
    return () => {
      window.removeEventListener('focus', clearBadge);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SnackbarProvider>
          <DateProvider>
            <GroupsProvider>
              <ChildrenProvider>
                <StaffProvider>
                  <Routes>
                    {/* Публичные маршруты */}
                    <Route path='/login' element={<Login />} />

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
                </StaffProvider>
              </ChildrenProvider>
            </GroupsProvider>
          </DateProvider>
        </SnackbarProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
