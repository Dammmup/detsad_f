import { AxiosError } from 'axios';

/**
 * Извлекает понятное сообщение об ошибке из ошибки Axios или обычного исключения.
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Произошла неизвестная ошибка';

  if (typeof error === 'string') return error;

  if (error instanceof AxiosError) {
    // Ошибки, возвращаемые бэкендом (app.ts global handler) обычно в формате { error: string }
    const data = error.response?.data;
    
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.errors)) {
        // Если вдруг бэкенд вернет массив валидационных ошибок (express-validator)
        return data.errors.map((e: any) => e.msg || e.message).join('. ');
      }
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Ошибка сети. Проверьте соединение с интернетом.';
    }

    if (error.response?.status === 404) {
      return 'Запрашиваемый ресурс не найден.';
    }

    if (error.response?.status === 500) {
      return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
    }

    return error.message || 'Ошибка при общении с сервером.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
};
