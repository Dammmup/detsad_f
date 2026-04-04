import React from 'react';
import { Alert, AlertTitle, Box, Collapse } from '@mui/material';

interface FormErrorAlertProps {
  error: string | null | undefined;
  onClose?: () => void;
}

/**
 * Компонент для отображения ошибок в формах.
 * Автоматически скрывается, если ошибка пуста.
 */
const FormErrorAlert: React.FC<FormErrorAlertProps> = ({ error, onClose }) => {
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <Collapse in={!!error}>
        <Alert 
          severity="error" 
          onClose={onClose}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle>Ошибка сохранения</AlertTitle>
          {error}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default FormErrorAlert;
