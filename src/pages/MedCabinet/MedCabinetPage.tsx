import React from 'react';
import { Box, Typography, Tabs, Tab, Paper, Button, Stack } from '@mui/material';
import { medJournals, MedJournalType } from './medJournals.config';
import { useNavigate } from 'react-router-dom';




export default function MedCabinetPage() {
  const [tab, setTab] = React.useState<MedJournalType>('children');
  const navigate = useNavigate();

  const handleTabChange = (_: React.SyntheticEvent, value: MedJournalType) => {
    setTab(value);
  };
  const journalTypes: { type: MedJournalType; label: string }[] = [
    { type: 'children', label: 'Журналы по детям' },
    { type: 'food', label: 'Журналы по питанию/пищеблоку' },
  ];
  const filteredJournals = medJournals.filter(j => j.type === tab);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Медицинский кабинет</Typography>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {journalTypes.map(jt => (
            <Tab key={jt.type} value={jt.type} label={jt.label} />
          ))}
        </Tabs>
      </Paper>
      <Stack spacing={2}>
        {filteredJournals.map(journal => (
          <Button
            key={journal.id}
            variant="outlined"
            size="large"
            sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 2 }}
            onClick={() => navigate(getJournalRoute(journal.id))}
          >
            <Box>
              <Typography variant="h6">{journal.title}</Typography>
              {journal.description && (
                <Typography variant="body2" color="text.secondary">{journal.description}</Typography>
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
      case 'helminth_journal':
        return '/app/med/helminth';
      case 'infectious_diseases':
        return '/app/med/infectious';
      case 'contact_infection':
        return '/app/med/contact-infection';
      case 'risk_group_children':
        return '/app/med/risk-group';
      case 'tub_positive':
        return '/app/med/tub-positive';
      case 'vitaminization':
        return '/app/med/vitaminization';
      case 'organoleptic':
        return '/app/med/organoleptic-journal';
      case 'food_norms_control':
        return '/app/med/food-norms-control';
      default:
        return '/app/med';
    }
  }
}

