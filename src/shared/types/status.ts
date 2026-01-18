

export type StatusColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export const STATUS_COLORS: Record<string, StatusColor> = {

  scheduled: 'default',
  completed: 'success',
  late: 'primary',

  on_break: 'warning',
  overtime: 'secondary',
  absent: 'error',
  early_departure: 'warning',
  present: 'success',

  active_rent: 'warning',
  overdue_rent: 'error',
  paid_rent: 'success',
  draft_rent: 'default',
  active_payment: 'warning',
  overdue_payment: 'error',
  paid_payment: 'success',
  draft_payment: 'default',

  absent_shift: 'error',
  on_break_shift: 'warning',
  overtime_shift: 'secondary',
  early_departure_shift: 'warning',
  present_shift: 'success',
};

export const STATUS_TEXT: Record<string, string> = {

  scheduled: 'Запланирована',
  completed: 'Завершена',

  absent: 'Отсутствует',

  active_rent: 'Активна',
  overdue_rent: 'Просрочена',
  paid_rent: 'Оплачена',
  draft_rent: 'Черновик',
  active_payment: 'Активна',
  overdue_payment: 'Просрочена',
  paid_payment: 'Оплачена',
  draft_payment: 'Черновик',
  paid: 'Оплачено',
  active: 'Активно',


  absent_shift: 'Отсутствует',
  pending_approval_shift: 'Ожидает подтверждения',
  late_shift: 'Опоздание',
};

export enum ShiftStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  absent = 'absent',
  in_progress = 'in_progress',
  pending_approval = 'pending_approval',
  late = 'late',
}
