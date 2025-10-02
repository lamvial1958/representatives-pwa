'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { Sale, ApiResponse } from '@/types';

export default function SalesPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/sales');
      const result: ApiResponse<Sale[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load sales');
      }

      setSales(result.data || []);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('sales.loading', 'Carregando vendas...')}</p>
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
            {t('sales.error.title', 'Erro ao Carregar Vendas')}
          </h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchSales}
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
          { label: t('nav.sales', 'Sales'), icon: '💰' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 {t('sales.title', 'Vendas')}
          </h1>
          <p className="text-gray-600">
            {t('sales.subtitle', 'Gerencie suas vendas e comissões')}
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
            href="/sales/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            ➕ {t('sales.newSale', 'Nova Venda')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">{sales.length}</div>
          <div className="text-emerald-100 text-sm">
            {t('sales.stats.total', 'Total de Vendas')}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {sales.filter((s) => s.customer_state === 'RS').length}
          </div>
          <div className="text-green-100 text-sm">🏴 Vendas RS</div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="text-lg font-bold mb-1">
            {formatCurrency(
              sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
            )}
          </div>
          <div className="text-blue-100 text-sm">
            📈 {t('sales.stats.revenue', 'Receita Total')}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="text-lg font-bold mb-1">
            {formatCurrency(
              sales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0),
            )}
          </div>
          <div className="text-purple-100 text-sm">
            💎 {t('sales.stats.commission', 'Comissão Total')}
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            📋 {t('sales.list.title', 'Lista de Vendas')}
          </h2>
        </div>

        <div className="p-6">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('sales.empty.title', 'Nenhuma venda ainda')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('sales.empty.subtitle', 'Comece criando sua primeira venda')}
              </p>
              <Link
                href="/sales/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                ➕ {t('sales.addFirst', 'Criar Primeira Venda')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">💰</div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          sale.status === 'Pago'
                            ? 'bg-green-100 text-green-600'
                            : sale.status === 'Pendente'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {sale.product_service}
                    </h3>
                    <p className="text-sm text-gray-600">{sale.customer_name}</p>
                    <p className="text-sm text-gray-600">
                      {sale.customer_state === 'RS' ? '🏴' : '📍'} {sale.customer_state}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(sale.total_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Comissão:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(sale.commission_amount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✏️ {t('common.edit', 'Editar')}
                    </Link>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            t(
                              'sales.confirmDelete',
                              'Tem certeza que deseja excluir esta venda?',
                            ),
                          )
                        ) {
                          // TODO: Implement delete
                          console.log('Delete sale:', sale.id);
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm font-medium transition-colors"
                      aria-label={t('common.delete', 'Excluir')}
                      title={t('common.delete', 'Excluir')}
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
