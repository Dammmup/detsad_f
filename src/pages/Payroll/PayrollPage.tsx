import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PageTitle from '../../components/PageTitle';
import PayrollTable from '../../components/Payroll/PayrollTable';

const PayrollPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <PageTitle title="Зарплаты" />
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Управление зарплатами сотрудников
        </Typography>
        <Box mt={2}>
          <PayrollTable />
        </Box>
      </Box>
    </Container>
  );
};

export default PayrollPage;