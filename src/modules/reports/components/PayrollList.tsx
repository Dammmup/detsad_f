import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileUpload as FileUploadIcon,
  AccountBalance as DebtIcon,
  PeopleAlt as PeopleIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  payrollApi as payrollService,
  updatePayroll,
  deletePayroll,
  createPayroll,
  generatePayrollSheets,
  calculateDebt,
  addFine,
  removeFine,
  getPayrolls,
} from '../../staff/services/payroll';
import { importPayrolls } from '../../../shared/services/importService';
import { UserRole, EXTERNAL_ROLES } from '../../../shared/types/common';
import { PayrollRecord as Payroll } from '../../../shared/types/staff';
import { useAuth } from '../../../app/context/AuthContext';
import { useStaff } from '../../../app/context/StaffContext';
import { getKindergartenSettings, updateKindergartenSettings } from '../../settings/services/settings';
import FinesDetailsDialog from './FinesDetailsDialog';
import PayrollTotalDialog from './PayrollTotalDialog';
import AuditLogButton from '../../../shared/components/AuditLogButton';

interface Props {
  userId?: string;
  personalOnly?: boolean;
}

interface CurrentUser {
  id: string | undefined;
  role: string;
}

interface PayrollRow {
  staffName: string;
  accruals: number;
  penalties: number;
  latePenalties: number;
  absencePenalties: number;
  latePenaltyRate: number;
  advance: number;
  total: number;
  status: string;
  staffId: string;
  _id?: string;
  baseSalary: number;
  baseSalaryType?: 'month' | 'shift';
  fines?: any[];
  userFines?: number;
  bonuses: number;
  bonusDetails?: {
    weekendWork?: number;
    performance?: number;
    holidayWork?: number;
  };
  workedShifts: number;
  workedDays: number;
  shiftRate: number;
  normDays?: number;
  normProduction?: number;
  normShifts?: number;
  normType?: 'production' | 'shifts';
  deductions?: number;
  carryOverDebt?: number;
}

