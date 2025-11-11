// ===== ЭКСПОРТ ВСЕХ API СЕРВИСОВ =====

// Основные API клиенты
export { default as usersApi } from './users';
export { default as groupsApi } from './groups';
export { default as shiftsApi } from './shifts';
export { default as authApi } from './auth';
export { default as childPaymentApi } from './childPayment';

// Экспорт функций для обратной совместимости
export * from './users';
export * from './groups';
export * from './shifts';
export * from './auth';
export * from './documents';

// Добавляем экспорт сервиса настроек

// Утилиты API
export {
  apiClient,
  createApiInstance,
  BaseApiClient,
  apiCache,
} from '../utils/api';

// Общие типы

// Утилиты форматирования и валидации
export * from '../utils/format';
export * from '../utils/validation';
