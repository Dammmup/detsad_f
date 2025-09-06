import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import MoneyIcon from '@mui/icons-material/PeopleAlt';
import { useGroups } from '../../../context/GroupsContext';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  statCard: {
    padding: theme.spacing(3),
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows[8],
    },
  },
  statIcon: {
    fontSize: '2.5rem',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: theme.spacing(1, 0),
  },
  statLabel: {
    color: theme.palette.text.secondary,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
}));

const StatCard = ({ icon: Icon, value, subValue, label, loading, color = 'primary' }) => {
  const classes = useStyles();
  
  return (
    <Paper className={classes.statCard} elevation={3}>
      {loading ? (
        <Box className={classes.loading}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <>
          <Icon className={classes.statIcon} color={color} />
          <Typography variant="h4" className={classes.statValue} color={color}>
            {loading ? <CircularProgress size={24} /> : value}
          </Typography>
          {subValue && (
            <Typography variant="subtitle2" color="textSecondary">
              {subValue}
            </Typography>
          )}
          <Typography variant="subtitle1" className={classes.statLabel}>
            {label}
          </Typography>
        </>
      )}
    </Paper>
  );
};

const Dashboard = () => {
  const classes = useStyles();
  const { groups, loading: groupsLoading, error } = useGroups();
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalGroups: 0,
    upcomingEvents: 0,
    totalStaff: 0,
    availableSpots: 0,
    avgGroupSize: 0,
  });

  useEffect(() => {
    if (!groupsLoading && groups) {
      const totalChildren = groups.reduce((sum, group) => sum + (group.childrenCount || 0), 0);
      const availableSpots = groups.reduce((sum, group) => {
        const max = group.maxCapacity || 0;
        const current = group.childrenCount || 0;
        return sum + Math.max(0, max - current);
      }, 0);
      
      const avgGroupSize = groups.length > 0 
        ? Math.round((totalChildren / groups.length) * 10) / 10 
        : 0;
      
      const teacherIds = new Set();
      groups.forEach(group => {
        if (group.teacherId) {
          teacherIds.add(group.teacherId);
        }
      });
      
      setStats({
        totalChildren,
        totalGroups: groups.length,
        totalStaff: teacherIds.size,
        availableSpots,
        avgGroupSize,
        upcomingEvents: 0,
      });
    }
  }, [groups, groupsLoading]);
  
  const loading = groupsLoading;

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Панель управления детским садом
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box className={classes.loading}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={PeopleIcon} 
              value={stats.totalChildren} 
              label="Всего детей"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={GroupIcon} 
              value={stats.totalGroups} 
              label="Группы"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={EventIcon} 
              value={stats.upcomingEvents} 
              label="Мероприятия"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={MoneyIcon} 
              value={stats.totalStaff} 
              label="Воспитатели"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={GroupIcon} 
              value={stats.availableSpots} 
              label="Свободных мест"
              loading={loading}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <StatCard 
              icon={GroupIcon} 
              value={stats.avgGroupSize} 
              subValue={`из ${groups[0]?.maxCapacity || 0}`}
              label="Средний размер группы"
              loading={loading}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper className={classes.statCard}>
              <EventIcon className={classes.statIcon} color="action" />
              <Typography variant="h6" className={classes.statLabel}>
                Доп. показатели
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Будут добавлены позже
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default Dashboard;
