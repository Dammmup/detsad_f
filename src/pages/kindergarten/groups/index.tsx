import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import GroupsList from './GroupsList';

const GroupsModule = ({ match }) => {
  return (
    <Switch>
      <Route exact path={`${match.path}`} component={GroupsList} />
      <Redirect to="/404" />
    </Switch>
  );
};

export default GroupsModule;
