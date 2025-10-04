'use client';

import React, { useState, useEffect } from 'react';
import { LicenseManager } from '@/lib/license-manager';
import { LicenseView, BackupMetadata } from '@/lib/license-types';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function LicensePage() {
  const { t } = useTranslation();
  const [licenseData, setLicenseData] = useState<LicenseView | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
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
      await manager.initialize();
      const license = manager.getLicense();
      setLicenseData(license);

      // Carregar backups se licença existir
      if (license?.deviceId) {
        await loadBackups(license.deviceId);
      }
    } catch (error) {
      console.error('Erro ao carregar licença:', error);
      setError('Erro ao carregar dados da licença');
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/license/backups?deviceId=${deviceId}`);
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
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

      const manager = LicenseManager.getInstance();
      const result = await manager.activate(
        newLicenseKey.trim(), 
        issuedTo.trim() || undefined
      );
      
      if (result) {
        setSuccess(`Licença ativada com sucesso! Device ID: ${result.deviceId.substring(0, 8)}`);
        setNewLicenseKey('');
        setIssuedTo('');
        setLicenseData(result);
        
        // Carregar backups
        if (result.deviceId) {
          await loadBackups(result.deviceId);
        }
      }
    } catch (error: any) {
      console.error('Erro ao ativar licença:', error);
      setError(error.message || 'Erro ao ativar a licença');
    } finally {
      setActivating(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!licenseData?.deviceId) return;

    try {
      const response = await fetch('/api/license/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: licenseData.deviceId,
          reason: 'manual'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Backup criado com sucesso!');
        await loadBackups(licenseData.deviceId);
      } else {
        setError(data.error || 'Erro ao criar backup');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      setError('Erro ao criar backup');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Deseja restaurar este backup? As alterações atuais serão substituídas.')) {
      return;
    }

    try {
      const response = await fetch('/api/license/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Backup restaurado com sucesso!');
        setLicenseData(data.data);
        
        if (data.data.deviceId) {
          await loadBackups(data.data.deviceId);
        }
      } else {
        setError(data.error || 'Erro ao restaurar backup');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      setError('Erro ao restaurar backup');
    }
  };

  useEffect(() => {
    loadLicense();
  }, []);

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return 'Sem expiração';
    return new Date(isoDate).toLocaleDateString('pt-BR');
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
            Sistema de licenciamento server-first com rastreamento de dispositivos
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

                  <div>
                    <label className="text-sm font-medium text-gray-600">Chave da Licença</label>
                    <div className="mt-1 font-mono text-lg font-bold text-gray-900 bg-gray-100 p-3 rounded-lg">
                      {licenseData.key}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {getTypeText(licenseData.type)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Dias Restantes</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.isLifetime ? '∞ Vitalícia' : `${licenseData.daysRemaining} dias`}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Device ID (Hardware)</label>
                    <div className="mt-1 font-mono text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                      🔒 {licenseData.deviceId.substring(0, 12)}...
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Vinculada a este hardware físico</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Usuários Máximos</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.maxUsers}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Emitida para</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {licenseData.issuedTo}
                    </div>
                  </div>

                  {licenseData.companyName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Empresa</label>
                      <div className="mt-1 text-lg font-bold text-gray-900">
                        {licenseData.companyName}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Expiração</label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {formatDate(licenseData.expiryDate)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Funcionalidades</label>
                    <div className="mt-1">
                      {licenseData.features.includes('all') ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ Todas as funcionalidades
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

                {/* Policy Info */}
                <div className="md:col-span-2 pt-4 border-t">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Políticas de Segurança</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tolerância:</span>
                      <span className="ml-1 font-bold">{(licenseData.policy.fingerprintTolerance * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Grace Period:</span>
                      <span className="ml-1 font-bold">{licenseData.policy.graceDays} dias</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Trial:</span>
                      <span className="ml-1 font-bold">{licenseData.policy.allowTrial ? 'Habilitado' : 'Desabilitado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Última Validação:</span>
                      <span className="ml-1 font-bold">{new Date(licenseData.lastValidatedAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🔓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma licença ativa</h3>
                <p className="text-gray-600">
                  Ative uma licença para desbloquear todas as funcionalidades.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Backup Section */}
        {licenseData && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-3 text-2xl">💾</span>
                  Backups
                </span>
                <button
                  onClick={handleCreateBackup}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  + Criar Backup
                </button>
              </h2>
            </div>
            
            <div className="p-8">
              {backups.length > 0 ? (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(backup.createdAt).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Razão: {backup.reason} • {backup.preview?.licenseKey || 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum backup disponível. Crie um backup para salvar o estado atual.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activate License Form */}
        {!licenseData && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">🚀</span>
                Ativar Licença
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
                    autoComplete="off"
                    value={newLicenseKey}
                    onChange={(e) => setNewLicenseKey(e.target.value)}
                    placeholder="ENTP-2025-VIAL-0001"
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

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-bold text-blue-800 flex items-center mb-2">
                  <span className="mr-2">🔒</span>
                  Sistema Server-First
                </h3>
                <div className="space-y-1 text-xs text-blue-700">
                  <p>• Licença validada no servidor PostgreSQL (Neon)</p>
                  <p>• Hardware rígido: Canvas, CPU, RAM, Screen (não muda)</p>
                  <p>• Browser flexível: Chrome, Firefox, Safari (pode atualizar)</p>
                  <p>• Heartbeat automático a cada 5 minutos</p>
                </div>
              </div>
            </div>
          </div>
        )}

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