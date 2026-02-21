import React, { createContext, useContext, useMemo } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';

export const INITIAL_STATE = {
  open: false,
  message: '',
  anchorOrigin: {
    horizontal: 'center',
    vertical: 'top',
  },
  autoHideDuration: 4000,
  type: 'success',
};

const ACTIONS = {
  open: 'open',
  close: 'close',
};

function reducer(state: any, action: { type: any; options: any }) {
  switch (action.type) {
    case ACTIONS.open:
      return {
        ...state,
        open: true,
        ...action.options,
      };
    case ACTIONS.close:
      return INITIAL_STATE;
    default:
      return state;
  }
}

const SnackbarContext = createContext({});
let dispatchAction: (arg0: { type: any; options?: any }) => void;

const SnackbarProvider = ({
  initialValue = INITIAL_STATE,
  children,
}: {
  initialValue?: any;
  children: React.ReactNode;
}) => {
  const [state, dispatch] = React.useReducer(reducer, initialValue);
  dispatchAction = dispatch as any;

  const handleClose = () => {
    dispatchAction({ type: ACTIONS.close });
  };

  const contextValue = useMemo(() => state, [state.open, state.message, state.type]);

  return (
    <SnackbarContext.Provider value={contextValue}>
      <Snackbar
        open={state.open}
        autoHideDuration={state.autoHideDuration}
        TransitionComponent={Slide}
        onClose={handleClose}
        anchorOrigin={{
          horizontal: state.anchorOrigin.horizontal,
          vertical: state.anchorOrigin.vertical,
        }}
      >
        <Alert onClose={handleClose} severity={state.type}>
          {state.message}
        </Alert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  );
};

function showSnackbar(options: any) {
  dispatchAction({ type: ACTIONS.open, options });
}

function useSnackbar() {
  return useContext(SnackbarContext);
}

export { SnackbarProvider, useSnackbar, showSnackbar };
