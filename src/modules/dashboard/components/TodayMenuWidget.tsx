import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  RestaurantMenu,
  FreeBreakfast,
  LunchDining,
  DinnerDining,
  BakeryDining,
} from '@mui/icons-material';
import { getTodayMenu, DailyMenu, getMealTypeName, MealType } from '../../food/services/dailyMenu';

const TodayMenuWidget: React.FC = React.memo(() => {
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const todayMenu = await getTodayMenu();
        setMenu(todayMenu);
      } catch (err: any) {
        console.error('Error fetching today menu:', err);
        setError('Не удалось загрузить меню на сегодня');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const getMealIcon = useCallback((mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return <FreeBreakfast color="primary" />;
      case 'lunch':
        return <LunchDining color="secondary" />;
      case 'snack':
        return <BakeryDining sx={{ color: '#ff9800' }} />;
      case 'dinner':
        return <DinnerDining sx={{ color: '#764ba2' }} />;
      default:
        return <RestaurantMenu />;
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!menu) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">Меню на сегодня ещё не составлено</Typography>
      </Box>
    );
  }

  const mealTypes = useMemo<MealType[]>(() => ['breakfast', 'lunch', 'snack', 'dinner'], []);

  return (
    <Card
      sx={{
        height: '100%',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 'none',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <List dense sx={{ py: 0 }}>
          {mealTypes.map((type, index) => {
            const meal = menu.meals[type];
            if (!meal || !meal.dishes || meal.dishes.length === 0) return null;

            return (
              <React.Fragment key={type}>
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    {getMealIcon(type)}
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Typography variant="subtitle2" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {getMealTypeName(type)}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {meal.dishes.map((dish: any, dishIndex: number) => (
                          <Typography
                            key={dishIndex}
                            variant="body2"
                            component="div"
                            sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.4 }}
                          >
                            • {dish.name || (typeof dish === 'string' ? dish : 'Блюдо')}
                          </Typography>
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
                {index < mealTypes.length - 1 && (
                  <Divider variant="inset" component="li" sx={{ ml: 5, opacity: 0.6 }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
});

export default TodayMenuWidget;
