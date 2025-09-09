import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  getUsers as getStaff,
  getUser as getStaffMember,
  createUser as createStaffApi,
  updateUser as updateStaffApi,
  deleteUser as deleteStaffApi,
  getUserRoles as getStaffRolesApi,
} from '../services/api/users';
import { User as StaffMember } from '../services/api/users';

// Типы действий
const STAFF_ACTIONS = {
  FETCH_STAFF_START: 'FETCH_STAFF_START',
  FETCH_STAFF_SUCCESS: 'FETCH_STAFF_SUCCESS',
  FETCH_STAFF_ERROR: 'FETCH_STAFF_ERROR',
  FETCH_STAFF_MEMBER_START: 'FETCH_STAFF_MEMBER_START',
  FETCH_STAFF_MEMBER_SUCCESS: 'FETCH_STAFF_MEMBER_SUCCESS',
  FETCH_STAFF_MEMBER_ERROR: 'FETCH_STAFF_MEMBER_ERROR',
  CREATE_STAFF_START: 'CREATE_STAFF_START',
  CREATE_STAFF_SUCCESS: 'CREATE_STAFF_SUCCESS',
  CREATE_STAFF_ERROR: 'CREATE_STAFF_ERROR',
  UPDATE_STAFF_START: 'UPDATE_STAFF_START',
  UPDATE_STAFF_SUCCESS: 'UPDATE_STAFF_SUCCESS',
  UPDATE_STAFF_ERROR: 'UPDATE_STAFF_ERROR',
  DELETE_STAFF_START: 'DELETE_STAFF_START',
  DELETE_STAFF_SUCCESS: 'DELETE_STAFF_SUCCESS',
  DELETE_STAFF_ERROR: 'DELETE_STAFF_ERROR',
  FETCH_ROLES_START: 'FETCH_ROLES_START',
  FETCH_ROLES_SUCCESS: 'FETCH_ROLES_SUCCESS',
  FETCH_ROLES_ERROR: 'FETCH_ROLES_ERROR',
  RESET_STAFF_STATE: 'RESET_STAFF_STATE',
};

// Начальное состояние
const initialState = {
  staff: [],
  currentStaff: null,
  roles: [],
  loading: false,
  error: null,
  loadingRoles: false,
  errorRoles: null,
};

// Редуктор
// Типы для стейта и экшенов

interface StaffState {
  staff: StaffMember[];
  currentStaff: StaffMember | null;
  loading: boolean;
  error: string | null;
  loadingRoles?: boolean;
  roles?: string[];
  errorRoles?: string | null;
}

interface StaffAction {
  type: string;
  payload?: any;
}

const staffReducer = (state: StaffState, action: StaffAction): StaffState => {
  switch (action.type) {
    case STAFF_ACTIONS.FETCH_STAFF_START:
      return { ...state, loading: true, error: null };
    case STAFF_ACTIONS.FETCH_STAFF_SUCCESS:
      return { ...state, loading: false, staff: action.payload };
    case STAFF_ACTIONS.FETCH_STAFF_ERROR:
      return { ...state, loading: false, error: action.payload };

    case STAFF_ACTIONS.FETCH_STAFF_MEMBER_START:
      return { ...state, loading: true, currentStaff: null, error: null };
    case STAFF_ACTIONS.FETCH_STAFF_MEMBER_SUCCESS:
      return { ...state, loading: false, currentStaff: action.payload };
    case STAFF_ACTIONS.FETCH_STAFF_MEMBER_ERROR:
      return { ...state, loading: false, error: action.payload };

    case STAFF_ACTIONS.CREATE_STAFF_START:
      return { ...state, loading: true, error: null };
    case STAFF_ACTIONS.CREATE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: [...state.staff, action.payload],
      };
    case STAFF_ACTIONS.CREATE_STAFF_ERROR:
      return { ...state, loading: false, error: action.payload };

    case STAFF_ACTIONS.UPDATE_STAFF_START:
      return { ...state, loading: true, error: null };
    case STAFF_ACTIONS.UPDATE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: state.staff.map((staff) =>
          staff.id === action.payload.id ? action.payload : staff
        ),
        currentStaff: action.payload,
      };
    case STAFF_ACTIONS.UPDATE_STAFF_ERROR:
      return { ...state, loading: false, error: action.payload };

    case STAFF_ACTIONS.DELETE_STAFF_START:
      return { ...state, loading: true, error: null };
    case STAFF_ACTIONS.DELETE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: state.staff.filter((staff) => staff.id !== action.payload),
        currentStaff: state.currentStaff?.id === action.payload ? null : state.currentStaff,
      };
    case STAFF_ACTIONS.DELETE_STAFF_ERROR:
      return { ...state, loading: false, error: action.payload };

    case STAFF_ACTIONS.FETCH_ROLES_START:
      return { ...state, loadingRoles: true, errorRoles: null };
    case STAFF_ACTIONS.FETCH_ROLES_SUCCESS:
      return { ...state, loadingRoles: false, roles: action.payload };
    case STAFF_ACTIONS.FETCH_ROLES_ERROR:
      return { ...state, loadingRoles: false, errorRoles: action.payload };

    case STAFF_ACTIONS.RESET_STAFF_STATE:
      return { ...initialState };

    default:
      return state;
  }
};

