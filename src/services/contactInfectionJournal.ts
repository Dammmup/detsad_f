import api from './base';
import { ContactInfectionRecord } from '../types/contactInfection';

export const getContactInfectionRecords = async (
  params?: any,
): Promise<ContactInfectionRecord[]> => {
  const { data } = await api.get('/contact-infection-journal', { params });
  return data;
};

export const createContactInfectionRecord = async (
  record: Partial<ContactInfectionRecord>,
): Promise<ContactInfectionRecord> => {
  const { data } = await api.post('/contact-infection-journal', record);
  return data;
};

export const updateContactInfectionRecord = async (
  id: string,
  record: Partial<ContactInfectionRecord>,
): Promise<ContactInfectionRecord> => {
  const { data } = await api.put(`/contact-infection-journal/${id}`, record);
  return data;
};

export const deleteContactInfectionRecord = async (
  id: string,
): Promise<void> => {
  await api.delete(`/contact-infection-journal/${id}`);
};
