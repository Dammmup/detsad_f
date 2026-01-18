


export type MedJournalType = 'children' | 'food';

export interface MedJournalField {
  key: string;
  label: string;
  type: 'string' | 'date' | 'number' | 'enum';
  options?: string[];
}

export interface MedJournalConfig {
  id: string;
  type: MedJournalType;
  title: string;
  description?: string;
  fields: MedJournalField[];
}

export const medJournals: MedJournalConfig[] = [
  {
    id: 'child_health_passport',
    type: 'children',
    title: 'Паспорт здоровья ребенка (форма 052-2/у)',
    description: 'Карточка с ключевыми данными о здоровье ребенка',
    fields: [
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'birthdate', label: 'Дата рождения', type: 'date' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'main_diagnosis', label: 'Основной диагноз', type: 'string' },
      { key: 'vaccinations', label: 'Прививки', type: 'string' },
      { key: 'notes', label: 'Примечания', type: 'string' },
    ],
  },
  {
    id: 'mantoux_test_register',
    type: 'children',
    title: 'Журнал регистрации проб Манту',
    description: 'Учет пробы Манту',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'result', label: 'Результат', type: 'string' },
      { key: 'doctor', label: 'Врач', type: 'string' },
    ],
  },
  {
    id: 'somatic_diseases',
    type: 'children',
    title: 'Журнал соматической заболеваемости',
    description: 'Диагнозы, сроки, дни отсутствия',
    fields: [
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'diagnosis', label: 'Диагноз', type: 'string' },
      { key: 'start_date', label: 'Дата начала', type: 'date' },
      { key: 'end_date', label: 'Дата окончания', type: 'date' },
      { key: 'absence_days', label: 'Дней отсутствия', type: 'number' },
    ],
  },
  {
    id: 'helminth_test_register',
    type: 'children',
    title: 'Журнал регистрации лиц, обследованных на гельминты',
    description: 'Дата, результат, группа',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'result', label: 'Результат', type: 'string' },
    ],
  },
  {
    id: 'tub_positive_register',
    type: 'children',
    title: 'Журнал туберкулино‑положительных (к фтизиопедиатру)',
    description: 'Направления/консультации',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'referral', label: 'Направление', type: 'string' },
      { key: 'doctor', label: 'Врач', type: 'string' },
    ],
  },
  {
    id: 'infectious_diseases',
    type: 'children',
    title: 'Журнал учета инфекционных заболеваний',
    description: 'Случаи, карантинные дни, меднаблюдение',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'diagnosis', label: 'Диагноз', type: 'string' },
      { key: 'quarantine_days', label: 'Карантинные дни', type: 'number' },
      { key: 'observation', label: 'Меднаблюдение', type: 'string' },
    ],
  },
  {
    id: 'contacts_infections',
    type: 'children',
    title: 'Журнал учета контактов с острыми инфекционными заболеваниями',
    description: 'Ежедневный мониторинг симптомов/стула',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'symptoms', label: 'Симптомы', type: 'string' },
      { key: 'stool', label: 'Стул', type: 'string' },
    ],
  },
  {
    id: 'risk_group',
    type: 'children',
    title: 'Список детей группы риска',
    description: 'Группы/адреса/основание',
    fields: [
      { key: 'fio', label: 'ФИО ребенка', type: 'string' },
      { key: 'group', label: 'Группа', type: 'string' },
      { key: 'address', label: 'Адрес', type: 'string' },
      { key: 'reason', label: 'Основание', type: 'string' },
    ],
  },


  {
    id: 'organoleptic',
    type: 'food',
    title: 'Журнал органолептической оценки качества блюд',
    description: 'Внешний вид, вкус, запах, решение',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'dish', label: 'Блюдо', type: 'string' },
      { key: 'appearance', label: 'Внешний вид', type: 'string' },
      { key: 'taste', label: 'Вкус', type: 'string' },
      { key: 'smell', label: 'Запах', type: 'string' },
      { key: 'decision', label: 'Решение', type: 'string' },
    ],
  },
  {
    id: 'food_norms_control',
    type: 'food',
    title: 'Ведомость контроля за выполнением норм пищевой продукции (Форма 4)',
    description: '30 дней, среднее, отклонения',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'product', label: 'Продукт', type: 'string' },
      { key: 'norm', label: 'Норма', type: 'number' },
      { key: 'actual', label: 'Фактически', type: 'number' },
      { key: 'deviation', label: 'Отклонение', type: 'number' },
    ],
  },
  {
    id: 'perishable_brak',
    type: 'food',
    title: 'Бракераж скоропортящейся продукции и полуфабрикатов',
    description: 'Приемка/оценка/сроки',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'product', label: 'Продукт', type: 'string' },
      { key: 'assessment', label: 'Оценка', type: 'string' },
      { key: 'expiry', label: 'Срок годности', type: 'date' },
    ],
  },
  {
    id: 'food_certificates',
    type: 'food',
    title: 'Журнал регистрации сертификатов годности продуктов питания',
    description: 'Номер/дата/срок/контролы',
    fields: [
      { key: 'number', label: 'Номер сертификата', type: 'string' },
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'expiry', label: 'Срок годности', type: 'date' },
      { key: 'controller', label: 'Контролер', type: 'string' },
    ],
  },
  {
    id: 'detergents',
    type: 'food',
    title: 'Журнал учета моющих средств',
    description: 'Приход/расход/остаток, контроль',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'name', label: 'Наименование', type: 'string' },
      { key: 'income', label: 'Приход', type: 'number' },
      { key: 'expense', label: 'Расход', type: 'number' },
      { key: 'balance', label: 'Остаток', type: 'number' },
      { key: 'controller', label: 'Контролер', type: 'string' },
    ],
  },
  {
    id: 'food_stock',
    type: 'food',
    title: 'Журнал учета приходов, расходов и остатков ежедневных продуктов',
    description: 'Складской учет по дням',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'product', label: 'Продукт', type: 'string' },
      { key: 'income', label: 'Приход', type: 'number' },
      { key: 'expense', label: 'Расход', type: 'number' },
      { key: 'balance', label: 'Остаток', type: 'number' },
    ],
  },
  {
    id: 'canteen_staff_health',
    type: 'food',
    title: 'Журнал регистрации состояния здоровья работников пищеблока',
    description: 'Осмотр, признаки ОРИ/кожные, подпись',
    fields: [
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'fio', label: 'ФИО работника', type: 'string' },
      { key: 'inspection', label: 'Осмотр', type: 'string' },
      { key: 'symptoms', label: 'Признаки ОРИ/кожные', type: 'string' },
      { key: 'signature', label: 'Подпись', type: 'string' },
    ],
  },
];
