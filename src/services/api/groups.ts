import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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
    if (token) {
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

// Add delay between requests to prevent rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle API errors
const handleApiError = (error, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);
  
  // Create a more detailed error object
  const apiError = new Error(`Error ${context}: ${errorMessage}`);
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  throw apiError;
};

/**
 * Get all courses (groups)
 * @returns {Promise<Array>} List of courses/groups
 */
// Cache for groups data
let cachedGroups = null;

export const getGroups = async () => {
  try {
    await delay(300);
    const response = await api.get('/groups');
    cachedGroups = response.data;
    return cachedGroups;
  } catch (error) {
    return handleApiError(error, 'fetching groups');
  }
};

/**
 * Get a single course (group) by ID
 * @param {string} id - Course/Group ID
 * @returns {Promise<Object>} Course/Group data
 */
export const getGroup = async (id) => {
  try {
    // Try to get from cache first
    if (cachedGroups) {
      const cachedGroup = cachedGroups.find(group => group._id === id);
      if (cachedGroup) return cachedGroup;
    }
    
    await delay(300);
    const response = await api.get(`/groups/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `fetching group ${id}`);
  }
};

/**
 * Create a new course (group)
 * @param {Object} groupData - Course/Group data to create
 * @returns {Promise<Object>} Created course/group data
 */
export const createGroup = async (groupData) => {
  try {
    await delay(500); // Longer delay for write operations
    const response = await api.post('/groups', groupData);
    // Invalidate cache
    cachedGroups = null;
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating group');
  }
};

/**
 * Update an existing course (group)
 * @param {string} id - Course/Group ID to update
 * @param {Object} groupData - Updated course/group data
 * @returns {Promise<Object>} Updated course/group data
 */
export const updateGroup = async (id, groupData) => {
  try {
    await delay(500);
    const response = await api.put(`/groups/${id}`, groupData);
    // Invalidate cache
    cachedGroups = null;
    return response.data;
  } catch (error) {
    return handleApiError(error, `updating group ${id}`);
  }
};

/**
 * Delete a course (group)
 * @param {string} id - Course/Group ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteGroup = async (id) => {
  try {
    await delay(500);
    const response = await api.delete(`/groups/${id}`);
    // Invalidate cache
    cachedGroups = null;
    return response.data;
  } catch (error) {
    return handleApiError(error, `deleting group ${id}`);
  }
};

/**
 * Get teachers list for course/group assignment
 * @returns {Promise<Array>} List of teachers
 */
// Cache for teachers data
let cachedTeachers = null;

/**
 * Get list of available teachers for group assignment
 * @returns {Promise<Array>} List of teachers with id, name and email
 */
export const getTeachers = async () => {
  // Return cached data if available
  if (cachedTeachers) {
    return cachedTeachers;
  }

  try {
    await delay(300);
    // Get users with teacher role
    const response = await api.get('/users', {
      params: {
        role: 'teacher',
        fields: 'id,name,email,avatar'
      }
    });
    
    // Transform to match the expected format
    cachedTeachers = response.data.map(teacher => ({
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      avatar: teacher.avatar
    }));
    
    return cachedTeachers;
  } catch (error) {
    // Fallback to empty array if endpoint is not available
    console.warn('Could not fetch teachers, using empty list as fallback');
    cachedTeachers = [];
    return cachedTeachers;
  }
};
