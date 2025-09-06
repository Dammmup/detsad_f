import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChildForm from '../children/ChildForm';

const Attendance = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Посещаемость</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Добавить ребенка
        </Button>
      </Box>
      {/* Здесь будет список посещаемости/детей */}
      <Typography color="textSecondary">Здесь будет таблица посещаемости и список детей.</Typography>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить ребенка</DialogTitle>
        <DialogContent>
          <ChildForm onSuccess={handleClose} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Отмена</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance;
