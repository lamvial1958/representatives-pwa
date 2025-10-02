'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { Customer, ApiResponse } from '@/types';

export default function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/clients');
      const result: ApiResponse<Customer[]> = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load clients');
      }

      setClients(result.data || []);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      // Removido console.error para produção
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('clients.loading', 'Carregando clientes...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {t('clients.error.title', 'Erro ao Carregar Clientes')}
          </h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchClients}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            🔄 {t('common.tryAgain', 'Tentar Novamente')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home', 'Home'), href: '/', icon: '🏠' },
          { label: t('nav.clients', 'Clients'), icon: '👥' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 {t('clients.title', 'Clientes')}
          </h1>
          <p className="text-gray-600">
            {t('clients.subtitle', 'Gerencie sua base de clientes')}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            📊 {t('nav.dashboard', 'Painel')}
          </Link>
          <Link
            href="/clients/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            ➕ {t('clients.newClient', 'Novo Cliente')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">{clients.length}</div>
          <div className="text-blue-100 text-sm">{t('clients.stats.total', 'Total de Clientes')}</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {clients.filter(c => c.state === 'RS').length}
          </div>
          <div className="text-green-100 text-sm">🏴󠁢󠁲󠁲󠁳󠁿 Clientes RS</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {clients.filter(c => c.tipo_pessoa === 'fisica').length}
          </div>
          <div className="text-purple-100 text-sm">👤 {t('clients.stats.individual', 'Pessoa Física')}</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {clients.filter(c => c.tipo_pessoa === 'juridica').length}
          </div>
          <div className="text-orange-100 text-sm">🏢 {t('clients.stats.business', 'Pessoa Jurídica')}</div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            📋 {t('clients.list.title', 'Lista de Clientes')}
          </h2>
        </div>
        
        <div className="p-6">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('clients.empty.title', 'Nenhum cliente ainda')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('clients.empty.subtitle', 'Comece adicionando seu primeiro cliente')}
              </p>
              <Link
                href="/clients/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                ➕ {t('clients.addFirst', 'Adicionar Primeiro Cliente')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">
                      {client.tipo_pessoa === 'fisica' ? '👤' : '🏢'}
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {client.state === 'RS' ? '🏴󠁢󠁲󠁲󠁳󠁿' : '📍'} {client.state}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      {client.city}, {client.state} • {client.postal_code}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/clients/edit/${client.id}`}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✏️ {t('common.edit', 'Editar')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('clients.confirmDelete', 'Tem certeza que deseja excluir este cliente?'))) {
                          // TODO: Implement delete - silencioso em produção
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}