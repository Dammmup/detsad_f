import { BaseCrudApiClient } from '../utils/api';

export interface FoodStaffHealth {
  _id?: string;
  date: string;
  staffName: string;
  healthStatus: string;
  notes?: string;
}

class FoodStaffHealthApiClient extends BaseCrudApiClient<FoodStaffHealth> {
  protected endpoint = '/food-staff-health';
}

export const foodStaffHealthApi = new FoodStaffHealthApiClient();
