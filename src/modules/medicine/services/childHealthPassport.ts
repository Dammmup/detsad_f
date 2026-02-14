import apiClient from '../../../shared/utils/api';

export interface ChildHealthPassportData {
    _id?: string;
    childId: string;
    birthDate: string;
    birthPlace: string;
    bloodType: string;
    rhesusFactor: string;
    chronicDiseases: string[];
    allergies: string[];
    notes?: string;
    status: string;
    gender?: string;
    address?: string;
    clinic?: string;
    disability?: string;
    dispensary?: string;
    diagnosis?: string;
    infections?: string;
    hospitalizations?: string;
    incapacity?: string;
    checkups?: string;
}

const childHealthPassportApi = {
    getByChildId: async (childId: string) => {
        const response = await apiClient.get(`/child-health-passport/child/${childId}`);
        return response.data;
    },

    upsert: async (data: Partial<ChildHealthPassportData>) => {
        const response = await apiClient.post('/child-health-passport/upsert', data);
        return response.data;
    }
};

export default childHealthPassportApi;
