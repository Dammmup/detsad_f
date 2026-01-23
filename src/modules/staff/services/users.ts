import { User } from '../../../shared/types/staff';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class UserApiClient extends BaseCrudApiClient<User> {
  endpoint = '/users';

  async updatePayrollSettings(id: string, data: { salary?: number; salaryType?: string }) {
    return this.put(`${this.endpoint}/${id}/payroll-settings`, data);
  }

  async generateTelegramLinkCode(id: string) {
    return this.post<{ telegramLinkCode: string }>(`${this.endpoint}/${id}/generate-telegram-code`);
  }
}

export const userApi = new UserApiClient();
export const getUsers = (includePasswords?: boolean) => userApi.getAll({ includePasswords });
export const createUser = (data: Partial<User>) => userApi.create(data as any);
export const updateUser = (id: string, data: Partial<User>) => userApi.update(id, data as any);
export const deleteUser = (id: string) => userApi.deleteItem(id);

export const usersApi = {
  ...userApi,
  getAll: getUsers,
  getById: (id: string) => userApi.getById(id),
  create: createUser,
  update: updateUser,
  delete: deleteUser,
  updatePayrollSettings: (id: string, data: { salary?: number; salaryType?: string }) => userApi.updatePayrollSettings(id, data),
  generateTelegramLinkCode: (id: string) => userApi.generateTelegramLinkCode(id),
};

export default userApi;
