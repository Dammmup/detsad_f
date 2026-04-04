import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Button
} from '@mui/material';
import { showSnackbar } from '../../../shared/components/Snackbar';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import SeedIcon from '@mui/icons-material/Agriculture';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrialBalanceTab from '../components/TrialBalanceTab';
import PostingsJournalTab from '../components/PostingsJournalTab';
import AccountCardTab from '../components/AccountCardTab';
import DocumentsTab from '../components/DocumentsTab';
import ReconciliationTab from '../components/ReconciliationTab';
import accountingApi from '../services/accountingApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const AccountingPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleSelectAccount = (code: string) => {
    setSelectedAccount(code);
    setTab(2); // Switch to Account Card tab
  };

  const [retroLoading, setRetroLoading] = useState(false);

  const handleSeed = async () => {
    try {
      const result = await accountingApi.seedAccounts();
      showSnackbar({ message: result.message, type: 'success' });
    } catch (err: any) {
      showSnackbar({ message: getErrorMessage(err), type: 'error' });
    }
  };

  const handleRetroGenerate = async () => {
    setRetroLoading(true);
    try {
      const result = await accountingApi.retroGenerate();
      const g = result.generated;
      showSnackbar({
        message: `Сгенерировано ${result.total} документов (оплаты: ${g.childPayments}, начисл. ЗП: ${g.payrollApproved}, выпл. ЗП: ${g.payrollPaid}, аренда: ${g.rents})`,
        type: 'success'
      });
    } catch (err: any) {
      showSnackbar({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setRetroLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Бухгалтерия
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<AutoFixHighIcon />}
            onClick={handleRetroGenerate}
            disabled={retroLoading}
          >
            {retroLoading ? 'Генерация...' : 'Сгенерировать проводки из данных'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SeedIcon />}
            onClick={handleSeed}
          >
            Инит. план счетов
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ mb: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<FactCheckIcon />} iconPosition="start" label="Сверка" />
          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Оборотная ведомость" />
          <Tab icon={<CreditCardIcon />} iconPosition="start" label="Карточка счёта" />
          <Tab icon={<ListAltIcon />} iconPosition="start" label="Журнал проводок" />
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Документы" />
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0}>
        <ReconciliationTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <TrialBalanceTab onSelectAccount={handleSelectAccount} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <AccountCardTab initialAccount={selectedAccount || undefined} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <PostingsJournalTab />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <DocumentsTab />
      </TabPanel>

    </Box>
  );
};

export default AccountingPage;
