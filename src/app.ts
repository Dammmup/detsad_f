// Main application configuration and setup
export { App } from './components/App';

// Re-export main contexts for easy access
export { GroupsProvider, useGroups } from './components/context/GroupsContext';
// StaffContext removed during refactoring
// UserContext removed during refactoring

// Re-export main services
export * as groupsApi from './services/groups';
export * as usersApi from './services/users';

// Configuration
// export { default as config } from './config';
