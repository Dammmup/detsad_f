// ===== ЭКСПОРТ ВСЕХ API СЕРВИСОВ =====

// Основные API клиенты
export { default as usersApi } from './users';
export { default as groupsApi } from './groups';
export { default as shiftsApi } from './shifts';
export { default as authApi } from './auth';

// Экспорт функций для обратной совместимости
export * from './users';
export * from './groups';
export * from './shifts';
export * from './auth';

// Утилиты API
export { apiClient, createApiInstance, BaseApiClient, apiCache } from '../../utils/api';

// Общие типы
export * from '../../types/common';

// Утилиты форматирования и валидации
export * from '../../utils/format';
export * from '../../utils/validation';