// Создание контекста
export const StaffContext = createContext(undefined);

// Провайдер контекста
export interface StaffProviderProps { children: React.ReactNode; }
export const StaffProvider = ({ children }: StaffProviderProps) => {
  const [state, dispatch] = useReducer(staffReducer, initialState);

  // Действия
  const fetchStaff = useCallback(async () => {
    dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_START });
    try {
      const data = await getStaff();
      dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_SUCCESS, payload: data });
      return data;
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

  const fetchStaffMember = useCallback(async (id: any) => {
    dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_MEMBER_START });
    try {
      const data = await getStaffMember(id);
      dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_MEMBER_SUCCESS, payload: data });
      return data;
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.FETCH_STAFF_MEMBER_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

  const addStaff = useCallback(async (staff: StaffMember) => {
    dispatch({ type: STAFF_ACTIONS.CREATE_STAFF_START });
    try {
      const data = await createStaffApi(staff);
      dispatch({ type: STAFF_ACTIONS.CREATE_STAFF_SUCCESS, payload: data });
      return data;
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.CREATE_STAFF_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

  const updateStaff = useCallback(async (id: string, staffData: StaffMember) => {
    dispatch({ type: STAFF_ACTIONS.UPDATE_STAFF_START });
    try {
      const data = await updateStaffApi(id, staffData);
      dispatch({ type: STAFF_ACTIONS.UPDATE_STAFF_SUCCESS, payload: data });
      return data;
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.UPDATE_STAFF_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

  const removeStaff = useCallback(async (id: string) => {
    dispatch({ type: STAFF_ACTIONS.DELETE_STAFF_START });
    try {
      await deleteStaffApi(id);
      dispatch({ type: STAFF_ACTIONS.DELETE_STAFF_SUCCESS, payload: id });
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.DELETE_STAFF_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

   const fetchRoles = useCallback(async () => {
    dispatch({ type: STAFF_ACTIONS.FETCH_ROLES_START });
    try {
      const data = await getStaffRolesApi();
      dispatch({ type: STAFF_ACTIONS.FETCH_ROLES_SUCCESS, payload: data });
      return data;
    } catch (error: unknown) {
      dispatch({ type: STAFF_ACTIONS.FETCH_ROLES_ERROR, payload: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, []);

  const resetStaffState = useCallback(() => {
    dispatch({ type: STAFF_ACTIONS.RESET_STAFF_STATE });
  }, []);

  const value = {
    ...state,
    fetchStaff,
    fetchStaffMember,
    addStaff,
    updateStaff,
    removeStaff,
    fetchRoles,
    resetStaffState,
  };

  return <StaffContext.Provider value={value as any}>{children}</StaffContext.Provider>;
};

// Хук для использования контекста
export const useStaff = () => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

