import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DateContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate }}>
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
