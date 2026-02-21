import React, { useMemo } from 'react';

let LayoutStateContext = React.createContext<any>({});
let LayoutDispatchContext = React.createContext<any>({});

function layoutReducer(state: { isSidebarOpened: any }, action: { type: any }) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpened: !state.isSidebarOpened };
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function LayoutProvider({ children }: { children: React.ReactNode }) {
  let [state, dispatch] = React.useReducer(layoutReducer, {
    isSidebarOpened: true,
  });

  const stateValue = useMemo(() => state, [state.isSidebarOpened]);
  const dispatchValue = useMemo(() => dispatch, [dispatch]);

  return (
    <LayoutStateContext.Provider value={stateValue}>
      <LayoutDispatchContext.Provider value={dispatchValue}>
        {children}
      </LayoutDispatchContext.Provider>
    </LayoutStateContext.Provider>
  );
}

const useLayoutState = () => {
  let context = React.useContext(LayoutStateContext);
  if (context === undefined) {
    throw new Error('useLayoutState must be used within a LayoutProvider');
  }
  return context;
};

const useLayoutDispatch = () => {
  let context = React.useContext(LayoutDispatchContext);
  if (context === undefined) {
    throw new Error('useLayoutDispatch must be used within a LayoutProvider');
  }
  return context;
};

const toggleSidebar = (dispatch: any) => {
  dispatch({
    type: 'TOGGLE_SIDEBAR',
  });
};

export {
  LayoutProvider,
  useLayoutState,
  useLayoutDispatch,
  toggleSidebar,
  LayoutStateContext,
};
