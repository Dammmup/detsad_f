import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:8080/api';

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Интерфейс для активности в циклограмме
export interface CyclogramActivity {
  id?: string;
  name: string;
  description?: string;
  duration: number; // в минутах
  type: 'educational' | 'physical' | 'creative' | 'rest' | 'meal' | 'hygiene' | 'outdoor';
  ageGroup: string; // например: "3-4", "4-5", "5-6"
  materials?: string[];
  goals?: string[];
  methods?: string[];
}

// Интерфейс для временного слота в циклограмме
export interface CyclogramTimeSlot {
  id?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: CyclogramActivity;
  dayOfWeek: number; // 1-7 (понедельник-воскресенье)
  groupId?: string;
  teacherId?: string;
  notes?: string;
}

// Интерфейс для недельной циклограммы
export interface WeeklyCyclogram {
  id?: string;
  title: string;
  description?: string;
  ageGroup: string;
  groupId: string;
  teacherId: string;
  weekStartDate: string; // YYYY-MM-DD
  timeSlots: CyclogramTimeSlot[];
  status: 'draft' | 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

// Интерфейс для шаблона циклограммы
export interface CyclogramTemplate {
  id?: string;
  name: string;
  description?: string;
  ageGroup: string;
  timeSlots: Omit<CyclogramTimeSlot, 'id' | 'groupId' | 'teacherId'>[];
  isDefault: boolean;
  createdAt?: string;
}

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 429 (Too Many Requests), wait and retry
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 2; // Default to 2 seconds
      
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);
  
  // Create a more detailed error object
  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  throw apiError;
};

// Add delay between requests to prevent rate limiting
const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all cyclograms
 * @param {string} groupId - Optional group ID to filter
 * @returns {Promise<WeeklyCyclogram[]>} List of cyclograms
 */
export const getCyclograms = async (groupId?: string) => {
  try {
    const params: any = {};
    if (groupId) params.groupId = groupId;
    const response = await api.get('/cyclogram', { params });
    const cyclograms: WeeklyCyclogram[] = response.data.map((item: any) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      ageGroup: item.ageGroup,
      groupId: item.groupId,
      teacherId: item.teacherId,
      weekStartDate: item.weekStartDate,
      timeSlots: item.timeSlots,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    return cyclograms;
  } catch (error) {
    return handleApiError(error, 'fetching cyclograms');
  }
};

/**
 * Get a single cyclogram by ID
 * @param {string} id - Cyclogram ID
 * @returns {Promise<WeeklyCyclogram>} Cyclogram data
 */
export const getCyclogram = async (id: string) => {
  try {
    const response = await api.get(`/cyclogram/${id}`);
    const cyclogram: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return cyclogram;
  } catch (error) {
    return handleApiError(error, `fetching cyclogram ${id}`);
  }
};

/**
 * Create a new cyclogram
 * @param {WeeklyCyclogram} cyclogram - Cyclogram data to create
 * @returns {Promise<WeeklyCyclogram>} Created cyclogram
 */
export const createCyclogram = async (cyclogram: WeeklyCyclogram) => {
  try {
    const response = await api.post('/cyclogram', cyclogram);
    const created: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return created;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram');
  }
};

/**
 * Update an existing cyclogram
 * @param {string} id - Cyclogram ID
 * @param {WeeklyCyclogram} cyclogram - Updated cyclogram data
 * @returns {Promise<WeeklyCyclogram>} Updated cyclogram
 */
export const updateCyclogram = async (id: string, cyclogram: WeeklyCyclogram) => {
  try {
    const response = await api.put(`/cyclogram/${id}`, cyclogram);
    const updated: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return updated;
  } catch (error) {
    return handleApiError(error, `updating cyclogram ${id}`);
  }
};

/**
 * Delete a cyclogram
 * @param {string} id - Cyclogram ID
 * @returns {Promise<void>}
 */
export const deleteCyclogram = async (id: string) => {
  try {
    await api.delete(`/cyclogram/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting cyclogram ${id}`);
  }
};

/**
 * Get cyclogram templates
 * @param {string} ageGroup - Optional age group to filter
 * @returns {Promise<CyclogramTemplate[]>} List of templates
 */
export const getCyclogramTemplates = async (ageGroup?: string) => {
  try {
    await delay(300);
    
    // Моковые данные для тестирования
    const mockTemplates: CyclogramTemplate[] = generateMockTemplates();
    
    const filteredTemplates = ageGroup 
      ? mockTemplates.filter(t => t.ageGroup === ageGroup)
      : mockTemplates;
    
    return filteredTemplates;
  } catch (error) {
    return handleApiError(error, 'fetching cyclogram templates');
  }
};

/**
 * Create cyclogram from template
 * @param {string} templateId - Template ID
 * @param {object} params - Parameters for creating cyclogram
 * @returns {Promise<WeeklyCyclogram>} Created cyclogram
 */
export const createCyclogramFromTemplate = async (
  templateId: string, 
  params: {
    title: string;
    groupId: string;
    teacherId: string;
    weekStartDate: string;
  }
) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post(`/cyclograms/from-template/${templateId}`, params);
    
    // Моковые данные для тестирования
    const templates = generateMockTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Шаблон не найден');
    }
    
    const mockCyclogram: WeeklyCyclogram = {
      id: Math.random().toString(36).substring(2, 15),
      title: params.title,
      description: `Создано из шаблона: ${template.name}`,
      ageGroup: template.ageGroup,
      groupId: params.groupId,
      teacherId: params.teacherId,
      weekStartDate: params.weekStartDate,
      timeSlots: template.timeSlots.map(slot => ({
        ...slot,
        id: Math.random().toString(36).substring(2, 15),
        groupId: params.groupId,
        teacherId: params.teacherId
      })),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return mockCyclogram;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram from template');
  }
};