const PayrollList: React.FC<Props> = ({ userId, personalOnly }) => {
  const { user } = useAuth();
  const { staff } = useStaff();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoAccess, setHasNoAccess] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [globalPenaltyRate, setGlobalPenaltyRate] = useState<number>(50);
  const [penaltyType, setPenaltyType] = useState<string>('per_minute');
  const staffMap = useMemo(() => {
    const map = new Map<string, any>();
    staff.forEach((s) => {
      const id = s.id || s._id;
      if (id) map.set(id, s);
    });
    return map;
  }, [staff]);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState<number>(50);
  const [newPenaltyType, setNewPenaltyType] = useState<string>('per_minute');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PayrollRow>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  );
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [currentFinePayrollId, setCurrentFinePayrollId] = useState<string | null>(null);
  const [currentFineStaffName, setCurrentFineStaffName] = useState('');
  const [currentFines, setCurrentFines] = useState<any[]>([]);
  const [newFine, setNewFine] = useState({ amount: '', reason: '' });
  const [totalDialogOpen, setTotalDialogOpen] = useState(false);
  const [currentTotalRow, setCurrentTotalRow] = useState<PayrollRow | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (personalOnly && user && user.role !== 'admin' && user.allowToSeePayroll === false) {
        setError('У вас нет прав для просмотра своей зарплаты. Обратитесь к администратору.');
        setLoading(false);
        return;
      }

      const params: any = {
        period: selectedMonth,
      };

      if ((personalOnly || (user && user.role !== UserRole.admin && user.role !== UserRole.manager)) && user?.id) {
        params.userId = user.id;
      } else if (userId) {
        params.userId = userId;
      }

      const settings = await getKindergartenSettings();
      const globalLatePenaltyRate = settings?.payroll?.latePenaltyRate || 50;
      const globalLatePenaltyType = settings?.payroll?.latePenaltyType || 'per_minute';
      setGlobalPenaltyRate(globalLatePenaltyRate);
      setPenaltyType(globalLatePenaltyType);

      const payrollsData = await getPayrolls(params);

      const data = (payrollsData || []) as any[];

      const filteredData = data.filter(p => {
        const sId = p.staffId?._id || p.staffId?.id || p.staffId;
        const staffInfo = staffMap.get(sId);
        const role = staffInfo?.role || p.staffId?.role as UserRole;
        const isExternal = EXTERNAL_ROLES.includes(role);

        if (isExternal) return false;

        if (personalOnly && user?.id) {
          return sId === user.id;
        }

        return true;
      });

      const workedEmployees = filteredData.filter(p => (p.workedShifts || 0) > 0 || (p.workedDays || 0) > 0);

      const summaryData = {
        totalEmployees: workedEmployees.length,
        totalAccruals: workedEmployees.reduce(
          (sum, p) => sum + (p.accruals || 0) + (p.bonuses || 0),
          0,
        ),
        totalAdvance: workedEmployees.reduce((sum, p) => sum + (p.advance || 0), 0),
        totalPenalties: workedEmployees.reduce((sum, p) => {
          const rowPenalties = (p.penalties || 0) + (p.deductions || 0);
          return sum + rowPenalties;
        }, 0),
        totalPayout: workedEmployees.reduce((sum, p) => sum + (p.total || 0), 0),
      };

      setSummary(summaryData);
      setRows(
        filteredData.map((p: any) => {
          const sId = p.staffId?._id || p.staffId?.id || p.staffId || '';
          const staffInfo = staffMap.get(sId);
          return {
            staffName: staffInfo?.fullName || p.staffId?.fullName || p.staffId?.name || 'Неизвестно',
            accruals: p.accruals || (p.baseSalaryType === 'shift' ? ((p.workedShifts || 0) * (p.shiftRate || p.baseSalary || 0)) : 0),
            bonuses: p.bonuses || 0,
            deductions: p.deductions || 0,
            penalties: p.penalties || 0,
            latePenalties: p.latePenalties || 0,
            absencePenalties: p.absencePenalties || 0,
            latePenaltyRate: globalLatePenaltyRate,
            advance: p.advance || 0,
            total: p.total || 0,
            status: p.status || 'draft',
            staffId: sId,
            _id: p._id || undefined,
            baseSalary: p.baseSalary || 0,
            baseSalaryType: p.baseSalaryType || 'month',
            fines: p.fines || [],
            userFines: p.userFines || 0,
            workedShifts: p.workedShifts || 0,
            workedDays: p.workedDays || 0,
            normDays: p.normDays || 0,
            normProduction: p.normProduction || 0,
            normShifts: p.normShifts || 0,
            normType: p.normType || 'production',
            shiftRate: p.shiftRate || 0,
            bonusDetails: p.bonusDetails,
            carryOverDebt: p.carryOverDebt || 0,
          };
        }),
      );
      setGlobalPenaltyRate(globalLatePenaltyRate);
      setNewRate(globalLatePenaltyRate);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки зарплат');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth, personalOnly, user, staffMap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditClick = (row: PayrollRow) => {
    setEditingId(row.staffId);
    setEditData({
      accruals: row.accruals || undefined,
      penalties: row.penalties || undefined,
      advance: row.advance || undefined,
      bonuses: row.bonuses || undefined,
      bonusDetails: row.bonusDetails,
      baseSalary: row.baseSalary || undefined,
      status: row.status || 'draft',
    });
  };

  const handleOpenTotalDialog = (row: PayrollRow) => {
    setCurrentTotalRow(row);
    setTotalDialogOpen(true);
  };

  const handleSaveClick = async (rowId: string) => {
    try {
      const originalRow = rows.find((r) => r.staffId === rowId);
      if (originalRow) {
        let payrollId = originalRow._id;

        const accruals =
          editData.accruals !== undefined
            ? editData.accruals
            : originalRow.accruals || 0;
        const penalties =
          editData.penalties !== undefined
            ? editData.penalties
            : originalRow.penalties || 0;
        const advance =
          editData.advance !== undefined
            ? editData.advance
            : originalRow.advance || 0;
        const bonuses =
          editData.bonuses !== undefined
            ? editData.bonuses
            : originalRow.bonuses || 0;
        const status = editData.status ?? originalRow.status ?? 'draft';
        const apiStatus = status;

        const deductions = originalRow.deductions || 0; // Используем вычеты из оригинальной строки
        const carryOverDebt = originalRow.carryOverDebt || 0;
        const total = accruals + bonuses - penalties - advance - deductions - carryOverDebt;

        const updatedData = {
          ...editData,
          total,
          status: apiStatus as 'draft' | 'approved' | 'paid',
        };

        if (!payrollId) {
          console.log('Creating new payroll for virtual record');
          const newPayroll = await createPayroll({
            staffId: rowId as any, // Передаем ID сотрудника для бэкенда
            period: selectedMonth,
            baseSalary: editData.baseSalary ?? originalRow.baseSalary ?? 0,
            bonuses: editData.bonuses ?? originalRow.bonuses ?? 0,
            accruals: accruals,
            penalties: penalties,
            advance: advance,
            deductions: deductions,
            total: total,
            status: apiStatus as 'draft' | 'approved' | 'paid',
          });
          payrollId = newPayroll._id;
        } else {
          console.log('Updating payroll with ID:', payrollId);
          await updatePayroll(payrollId, updatedData as Partial<Payroll>);
        }

        setRows((prev) =>
          prev.map((r) =>
            r.staffId === rowId ? ({ ...r, ...updatedData, _id: payrollId, staffId: rowId, total } as PayrollRow) : r,
          ),
        );
        setEditingId(null);
        setEditData({});
        setSnackbarMessage('Зарплата успешно обновлена');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      setSnackbarMessage('Ошибка при обновлении зарплаты');
      setSnackbarOpen(true);
    }
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleDeleteClick = async (rowId: string) => {
    if (!user || user.role !== 'admin') {
      setSnackbarMessage('Только администратор может удалять расчетные листы');
      setSnackbarOpen(true);
      return;
    }

    if (
      window.confirm(
        'Вы уверены, что хотите удалить этот расчетный лист? Это действие нельзя отменить.',
      )
    ) {
      try {

        const originalRow = rows.find((r) => r.staffId === rowId);
        if (originalRow) {

          const payrollId = originalRow._id || rowId;


          await deletePayroll(payrollId);

          setRows((prev) => prev.filter((r) => r.staffId !== rowId));
          setSnackbarMessage('Расчетный лист успешно удален');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error deleting payroll:', error);
        setSnackbarMessage('Ошибка при удалении расчетного листа');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleExportToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');

      // Подготавливаем данные для экспорта
      const exportData = rows.map(row => ({
        'Сотрудник': row.staffName,
        'Оклад': row.baseSalary,
        'Тип оклада': row.baseSalaryType,
        'Отработано (см)': row.workedShifts,
        'Отработано (дн)': row.workedDays,
        'Начисления': row.accruals,
        'Премия': row.bonuses,
        'Аванс': row.advance,
        'Вычеты': row.penalties,
        'Ставка за опоздание': `${globalPenaltyRate} тг/мин`,
        'Итого': row.total,
        'Статус': row.status,
      }));
      // Создаем worksheet
      const worksheet = utils.json_to_sheet(exportData);

      // Устанавливаем ширину колонок для лучшего отображения
      const colWidths = [
        { wch: 25 }, // Сотрудник
        { wch: 15 }, // Начисления
        { wch: 10 }, // Премия
        { wch: 10 }, // Аванс
        { wch: 10 }, // Вычеты
        { wch: 20 }, // Ставка за опоздание
        { wch: 15 }, // Итого
        { wch: 12 }, // Статус
        { wch: 12 }, // Оклад
        { wch: 12 }, // Тип оклада
        { wch: 15 }, // Отработано
      ];
      worksheet['!cols'] = colWidths;

      // Создаем workbook и добавляем worksheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Расчетные листы');

      // Генерируем имя файла с датой
      const fileName = `расчетный_лист_${new Date().toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-')}.xlsx`;

      // Сохраняем файл
      writeFile(workbook, fileName);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      setSnackbarMessage('Ошибка при экспорте файла');
      setSnackbarOpen(true);
    }

  }
  // Open confirmation dialog for generate
  const handleOpenConfirmDialog = () => {
    if (!user || user.role !== 'admin') {
      setSnackbarMessage(
        'Только администратор может генерировать расчетные листы',
      );
      setSnackbarOpen(true);
      return;
    }
    setConfirmDialogOpen(true);
  };


  // Confirmed generate
  const handleConfirmGenerate = async () => {
    setConfirmDialogOpen(false);
    const monthToGenerate = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    try {
      setGenerating(true);
      await generatePayrollSheets(monthToGenerate);
      setSnackbarMessage('Расчетные листы успешно сгенерированы');
      setSnackbarOpen(true);
      await loadData();
    } catch (error: any) {
      console.error('Error generating payroll sheets:', error);
      setSnackbarMessage(
        error?.message || 'Ошибка генерации расчетных листов',
      );
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  // Refresh all payrolls (recalculate based on current attendance)
  const handleRefreshPayrolls = async () => {
    if (!user || user.role !== 'admin') {
      setSnackbarMessage(
        'Только администратор может обновлять расчетные листы',
      );
      setSnackbarOpen(true);
      return;
    }

    const monthToRefresh = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    try {
      setRefreshing(true);
      await generatePayrollSheets(monthToRefresh, true); // Передаем force: true
      setSnackbarMessage('Все расчетные листы успешно обновлены');
      setSnackbarOpen(true);
      await loadData();
    } catch (error: any) {
      console.error('Error refreshing payroll sheets:', error);
      setSnackbarMessage(
        error?.message || 'Ошибка обновления расчетных листов',
      );
      setSnackbarOpen(true);
    } finally {
      setRefreshing(false);
    }
  };

  // Импорт зарплат из Excel
  const handleImportPayrolls = async () => {
    if (!user || user.role !== 'admin') {
      setSnackbarMessage('Только администратор может импортировать зарплаты');
      setSnackbarOpen(true);
      return;
    }

    try {
      setImporting(true);
      const result = await importPayrolls(selectedMonth);
      if (result.success) {
        setSnackbarMessage(`Импорт завершён: создано ${result.stats.created || 0}, обновлено ${result.stats.updated || 0}`);
        await loadData();
      } else {
        setSnackbarMessage(result.error || 'Ошибка импорта');
      }
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Error importing payrolls:', error);
      setSnackbarMessage(error?.message || 'Ошибка импорта зарплат');
      setSnackbarOpen(true);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenFineDialog = (row: PayrollRow) => {
    setCurrentFinePayrollId(row._id || row.staffId);
    setCurrentFineStaffName(row.staffName);
    setCurrentFines(row.fines || []);
    setFineDialogOpen(true);
  };

  const handleAddFine = async (fineData: { amount: number; reason: string; type: 'manual' }) => {
    if (!currentFinePayrollId) return;

    try {

      const row = rows.find(r => r._id === currentFinePayrollId || r.staffId === currentFinePayrollId);
      let payrollId = row?._id;

      if (!payrollId && row) {

        const newPayroll = await createPayroll({
          staffId: { _id: row.staffId } as any,
          period: selectedMonth,
          baseSalary: row.baseSalary || 0,
          status: 'draft'
        });
        payrollId = newPayroll._id;
      }

      if (!payrollId) throw new Error('Could not determine payroll ID');

      const updatedPayroll = await addFine(payrollId!, {
        amount: fineData.amount,
        reason: fineData.reason,
        type: 'manual'
      });

      setSnackbarMessage('Вычет добавлен');
      setSnackbarOpen(true);


      setCurrentFines(updatedPayroll.fines || []);

      await loadData();

    } catch (e: any) {
      setSnackbarMessage('Ошибка добавления Вычета: ' + (e.message || 'Unknown'));
      setSnackbarOpen(true);
    }
  };

  const handleDeleteFine = async (fineIndex: string) => {
    console.log('🗑️ [ReportsSalary] handleDeleteFine called with fineIndex:', fineIndex);
    console.log('🗑️ [ReportsSalary] currentFinePayrollId:', currentFinePayrollId);

    if (!currentFinePayrollId) {
      console.error('❌ [ReportsSalary] currentFinePayrollId is null or undefined');
      return;
    }

    try {
      const row = rows.find(r => r._id === currentFinePayrollId || r.staffId === currentFinePayrollId);
      console.log('🗑️ [ReportsSalary] Found row:', row);
      const payrollId = row?._id;
      console.log('🗑️ [ReportsSalary] payrollId:', payrollId);

      if (!payrollId) {
        console.error('❌ [ReportsSalary] payrollId not found');
        setSnackbarMessage('Ошибка: не найден ID расчетного листа');
        setSnackbarOpen(true);
        return;
      }

      console.log('📤 [ReportsSalary] Calling removeFine API with payrollId:', payrollId, 'fineIndex:', fineIndex);
      const updatedPayroll = await removeFine(payrollId, Number(fineIndex));
      console.log('✅ [ReportsSalary] removeFine response:', updatedPayroll);

      setSnackbarMessage('Вычет удален');
      setSnackbarOpen(true);

      // Обновляем список вычетов в диалоге
      setCurrentFines(updatedPayroll.fines || []);

      await loadData();

    } catch (e: any) {
      console.error('❌ [ReportsSalary] Error in handleDeleteFine:', e);
      setSnackbarMessage('Ошибка удаления вычета: ' + (e.message || 'Unknown'));
      setSnackbarOpen(true);
    }
  };

  const handleOpenRateDialog = () => {
    setNewRate(globalPenaltyRate);
    setNewPenaltyType(penaltyType);
    setRateDialogOpen(true);
  };

  const handleSaveRate = async () => {
    try {
      const settings = await getKindergartenSettings();
      if (settings) {
        await updateKindergartenSettings({
          ...settings,
          payroll: {
            ...settings.payroll,
            latePenaltyRate: newRate,
            latePenaltyType: newPenaltyType as 'fixed' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes'
          }
        });
        setGlobalPenaltyRate(newRate);
        setPenaltyType(newPenaltyType);
        setSnackbarMessage('Настройки штрафа за опоздание обновлены');
        setSnackbarOpen(true);
        setRateDialogOpen(false);
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка обновления ставки');
    }
  };


  const selectedMonthLabel = new Date(`${selectedMonth}-01`).toLocaleString(
    'ru-RU',
    { month: 'long', year: 'numeric' },
  );

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (hasNoAccess) {
    return null;
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />

      {personalOnly ? (
        (() => {
          const mySalary = rows[0];
          const receiptData = mySalary ? {
            name: mySalary.staffName,
            period: selectedMonthLabel,
            accruals: mySalary.accruals,
            bonuses: mySalary.bonuses,
            penalties: mySalary.penalties,
            advance: mySalary.advance,
            total: mySalary.total,
            status: mySalary.status,
            id: mySalary.staffId?.slice(-8).toUpperCase() || 'N/A',
            workedDays: mySalary.workedDays,
            workedShifts: mySalary.workedShifts,
            baseSalaryType: mySalary.baseSalaryType,
            shiftRate: mySalary.shiftRate,
            baseSalary: mySalary.baseSalary,
            normDays: mySalary.normDays || 22,
            fines: mySalary.fines || []
          } : null;

          if (!receiptData) {
            return (
              <Box sx={{ p: 4, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f7fa' }}>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>Нет данных о зарплате за этот период</Typography>
                <TextField
                  label='Выбрать другой месяц'
                  type='month'
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Box>
            );
          }

          return (
            <Box sx={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
              p: { xs: 2, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflowY: 'auto'
            }}>
              <Box sx={{ mb: 4, width: '100%', maxWidth: 400 }}>
                <TextField
                  label='ПЕРИОД / PERIOD'
                  type='month'
                  fullWidth
                  size='small'
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 1,
                    input: { color: 'white' },
                    label: { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    }
                  }}
                />
              </Box>

              <Box sx={{
                width: '100%',
                maxWidth: 380,
                background: '#fff',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                position: 'relative',
                pb: 2
              }}>
                <Box sx={{
                  height: 12,
                  width: '100%',
                  background: '#fff',
                  clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)',
                }} />

                <Box sx={{ p: 3, pt: 1, fontFamily: '"Courier New", Courier, monospace', color: '#000' }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', borderBottom: '2px solid #000', pb: 1, display: 'inline-block' }}>ALDAMIRAM</Typography>
                    <Typography sx={{ display: 'block', mt: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>РАСЧЕТНЫЙ ЛИСТОК / PAYROLL</Typography>
                    <Typography sx={{ fontSize: '0.7rem', opacity: 0.8 }}>{new Date().toLocaleString()}</Typography>
                  </Box>

                  <Box sx={{ mb: 2, borderBottom: '1px dashed #000', pb: 1 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>СОТРУДНИК: {receiptData.name}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>ПЕРИОД: {receiptData.period}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>
                      ОТРАБОТАНО: {receiptData.baseSalaryType === 'shift' ? `${receiptData.workedShifts} см.` : `${receiptData.workedDays} дн.`}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, mb: 1 }}>НАЧИСЛЕНИЯ (EARNINGS):</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.8rem' }}>ОКЛАД / BASE SALARY</Typography>
                      <Typography sx={{ fontSize: '0.8rem' }}>{receiptData.baseSalary.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {receiptData.baseSalaryType === 'shift' ? 'СТАВКА ЗА СМЕНУ / SHIFT RATE' : 'СТАВКА ЗА ДЕНЬ / DAY RATE'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {(receiptData.shiftRate > 0
                          ? receiptData.shiftRate
                          : Math.round(receiptData.baseSalary / (receiptData.normDays || 1))
                        ).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5, borderTop: '1px dotted #eee', pt: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>НАЧИСЛЕНО / EARNED</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{receiptData.accruals.toLocaleString()}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', opacity: 0.6, fontStyle: 'italic', textAlign: 'right' }}>
                        ФОРМУЛА: {receiptData.baseSalaryType === 'shift'
                          ? `${receiptData.shiftRate.toLocaleString()} × ${receiptData.workedShifts} см.`
                          : `(${receiptData.baseSalary.toLocaleString()} / ${receiptData.normDays}) × ${receiptData.workedDays} дн.`
                        }
                      </Typography>
                    </Box>
                    {receiptData.bonuses > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>ПРЕМИИ / BONUSES</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}>+{receiptData.bonuses.toLocaleString()}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, mb: 1 }}>УДЕРЖАНИЯ (DEDUCTIONS):</Typography>
                  <Box sx={{ mb: 2 }}>
                    {receiptData.advance > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>АВАНС/ADVANCE</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}>-{receiptData.advance.toLocaleString()}</Typography>
                      </Box>
                    )}
                    {receiptData.penalties > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>ШТРАФЫ/FINES</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}>-{receiptData.penalties.toLocaleString()}</Typography>
                      </Box>
                    )}
                    {receiptData.fines && receiptData.fines.length > 0 && (
                      <Box sx={{ mt: 1, borderTop: '1px dotted #ccc', pt: 1 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold', mb: 0.5, opacity: 0.6 }}>ДЕТАЛИЗАЦИЯ ВЫЧЕТОВ / DEDUCTION DETAILS:</Typography>
                        {receiptData.fines.map((f: any, idx: number) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                            <Typography sx={{ fontSize: '0.6rem', opacity: 0.6 }}>
                              {f.date ? `${new Date(f.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ` : ''}
                              {f.reason || 'Вычет'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', opacity: 0.6 }}>-{f.amount.toLocaleString()}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ borderTop: '2px solid #000', pt: 1, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>ИТОГО (TOTAL):</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.8rem' }}>{receiptData.total.toLocaleString()} ₸</Typography>
                  </Box>

                  <Box sx={{ position: 'relative', mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{
                      border: '4px double',
                      p: 1,
                      transform: 'rotate(-15deg)',
                      color: receiptData.status === 'paid' ? '#2e7d32' : receiptData.status === 'approved' ? '#1976d2' : '#e65100',
                      borderColor: receiptData.status === 'paid' ? '#2e7d32' : receiptData.status === 'approved' ? '#1976d2' : '#e65100',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      fontSize: '1.2rem',
                      letterSpacing: 4,
                      opacity: 0.8
                    }}>
                      {receiptData.status === 'paid' ? 'ОПЛАЧЕНО' : receiptData.status === 'approved' ? 'УТВЕРЖДЕНО' : 'РАССЧИТАНО'}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 5, textAlign: 'center', opacity: 0.4 }}>
                    <Box sx={{
                      height: 30,
                      width: '100%',
                      background: 'repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 3px, #000 3px, #000 5px, transparent 5px, transparent 6px)',
                      mb: 0.5
                    }} />
                    <Typography sx={{ fontSize: '0.5rem' }}>DOCID: {receiptData.id} | AUTH_SIG_VALID</Typography>
                  </Box>
                </Box>

                <Box sx={{
                  height: 12,
                  width: '100%',
                  background: '#fff',
                  clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
                  position: 'absolute',
                  bottom: -10
                }} />
              </Box>


              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                <Tooltip title="Показать детальный расчет зарплаты">
                  <Button
                    onClick={() => handleOpenTotalDialog(mySalary)}
                    sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none', '&:hover': { color: '#fff' } }}
                  >
                    ПОКАЗАТЬ ДЕТАЛЬНЫЙ РАСЧЕТ / VIEW DETAILS
                  </Button>
                </Tooltip>

                {mySalary?._id && (
                  <AuditLogButton
                    entityType="payroll"
                    entityId={mySalary._id}
                    entityName={`Зарплата: ${mySalary.staffName}`}
                    size="small"
                  />
                )}
              </Box>
              <PayrollTotalDialog open={totalDialogOpen} onClose={() => setTotalDialogOpen(false)} data={currentTotalRow} />
            </Box>
          );
        })()
      ) : (
        <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
          <Box sx={{ maxWidth: '1400px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
              <Typography variant={isMobile ? 'h5' : 'h3'} sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>Расчетные листы</Typography>
              <Typography variant={isMobile ? 'body2' : 'h6'} sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Управление зарплатами за {selectedMonthLabel}</Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <TextField
                  label='Выберите месяц'
                  type='month'
                  size='small'
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <AuditLogButton entityType="payroll" />
              </Box>
            </Box>

            {!personalOnly && (
              <>
                <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                  <Box sx={{ p: { xs: 2, md: 3 }, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }, gap: { xs: 1.5, md: 3 } }}>
                    {[
                      { label: 'Начислено', value: (summary?.totalAccruals || 0).toLocaleString() + ' ₸', color: '#10b981', icon: <EditIcon /> },
                      { label: 'Авансы', value: (summary?.totalAdvance || 0).toLocaleString() + ' ₸', color: '#2196f3', icon: <DebtIcon /> },
                      { label: 'Вычеты', value: (summary?.totalPenalties || 0).toLocaleString() + ' ₸', color: '#f43f5e', icon: <CancelIcon /> },
                      { label: 'К выплате', value: (summary?.totalPayout || 0).toLocaleString() + ' ₸', color: '#8b5cf6', icon: <VisibilityIcon /> },
                    ].map((stat, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                        <Box sx={{ width: { xs: 32, md: 48 }, height: { xs: 32, md: 48 }, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${stat.color}15`, color: stat.color }}>
                          {React.cloneElement(stat.icon as React.ReactElement, { sx: { fontSize: { xs: 18, md: 24 } } })}
                        </Box>
                        <Box>
                          <Typography variant='caption' color='text.secondary' sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>{stat.label}</Typography>
                          <Typography variant={isMobile ? 'body2' : 'h6'} sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>

                {user?.id && (user?.role === 'admin' || user?.role === 'manager') && (
                  <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Tooltip title="Сгенерировать расчетные листы за выбранный период">
                      <Button variant='contained' startIcon={<EditIcon />} onClick={handleOpenConfirmDialog} disabled={generating} size={isMobile ? 'small' : 'medium'}>Сгенерировать</Button>
                    </Tooltip>
                    <Tooltip title="Обновить все расчетные листы на основе текущих данных">
                      <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleRefreshPayrolls} disabled={refreshing} size={isMobile ? 'small' : 'medium'}>Обновить всё</Button>
                    </Tooltip>
                    <Tooltip title="Импортировать данные из Excel файла">
                      <Button variant='outlined' color='secondary' startIcon={<FileUploadIcon />} onClick={handleImportPayrolls} disabled={importing} size={isMobile ? 'small' : 'medium'}>Импорт</Button>
                    </Tooltip>

                    <Tooltip title={`Настроить ставку штрафа за опоздания (${globalPenaltyRate} тг)`}>
                      <Button variant='outlined' onClick={handleOpenRateDialog} size={isMobile ? 'small' : 'medium'}>Ставка: {globalPenaltyRate} ₸</Button>
                    </Tooltip>
                    <Tooltip title="Экспортировать данные в формате XLSX">
                      <Button variant='contained' color='success' startIcon={<VisibilityIcon />} onClick={handleExportToExcel} size={isMobile ? 'small' : 'medium'}>Экспорт XLSX</Button>
                    </Tooltip>
                  </Box>
                )}

                {isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rows.map((r) => (
                      <Card key={r.staffId} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{r.staffName}</Typography>
                              <Chip
                                label={r.status === 'paid' ? 'Оплачено' : r.status === 'approved' ? 'Утвержден' : 'Черновик'}
                                color={r.status === 'paid' ? 'success' : r.status === 'approved' ? 'info' : 'warning'}
                                size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                              />
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: (r.total || 0) < 0 ? 'error.main' : 'primary.main' }}>
                                {r.total?.toLocaleString()} ₸
                              </Typography>
                              <Typography variant="caption" color="text.secondary">Итого к выплате</Typography>
                            </Box>
                          </Box>

                          {editingId === r.staffId ? (
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                  label="Оклад/Смена"
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={editData.baseSalary === 0 ? '' : (editData.baseSalary ?? r.baseSalary ?? '')}
                                  onChange={(e) => handleInputChange('baseSalary', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                                <Select
                                  value={editData.baseSalaryType || r.baseSalaryType || 'month'}
                                  onChange={(e) => handleInputChange('baseSalaryType', e.target.value)}
                                  size="small"
                                  sx={{ minWidth: 80 }}
                                >
                                  <MenuItem value="month">Мес</MenuItem>
                                  <MenuItem value="shift">Смена</MenuItem>
                                </Select>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  label="Премия"
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={editData.bonuses === 0 ? '' : (editData.bonuses ?? r.bonuses)}
                                  onChange={(e) => handleInputChange('bonuses', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                                <TextField
                                  label="Аванс"
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={editData.advance === 0 ? '' : (editData.advance ?? r.advance)}
                                  onChange={(e) => handleInputChange('advance', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  label="Вычеты"
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={editData.penalties === 0 ? '' : (editData.penalties ?? r.penalties)}
                                  onChange={(e) => handleInputChange('penalties', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                                <Select
                                  size="small"
                                  fullWidth
                                  value={editData.status ?? r.status}
                                  onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                  <MenuItem value="draft">Черновик</MenuItem>
                                  <MenuItem value="approved">Утвержден</MenuItem>
                                  <MenuItem value="paid">Оплачено</MenuItem>
                                </Select>
                              </Box>
                              <Button
                                variant="contained"
                                fullWidth
                                startIcon={<SaveIcon />}
                                onClick={() => handleSaveClick(r.staffId)}
                                sx={{ mt: 1 }}
                              >
                                Сохранить
                              </Button>
                            </Stack>
                          ) : (
                            <>
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2, bgcolor: 'grey.50', p: 1.5, borderRadius: 1.5 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Оклад</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {r.baseSalary?.toLocaleString()} ₸ ({r.baseSalaryType === 'shift' ? 'см.' : 'мес.'})
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Премия</Typography>
                                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                                    +{r.bonuses?.toLocaleString()}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Аванс</Typography>
                                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'medium' }}>
                                    -{r.advance?.toLocaleString()}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Вычеты <AddIcon sx={{ fontSize: 12, cursor: 'pointer' }} onClick={() => handleOpenFineDialog(r)} />
                                  </Typography>
                                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium', cursor: 'pointer', borderBottom: '1px dashed currentColor', display: 'inline-block' }} onClick={() => handleOpenFineDialog(r)}>
                                    -{r.penalties?.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton size="small" color="primary" onClick={() => handleEditClick(r)} sx={{ bgcolor: 'primary.lighter' }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleOpenTotalDialog(r)} sx={{ bgcolor: 'grey.100' }}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                  {r._id && (
                                    <AuditLogButton
                                      entityType="payroll"
                                      entityId={r._id}
                                      entityName={`Зарплата: ${r.staffName}`}
                                      size="small"
                                    />
                                  )}
                                </Box>
                                <IconButton size="small" color="error" onClick={() => handleDeleteClick(r.staffId)} sx={{ bgcolor: 'error.lighter' }}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ overflowX: 'auto' }}>
                        <Table>
                          <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Сотрудник</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Оклад/Смены</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Премия</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Аванс</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Вычеты</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Итого</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows.map((r) => (
                              <TableRow key={r.staffId} hover>
                                <TableCell sx={{ fontWeight: 'medium' }}>{r.staffName}</TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                      <TextField
                                        size='small'
                                        type='number'
                                        value={editData.baseSalary === 0 ? '' : (editData.baseSalary ?? r.baseSalary ?? '')}
                                        onChange={(e) => handleInputChange('baseSalary', e.target.value === '' ? 0 : Number(e.target.value))}
                                        inputProps={{ style: { fontSize: 14, textAlign: 'right' }, min: 0 }}
                                        sx={{ width: '80px' }}
                                        variant='standard'
                                      />
                                      <Select
                                        value={editData.baseSalaryType || r.baseSalaryType || 'month'}
                                        onChange={(e) => handleInputChange('baseSalaryType', e.target.value)}
                                        variant="standard"
                                        size="small"
                                        sx={{ fontSize: '0.75rem', minWidth: '40px' }}
                                      >
                                        <MenuItem value="month">Мес</MenuItem>
                                        <MenuItem value="shift">Смена</MenuItem>
                                      </Select>
                                    </Box>
                                  ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                      <span>{r.baseSalary?.toLocaleString()} тг</span>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>
                                        {r.baseSalaryType === 'shift' ? 'за смену' : 'в месяц'}
                                      </Typography>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <TextField 
                                      type='number' 
                                      size='small' 
                                      value={editData.bonuses === 0 ? '' : (editData.bonuses ?? r.bonuses)} 
                                      onChange={(e) => handleInputChange('bonuses', e.target.value === '' ? 0 : Number(e.target.value))} 
                                      sx={{ width: '100px' }} 
                                      inputProps={{ style: { textAlign: 'right' }, min: 0 }} 
                                    />
                                  ) : (
                                    <Typography variant='body2' color='success.main'>+{r.bonuses?.toLocaleString() || '0'}</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <TextField 
                                      type='number' 
                                      size='small' 
                                      value={editData.advance === 0 ? '' : (editData.advance ?? r.advance)} 
                                      onChange={(e) => handleInputChange('advance', e.target.value === '' ? 0 : Number(e.target.value))} 
                                      sx={{ width: '100px' }} 
                                      inputProps={{ style: { textAlign: 'right' }, min: 0 }} 
                                    />
                                  ) : (
                                    <Typography variant='body2' sx={{ color: '#e65100' }}>-{r.advance?.toLocaleString() || '0'}</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <TextField 
                                      type='number' 
                                      size='small' 
                                      value={editData.penalties === 0 ? '' : (editData.penalties ?? r.penalties)} 
                                      onChange={(e) => handleInputChange('penalties', e.target.value === '' ? 0 : Number(e.target.value))} 
                                      sx={{ width: '100px' }} 
                                      inputProps={{ style: { textAlign: 'right' }, min: 0 }} 
                                    />
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                      <Tooltip
                                        title="Нажмите для детализации"
                                        placement="left"
                                        arrow
                                      >
                                        <span
                                          style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px dashed #ef5350',
                                            color: '#d32f2f',
                                            fontWeight: 'bold'
                                          }}
                                          onClick={() => handleOpenFineDialog(r)}
                                        >
                                          {r.penalties ? r.penalties?.toLocaleString() : '0'}
                                        </span>
                                      </Tooltip>
                                      {user?.role === 'admin' && (
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenFineDialog(r)}
                                          sx={{
                                            color: 'error.main',
                                            bgcolor: 'error.lighter',
                                            width: 28,
                                            height: 28,
                                            '&:hover': { bgcolor: 'error.light', color: 'white' }
                                          }}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Tooltip title="Нажмите для детализации" arrow placement="top">
                                    <span
                                      onClick={() => handleOpenTotalDialog(r)}
                                      style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px dashed currentColor',
                                        paddingBottom: '2px'
                                      }}
                                    >
                                      <Typography
                                        variant='body1'
                                        sx={{
                                          fontWeight: '900',
                                          color: (r.total || 0) < 0 ? 'error.main' : 'primary.main'
                                        }}
                                      >
                                        {r.total?.toLocaleString() || '0'} ₸
                                      </Typography>
                                    </span>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <Select size='small' value={editData.status ?? r.status} onChange={(e) => handleInputChange('status', e.target.value)}>
                                      <MenuItem value='draft'>Черновик</MenuItem>
                                      <MenuItem value='approved'>Утвержден</MenuItem>
                                      <MenuItem value='paid'>Оплачено</MenuItem>
                                    </Select>
                                  ) : (
                                    <Chip
                                      label={r.status === 'paid' ? 'Оплачено' : r.status === 'approved' ? 'Утвержден' : 'Черновик'}
                                      color={r.status === 'paid' ? 'success' : r.status === 'approved' ? 'info' : 'warning'}
                                      size='small'
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingId === r.staffId ? (
                                    <IconButton color='success' onClick={() => handleSaveClick(r.staffId)}><SaveIcon /></IconButton>
                                  ) : (
                                    <>
                                      <Tooltip title='Редактировать'>
                                        <IconButton
                                          color='primary'
                                          size='small'
                                          onClick={() => handleEditClick(r)}
                                          sx={{ mr: 1 }}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title='Просмотр'>
                                        <IconButton color='default' size='small' onClick={() => handleOpenTotalDialog(r)}>
                                          <VisibilityIcon />
                                        </IconButton>
                                      </Tooltip>
                                      {r._id && (
                                        <AuditLogButton
                                          entityType="payroll"
                                          entityId={r._id}
                                          entityName={`Зарплата: ${r.staffName}`}
                                        />
                                      )}
                                      <Tooltip title='Удалить'>
                                        <IconButton
                                          color='error'
                                          size='small'
                                          onClick={() => handleDeleteClick(r.staffId)}
                                        >
                                          <CloseIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <FinesDetailsDialog open={fineDialogOpen} onClose={() => setFineDialogOpen(false)} fines={currentFines} onAddFine={handleAddFine} onDeleteFine={handleDeleteFine} staffName={currentFineStaffName} />
            <PayrollTotalDialog
              open={totalDialogOpen}
              onClose={() => setTotalDialogOpen(false)}
              data={currentTotalRow}
              onUpdate={async (id, updates) => {
                await updatePayroll(id, updates);
                await loadData();
                const updatedRow = rows.find(r => r._id === id);
                if (updatedRow) setCurrentTotalRow(updatedRow);
              }}
            />

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
              <DialogTitle>Генерация листов</DialogTitle>
              <DialogContent><DialogContentText>Сгенерировать листы за {selectedMonth}?</DialogContentText></DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmDialogOpen(false)}>Отмена</Button>
                <Button onClick={handleConfirmGenerate} variant="contained" color="primary">ОК</Button>
              </DialogActions>
            </Dialog>

            <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Настройки штрафа за опоздание</DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                  Укажите ставку штрафа и тип расчета.
                  Это значение будет использоваться при следующем расчете зарплат.
                </DialogContentText>
                <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Тип расчета штрафа
                  </Typography>
                  <Select
                    value={newPenaltyType}
                    onChange={(e) => setNewPenaltyType(e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="per_minute">За каждую минуту</MenuItem>
                    <MenuItem value="per_5_minutes">За каждые 5 минут</MenuItem>
                    <MenuItem value="per_10_minutes">За каждые 10 минут</MenuItem>
                    <MenuItem value="fixed">Фиксированный штраф</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  margin="dense"
                  label={newPenaltyType === 'fixed' ? 'Сумма штрафа (тг)' : `Ставка (тг/${newPenaltyType === 'per_minute' ? 'мин' : newPenaltyType === 'per_5_minutes' ? '5 мин' : '10 мин'})`}
                  type="number"
                  fullWidth
                  value={newRate === 0 ? '' : newRate}
                  onChange={(e) => setNewRate(e.target.value === '' ? 0 : Number(e.target.value))}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {newPenaltyType === 'per_minute' && 'Пример: при опоздании на 15 мин штраф = 15 × ставка'}
                  {newPenaltyType === 'per_5_minutes' && 'Пример: при опоздании на 15 мин штраф = 3 × ставка (15÷5=3)'}
                  {newPenaltyType === 'per_10_minutes' && 'Пример: при опоздании на 15 мин штраф = 2 × ставка (15÷10≈2)'}
                  {newPenaltyType === 'fixed' && 'Фиксированный штраф за любое опоздание'}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setRateDialogOpen(false)}>Отмена</Button>
                <Button onClick={handleSaveRate} variant="contained">Сохранить</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
      )
      }
    </>
  );
};

export default PayrollList;

