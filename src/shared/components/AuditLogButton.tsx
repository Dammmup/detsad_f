import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AuditLogDrawer from './AuditLogDrawer';
import { useAuth } from '../../app/context/AuthContext';

interface AuditLogButtonProps {
  entityType: string;
  entityId?: string;
  entityName?: string;
  size?: 'small' | 'medium' | 'large';
}

const ALLOWED_ROLES = ['admin', 'manager'];

const AuditLogButton: React.FC<AuditLogButtonProps> = ({
  entityType,
  entityId,
  entityName,
  size = 'small',
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <>
      <Tooltip title="История изменений">
        <IconButton size={size} onClick={() => setOpen(true)}>
          <HistoryIcon fontSize={size} />
        </IconButton>
      </Tooltip>
      <AuditLogDrawer
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </>
  );
};

export default AuditLogButton;
