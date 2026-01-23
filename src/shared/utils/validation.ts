



export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};



export const isValidPhoneNumber = (phone: string): boolean => {

  const cleaned = phone.replace(/\D/g, '');


  return /^[78]\d{10}$/.test(cleaned);
};

export const isValidMobileNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');


  return /^[78](70|71|72|73|74|75|76|77|78)\d{7}$/.test(cleaned);
};



export const isValidIIN = (iin: string): boolean => {

  if (!/^\d{12}$/.test(iin)) {
    return false;
  }


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

export const parseIIN = (
  iin: string,
): {
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


  if (
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return { birthDate: null, gender: null, century: null };
  }

  return { birthDate, gender, century };
};



export const validatePassword = (
  password: string,
): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let score = 0;


  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  } else {
    score += 1;
  }


  if (!/[A-ZА-Я]/.test(password)) {
    errors.push('Пароль должен содержать заглавные буквы');
  } else {
    score += 1;
  }


  if (!/[a-zа-я]/.test(password)) {
    errors.push('Пароль должен содержать строчные буквы');
  } else {
    score += 1;
  }


  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  } else {
    score += 1;
  }


  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
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
    strength,
  };
};



export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date.toISOString().slice(0, 10) === dateString;
};

export const isValidTime = (timeString: string): boolean => {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
};

export const isNotFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return date <= today;
};

export const isNotTooOldDate = (
  dateString: string,
  maxYearsAgo: number = 100,
): boolean => {
  const date = new Date(dateString);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxYearsAgo);

  return date >= minDate;
};

export const isValidAgeRange = (
  birthDate: string,
  minAge: number = 0,
  maxAge: number = 120,
): boolean => {
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



export const isPositiveNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const isNonNegativeNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

export const isInRange = (value: any, min: number, max: number): boolean => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};



export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

export const isOnlyLettersAndSpaces = (value: string): boolean => {
  return /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(value);
};

export const isOnlyDigits = (value: string): boolean => {
  return /^\d+$/.test(value);
};



export const isValidFileType = (
  file: File,
  allowedTypes: string[],
): boolean => {
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const isValidFileExtension = (
  filename: string,
  allowedExtensions: string[],
): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};



export const validateUser = (userData: {
  fullName: string;
  email?: string;
  phone?: string;
  iin?: string;
  birthday?: string;
}): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};


  if (!isNotEmpty(userData.fullName)) {
    errors.fullName = ['ФИО обязательно для заполнения'];
  } else if (!hasMinLength(userData.fullName, 2)) {
    errors.fullName = ['ФИО должно содержать минимум 2 символа'];
  } else if (!isOnlyLettersAndSpaces(userData.fullName)) {
    errors.fullName = ['ФИО должно содержать только буквы и пробелы'];
  }


  if (userData.email && !isValidEmail(userData.email)) {
    errors.email = ['Некорректный email адрес'];
  }


  if (userData.phone && !isValidPhoneNumber(userData.phone)) {
    errors.phone = ['Некорректный номер телефона'];
  }


  if (userData.iin && !isValidIIN(userData.iin)) {
    errors.iin = ['Некорректный ИИН'];
  }


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
    errors,
  };
};

export const validateGroup = (groupData: {
  name: string;
  description?: string;
  maxStudents?: number;
  ageGroup: string[];
}): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};


  if (!isNotEmpty(groupData.name)) {
    errors.name = ['Название группы обязательно для заполнения'];
  } else if (!hasMinLength(groupData.name, 2)) {
    errors.name = ['Название группы должно содержать минимум 2 символа'];
  }


  if (
    groupData.maxStudents !== undefined &&
    !isPositiveNumber(groupData.maxStudents)
  ) {
    errors.maxStudents = [
      'Максимальное количество студентов должно быть положительным числом',
    ];
  }


  if (!groupData.ageGroup || groupData.ageGroup.length === 0) {
    errors.ageGroup = ['Необходимо указать возрастную группу'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};



export const createFieldValidator = (
  validators: Array<(value: any) => string | null>,
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

export const fieldValidators = {
  required:
    (message: string = 'Поле обязательно для заполнения') =>
      (value: any) =>
        !value || (typeof value === 'string' && !isNotEmpty(value))
          ? message
          : null,

  minLength: (length: number, message?: string) => (value: string) =>
    !hasMinLength(value, length)
      ? message || `Минимальная длина: ${length} символов`
      : null,

  maxLength: (length: number, message?: string) => (value: string) =>
    !hasMaxLength(value, length)
      ? message || `Максимальная длина: ${length} символов`
      : null,

  email:
    (message: string = 'Некорректный email адрес') =>
      (value: string) =>
        value && !isValidEmail(value) ? message : null,

  phone:
    (message: string = 'Некорректный номер телефона') =>
      (value: string) =>
        value && !isValidPhoneNumber(value) ? message : null,

  iin:
    (message: string = 'Некорректный ИИН') =>
      (value: string) =>
        value && !isValidIIN(value) ? message : null,

  positiveNumber:
    (message: string = 'Значение должно быть положительным числом') =>
      (value: any) =>
        value && !isPositiveNumber(value) ? message : null,

  dateNotFuture:
    (message: string = 'Дата не может быть в будущем') =>
      (value: string) =>
        value && !isNotFutureDate(value) ? message : null,
};
