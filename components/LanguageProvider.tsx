'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Se já estiver inicializado, marcar como pronto
        if (i18n.isInitialized) {
          setIsReady(true);
          return;
        }

        // Aguardar inicialização assíncrona
        await i18n.init();
        setIsReady(true);
        
      } catch (error) {
        // Mesmo com erro, permitir renderização para não travar o sistema
        setIsReady(true);
      }
    };

    // Listener para evento de inicialização
    const handleInitialized = () => {
      setIsReady(true);
    };

    // Registrar listener
    i18n.on('initialized', handleInitialized);

    // Inicializar
    initializeI18n();

    // Timeout de segurança - se não inicializar em 5 segundos, renderizar mesmo assim
    const safetyTimeout = setTimeout(() => {
      if (!isReady) {
        setIsReady(true);
      }
    }, 5000);

    // Cleanup
    return () => {
      i18n.off('initialized', handleInitialized);
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Tela de carregamento enquanto inicializa
  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>Carregando sistema de tradução...</div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  // Renderizar o provider com os children
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}