import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { StaffList, StaffForm } from './';

const StaffRoutes = ({ match }) => (
  <Switch>
    <Route exact path={`${match.path}`} component={StaffList} />
    <Route exact path={`${match.path}/new`} component={StaffForm} />
    <Route exact path={`${match.path}/edit/:id`} component={StaffForm} />
    <Redirect to={`${match.path}`} />
  </Switch>
);

export default StaffRoutes;
