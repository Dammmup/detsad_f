import { ExportTemplate } from '../components/ExportAutoTemplatesButton';

export const childrenTemplates: ExportTemplate[] = [
  {
    template: 'spravka_bolezn_rebenka',
    label: 'Справка о болезни (PDF)',
    format: 'pdf',
  },
  {
    template: 'attendance_report',
    label: 'Отчёт о посещаемости (Excel)',
    format: 'xlsx',
  },
];

export const staffTemplates: ExportTemplate[] = [
  {
    template: 'employment_contract',
    label: 'Трудовой договор (PDF)',
    format: 'pdf',
  },
  {
    template: 'salary_report',
    label: 'Отчёт по зарплатам (Excel)',
    format: 'xlsx',
  },
];

export const generalTemplates: ExportTemplate[] = [
  {
    template: 'spravka_bolezn_rebenka',
    label: 'Справка о болезни (PDF)',
    format: 'pdf',
  },
  {
    template: 'salary_report',
    label: 'Отчёт по зарплатам (Excel)',
    format: 'xlsx',
  },
];
