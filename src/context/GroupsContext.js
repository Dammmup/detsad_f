import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as groupsApi from '../services/api/groups';

export const GroupsContext = createContext();

// Cache for storing groups data
let groupsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState(groupsCache || []);
  const [loading, setLoading] = useState(!groupsCache);
  const [error, setError] = useState(null);

  // Fetch all groups with caching
  const fetchGroups = useCallback(async (force = false) => {
    // Return cached data if it's still valid
    const now = Date.now();
    if (!force && groupsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setGroups(groupsCache);
      return groupsCache;
    }

    try {
      setLoading(true);
      const data = await groupsApi.getGroups();
      
      // Update cache
      groupsCache = data;
      cacheTimestamp = now;
      
      setGroups(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Не удалось загрузить список групп. Пожалуйста, попробуйте позже.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load groups on mount or when fetchGroups changes
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Create a new group
  const createGroup = async (groupData) => {
    try {
      setLoading(true);
      const newGroup = await groupsApi.createGroup(groupData);
      setGroups(prevGroups => [...prevGroups, newGroup]);
      setError(null);
      return newGroup;
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Не удалось создать группу. Пожалуйста, проверьте введенные данные.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing group
  const updateGroup = async (id, groupData) => {
    try {
      setLoading(true);
      const updatedGroup = await groupsApi.updateGroup(id, groupData);
      setGroups(prevGroups => 
        prevGroups.map(group => (group.id === id ? updatedGroup : group))
      );
      setError(null);
      return updatedGroup;
    } catch (err) {
      console.error(`Failed to update group ${id}:`, err);
      setError('Не удалось обновить группу. Пожалуйста, попробуйте снова.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a group
  const deleteGroup = async (id) => {
    try {
      setLoading(true);
      await groupsApi.deleteGroup(id);
      setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
      setError(null);
    } catch (err) {
      console.error(`Failed to delete group ${id}:`, err);
      setError('Не удалось удалить группу. Пожалуйста, попробуйте снова.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get a single group by ID
  const getGroup = async (id) => {
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

  // Get teachers list
  const getTeachers = async () => {
    try {
      const teachers = await groupsApi.getTeachers();
      return teachers;
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError('Не удалось загрузить список воспитателей.');
      throw err;
    }
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
