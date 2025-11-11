import React from 'react';
import { Button, Box } from '@mui/material';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ExcelIcon from '@mui/icons-material/TableChart';
import {
  generateAndDownloadDocument,
  GenerateDocumentParams,
} from '../services/documentGenerator';

export type ExportTemplate = {
  template: string;
  label: string;
  format: 'pdf' | 'xlsx' | 'docx';
  getParams?: () => Partial<GenerateDocumentParams>;
};

interface ExportAutoTemplatesButtonProps {
  templates: ExportTemplate[];
}

const ExportAutoTemplatesButton: React.FC<ExportAutoTemplatesButtonProps> = ({
  templates,
}) => {
  return (
    <Box mb={2} display='flex' gap={2}>
      {templates.map((tpl) => (
        <Button
          key={tpl.template}
          variant='outlined'
          startIcon={tpl.format === 'pdf' ? <PdfIcon /> : <ExcelIcon />}
          onClick={() =>
            generateAndDownloadDocument({
              template: tpl.template,
              format: tpl.format,
              date: new Date().toISOString().slice(0, 10),
              ...tpl.getParams?.(),
            })
          }
        >
          {tpl.label}
        </Button>
      ))}
    </Box>
  );
};

export default ExportAutoTemplatesButton;
