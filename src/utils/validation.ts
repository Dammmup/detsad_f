// ===== УТИЛИТЫ ДЛЯ ВАЛИДАЦИИ =====

// ===== ВАЛИДАЦИЯ EMAIL =====

/**
 * Проверка корректности email адреса
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ===== ВАЛИДАЦИЯ ТЕЛЕФОНОВ =====

/**
 * Проверка корректности номера телефона (казахстанский формат)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Удаляем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Проверяем казахстанские номера: +7XXXXXXXXXX или 8XXXXXXXXXX
  return /^[78]\d{10}$/.test(cleaned);
};

/**
 * Проверка корректности мобильного номера Казахстана
 */
export const isValidMobileNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Казахстанские мобильные операторы: 70X, 71X, 72X, 73X, 74X, 75X, 76X, 77X, 78X
  return /^[78](70|71|72|73|74|75|76|77|78)\d{7}$/.test(cleaned);
};

// ===== ВАЛИДАЦИЯ ИИН =====

/**
 * Проверка корректности ИИН (Индивидуальный идентификационный номер)
 */
export const isValidIIN = (iin: string): boolean => {
  // ИИН должен содержать только цифры и быть длиной 12 символов
  if (!/^\d{12}$/.test(iin)) {
    return false;
  }
  
  // Проверка контрольной суммы
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(iin[i]) * weights1[i];
  }
  
  let controlDigit = sum % 11;
  
  if (controlDigit === 10) {
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(iin[i]) * weights2[i];
    }
    controlDigit = sum % 11;
    
    if (controlDigit === 10) {
      return false;
    }
  }
  
  return controlDigit === parseInt(iin[11]);
};

/**
 * Получение информации из ИИН
 */
export const parseIIN = (iin: string): {
  birthDate: Date | null;
  gender: 'male' | 'female' | null;
  century: number | null;
} => {
  if (!isValidIIN(iin)) {
    return { birthDate: null, gender: null, century: null };
  }
  
  const year = parseInt(iin.substring(0, 2));
  const month = parseInt(iin.substring(2, 4));
  const day = parseInt(iin.substring(4, 6));
  const genderDigit = parseInt(iin[6]);
  
  // Определение века и пола
  let century: number;
  let gender: 'male' | 'female';
  
  if (genderDigit >= 1 && genderDigit <= 2) {
    century = 19;
    gender = genderDigit === 1 ? 'male' : 'female';
  } else if (genderDigit >= 3 && genderDigit <= 4) {
    century = 20;
    gender = genderDigit === 3 ? 'male' : 'female';
  } else if (genderDigit >= 5 && genderDigit <= 6) {
    century = 21;
    gender = genderDigit === 5 ? 'male' : 'female';
  } else {
    return { birthDate: null, gender: null, century: null };
  }
  
  const fullYear = century * 100 + year;
  const birthDate = new Date(fullYear, month - 1, day);
  
  // Проверка корректности даты
  if (birthDate.getFullYear() !== fullYear || 
      birthDate.getMonth() !== month - 1 || 
      birthDate.getDate() !== day) {
    return { birthDate: null, gender: null, century: null };
  }
  
  return { birthDate, gender, century };
};

// ===== ВАЛИДАЦИЯ ПАРОЛЕЙ =====

/**
 * Проверка силы пароля
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let score = 0;
  
  // Минимальная длина
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  } else {
    score += 1;
  }
  
  // Заглавные буквы
  if (!/[A-ZА-Я]/.test(password)) {
    errors.push('Пароль должен содержать заглавные буквы');
  } else {
    score += 1;
  }
  
  // Строчные буквы
  if (!/[a-zа-я]/.test(password)) {
    errors.push('Пароль должен содержать строчные буквы');
  } else {
    score += 1;
  }
  
  // Цифры
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  } else {
    score += 1;
  }
  
  // Специальные символы
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать специальные символы');
  } else {
    score += 1;
  }
  
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

// ===== ВАЛИДАЦИЯ ДАТА И ВРЕМЕНИ =====

/**
 * Проверка корректности даты в формате YYYY-MM-DD
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10) === dateString;
};

/**
 * Проверка корректности времени в формате HH:MM
 */
export const isValidTime = (timeString: string): boolean => {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
};

/**
 * Проверка, что дата не в будущем
 */
export const isNotFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Конец сегодняшнего дня
  
  return date <= today;
};

/**
 * Проверка, что дата не слишком старая
 */
export const isNotTooOldDate = (dateString: string, maxYearsAgo: number = 100): boolean => {
  const date = new Date(dateString);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxYearsAgo);
  
  return date >= minDate;
};

/**
 * Проверка корректности возрастного диапазона
 */
