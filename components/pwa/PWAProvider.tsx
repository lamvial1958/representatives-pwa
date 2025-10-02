'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  updateApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isInstalled: false,
  isUpdateAvailable: false,
  updateApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || isInWebAppIOS);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateApp = () => {
    window.location.reload();
  };

  return (
    <PWAContext.Provider value={{
      isOnline,
      isInstalled,
      isUpdateAvailable,
      updateApp,
    }}>
      {children}
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
          <span className="text-sm font-medium">
            📡 Você está offline - Algumas funcionalidades podem estar limitadas
          </span>
        </div>
      )}
    </PWAContext.Provider>
  );
}

