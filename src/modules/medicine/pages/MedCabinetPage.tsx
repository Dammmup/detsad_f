import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { medJournals, MedJournalType } from './medJournals.config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import { useEffect } from 'react';

export default function MedCabinetPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as MedJournalType) || 'children';
  const [tab, setTab] = React.useState<MedJournalType>(initialTab);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const role = currentUser?.role || '';
  const canViewMedical = ['admin', 'manager', 'director', 'doctor', 'nurse'].includes(role);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as MedJournalType;
    if (tabFromUrl && tabFromUrl !== tab) {
      setTab(tabFromUrl);
    }
  }, [searchParams, tab]);

  const handleTabChange = (_: React.SyntheticEvent, value: MedJournalType) => {
    setTab(value);
  };
  const journalTypes: { type: MedJournalType; label: string }[] = [
    { type: 'children', label: 'Журналы по детям' },
    { type: 'food', label: 'Журналы по питанию/пищеблоку' },
  ];
  const filteredJournals = medJournals.filter((j) => j.type === tab);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h4' gutterBottom>
        Медицинский кабинет
      </Typography>
      {!canViewMedical && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Доступ к журналам медкабинета ограничен для вашей роли.
        </Alert>
      )}
      {canViewMedical && (
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor='primary'
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
        >
          {journalTypes.map((jt) => (
            <Tab key={jt.type} value={jt.type} label={jt.label} />
          ))}
        </Tabs>
      </Paper>
      )}
      <Stack spacing={2}>
        {canViewMedical && filteredJournals.map((journal) => (
          <Button
            key={journal.id}
            variant='outlined'
            size='large'
            sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 2 }}
            onClick={() => navigate(getJournalRoute(journal.id))}
          >
            <Box>
              <Typography variant='h6'>{journal.title}</Typography>
              {journal.description && (
                <Typography variant='body2' color='text.secondary'>
                  {journal.description}
                </Typography>
              )}
            </Box>
          </Button>
        ))}
      </Stack>
    </Box>
  );

  function getJournalRoute(id: string) {
    switch (id) {
      case 'child_health_passport':
        return '/app/med/passport';
      case 'mantoux_test_register':
        return '/app/med/mantoux';
      case 'somatic_diseases':
        return '/app/med/somatic';
      case 'helminth_test_register':
        return '/app/med/helminth';
      case 'infectious_diseases':
        return '/app/med/infectious';
      case 'contacts_infections':
        return '/app/med/contact-infection';
      case 'risk_group':
        return '/app/med/risk-group';
      case 'tub_positive_register':
        return '/app/med/tub-positive';
      case 'organoleptic':
        return '/app/med/organoleptic-journal';
      case 'food_norms_control':
        return '/app/med/food-norms-control';
      case 'perishable_brak':
        return '/app/med/perishable-brak';
      case 'food_certificates':
        return '/app/med/food-certificates';
      case 'detergents':
        return '/app/med/detergents';
      case 'food_stock':
        return '/app/med/food-stock';
      case 'canteen_staff_health':
        return '/app/med/canteen-staff-health';
      case 'vitaminization':
        return '/app/med/vitaminization';
      default:
        return '/app/med';
    }
  }
}
