import { PayrollRecord } from '../../../shared/types/staff';
import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';

class PayrollApiClient extends BaseCrudApiClient<PayrollRecord> {
  endpoint = '/payroll';

  async getByUsers(filters: any): Promise<any[]> {
    const { data } = await apiClient.get(`${this.endpoint}/by-users`, { params: filters });
    return data;
  }

  async approve(id: string): Promise<PayrollRecord> {
    const { data } = await apiClient.patch(`${this.endpoint}/${id}/approve`);
    return data;
  }

  async markAsPaid(id: string): Promise<PayrollRecord> {
    const { data } = await apiClient.patch(`${this.endpoint}/${id}/mark-paid`);
    return data;
  }

  async calculate(staffId: string, month: string): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/calculate`, { staffId, month });
    return data;
  }

  async generateSheets(period: string): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/generate-sheets`, { period }, { timeout: 60000 });
    return data;
  }

  async addFine(id: string, fineData: any): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/${id}/fines`, fineData);
    return data;
  }

  async removeFine(id: string, fineIndex: number): Promise<any> {
    const { data } = await apiClient.delete(`${this.endpoint}/${id}/fines/${fineIndex}`);
    return data;
  }

  async calculateDebt(period: string): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/calculate-debt`, { period });
    return data;
  }
}

export const payrollApi = new PayrollApiClient();
export const getPayrolls = (filters?: any) => payrollApi.getAll(filters);
export const getPayrollsByUsers = (filters: any) => payrollApi.getByUsers(filters);
export const getPayrollById = (id: string) => payrollApi.getById(id);
export const createPayroll = (data: Partial<PayrollRecord>) => payrollApi.create(data);
export const updatePayroll = (id: string, data: Partial<PayrollRecord>) => payrollApi.update(id, data);
export const deletePayroll = (id: string) => payrollApi.deleteItem(id);
export const approvePayroll = (id: string) => payrollApi.approve(id);
export const markPayrollAsPaid = (id: string) => payrollApi.markAsPaid(id);
export const calculatePayroll = (staffId: string, month: string) => payrollApi.calculate(staffId, month);
export const generatePayrollSheets = (period: string) => payrollApi.generateSheets(period);
export const addFine = (id: string, fineData: any) => payrollApi.addFine(id, fineData);
export const removeFine = (id: string, fineIndex: number) => payrollApi.removeFine(id, fineIndex);
export const calculateDebt = (period: string) => payrollApi.calculateDebt(period);

export default payrollApi;
