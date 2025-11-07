
import React, { useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, Box, SelectChangeEvent
} from '@mui/material';
import { Download, PictureAsPdf, TableChart, InsertDriveFile } from '@mui/icons-material';

interface ExportButtonProps {
  exportTypes: { value: string; label: string }[];
  onExport: (exportType: string, exportFormat: 'pdf' | 'excel' | 'csv') => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ exportTypes, onExport }) => {
  const exportType = exportTypes[0]?.value || '';

  const handleExport = () => {
    onExport(exportType, 'excel');
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<Download />}
      onClick={handleExport}
    >
      Экспорт
    </Button>
  );
};

export default ExportButton;
