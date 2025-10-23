import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '../../utils/api';




interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

interface TimeTrackingContextType {
  timeStatus: string | null;
  loading: boolean;
  location: GeolocationPosition | null;
  locationError: string | null;
  getCurrentLocation: () => Promise<GeolocationPosition>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const useTimeTracking = (): TimeTrackingContextType => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};

interface TimeTrackingProviderProps {
  children: React.ReactNode;
}

export const TimeTrackingProvider = ({ children }: TimeTrackingProviderProps) => {

 const [timeStatus, setTimeStatus] = useState<string | null>(null);
 // setTimeStatus is used in the fetchTimeStatus function below
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            timestamp: position.timestamp,
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
      // API call would go here
      // return response.data;
      return null;
    } catch (error) {
      console.error('Error fetching time status:', error);
      toast.error('Ошибка загрузки статуса рабочего времени');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clock in
  const clockIn = useCallback(async (options: Record<string, any> = {}) => {
    try {
      setLoading(true);
      
      // Get current location if not provided
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      const requestData = {
        latitude: currentLocation?.coords.latitude,
        longitude: currentLocation?.coords.longitude,
      };

      const response = await apiClient.post('/time-tracking/clock-in', requestData);
      
      // // Update status
      // await fetchTimeStatus();
      
      toast.success('Успешно отмечен приход на работу');
      return response.data;
    } catch (error) {
      console.error('Clock in error:', error);
      const errorMessage = (error as any).response?.data?.error || 'Ошибка при отметке прихода';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [location, getCurrentLocation]);

  // Clock out
  const clockOut = useCallback(async (options: Record<string, any> = {}) => {
    try {
      setLoading(true);
      
      // Get current location if not provided
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      const requestData = {
        latitude: currentLocation?.coords.latitude,
        longitude: currentLocation?.coords.longitude,
      };

      const response = await apiClient.post('/time-tracking/clock-out', requestData);
      
      // // Update status
      // await fetchTimeStatus();
      
      toast.success('Успешно отмечен уход с работы');
      return response.data;
    } catch (error) {
      console.error('Clock out error:', error);
      const errorMessage = (error as any).response?.data?.error || 'Ошибка при отметке ухода';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [location, getCurrentLocation]);

  // Start break
  const startBreak = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/time-tracking/break-start');
      
      // // Update status
      // await fetchTimeStatus();
      
      toast.success('Перерыв начат');
      return response.data;
    } catch (error) {
      console.error('Start break error:', error);
      const errorMessage = (error as any).response?.data?.error || 'Ошибка при начале перерыва';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // End break
  const endBreak = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/time-tracking/break-end');
      
      // // Update status
      // await fetchTimeStatus();
      
      toast.success('Перерыв завершен');
      return response.data;
    } catch (error) {
      console.error('End break error:', error);
      const errorMessage = (error as any).response?.data?.error || 'Ошибка при завершении перерыва';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get time entries
  const getTimeEntries = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const queryParams = new URLSearchParams({
        ...params
      });

      const response = await apiClient.get(`/time-tracking/entries?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Ошибка загрузки записей рабочего времени');
      throw error;
    }
  }, []);

  // Get time summary
  const getTimeSummary = useCallback(async (startDate: { toISOString: () => any; }, endDate: { toISOString: () => any; }) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiClient.get(`/time-tracking/summary?${params}`);
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
    fetchTimeStatus();
    const interval = setInterval(() => {
      fetchTimeStatus().catch(() => {
        // Error is already handled in fetchTimeStatus
      });
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchTimeStatus]);

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
    
    // Helper functions
    formatTime: (date: string | number | Date) => {
      return new Date(date).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    formatDuration: (startTime: string | number | Date) => {
      const now = new Date();
      const diff = now.getTime() - new Date(startTime).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}ч ${minutes}м`;
    },
    
    formatHours: (hours: number) => {
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
