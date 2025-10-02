'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || isInWebAppIOS);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso');
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsInstallable(false);
    setDeferredPrompt(null);
  };

  if (isInstalled || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Instalar App
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Instale o app para uma experiência mais rápida!
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="flex items-center gap-1"
            >
              <Download size={14} />
              Instalar
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="outline" 
              size="sm"
            >
              Agora não
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="ml-2 p-1"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}


