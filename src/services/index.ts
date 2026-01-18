// Re-export services from new module structure
export { userApi, getUsers, createUser, updateUser, deleteUser } from '../modules/staff/services/users';
export { groupsApi, getGroups, createGroup, updateGroup, deleteGroup, getGroup, getTeachers } from '../modules/children/services/groups';
export { shiftsApi, getShifts, getStaffShifts } from '../modules/staff/services/shifts';
export { authApi, login, logout, isAuthenticated, getCurrentUser } from '../modules/staff/services/auth';
export { default as childPaymentApi } from '../modules/children/services/childPayment';
export { generateAndDownloadDocument } from '../modules/documents/services/documentGenerator';

// Re-export from shared utils
export {
  apiClient,
  createApiInstance,
  BaseCrudApiClient as BaseApiClient,
  apiCache,
} from '../shared/utils/api';

export * from '../shared/utils/format';
export * from '../shared/utils/validation';
