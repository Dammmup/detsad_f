import auth from 'reducers/auth';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import users from 'reducers/users/usersReducers';

const createRootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    auth,
    users,
  });

export default createRootReducer;
