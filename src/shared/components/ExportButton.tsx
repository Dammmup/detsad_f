import React from 'react';
import {
  Button,
} from '@mui/material';
import {
  Download,
  Upload,

} from '@mui/icons-material';

interface ExportButtonProps {
  exportTypes: { value: string; label: string }[];
  onExport: (exportType: string, exportFormat: 'xlsx') => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  exportTypes,
  onExport,
}) => {
  const exportType = exportTypes[0]?.value || '';

  const handleExport = () => {
    onExport(exportType, 'xlsx');
  };

  return (
    <Button
      variant='contained'
      color='primary'
      startIcon={<Upload />}
      onClick={handleExport}
    >
      Экспорт
    </Button>
  );
};

export default ExportButton;
