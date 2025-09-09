import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import ChildCareIcon from '@mui/icons-material/ChildCare';

const ReportsUnified: React.FC = () => (
  <Box p={3}>
    <Typography variant="h4" gutterBottom>Отчёты</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardActionArea href="/app/reports/staff">
            <CardContent>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Отчёты по сотрудникам</Typography>
              <Typography variant="body2" color="text.secondary">Посещаемость, графики, зарплаты и др.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardActionArea href="/app/reports/children">
            <CardContent>
              <ChildCareIcon color="secondary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Отчёты по детям</Typography>
              <Typography variant="body2" color="text.secondary">Посещаемость, группы, динамика и др.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default ReportsUnified;