export const isValidAgeRange = (birthDate: string, minAge: number = 0, maxAge: number = 120): boolean => {
  if (!isValidDate(birthDate)) {
    return false;
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge && age <= maxAge;
};

// ===== ВАЛИДАЦИЯ ЧИСЕЛ =====

/**
 * Проверка, что значение является положительным числом
 */
export const isPositiveNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Проверка, что значение является неотрицательным числом
 */
export const isNonNegativeNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Проверка, что значение находится в диапазоне
 */
export const isInRange = (value: any, min: number, max: number): boolean => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

// ===== ВАЛИДАЦИЯ СТРОК =====

/**
 * Проверка, что строка не пустая
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Проверка минимальной длины строки
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Проверка максимальной длины строки
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Проверка, что строка содержит только буквы и пробелы
 */
export const isOnlyLettersAndSpaces = (value: string): boolean => {
  return /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(value);
};

/**
 * Проверка, что строка содержит только цифры
 */
export const isOnlyDigits = (value: string): boolean => {
  return /^\d+$/.test(value);
};

// ===== ВАЛИДАЦИЯ ФАЙЛОВ =====

/**
 * Проверка типа файла
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Проверка размера файла
 */
export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Проверка расширения файла
 */
export const isValidFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

// ===== КОМПЛЕКСНАЯ ВАЛИДАЦИЯ =====

/**
 * Валидация данных пользователя
 */
export const validateUser = (userData: {
  fullName: string;
  email?: string;
  phone?: string;
  iin?: string;
  birthday?: string;
}): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  
  // Проверка ФИО
  if (!isNotEmpty(userData.fullName)) {
    errors.fullName = ['ФИО обязательно для заполнения'];
  } else if (!hasMinLength(userData.fullName, 2)) {
    errors.fullName = ['ФИО должно содержать минимум 2 символа'];
  } else if (!isOnlyLettersAndSpaces(userData.fullName)) {
    errors.fullName = ['ФИО должно содержать только буквы и пробелы'];
  }
  
  // Проверка email
  if (userData.email && !isValidEmail(userData.email)) {
    errors.email = ['Некорректный email адрес'];
  }
  
  // Проверка телефона
  if (userData.phone && !isValidPhoneNumber(userData.phone)) {
    errors.phone = ['Некорректный номер телефона'];
  }
  
  // Проверка ИИН
  if (userData.iin && !isValidIIN(userData.iin)) {
    errors.iin = ['Некорректный ИИН'];
  }
  
  // Проверка даты рождения
  if (userData.birthday) {
    if (!isValidDate(userData.birthday)) {
      errors.birthday = ['Некорректная дата рождения'];
    } else if (!isNotFutureDate(userData.birthday)) {
      errors.birthday = ['Дата рождения не может быть в будущем'];
    } else if (!isValidAgeRange(userData.birthday, 0, 120)) {
      errors.birthday = ['Некорректный возраст'];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Валидация данных группы
 */
export const validateGroup = (groupData: {
  name: string;
  description?: string;
  maxStudents?: number;
  ageGroup: string[];
}): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  
  // Проверка названия
  if (!isNotEmpty(groupData.name)) {
    errors.name = ['Название группы обязательно для заполнения'];
  } else if (!hasMinLength(groupData.name, 2)) {
    errors.name = ['Название группы должно содержать минимум 2 символа'];
  }
  
  // Проверка максимального количества студентов
  if (groupData.maxStudents !== undefined && !isPositiveNumber(groupData.maxStudents)) {
    errors.maxStudents = ['Максимальное количество студентов должно быть положительным числом'];
  }
  
  // Проверка возрастной группы
  if (!groupData.ageGroup || groupData.ageGroup.length === 0) {
    errors.ageGroup = ['Необходимо указать возрастную группу'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ===== УТИЛИТЫ ДЛЯ ФОРМ =====

/**
 * Создание валидатора для поля формы
 */
export const createFieldValidator = (
  validators: Array<(value: any) => string | null>
) => {
  return (value: any): string[] => {
    const errors: string[] = [];
    
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors.push(error);
      }
    }
    
    return errors;
  };
};

/**
 * Базовые валидаторы для полей
 */
export const fieldValidators = {
  required: (message: string = 'Поле обязательно для заполнения') => 
    (value: any) => (!value || (typeof value === 'string' && !isNotEmpty(value))) ? message : null,
    
  minLength: (length: number, message?: string) => 
    (value: string) => !hasMinLength(value, length) ? 
      (message || `Минимальная длина: ${length} символов`) : null,
      
  maxLength: (length: number, message?: string) => 
    (value: string) => !hasMaxLength(value, length) ? 
      (message || `Максимальная длина: ${length} символов`) : null,
      
  email: (message: string = 'Некорректный email адрес') => 
    (value: string) => value && !isValidEmail(value) ? message : null,
    
  phone: (message: string = 'Некорректный номер телефона') => 
    (value: string) => value && !isValidPhoneNumber(value) ? message : null,
    
  iin: (message: string = 'Некорректный ИИН') => 
    (value: string) => value && !isValidIIN(value) ? message : null,
    
  positiveNumber: (message: string = 'Значение должно быть положительным числом') => 
    (value: any) => value && !isPositiveNumber(value) ? message : null,
    
  dateNotFuture: (message: string = 'Дата не может быть в будущем') => 
    (value: string) => value && !isNotFutureDate(value) ? message : null
};