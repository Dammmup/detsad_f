import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const TimeTrackingContext = createContext();

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};

export const TimeTrackingProvider = ({ children }) => {
  const [timeStatus, setTimeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Get user location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          setLocation(locationData);
          setLocationError(null);
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Не удалось получить местоположение';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о местоположении недоступна';
              break;
            case error.TIMEOUT:
              errorMessage = 'Время ожидания геолокации истекло';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  // Fetch current time tracking status
  const fetchTimeStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${config.baseURLApi}/time-tracking/status`);
      setTimeStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching time status:', error);
      toast.error('Ошибка загрузки статуса рабочего времени');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clock in
  const clockIn = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      
      // Get current location if not provided
      let currentLocation = location;
      if (!currentLocation || options.forceLocationUpdate) {
        currentLocation = await getCurrentLocation();
      }

      const requestData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        notes: options.notes,
        photo: options.photo
      };

      const response = await Axios.post(`${config.baseURLApi}/time-tracking/clock-in`, requestData);
      
      // Update status
      await fetchTimeStatus();
      
      toast.success('Успешно отмечен приход на работу');
      return response.data;
    } catch (error) {
      console.error('Clock in error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при отметке прихода';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [location, getCurrentLocation, fetchTimeStatus]);

  // Clock out
  const clockOut = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      
      // Get current location if not provided
      let currentLocation = location;
      if (!currentLocation || options.forceLocationUpdate) {
        currentLocation = await getCurrentLocation();
      }

      const requestData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        notes: options.notes,
        photo: options.photo
      };

      const response = await Axios.post(`${config.baseURLApi}/time-tracking/clock-out`, requestData);
      
      // Update status
      await fetchTimeStatus();
      
      toast.success('Успешно отмечен уход с работы');
      return response.data;
    } catch (error) {
      console.error('Clock out error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при отметке ухода';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [location, getCurrentLocation, fetchTimeStatus]);

  // Start break
  const startBreak = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Axios.post(`${config.baseURLApi}/time-tracking/break-start`);
      
      // Update status
      await fetchTimeStatus();
      
      toast.success('Перерыв начат');
      return response.data;
    } catch (error) {
      console.error('Start break error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при начале перерыва';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeStatus]);

  // End break
  const endBreak = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Axios.post(`${config.baseURLApi}/time-tracking/break-end`);
      
      // Update status
      await fetchTimeStatus();
      
      toast.success('Перерыв завершен');
      return response.data;
    } catch (error) {
      console.error('End break error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при завершении перерыва';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeStatus]);

  // Get time entries
  const getTimeEntries = useCallback(async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
      });

      const response = await Axios.get(`${config.baseURLApi}/time-tracking/entries?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Ошибка загрузки записей рабочего времени');
      throw error;
    }
  }, []);

  // Get time summary
  const getTimeSummary = useCallback(async (startDate, endDate) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await Axios.get(`${config.baseURLApi}/time-tracking/summary?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time summary:', error);
      toast.error('Ошибка загрузки сводки рабочего времени');
      throw error;
    }
  }, []);

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation().catch(() => {
      // Location error is already handled in getCurrentLocation
    });
  }, [getCurrentLocation]);

  // Auto-refresh status every 30 seconds if user is clocked in
  useEffect(() => {
    if (timeStatus?.isActive) {
      const interval = setInterval(() => {
        fetchTimeStatus().catch(() => {
          // Error is already handled in fetchTimeStatus
        });
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [timeStatus?.isActive, fetchTimeStatus]);

  const value = {
    // State
    timeStatus,
    loading,
    location,
    locationError,
    
    // Actions
    fetchTimeStatus,
    getCurrentLocation,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    getTimeEntries,
    getTimeSummary,
    
    // Computed values
    isActive: timeStatus?.isActive || false,
    activeEntry: timeStatus?.activeEntry || null,
    todaySchedule: timeStatus?.todaySchedule || null,
    
    // Helper functions
    formatTime: (date) => {
      return new Date(date).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    formatDuration: (startTime) => {
      const now = new Date();
      const diff = now - new Date(startTime);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}ч ${minutes}м`;
    },
    
    formatHours: (hours) => {
      return `${hours.toFixed(2)}ч`;
    }
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
};

export default TimeTrackingContext;
