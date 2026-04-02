import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { usersApi } from '../../modules/staff/services/users';
import { User } from '../../shared/types/staff';

interface StaffContextType {
  staff: User[];
  loading: boolean;
  error: string | null;
  fetchStaff: (params?: any, force?: boolean) => Promise<User[]>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  refreshStaff: () => Promise<void>;
  getUser: (id: string) => Promise<User>;
  updatePayrollSettings: (id: string, data: { salary?: number; salaryType?: string }) => Promise<any>;
  updateAllowToSeePayroll: (id: string, allowToSeePayroll: boolean) => Promise<any>;
  generateTelegramLinkCode: (id: string) => Promise<{ telegramLinkCode: string }>;
}

interface StaffProviderProps {
  children: ReactNode;
}

export const StaffContext = createContext<StaffContextType | undefined>(
  undefined,
);

let staffCache: User[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export const clearStaffCache = () => {
  staffCache = null;
  cacheTimestamp = 0;
};

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
  const [staffList, setStaffList] = useState<User[]>(staffCache || []);
  const [loading, setLoading] = useState(!staffCache);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async (params = {}, force = false) => {
    const now = Date.now();
    const cacheKey = JSON.stringify(params);
    if (!force && staffCache && now - cacheTimestamp < CACHE_DURATION) {
      return staffCache;
    }

    try {
      setLoading(true);
      const data = await usersApi.getAll(params);
      
      staffCache = data;
      cacheTimestamp = now;
      
      setStaffList(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError('Не удалось загрузить список сотрудников.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      const newUser = await usersApi.create(userData);
      setStaffList((prev) => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError('Не удалось добавить сотрудника.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await usersApi.update(id, userData);
      setStaffList((prev) =>
        prev.map((u) => (u.id === id ? updatedUser : u)),
      );
      return updatedUser;
    } catch (err) {
      setError('Не удалось обновить данные сотрудника.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      await usersApi.delete(id);
      setStaffList((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError('Не удалось удалить сотрудника.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (id: string) => {
    try {
      return await usersApi.getById(id);
    } catch (err) {
      setError('Не удалось получить данные сотрудника.');
      throw err;
    }
  };

  const updatePayrollSettings = async (id: string, data: { salary?: number; salaryType?: string }) => {
    try {
      const result = await usersApi.updatePayrollSettings(id, data);
      await refreshStaff(); // Refresh list to get updated data
      return result;
    } catch (err) {
      setError('Не удалось обновить настройки зарплаты.');
      throw err;
    }
  };

  const updateAllowToSeePayroll = async (id: string, allowToSeePayroll: boolean) => {
    try {
      const result = await usersApi.updateAllowToSeePayroll(id, allowToSeePayroll);
      await refreshStaff();
      return result;
    } catch (err) {
      setError('Не удалось обновить права доступа к зарплате.');
      throw err;
    }
  };

  const generateTelegramLinkCode = async (id: string) => {
    try {
      return await usersApi.generateTelegramLinkCode(id);
    } catch (err) {
      setError('Не удалось сгенерировать код для Telegram.');
      throw err;
    }
  };

  const refreshStaff = async () => {
    await fetchStaff(true);
  };

  const value = useMemo(
    () => ({
      staff: staffList,
      loading,
      error,
      fetchStaff,
      createUser,
      updateUser,
      deleteUser,
      refreshStaff,
      getUser,
      updatePayrollSettings,
      updateAllowToSeePayroll,
      generateTelegramLinkCode,
    }),
    [staffList, loading, error, fetchStaff],
  );

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
