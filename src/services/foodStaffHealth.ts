import { BaseCrudApiClient } from '../utils/api';
import { FoodStaffHealth } from '../types/foodStaffHealth';
export type { FoodStaffHealth } from '../types/foodStaffHealth';

class FoodStaffHealthApiClient extends BaseCrudApiClient<FoodStaffHealth> {
  protected endpoint = '/food-staff-health';
}

export const foodStaffHealthApi = new FoodStaffHealthApiClient();
