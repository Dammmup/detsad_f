export interface HealthPassport {
  id: string;
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  main_diagnosis: string;
  vaccinations: string;
  notes?: string;
}
