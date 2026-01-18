import apiClient from '../utils/api';

export const getHolidays = async (): Promise<{ holidays: string[], workingSaturdays: string[] }> => {
    const response = await apiClient.get('/api/common/holidays');
    const data = response.data;

    // Flatten the nested structure { 2025: [...], 2026: [...] } into a single array
    const allHolidays = Object.values(data.holidays || {}).flat() as string[];
    const allWorkingSaturdays = Object.values(data.workingSaturdays || {}).flat() as string[];

    return {
        holidays: allHolidays,
        workingSaturdays: allWorkingSaturdays
    };
};
