'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_state: string;
  product_service: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_method: string;
  status: 'Pendente' | 'Pago' | 'Cancelado';
  sale_date: string;
  created_at: string;
}

interface CommissionAnalysis {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  averageRate: number;
  topProducts: Array<{
    product: string;
    sales: number;
    totalCommission: number;
    averageCommission: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    commissions: number;
    sales: number;
  }>;
  stateBreakdown: Array<{
    state: string;
    commissions: number;
    sales: number;
    averageTicket: number;
  }>;
}

export default function CommissionsPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [analysis, setAnalysis] = useState<CommissionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pago' | 'Pendente' | 'Cancelado'>('all');

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/sales');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de vendas');
      }
      
      const data = await response.json();
      if (data.success) {
        const salesData = data.data || [];
        setSales(salesData);
        analyzeCommissions(salesData);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeCommissions = (salesData: Sale[]) => {
    // Filtrar por período
    const now = new Date();
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Number.MAX_SAFE_INTEGER
    };

    const filteredSales = salesData.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const isInPeriod = periodFilter === 'all' || (now.getTime() - saleDate.getTime()) <= periodMs[periodFilter];
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      return isInPeriod && matchesStatus;
    });

    // Cálculos principais
    const totalCommissions = filteredSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
    const paidCommissions = filteredSales
      .filter(sale => sale.status === 'Pago')
      .reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
    const pendingCommissions = filteredSales
      .filter(sale => sale.status === 'Pendente')
      .reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const averageRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;

    // Top produtos por comissão
    const productMap = new Map();
    filteredSales.forEach(sale => {
      const product = sale.product_service;
      if (productMap.has(product)) {
        const existing = productMap.get(product);
        productMap.set(product, {
          product,
          sales: existing.sales + 1,
          totalCommission: existing.totalCommission + (sale.commission_amount || 0),
          averageCommission: 0 // Será calculado depois
        });
      } else {
        productMap.set(product, {
          product,
          sales: 1,
          totalCommission: sale.commission_amount || 0,
          averageCommission: 0
        });
      }
    });

    const topProducts = Array.from(productMap.values())
      .map(item => ({
        ...item,
        averageCommission: item.sales > 0 ? item.totalCommission / item.sales : 0
      }))
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 10);

    // Tendência mensal (últimos 12 meses)
    const monthlyMap = new Map();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7); // YYYY-MM
    }).reverse();

    last12Months.forEach(month => {
      monthlyMap.set(month, { month, commissions: 0, sales: 0 });
    });

    filteredSales.forEach(sale => {
      const saleMonth = sale.sale_date.substring(0, 7);
      if (monthlyMap.has(saleMonth)) {
        const existing = monthlyMap.get(saleMonth);
        monthlyMap.set(saleMonth, {
          month: saleMonth,
          commissions: existing.commissions + (sale.commission_amount || 0),
          sales: existing.sales + 1
        });
      }
    });

    const monthlyTrend = Array.from(monthlyMap.values());

    // Breakdown por estado
    const stateMap = new Map();
    filteredSales.forEach(sale => {
      const state = sale.customer_state || 'Indefinido';
      if (stateMap.has(state)) {
        const existing = stateMap.get(state);
        stateMap.set(state, {
          state,
          commissions: existing.commissions + (sale.commission_amount || 0),
          sales: existing.sales + 1,
          totalRevenue: existing.totalRevenue + (sale.total_amount || 0)
        });
      } else {
        stateMap.set(state, {
          state,
          commissions: sale.commission_amount || 0,
          sales: 1,
          totalRevenue: sale.total_amount || 0
        });
      }
    });

    const stateBreakdown = Array.from(stateMap.values())
      .map(item => ({
        ...item,
        averageTicket: item.sales > 0 ? item.totalRevenue / item.sales : 0
      }))
      .sort((a, b) => b.commissions - a.commissions)
      .slice(0, 10);

    setAnalysis({
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      averageRate,
      topProducts,
      monthlyTrend,
      stateBreakdown
    });
  };

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    if (sales.length > 0) {
      analyzeCommissions(sales);
    }
  }, [periodFilter, statusFilter, sales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analisando comissões...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
            { label: t('nav.commissions', 'Comissões'), icon: '💎' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              💎 {t('commissions.title', 'Análise de Comissões')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('commissions.subtitle', 'Dashboard executivo para análise detalhada de comissões e rentabilidade')}
            </p>
          </div>
          
          <Link
            href="/sales/new"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <span>💰</span>
            <span>Nova Venda</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Período
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="1y">Último ano</option>
                <option value="all">Todos os períodos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="ml-auto">
              <button
                onClick={fetchSalesData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {analysis && (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Commissions */}
              <div className="group relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 ring-4 ring-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium uppercase tracking-wide">💎 Total Comissões</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analysis.totalCommissions)}
                      </p>
                      <div className="flex items-center mt-2 text-yellow-100">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs">Taxa média: {analysis.averageRate.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">💎</div>
                  </div>
                </div>
              </div>

              {/* Paid Commissions */}
              <div className="group relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium uppercase tracking-wide">✅ Comissões Pagas</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analysis.paidCommissions)}
                      </p>
                      <div className="flex items-center mt-2 text-green-100">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs">Recebidas</span>
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">✅</div>
                  </div>
                </div>
              </div>

              {/* Pending Commissions */}
              <div className="group relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">⏳ Comissões Pendentes</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(analysis.pendingCommissions)}
                      </p>
                      <div className="flex items-center mt-2 text-orange-100">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs">A receber</span>
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">⏳</div>
                  </div>
                </div>
              </div>

              {/* Average Commission Rate */}
              <div className="group relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">📊 Taxa Média</p>
                      <p className="text-3xl font-bold mt-2">
                        {analysis.averageRate.toFixed(2)}%
                      </p>
                      <div className="flex items-center mt-2 text-purple-100">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs">Sobre vendas</span>
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">📊</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Products */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <span>🏆</span>
                    <span>Top Produtos por Comissão</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {analysis.topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.topProducts.slice(0, 8).map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{product.product}</p>
                              <p className="text-xs text-gray-600">{product.sales} vendas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 text-sm">
                              {formatCurrency(product.totalCommission)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Média: {formatCurrency(product.averageCommission)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📈</div>
                      <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* State Breakdown */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <span>🗺️</span>
                    <span>Comissões por Estado</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {analysis.stateBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.stateBreakdown.slice(0, 8).map((state, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl hover:from-green-50 hover:to-emerald-50 transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {state.state.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{state.state}</p>
                              <p className="text-xs text-gray-600">{state.sales} vendas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 text-sm">
                              {formatCurrency(state.commissions)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ticket: {formatCurrency(state.averageTicket)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🗺️</div>
                      <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>📈</span>
                  <span>Evolução Mensal de Comissões</span>
                </h2>
                <p className="text-indigo-100 text-sm mt-1">Últimos 12 meses</p>
              </div>
              
              <div className="p-6">
                {analysis.monthlyTrend.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.monthlyTrend.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {formatMonth(month.month)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formatMonth(month.month)}</p>
                            <p className="text-sm text-gray-600">{month.sales} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 text-lg">
                            {formatCurrency(month.commissions)}
                          </p>
                          {month.sales > 0 && (
                            <p className="text-sm text-gray-500">
                              Média: {formatCurrency(month.commissions / month.sales)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📈</div>
                    <p className="text-gray-500">Nenhum dado disponível para análise mensal</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Ações Rápidas</span>
                </h2>
              </div>
              
              <div className="p-8 bg-gradient-to-br from-gray-50 to-yellow-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Link
                    href="/sales/new"
                    className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-dashed border-green-300 rounded-2xl hover:border-green-500 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-300">💰</div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">
                        Nova Venda
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Gerar comissão
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/sales"
                    className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                        Ver Vendas
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Histórico completo
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/goals"
                    className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-500 hover:from-purple-100 hover:to-pink-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                        Objetivos
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Definir metas
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/reports"
                    className="group flex items-center p-6 bg-gradient-to-br from-orange-50 to-yellow-100 border-2 border-dashed border-orange-300 rounded-2xl hover:border-orange-500 hover:from-orange-100 hover:to-yellow-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-300">📈</div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg group-hover:text-orange-700 transition-colors">
                        Relatórios
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Análises completas
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
