import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EmailIcon from '@mui/icons-material/Email';

interface ExportMenuButtonProps {
  onDownload: () => void;
  onSendEmail: () => void;
  label?: string;
}

const ExportMenuButton: React.FC<ExportMenuButtonProps> = ({
  onDownload,
  onSendEmail,
  label,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = () => {
    handleClose();
    onDownload();
  };

  const handleSendEmail = () => {
    handleClose();
    onSendEmail();
  };

  return (
    <>
      <Button
        variant='outlined'
        color='primary'
        onClick={handleClick}
        startIcon={<UploadIcon />}
      >
        {label || 'Экспорт'}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Скачать файл' />
        </MenuItem>
        <MenuItem onClick={handleSendEmail}>
          <ListItemIcon>
            <EmailIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Отправить на почту' />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportMenuButton;
