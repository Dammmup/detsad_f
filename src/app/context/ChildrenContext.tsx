import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import childrenApi from '../../modules/children/services/children';
import { Child } from '../../shared/types/common';

interface ChildrenContextType {
  children: Child[];
  loading: boolean;
  error: string | null;
  fetchChildren: (force?: boolean) => Promise<Child[]>;
  createChild: (childData: Partial<Child>) => Promise<Child>;
  updateChild: (id: string, childData: Partial<Child>) => Promise<Child>;
  deleteChild: (id: string) => Promise<void>;
  refreshChildren: () => Promise<void>;
  getChild: (id: string) => Promise<Child>;
  generatePayments: (date?: Date) => Promise<any>;
}

interface ChildrenProviderProps {
  children: ReactNode;
}

export const ChildrenContext = createContext<ChildrenContextType | undefined>(
  undefined,
);

let childrenCache: Child[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export const clearChildrenCache = () => {
  childrenCache = null;
  cacheTimestamp = 0;
};

export const ChildrenProvider: React.FC<ChildrenProviderProps> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<Child[]>(childrenCache || []);
  const [loading, setLoading] = useState(!childrenCache);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && childrenCache && now - cacheTimestamp < CACHE_DURATION) {
      return childrenCache;
    }

    try {
      setLoading(true);
      const data = await childrenApi.getAll();
      
      childrenCache = data;
      cacheTimestamp = now;
      
      setChildrenList(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch children:', err);
      setError('Не удалось загрузить список детей.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createChild = async (childData: Partial<Child>) => {
    setLoading(true);
    try {
      const newChild = await childrenApi.create(childData as Child);
      setChildrenList((prev) => [...prev, newChild]);
      // Очищаем кэш чтобы при следующем fetchChildren загрузились актуальные данные
      clearChildrenCache();
      return newChild;
    } catch (err) {
      setError('Не удалось добавить ребенка.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateChild = async (id: string, childData: Partial<Child>) => {
    setLoading(true);
    try {
      const updatedChild = await childrenApi.update(id, childData);
      setChildrenList((prev) =>
        prev.map((c) => (c.id === id ? updatedChild : c)),
      );
      // Очищаем кэш чтобы при следующем fetchChildren загрузились актуальные данные
      clearChildrenCache();
      return updatedChild;
    } catch (err) {
      setError('Не удалось обновить данные ребенка.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteChild = async (id: string) => {
    setLoading(true);
    try {
      await childrenApi.deleteItem(id);
      setChildrenList((prev) => prev.filter((c) => c.id !== id));
      // Очищаем кэш чтобы при следующем fetchChildren загрузились актуальные данные
      clearChildrenCache();
    } catch (err) {
      setError('Не удалось удалить ребенка.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChild = async (id: string) => {
    try {
      return await childrenApi.getById(id);
    } catch (err) {
      setError('Не удалось получить данные ребенка.');
      throw err;
    }
  };

  const generatePayments = async (date?: Date) => {
    try {
      return await childrenApi.generatePayments(date);
    } catch (err) {
      setError('Не удалось сгенерировать платежи.');
      throw err;
    }
  };

  const refreshChildren = async () => {
    await fetchChildren(true);
  };

  const value = useMemo(
    () => ({
      children: childrenList,
      loading,
      error,
      fetchChildren,
      createChild,
      updateChild,
      deleteChild,
      refreshChildren,
      getChild,
      generatePayments,
    }),
    [childrenList, loading, error, fetchChildren],
  );

  return (
    <ChildrenContext.Provider value={value}>
      {children}
    </ChildrenContext.Provider>
  );
};

export const useChildren = () => {
  const context = useContext(ChildrenContext);
  if (!context) {
    throw new Error('useChildren must be used within a ChildrenProvider');
  }
  return context;
};
