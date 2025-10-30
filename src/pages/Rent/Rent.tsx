import React, { useEffect, useState, useCallback } from 'react';
import { getUsers } from '../../services/users';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Alert, Box, Typography,
} from '@mui/material';
import { User as StaffMember } from '../../types/common';

const Rent = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError(null);
    getUsers()
      .then(data => {
        const rentStaff = data.filter(user => user.tenant === true);
        setStaff(rentStaff);
      })
      .catch(err => setError(err?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return (
    <>
    <Paper style={{ margin: 24, padding: 24 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" style={{ color: '#1890ff', display: 'flex', alignItems: 'center' }}>
          Аренда
        </Typography>
      </Box>
      
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      
      {!loading && !error && (
        <>
          {staff.length === 0  ? (
            <Alert severity="info" style={{ marginTop: 16 }}>
              Нет сотрудников с признаком арендатора.
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ФИО</TableCell>
                  <TableCell>Контакты</TableCell>
                  <TableCell>Расчетные листы</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.fullName}</TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column">
                        {member.phone && (
                          <Box display="flex" alignItems="center">
                            {member.phone}
                          </Box>
                        )}
                        {member.email && (
                          <Box display="flex" alignItems="center">
                            {member.email}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                        {/* TODO: Add payrolls */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Paper>
    </>
  );
};

export default Rent;