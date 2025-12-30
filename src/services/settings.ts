import { apiClient } from '../utils/api';









interface ApiError extends Error {
  status?: number;
  data?: any;
}
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationSettings {
  enabled: boolean;
  coordinates: Coordinates;
  radius: number;
}

export interface KindergartenSettings {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  timezone: string;
  language: string;
  currency: string;
  payroll?: {
    latePenaltyRate: number;
  };
  holidays?: string[];
}


export interface NotificationSettings {
  id?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lateArrivalAlert: boolean;
  absenceAlert: boolean;
  overtimeAlert: boolean;
  reportReminders: boolean;
}


export interface SecuritySettings {
  id?: string;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
}


export interface GeolocationSettings {
  id?: string;
  enabled: boolean;
  radius: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  yandexApiKey?: string;
  strictMode: boolean;
  allowedDevices: string[];
}


export interface User {
  id?: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  permissions: string[];
}


const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);


  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};


export const settingsService = {

  getGeolocationSettings: () =>
    apiClient.get<GeolocationSettings>('/settings/geolocation'),
  updateGeolocationSettings: (data: Partial<GeolocationSettings>) =>
    apiClient.put<GeolocationSettings>('/settings/geolocation', data),
  updateCoordinates: (latitude: number, longitude: number) =>
    apiClient.put<GeolocationSettings>('/settings/geolocation/coordinates', {
      latitude,
      longitude,
    }),
  updateRadius: (radius: number) =>
    apiClient.put<GeolocationSettings>('/settings/geolocation/radius', {
      radius,
    }),


  getKindergartenSettings: () =>
    apiClient.get<KindergartenSettings>('/settings/kindergarten'),
  updateKindergartenSettings: (data: Partial<KindergartenSettings>) =>
    apiClient.put<KindergartenSettings>('/settings/kindergarten', data),


  isNonWorkingDay: (dateStr: string) =>
    apiClient.get<{ isNonWorkingDay: boolean }>(
      `/settings/is-non-working-day/${dateStr}`,
    ),
};

export const getKindergartenSettings = async () => {
  try {
    console.log('Fetching kindergarten settings from API...');

    const response = await apiClient.get('/settings/kindergarten');

    const settings: KindergartenSettings = {
      id: response.data._id,
      name: response.data.name,
      address: response.data.address,
      phone: response.data.phone,
      email: response.data.email,
      director: response.data.director,
      workingHours: {
        start: response.data.workingHours?.start || '08:00',
        end: response.data.workingHours?.end || '18:00',
      },
      workingDays: response.data.workingDays || [],
      timezone: response.data.timezone,
      language: response.data.language,
      currency: response.data.currency,
      payroll: {
        latePenaltyRate: response.data.payroll?.latePenaltyRate || 50,
      }
    };

    console.log('Kindergarten settings data:', settings);
    return settings;
  } catch (error) {
    console.error('Error in getKindergartenSettings:', error);
    return handleApiError(error, 'fetching kindergarten settings');
  }
};

export const updateKindergartenSettings = async (
  settings: KindergartenSettings,
) => {
  try {
    const response = await apiClient.put('/settings/kindergarten', {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      director: settings.director,
      workingHours: settings.workingHours,
      workingDays: settings.workingDays,
      timezone: settings.timezone,
      language: settings.language,
      currency: settings.currency,
      payroll: settings.payroll,
    });

    const updatedSettings: KindergartenSettings = {
      id: response.data._id,
      name: response.data.name,
      address: response.data.address,
      phone: response.data.phone,
      email: response.data.email,
      director: response.data.director,
      workingHours: {
        start: response.data.workingHours?.start || '08:00',
        end: response.data.workingHours?.end || '18:00',
      },
      workingDays: response.data.workingDays || [],
      timezone: response.data.timezone,
      language: response.data.language,
      currency: response.data.currency,
      payroll: {
        latePenaltyRate: response.data.payroll?.latePenaltyRate || 50,
      }
    };

    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating kindergarten settings');
  }
};

export const getNotificationSettings = async () => {
  try {
    const response = await apiClient.get('/settings/notifications');

    const settings: NotificationSettings = {
      id: response.data._id,
      emailNotifications: response.data.emailNotifications ?? true,
      smsNotifications: response.data.smsNotifications ?? false,
      pushNotifications: response.data.pushNotifications ?? true,
      lateArrivalAlert: response.data.lateArrivalAlert ?? true,
      absenceAlert: response.data.absenceAlert ?? true,
      overtimeAlert: response.data.overtimeAlert ?? true,
      reportReminders: response.data.reportReminders ?? true,
    };

    return settings;
  } catch (error) {
    return handleApiError(error, 'fetching notification settings');
  }
};

