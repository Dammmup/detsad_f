import { BaseCrudApiClient } from '../../../shared/utils/api';
import { FoodStaffDailyLog } from '../types/foodStaffHealth';
export type { FoodStaffDailyLog } from '../types/foodStaffHealth';

class FoodStaffDailyLogApiClient extends BaseCrudApiClient<FoodStaffDailyLog> {
  protected endpoint = '/food-staff-daily-log';
}

export const foodStaffHealthApi = new FoodStaffDailyLogApiClient();
