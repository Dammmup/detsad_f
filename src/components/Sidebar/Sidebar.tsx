import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Box,
  Fade,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  location: any;
  structure: any[];
  variant?: 'permanent' | 'temporary';
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({
  location,
  structure = [],
  variant = 'permanent',
  open = true,
  onClose,
}: SidebarProps) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const { user: currentUser } = useAuth();

  const handleToggle = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };


  const isItemVisible = (item: any): boolean => {

    if (!item.visibleFor) return true;


    const userRole = currentUser?.role || 'staff';
    return item.visibleFor.includes(userRole);
  };


  const renderMenuItems = (items: any[], level = 0) => (
    <List component='div' disablePadding>
      {items
        .filter((item) => isItemVisible(item))
        .map((item, idx) => {
          const hasChildren =
            Array.isArray(item.children) && item.children.length > 0;
          const isOpen = openMenus[item.label];



          let isActive = false;
          if (item.link) {

            if (item.link === '/app') {
              isActive = location?.pathname === '/app';
            } else {

              isActive = location?.pathname === item.link;
            }
          }
          return (
            <React.Fragment key={item.label + idx}>
              <ListItem
                button
                component={item.link ? Link : 'div'}
                to={item.link || undefined}
                onClick={
                  hasChildren ? () => handleToggle(item.label) : undefined
                }
                sx={{
                  mx: 1,
                  my: 0.5,
                  pl: 2 + level * 2,
                  pr: 2,
                  py: 1.5,
                  borderRadius: 2,
                  minHeight: 48,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(isActive && {
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background:
                        'linear-gradient(180deg, #fff 0%, rgba(255,255,0.7) 100%)',
                      borderRadius: '0 2px 2px 0',
                    },
                  }),
                  '&:hover': {
                    ...(!isActive && {
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }),
                    ...(isActive && {
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                      transform: 'translateY(-2px)',
                    }),
                  },
                  ...(hasChildren &&
                    level === 0 && {
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isActive ? 'white' : '#374151',
                  }),
                  ...(level > 0 && {
                    fontSize: '0.875rem',
                    color: isActive ? 'white' : '#6B7280',
                    ml: 1,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 16 + level * 16,
                      top: '50%',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: isActive ? 'rgba(255,255,255,0.7)' : '#D1D5DB',
                      transform: 'translateY(-50%)',
                    },
                  }),
                }}
              >
                {item.icon && (
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: 40,
                      transition: 'transform 0.2s ease',
                      transform: isOpen ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: hasChildren && level === 0 ? 600 : 500,
                    fontSize: level === 0 ? '0.95rem' : '0.875rem',
                  }}
                />
                {hasChildren && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.3s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <ExpandMore sx={{ fontSize: 20 }} />
                  </Box>
                )}
              </ListItem>
              {hasChildren && (
                <Collapse in={isOpen} timeout={300} unmountOnExit>
                  <Fade in={isOpen} timeout={200}>
                    <Box>{renderMenuItems(item.children, level + 1)}</Box>
                  </Fade>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
    </List>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      {/* Красивый заголовок */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"%3E%3Cpath d="M10 20 L50 20 M20 10 L50 10 M20 50 L50 50"/%3E%3C/svg%3E")',
            opacity: 0.1,
          },
        }}
      >
        <Typography
          variant='h5'
          sx={{
            fontWeight: 700,
            position: 'relative',
            zIndex: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          🏫 Детсад CRM
        </Typography>
        {/* <Typography
          variant="body2"
          sx={{
            opacity: 0.9,
            mt: 0.5,
            position: 'relative',
            zIndex: 1
          }}
        >
          Система управления детским садом
        </Typography> */}
      </Box>
      {/* Навигационное меню */}
      <Box sx={{ flex: 1, py: 2, overflow: 'auto' }}>
        {renderMenuItems(structure)}
      </Box>
      {/* Нижний блок с информацией */}
      <Box
        sx={{
          p: 2,
          mt: 'auto',
          borderTop: '1px solid #e2e8f0',
          background: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <Typography
          variant='caption'
          color='text.secondary'
          align='center'
          display='block'
        >
          v1.0.0 • Clockster System
        </Typography>
      </Box>
    </Drawer>
  );
};