export const updateNotificationSettings = async (
  settings: NotificationSettings,
) => {
  try {
    const response = await apiClient.put('/settings/notifications', settings);

    const updatedSettings: NotificationSettings = {
      id: response.data._id,
      emailNotifications: response.data.emailNotifications ?? true,
      smsNotifications: response.data.smsNotifications ?? false,
      pushNotifications: response.data.pushNotifications ?? true,
      lateArrivalAlert: response.data.lateArrivalAlert ?? true,
      absenceAlert: response.data.absenceAlert ?? true,
      overtimeAlert: response.data.overtimeAlert ?? true,
      reportReminders: response.data.reportReminders ?? true,
    };

    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating notification settings');
  }
};

export const getSecuritySettings = async () => {
  try {
    const response = await apiClient.get('/settings/security');

    const settings: SecuritySettings = {
      id: response.data._id,
      passwordPolicy: {
        minLength: response.data.passwordPolicy?.minLength ?? 8,
        requireUppercase:
          response.data.passwordPolicy?.requireUppercase ?? true,
        requireLowercase:
          response.data.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: response.data.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars:
          response.data.passwordPolicy?.requireSpecialChars ?? false,
      },
      sessionTimeout: response.data.sessionTimeout ?? 60,
      twoFactorAuth: response.data.twoFactorAuth ?? false,
      ipWhitelist: response.data.ipWhitelist || [],
      maxLoginAttempts: response.data.maxLoginAttempts ?? 5,
    };

    return settings;
  } catch (error) {
    return handleApiError(error, 'fetching security settings');
  }
};

export const updateSecuritySettings = async (settings: SecuritySettings) => {
  try {
    const response = await apiClient.put('/settings/security', settings);

    const updatedSettings: SecuritySettings = {
      id: response.data._id,
      passwordPolicy: {
        minLength: response.data.passwordPolicy?.minLength ?? 8,
        requireUppercase:
          response.data.passwordPolicy?.requireUppercase ?? true,
        requireLowercase:
          response.data.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: response.data.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars:
          response.data.passwordPolicy?.requireSpecialChars ?? false,
      },
      sessionTimeout: response.data.sessionTimeout ?? 60,
      twoFactorAuth: response.data.twoFactorAuth ?? false,
      ipWhitelist: response.data.ipWhitelist || [],
      maxLoginAttempts: response.data.maxLoginAttempts ?? 5,
    };

    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating security settings');
  }
};

export const getGeolocationSettings = async () => {
  try {
    const response = await apiClient.get('/settings/geolocation');

    const settings: GeolocationSettings = {
      id: response.data._id,
      enabled: response.data.enabled ?? false,
      radius: response.data.radius ?? 100,
      coordinates: {
        latitude: response.data.coordinates?.latitude ?? 0,
        longitude: response.data.coordinates?.longitude ?? 0,
      },
      yandexApiKey: response.data.yandexApiKey,
      strictMode: response.data.strictMode ?? false,
      allowedDevices: response.data.allowedDevices || [],
    };

    return settings;
  } catch (error) {
    return handleApiError(error, 'fetching geolocation settings');
  }
};

export const updateGeolocationSettings = async (
  settings: GeolocationSettings,
) => {
  try {
    const response = await apiClient.put('/settings/geolocation', {
      ...settings,
    });

    const updatedSettings: GeolocationSettings = {
      id: response.data._id,
      enabled: response.data.enabled ?? false,
      radius: response.data.radius ?? 100,
      coordinates: {
        latitude: response.data.coordinates?.latitude ?? 0,
        longitude: response.data.coordinates?.longitude ?? 0,
      },
      yandexApiKey: response.data.yandexApiKey,
      strictMode: response.data.strictMode ?? false,
      allowedDevices: response.data.allowedDevices || [],
    };

    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating geolocation settings');
  }
};

export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users');

    const users: User[] = response.data.map((user: any) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.active,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      permissions: [],
    }));

    return users;
  } catch (error) {
    return handleApiError(error, 'fetching users');
  }
};

export const createUser = async (user: User) => {
  try {
    const response = await apiClient.post('/users', user);

    const newUser: User = {
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
      fullName: response.data.fullName,
      role: response.data.role,
      isActive: response.data.active,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      permissions: [],
    };

    return newUser;
  } catch (error) {
    return handleApiError(error, 'creating user');
  }
};

export const updateUser = async (id: string, user: User) => {
  try {
    const response = await apiClient.put(`/users/${id}`, user);

    const updatedUser: User = {
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
      fullName: response.data.fullName,
      role: response.data.role,
      isActive: response.data.active,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      permissions: [],
    };

    return updatedUser;
  } catch (error) {
    return handleApiError(error, `updating user ${id}`);
  }
};

export const deleteUser = async (id: string) => {
  try {
    await apiClient.delete(`/users/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting user ${id}`);
  }
};


export { apiClient as api };
