import { exportStaffAttendance } from './excelExport';
import { getCurrentMonthRange } from './excelExport';
import { shiftsApi } from '../../modules/staff/services/shifts';

export const exportStaffAttendanceByPeriod = async (
  startDate: string,
  endDate: string,
  attendanceData?: any[],
): Promise<void> => {
  const period = `${startDate} - ${endDate}`;

  try {
    let dataToExport = attendanceData;


    if (!dataToExport) {

      dataToExport = await shiftsApi.getAll({
        startDate,
        endDate,
      });
    }

    const filteredData = (dataToExport || []).filter((record) => {
      return record.date >= startDate && record.date <= endDate;
    });

    await exportStaffAttendance(filteredData, period);
  } catch (error) {
    console.error('Ошибка при экспорте посещаемости сотрудников:', error);
    throw error;
  }
};

export const exportStaffAttendanceCurrentMonth = async (
  attendanceData?: any[],
): Promise<void> => {
  const { startDate, endDate } = getCurrentMonthRange();
  await exportStaffAttendanceByPeriod(startDate, endDate, attendanceData);
};
