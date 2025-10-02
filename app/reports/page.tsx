'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { Sale, Customer, ApiResponse } from '@/types';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [salesResponse, clientsResponse] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/clients')
      ]);

      const salesResult: ApiResponse<Sale[]> = await salesResponse.json();
      const clientsResult: ApiResponse<Customer[]> = await clientsResponse.json();

      if (salesResult.success) {
        setSales(salesResult.data || []);
      }
      
      if (clientsResult.success) {
        setClients(clientsResult.data || []);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cálculos dos relatórios
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
  const rsSales = sales.filter(s => s.customer_state === 'RS');
  const rsRevenue = rsSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const rsCommission = rsSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
  const paidSales = sales.filter(s => s.status === 'Pago');
  const pendingSales = sales.filter(s => s.status === 'Pendente');
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
          { label: t('reports.title', 'Relatórios'), icon: '📊' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 {t('reports.title', 'Relatórios')}
          </h1>
          <p className="text-gray-600">
            {t('reports.subtitle', 'Análise e relatórios de desempenho')}
          </p>
        </div>
        
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          📊 {t('nav.dashboard', 'Painel')}
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <span className="text-yellow-800 font-medium">Aviso:</span>
            <span className="text-yellow-700">Alguns dados podem estar incompletos devido a: {error}</span>
          </div>
        </div>
      )}

      {/* Resumo Executivo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            📈 Resumo Executivo
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">{totalSales}</div>
              <div className="text-blue-100 text-sm">📊 Total de Vendas</div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">{formatCurrency(totalRevenue)}</div>
              <div className="text-green-100 text-sm">💰 Receita Total</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">{formatCurrency(totalCommission)}</div>
              <div className="text-purple-100 text-sm">💎 Comissão Total</div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">{formatCurrency(avgTicket)}</div>
              <div className="text-orange-100 text-sm">🎯 Ticket Médio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise Regional (RS Focus) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            🏴󠁢󠁲󠁲󠁳󠁿 Análise Regional - Rio Grande do Sul
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">{rsSales.length}</div>
              <div className="text-green-100 text-sm">📊 Vendas RS</div>
              <div className="text-green-200 text-xs mt-1">
                {totalSales > 0 ? Math.round((rsSales.length / totalSales) * 100) : 0}% do total
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">{formatCurrency(rsRevenue)}</div>
              <div className="text-blue-100 text-sm">💰 Receita RS</div>
              <div className="text-blue-200 text-xs mt-1">
                {totalRevenue > 0 ? Math.round((rsRevenue / totalRevenue) * 100) : 0}% do total
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">{formatCurrency(rsCommission)}</div>
              <div className="text-purple-100 text-sm">💎 Comissão RS</div>
              <div className="text-purple-200 text-xs mt-1">
                {totalCommission > 0 ? Math.round((rsCommission / totalCommission) * 100) : 0}% do total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status das Vendas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            📋 Status das Vendas
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">{paidSales.length}</div>
              <div className="text-green-100 text-sm">✅ Vendas Pagas</div>
              <div className="text-green-200 text-xs mt-1">
                {formatCurrency(paidSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">{pendingSales.length}</div>
              <div className="text-yellow-100 text-sm">⏳ Vendas Pendentes</div>
              <div className="text-yellow-200 text-xs mt-1">
                {formatCurrency(pendingSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">{clients.length}</div>
              <div className="text-gray-100 text-sm">👥 Total Clientes</div>
              <div className="text-gray-200 text-xs mt-1">
                {clients.filter(c => c.state === 'RS').length} no RS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            💡 Insights de Performance
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <span className="text-green-600 text-2xl">✅</span>
              <div>
                <div className="font-medium text-green-900">
                  Foco regional RS está funcionando
                </div>
                <div className="text-green-700 text-sm">
                  {rsSales.length > 0 ? Math.round((rsSales.length / totalSales) * 100) : 0}% das vendas são do Rio Grande do Sul
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-600 text-2xl">📊</span>
              <div>
                <div className="font-medium text-blue-900">
                  Ticket médio: {formatCurrency(avgTicket)}
                </div>
                <div className="text-blue-700 text-sm">
                  Base sólida para crescimento sustentável
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <span className="text-purple-600 text-2xl">💎</span>
              <div>
                <div className="font-medium text-purple-900">
                  Taxa de comissão média: {totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-purple-700 text-sm">
                  Margem competitiva no mercado
                </div>
              </div>
            </div>
            
            {pendingSales.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <span className="text-yellow-600 text-2xl">⚠️</span>
                <div>
                  <div className="font-medium text-yellow-900">
                    {pendingSales.length} vendas pendentes
                  </div>
                  <div className="text-yellow-700 text-sm">
                    Valor total: {formatCurrency(pendingSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
