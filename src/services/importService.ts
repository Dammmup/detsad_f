/**
 * Сервис для импорта данных из Excel
 */

import { apiClient } from '../utils/api';

export interface ImportResult {
    success: boolean;
    message: string;
    stats: {
        created?: number;
        updated?: number;
        skipped?: number;
        notFound?: number;
        notFoundList?: string[];
        shiftsCreated?: number;
        shiftsUpdated?: number;
        attendanceCreated?: number;
        attendanceUpdated?: number;
    };
    error?: string;
}

/**
 * Импорт посещаемости детей из Excel
 */
export const importChildAttendance = async (year?: number): Promise<ImportResult> => {
    const response = await apiClient.post<ImportResult>('/api/import/child-attendance', { year });
    return response.data;
};

/**
 * Импорт посещаемости сотрудников из Excel
 */
export const importStaffAttendance = async (year?: number): Promise<ImportResult> => {
    const response = await apiClient.post<ImportResult>('/api/import/staff-attendance', { year });
    return response.data;
};

/**
 * Импорт оплаты детей из Excel
 */
export const importChildPayments = async (year?: number, month?: number): Promise<ImportResult> => {
    const response = await apiClient.post<ImportResult>('/api/import/child-payments', { year, month });
    return response.data;
};

/**
 * Импорт зарплат сотрудников из Excel
 */
export const importPayrolls = async (period?: string): Promise<ImportResult> => {
    const response = await apiClient.post<ImportResult>('/api/import/payrolls', { period });
    return response.data;
};
