import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import GroupsModule from './groups';
import StaffRoutes from './staff/routes';
import Attendance from './attendance/Attendance';

const KindergartenRoutes = () => (
  <Switch>
    <Route exact path="/app/kindergarten/dashboard" component={Dashboard} />
    <Route path="/app/kindergarten/groups" component={GroupsModule} />
    <Route path="/app/kindergarten/staff" component={StaffRoutes} />
    <Route path="/app/kindergarten/attendance" component={Attendance} />
    <Redirect to="/404" />
  </Switch>
);

export default KindergartenRoutes;