/**
 * Generate mock cyclograms for testing
 */
const generateMockCyclograms = (): WeeklyCyclogram[] => {
  return [
    {
      id: '1',
      title: 'Циклограмма для средней группы (4-5 лет) - Неделя 1',
      description: 'Стандартная циклограмма для детей 4-5 лет согласно требованиям МОН РК',
      ageGroup: '4-5',
      groupId: '1',
      teacherId: '2',
      weekStartDate: '2025-09-08',
      timeSlots: generateMockTimeSlots(),
      status: 'active',
      createdAt: '2025-09-01T00:00:00',
      updatedAt: '2025-09-07T00:00:00'
    },
    {
      id: '2',
      title: 'Циклограмма для старшей группы (5-6 лет) - Неделя 1',
      description: 'Циклограмма для подготовительной группы',
      ageGroup: '5-6',
      groupId: '2',
      teacherId: '3',
      weekStartDate: '2025-09-08',
      timeSlots: generateMockTimeSlots(),
      status: 'active',
      createdAt: '2025-09-01T00:00:00',
      updatedAt: '2025-09-07T00:00:00'
    }
  ];
};

/**
 * Generate mock time slots for testing
 */
const generateMockTimeSlots = (): CyclogramTimeSlot[] => {
  const activities: CyclogramActivity[] = [
    {
      id: '1',
      name: 'Утренняя гимнастика',
      description: 'Комплекс упражнений для пробуждения организма',
      duration: 15,
      type: 'physical',
      ageGroup: '4-5',
      materials: ['коврики', 'музыкальное сопровождение'],
      goals: ['развитие координации', 'укрепление здоровья'],
      methods: ['показ', 'объяснение', 'совместное выполнение']
    },
    {
      id: '2',
      name: 'Завтрак',
      description: 'Прием пищи с соблюдением культуры питания',
      duration: 30,
      type: 'meal',
      ageGroup: '4-5',
      goals: ['формирование культуры питания', 'получение энергии']
    },
    {
      id: '3',
      name: 'Развитие речи',
      description: 'Занятие по развитию речевых навыков',
      duration: 25,
      type: 'educational',
      ageGroup: '4-5',
      materials: ['картинки', 'книги', 'дидактические игры'],
      goals: ['развитие словарного запаса', 'формирование связной речи'],
      methods: ['беседа', 'игра', 'рассказывание']
    },
    {
      id: '4',
      name: 'Прогулка',
      description: 'Активный отдых на свежем воздухе',
      duration: 60,
      type: 'outdoor',
      ageGroup: '4-5',
      goals: ['укрепление здоровья', 'наблюдение за природой'],
      methods: ['наблюдение', 'подвижные игры', 'труд в природе']
    },
    {
      id: '5',
      name: 'Обед',
      description: 'Основной прием пищи',
      duration: 40,
      type: 'meal',
      ageGroup: '4-5'
    },
    {
      id: '6',
      name: 'Дневной сон',
      description: 'Отдых для восстановления сил',
      duration: 120,
      type: 'rest',
      ageGroup: '4-5'
    }
  ];

  const timeSlots: CyclogramTimeSlot[] = [];
  
  // Генерируем расписание для понедельника (dayOfWeek = 1)
  const mondaySchedule = [
    { startTime: '08:00', endTime: '08:15', activityIndex: 0 }, // Утренняя гимнастика
    { startTime: '08:15', endTime: '08:45', activityIndex: 1 }, // Завтрак
    { startTime: '09:00', endTime: '09:25', activityIndex: 2 }, // Развитие речи
    { startTime: '09:30', endTime: '10:30', activityIndex: 3 }, // Прогулка
    { startTime: '12:00', endTime: '12:40', activityIndex: 4 }, // Обед
    { startTime: '13:00', endTime: '15:00', activityIndex: 5 }, // Дневной сон
  ];

  mondaySchedule.forEach((slot, index) => {
    timeSlots.push({
      id: `slot_${index + 1}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      activity: activities[slot.activityIndex],
      dayOfWeek: 1, // Понедельник
      notes: ''
    });
  });

  return timeSlots;
};

/**
 * Generate mock templates for testing
 */
const generateMockTemplates = (): CyclogramTemplate[] => {
  return [
    {
      id: 'template_1',
      name: 'Стандартная циклограмма для средней группы (4-5 лет)',
      description: 'Базовый шаблон согласно требованиям МОН РК для детей 4-5 лет',
      ageGroup: '4-5',
      timeSlots: generateMockTimeSlots().map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        activity: slot.activity,
        dayOfWeek: slot.dayOfWeek,
        notes: slot.notes
      })),
      isDefault: true,
      createdAt: '2025-09-01T00:00:00'
    },
    {
      id: 'template_2',
      name: 'Стандартная циклограмма для старшей группы (5-6 лет)',
      description: 'Базовый шаблон для подготовительной группы',
      ageGroup: '5-6',
      timeSlots: generateMockTimeSlots().map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        activity: slot.activity,
        dayOfWeek: slot.dayOfWeek,
        notes: slot.notes
      })),
      isDefault: true,
      createdAt: '2025-09-01T00:00:00'
    }
  ];
};
