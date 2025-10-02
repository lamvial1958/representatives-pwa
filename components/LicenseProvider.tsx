"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LicenseContextType {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
}

const LicenseContext = createContext<LicenseContextType>({
  isValid: true,
  isLoading: false,
  error: null
});

export const useLicense = () => useContext(LicenseContext);

interface LicenseProviderProps {
  children: React.ReactNode;
}

export default function LicenseProvider({ children }: LicenseProviderProps) {
  const [state, setState] = useState<LicenseContextType>({
    isValid: true,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // Simula inicializa??o - sempre v?lido por enquanto
    setState({
      isValid: true,
      isLoading: false,
      error: null
    });
  }, []);

  return (
    <LicenseContext.Provider value={state}>
      {children}
    </LicenseContext.Provider>
  );
}
