
import apiClient from '../../../shared/utils/api';

export interface ExternalSpecialist {
    _id: string;
    name: string;
    type: 'tenant' | 'speech_therapist' | 'other';
    phone?: string;
    email?: string;
    description?: string;
    active: boolean;
}

export const getExternalSpecialists = async (activeOnly: boolean = false) => {
    const response = await apiClient.get<ExternalSpecialist[]>('/external-specialists', {
        params: { active: activeOnly }
    });
    return response.data;
};

export const createExternalSpecialist = async (data: Partial<ExternalSpecialist>) => {
    const response = await apiClient.post<ExternalSpecialist>('/external-specialists', data);
    return response.data;
};

export const updateExternalSpecialist = async (id: string, data: Partial<ExternalSpecialist>) => {
    const response = await apiClient.put<ExternalSpecialist>(`/external-specialists/${id}`, data);
    return response.data;
};

export const deleteExternalSpecialist = async (id: string) => {
    const response = await apiClient.delete(`/external-specialists/${id}`);
    return response.data;
};
