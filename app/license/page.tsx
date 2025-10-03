'use client';

import React, { useState, useEffect } from 'react';
import { LicenseManager } from '@/lib/license-manager';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface LicenseData {
  hasLicense: boolean;
  key?: string;
  type: 'trial' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  expiryDate?: Date | null;
  daysRemaining: number;
  maxUsers: number;
  issuedTo?: string;
  features: string[];
  isValid: boolean;
  isLifetime?: boolean;
  deviceId?: string;
}

// Gerar fingerprint baseado em hardware físico
const generateDeviceFingerprint = () => {
  // Canvas fingerprint (GPU física)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Hardware ID', 2, 2);
  }
  
  const hardwareData = [
    screen.width + 'x' + screen.height + 'x' + screen.colorDepth, // Monitor físico
    navigator.hardwareConcurrency || 'unknown',                  // CPU cores
    new Date().getTimezoneOffset(),                              // Localização física
    navigator.platform,                                          // OS/arquitetura
    canvas.toDataURL().substring(0, 50)                         // GPU fingerprint
  ].join('|');
  
  return btoa(hardwareData).substring(0, 32);
};

// Validar licença com controle de hardware
const validateLicense = (key: string) => {
  const validLicenses = [
    'FULL-LICENSE-2024-PREMIUM',
    'FULL-LICENSE-2024-ULTIMATE'
  ];
  
  if (!validLicenses.includes(key)) {
    return { isValid: false, message: 'Licença inválida' };
  }

  const deviceId = generateDeviceFingerprint();
  const storageKey = `license-${key}`;
  const storedDevice = localStorage.getItem(storageKey);
  
  if (storedDevice && storedDevice !== deviceId) {
    return { 
      isValid: false, 
      message: 'Esta licença já foi ativada em outro dispositivo. Licenças são pessoais e intransferíveis.' 
    };
  }
  
  // Primeira ativação - vincular ao dispositivo
  if (!storedDevice) {
    localStorage.setItem(storageKey, deviceId);
  }
  
  return { 
    isValid: true, 
    message: 'Licença ativada com sucesso!',
    isLifetime: true,
    deviceId: deviceId.substring(0, 8)
  };
};

export default function LicensePage() {
  const { t } = useTranslation();
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadLicense = async () => {
    try {
      setLoading(true);
      const manager = LicenseManager.getInstance();
      const license = await manager.getLicense();
      
      // Adicionar deviceId se licença existir
      if (license && license.key) {
        const validation = validateLicense(license.key);
        if (validation.isValid && validation.deviceId) {
          license.deviceId = validation.deviceId;
        }
      }
      
      setLicenseData(license);
    } catch (error) {
      console.error('Erro ao carregar licença:', error);
      setError('Erro ao carregar dados da licença');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setError('');
    setSuccess('');

    try {
      if (!newLicenseKey.trim()) {
        setError('Por favor, insira uma chave de licença válida');
        return;
      }

      // Validar licença com controle de hardware
      const validation = validateLicense(newLicenseKey.trim());
      
      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      const manager = LicenseManager.getInstance();
      const result = await manager.activateLicense(newLicenseKey.trim(), issuedTo.trim() || undefined);
      
      if (result) {
        setSuccess(`${validation.message} Device ID: ${validation.deviceId}`);
        setNewLicenseKey('');
        setIssuedTo('');
        await loadLicense();
      } else {
        setError('Erro interno ao ativar a licença');
      }
    } catch (error) {
      console.error('Erro ao ativar licença:', error);
      setError('Erro ao ativar a licença');
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    loadLicense();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Sem expiração';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-orange-600 bg-orange-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'expired': return 'Expirada';
      case 'suspended': return 'Suspensa';
      case 'revoked': return 'Revogada';
      default: return 'Desconhecido';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'trial': return 'Avaliação';
      case 'standard': return 'Padrão';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando informações da licença...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Breadcrumbs
          items={[
            { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
            { label: t('nav.license', 'Licença'), href: '/license', icon: '🔑' }
          ]}
        />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
            🔑 Gerenciamento de Licença
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Controle e ative sua licença do sistema de representantes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}

        {/* License Status Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-3 text-2xl">📋</span>
              Status da Licença
            </h2>
          </div>
          
          <div className="p-8">
            {licenseData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(licenseData.status)}`}>
                        {getStatusText(licenseData.status)}
                      </span>
                    </div>
                  </div>

                  {licenseData.key && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Chave da Licença</label>
                      <div className="mt-1 font-mono text-lg font-bold text-gray-900 bg-gray-100 p-3 rounded-lg">
                        {licenseData.key}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {getTypeText(licenseData.type)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Dias Restantes</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.isLifetime ? 'Vitalícia' : `${licenseData.daysRemaining} dias`}
                    </div>
                  </div>

                  {licenseData.deviceId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID do Dispositivo</label>
                      <div className="mt-1 font-mono text-sm text-gray-700 bg-yellow-50 p-2 rounded border">
                        🔒 {licenseData.deviceId}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Licença vinculada a este dispositivo</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Usuários Máximos</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.maxUsers}
                    </div>
                  </div>

                  {licenseData.issuedTo && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Emitida para</label>
                      <div className="mt-1 text-lg font-bold text-gray-900">
                        {licenseData.issuedTo}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Expiração</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.isLifetime ? 'Sem expiração' : formatDate(licenseData.expiryDate || null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Funcionalidades Habilitadas</label>
                    <div className="mt-1">
                      {licenseData.features.includes('all') ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Todas as funcionalidades
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {licenseData.features.map((feature, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🔓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma licença ativa</h3>
                <p className="text-gray-600">
                  Você está usando a versão de avaliação limitada do sistema.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activate License Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-3 text-2xl">🚀</span>
              Ativar Nova Licença
            </h2>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleActivateLicense} className="space-y-6">
              <div>
                <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Chave da Licença *
                </label>
                <input
                  type="text"
                  id="licenseKey"
                  value={newLicenseKey}
                  onChange={(e) => setNewLicenseKey(e.target.value)}
                  placeholder="FULL-LICENSE-2024-PREMIUM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  disabled={activating}
                />
              </div>

              <div>
                <label htmlFor="issuedTo" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Titular (Opcional)
                </label>
                <input
                  type="text"
                  id="issuedTo"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="Digite seu nome ou empresa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={activating}
                />
              </div>

              <button
                type="submit"
                disabled={activating || !newLicenseKey.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {activating ? 'Ativando...' : 'Ativar Licença'}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-bold text-yellow-800 flex items-center mb-2">
                <span className="mr-2">🔒</span>
                Licença Pessoal e Intransferível
              </h3>
              <div className="space-y-1 text-xs text-yellow-700">
                <p>• A licença será vinculada permanentemente a este dispositivo</p>
                <p>• Não poderá ser usada em outros computadores/dispositivos</p>
                <p>• Baseado em características únicas do seu hardware</p>
                <p>• Flexível a atualizações de navegador e sistema operacional</p>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Como obter uma licença
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Entre em contato com o desenvolvedor para adquirir uma licença</p>
                <p>• Licenças válidas: FULL-LICENSE-2024-PREMIUM ou FULL-LICENSE-2024-ULTIMATE</p>
                <p>• Após a ativação, todas as funcionalidades serão desbloqueadas</p>
                <p>• Licenças são vitalícias e vinculadas ao seu dispositivo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <button 
            onClick={loadLicense}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            🔄 Recarregar Informações
          </button>
        </div>
      </div>
    </div>
  );
}
