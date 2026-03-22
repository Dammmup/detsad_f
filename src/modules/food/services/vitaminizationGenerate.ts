import { VitaminizationRecord } from '../types/vitaminization';
import { apiClient } from '../../../shared/utils/api';

const ENDPOINT = '/vitaminization-journal/generate';

export const generateVitaminizationByMenu = async (params: { date: string; group?: string }): Promise<VitaminizationRecord[]> => {
    const { data } = await apiClient.post(ENDPOINT, params);
    return data;
};
