import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import classnames from 'classnames';

import SettingsIcon from '@mui/icons-material/Settings';

import { Fab, IconButton } from '@mui/material';
import { connect } from 'react-redux';

// styles
import useStyles from './styles';

// components
import Header from '../Header';
import Sidebar from '../Sidebar';
import { Link } from '../Wrappers';

// pages

// Kindergarten
import KindergartenDashboard from '../../pages/kindergarten/dashboard/Dashboard';
import GroupsModule from '../../pages/kindergarten/groups';
import StaffModule from '../../pages/kindergarten/staff/routes';

// context
import { useLayoutState } from '../../context/LayoutContext';


//Sidebar structure
import structure from '../Sidebar/SidebarStructure'


function Layout(props) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(open ? null : event.currentTarget);
  };

  // global
  const layoutState = useLayoutState();
  const { isSidebarOpened } = layoutState;

  return (
    <div className={classes.root}>
      <Header />
      <Sidebar structure={structure} />
      <div
        className={classnames(classes.content, {
          [classes.contentShift]: isSidebarOpened,
        })}
      >
        <Switch>
          <Route path="/app/dashboard" component={KindergartenDashboard} />
          <Route path="/app/kindergarten/dashboard" component={KindergartenDashboard} />
          <Route path="/app/kindergarten/groups" component={GroupsModule} />
          <Route path="/app/kindergarten/staff" component={StaffModule} />
          <Route component={KindergartenDashboard} />
        </Switch>
        <Fab
          color='primary'
          aria-label='settings'
          onClick={(e) => handleClick(e)}
          className={classes.changeThemeFab}
          style={{ zIndex: 100 }}
        >
          <SettingsIcon style={{ color: '#fff' }} />
        </Fab>
        <div>
          <div>
            <Link
              color={'primary'}
              href={'https://flatlogic.com/'}
              target={'_blank'}
              className={classes.link}
            >
              Flatlogic
            </Link>
            <Link
              color={'primary'}
              href={'https://flatlogic.com/about'}
              target={'_blank'}
              className={classes.link}
            >
              About Us
            </Link>
            <Link
              color={'primary'}
              href={'https://flatlogic.com/blog'}
              target={'_blank'}
              className={classes.link}
            >
              Blog
            </Link>
          </div>
          <div>
            <Link href={'https://www.facebook.com/flatlogic'} target={'_blank'}>
              <IconButton aria-label='facebook'>
              </IconButton>
            </Link>
            <Link href={'https://twitter.com/flatlogic'} target={'_blank'}>
              <IconButton aria-label='twitter'>
              </IconButton>
            </Link>
            <Link href={'https://github.com/flatlogic'} target={'_blank'}>
              <IconButton
                aria-label='github'
                style={{ padding: '12px 0 12px 12px' }}
              >
              </IconButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(connect()(Layout));
