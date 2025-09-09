// Main application configuration and setup
export { App } from './components/App';

// Re-export main contexts for easy access
export { GroupsProvider, useGroups } from './components/context/GroupsContext';
export { StaffProvider, useStaff } from './components/context/StaffContext';
export { useUserState } from './components/context/UserContext';

// Re-export main services
export * as groupsApi from './components/services/api/groups';
export * as usersApi from './components/services/api/users';

// Configuration
export { default as config } from './config';
