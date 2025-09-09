import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import ChildCareIcon from '@mui/icons-material/ChildCare';

const DocumentsUnified: React.FC = () => (
  <Box p={3}>
    <Typography variant="h4" gutterBottom>Документы</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardActionArea href="/app/documents/staff">
            <CardContent>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Документы сотрудников</Typography>
              <Typography variant="body2" color="text.secondary">Договоры, приказы, справки и др.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardActionArea href="/app/documents/children">
            <CardContent>
              <ChildCareIcon color="secondary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Документы детей</Typography>
              <Typography variant="body2" color="text.secondary">Медкарты, заявления, справки и др.</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default DocumentsUnified;
