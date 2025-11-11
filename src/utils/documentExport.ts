import { exportStaffAttendance } from './excelExport';
import { getCurrentMonthRange } from './excelExport';
import { shiftsApi } from '../services/shifts';

/**
 * Экспорт посещаемости сотрудников за указанный период
 * Используется на странице StaffAttendanceTracking с произвольным диапазоном дат
 */
export const exportStaffAttendanceByPeriod = async (
  startDate: string,
  endDate: string,
  attendanceData?: any[],
): Promise<void> => {
  const period = `${startDate} - ${endDate}`;

  try {
    let dataToExport = attendanceData;

    // Если данные не предоставлены, загружаем их из API
    if (!dataToExport) {
      // Получаем все смены за указанный период
      dataToExport = await shiftsApi.getAll({
        startDate,
        endDate,
      });
    }

    // Фильтруем данные, чтобы включить только записи в диапазоне указанных дат
    const filteredData = dataToExport.filter((record) => {
      return record.date >= startDate && record.date <= endDate;
    });

    await exportStaffAttendance(filteredData, period);
  } catch (error) {
    console.error('Ошибка при экспорте посещаемости сотрудников:', error);
    throw error;
  }
};

/**
 * Экспорт посещаемости сотрудников за текущий месяц
 * Используется на странице Settings с фиксированным диапазоном дат
 */
export const exportStaffAttendanceCurrentMonth = async (
  attendanceData?: any[],
): Promise<void> => {
  const { startDate, endDate } = getCurrentMonthRange();
  await exportStaffAttendanceByPeriod(startDate, endDate, attendanceData);
};
