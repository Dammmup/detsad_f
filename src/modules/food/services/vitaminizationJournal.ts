import { VitaminizationRecord } from '../types/vitaminization';
import { apiClient } from '../../../shared/utils/api';

const ENDPOINT = '/vitaminization-journal';

export const getVitaminizationRecords = async (params?: any): Promise<VitaminizationRecord[]> => {
    const { data } = await apiClient.get(ENDPOINT, { params });
    return data;
};

export const createVitaminizationRecord = async (record: Partial<VitaminizationRecord>): Promise<VitaminizationRecord> => {
    const { data } = await apiClient.post(ENDPOINT, record);
    return data;
};

export const updateVitaminizationRecord = async (id: string, record: Partial<VitaminizationRecord>): Promise<VitaminizationRecord> => {
    const { data } = await apiClient.put(`${ENDPOINT}/${id}`, record);
    return data;
};

export const deleteVitaminizationRecord = async (id: string): Promise<void> => {
    await apiClient.delete(`${ENDPOINT}/${id}`);
};

export const clearVitaminizationRecords = async (): Promise<void> => {
    await apiClient.delete(`${ENDPOINT}/clear`);
};
