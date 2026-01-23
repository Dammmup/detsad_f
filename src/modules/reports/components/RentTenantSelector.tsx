import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getUsers } from '../../staff/services/users';
import { EXTERNAL_ROLES } from '../../../shared/types/common';

interface User {
  _id?: string;
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
}

interface RentTenantSelectorProps {
  selectedTenantIds: string[];
  onTenantSelect: (tenantIds: string[]) => void;
  disabled?: boolean;
}

const RentTenantSelector: React.FC<RentTenantSelectorProps> = ({
  selectedTenantIds,
  onTenantSelect,
  disabled = false,
}) => {
  const [allTenants, setAllTenants] = useState<User[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<User[]>([]);


  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const users = await getUsers();

        const tenants = users.filter((user) => EXTERNAL_ROLES.includes(user.role as any));
        setAllTenants(tenants);


        const selected = tenants.filter(
          (tenant) => tenant._id && selectedTenantIds.includes(tenant._id),
        );
        setSelectedTenants(selected);
      } catch (error) {
        console.error('Ошибка загрузки арендаторов:', error);
      }
    };

    fetchTenants();
  }, [selectedTenantIds]);


  const handleTenantChange = (event: any, newValue: User[]) => {
    setSelectedTenants(newValue);
    onTenantSelect(
      newValue
        .map((tenant) => tenant._id)
        .filter((id): id is string => id !== undefined),
    );
  };


  const filteredTenants = allTenants.filter(
    (tenant) =>
      tenant._id &&
      !selectedTenants.some((selected) => selected._id === tenant._id) &&
      tenant.fullName.toLowerCase().includes(''),
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant='h6'
        sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
      >
        Выберите арендаторов для генерации расчетных листов
      </Typography>

      <Autocomplete
        multiple
        options={filteredTenants}
        getOptionLabel={(option) => option.fullName}
        value={selectedTenants}
        onChange={handleTenantChange}
        disabled={disabled}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField
            {...params}
            label='Арендаторы'
            placeholder='Выберите арендаторов'
            variant='outlined'
          />
        )}
        renderTags={(value, getTagProps) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  label={option.fullName}
                  size='small'
                  {...tagProps}
                  onDelete={disabled ? undefined : tagProps.onDelete}
                  deleteIcon={disabled ? undefined : <CloseIcon />}
                  color='primary'
                  variant='outlined'
                />
              );
            })}
          </Box>
        )}
      />

      {selectedTenants.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Выбрано арендаторов: {selectedTenants.length}
          </Typography>
          <IconButton
            size='small'
            onClick={() => {
              setSelectedTenants([]);
              onTenantSelect([]);
            }}
            disabled={disabled}
            color='primary'
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default RentTenantSelector;
