import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import * as groupsApi from '../../services/index';
import { Group } from '../../shared/types/common';

interface GroupsContextType {
  groups: Group[];
  loading: boolean;
  error: string | null;
  fetchGroups: (force?: boolean) => Promise<Group[]>;
  createGroup: (groupData: Partial<Group>) => Promise<Group>;
  updateGroup: (id: string, groupData: Partial<Group>) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
  getGroup: (id: string) => Promise<Group>;
  getTeachers: () => Promise<string[]>;
}

interface GroupsProviderProps {
  children: ReactNode;
}

export const GroupsContext = createContext<GroupsContextType | undefined>(
  undefined,
);


let groupsCache: Group[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;



export const GroupsProvider: React.FC<GroupsProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>(groupsCache || []);
  const [loading, setLoading] = useState(!groupsCache);
  const [error, setError] = useState<string | null>(null);


  const fetchGroups = useCallback(async (force = false) => {

    const now = Date.now();
    if (!force && groupsCache && now - cacheTimestamp < CACHE_DURATION) {
      setGroups(groupsCache as Group[]);
      return groupsCache as Group[];
    }

    try {
      setLoading(true);
      const data = await groupsApi.getGroups();


      groupsCache = data as any;
      cacheTimestamp = now;

      setGroups(data as Group[]);
      setError(null);
      return data as Group[];
    } catch (err: any) {
      console.error('Failed to fetch groups:', err);
      if (err.response?.status === 401) {
        console.warn(
          'Groups API: Authentication required, user may need to re-login',
        );
        setError('Требуется повторная авторизация');
      } else {
        setError(
          'Не удалось загрузить список групп. Пожалуйста, попробуйте позже.',
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const createGroup = async (groupData: Partial<Group>) => {
    setLoading(true);
    try {

      if (!groupData.name) throw new Error('Название группы обязательно');
      const newGroup = await groupsApi.createGroup(groupData as Group);
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      setError(null);
      return newGroup;
    } catch (err) {
      setError('Не удалось создать группу. Попробуйте позже.');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const updateGroup = async (id: string, groupData: Partial<Group>) => {
    setLoading(true);
    try {
      const updatedGroup = await groupsApi.updateGroup(id, groupData);
      setGroups((prevGroups) =>
        prevGroups.map((g) => (g.id === id ? updatedGroup : g)),
      );
      setError(null);
      return updatedGroup;
    } catch (err) {
      setError('Не удалось обновить группу. Попробуйте позже.');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const deleteGroup = async (id: string) => {
    try {
      setLoading(true);
      await groupsApi.deleteGroup(id);
      setGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));
      setError(null);
    } catch (err) {
      console.error(`Failed to delete group ${id}:`, err);
      setError('Не удалось удалить группу. Пожалуйста, попробуйте снова.');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const getGroup = async (id: string) => {
    try {
      setLoading(true);
      const group = await groupsApi.getGroup(id);
      setError(null);
      return group;
    } catch (err) {
      console.error(`Failed to fetch group ${id}:`, err);
      setError('Не удалось загрузить данные группы.');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const getTeachers = async () => {
    try {
      const teachers = await groupsApi.getTeachers();
      return teachers as any;
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError('Не удалось загрузить список воспитателей.');
      throw err;
    }
  };

  const refreshGroups = async (): Promise<void> => {
    await fetchGroups(true);
  };

  return (
    <GroupsContext.Provider
      value={{
        groups,
        loading,
        error,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        refreshGroups,
        getGroup,
        getTeachers,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};
