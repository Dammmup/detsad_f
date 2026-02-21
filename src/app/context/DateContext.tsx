import React, { createContext, useState, useContext, useMemo, useCallback, ReactNode } from 'react';

interface DateContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const value = useMemo(() => ({
    currentDate,
    setCurrentDate,
  }), [currentDate]);

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};
