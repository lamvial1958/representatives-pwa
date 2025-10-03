'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface DashboardData {
  totalClients: number;
  totalSales: number;
  totalRevenue: number;
  totalCommissions: number;
  monthlyGoal: number;
  currentMonthSales: number;
  goalProgress: number;
  recentSales: Array<{
    id: number;
    client: string;
    amount: number;
    commission: number;
    date: string;
    status: string;
  }>;
  monthlyStats: Array<{
    month: string;
    sales: number;
    revenue: number;
    commissions: number;
    goal: number;
    achieved: boolean;
  }>;
  topClients: Array<{
    name: string;
    totalPurchases: number;
    lastPurchase: string;
  }>;
  commissionAnalysis: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    pending: number;
    paid: number;
  };
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    monthlyGoal: 0,
    currentMonthSales: 0,
    goalProgress: 0,
    recentSales: [],
    monthlyStats: [],
    topClients: [],
    commissionAnalysis: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      pending: 0,
      paid: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Carregando dados do dashboard...');
      
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
        console.log('✅ Dados do dashboard carregados:', data.data);
      } else {
        setError(data.error || 'Erro ao carregar dados');
        console.error('❌ Erro na API:', data.error);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number | string) => {
    // Converter para número se for string
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Verificar se é um número válido
    if (typeof numValue !== 'number' || isNaN(numValue)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <Breadcrumbs
          items={[
            { label: t('nav.home', 'Início'), href: '/', icon: '🏠' }
          ]}
        />

        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
            🏠 Dashboard Principal
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Controle completo das suas vendas, clientes e comissões em tempo real
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-md mx-auto">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Clientes Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Clientes</p>
                  <p className="text-3xl font-bold">{dashboardData.totalClients}</p>
                  <p className="text-blue-100 text-sm mt-1">Cadastrados no sistema</p>
                </div>
                <div className="text-5xl opacity-80">👥</div>
              </div>
            </div>
            <div className="p-4 bg-blue-50">
              <a href="/clients" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                Ver todos os clientes <span className="ml-1">→</span>
              </a>
            </div>
          </div>

          {/* Vendas Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total de Vendas</p>
                  <p className="text-3xl font-bold">{dashboardData.totalSales}</p>
                  <p className="text-green-100 text-sm mt-1">Vendas realizadas</p>
                </div>
                <div className="text-5xl opacity-80">💰</div>
              </div>
            </div>
            <div className="p-4 bg-green-50">
              <a href="/sales" className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center">
                Ver todas as vendas <span className="ml-1">→</span>
              </a>
            </div>
          </div>

          {/* Receita Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Receita Total</p>
                  <p className="text-3xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</p>
                  <p className="text-purple-100 text-sm mt-1">Faturamento bruto</p>
                </div>
                <div className="text-5xl opacity-80">📈</div>
              </div>
            </div>
            <div className="p-4 bg-purple-50">
              <a href="/reports" className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                Ver relatórios <span className="ml-1">→</span>
              </a>
            </div>
          </div>

          {/* Comissões Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Comissões</p>
                  <p className="text-3xl font-bold">{formatCurrency(dashboardData.totalCommissions)}</p>
                  <p className="text-orange-100 text-sm mt-1">Total a receber</p>
                </div>
                <div className="text-5xl opacity-80">💎</div>
              </div>
            </div>
            <div className="p-4 bg-orange-50">
              <a href="/commissions" className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center">
                Ver comissões <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        {dashboardData.monthlyGoal > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">🎯</span>
                Meta Mensal - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.currentMonthSales)} / {formatCurrency(dashboardData.monthlyGoal)}
                  </p>
                  <p className="text-gray-600">
                    {formatPercentage(dashboardData.goalProgress)} da meta alcançada
                  </p>
                </div>
                <div className="text-4xl">
                  {dashboardData.goalProgress >= 100 ? '🏆' : dashboardData.goalProgress >= 75 ? '🔥' : '💪'}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(dashboardData.goalProgress)}`}
                  style={{ width: `${Math.min(dashboardData.goalProgress, 100)}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Restante</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(Math.max(0, dashboardData.monthlyGoal - dashboardData.currentMonthSales))}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Dias restantes</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Média diária necessária</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(Math.max(0, (dashboardData.monthlyGoal - dashboardData.currentMonthSales) / Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Analysis - CORRIGIDA */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-3 text-2xl">💎</span>
              Análise de Comissões
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-sm text-gray-600 mb-1">Este Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData?.commissionAnalysis?.thisMonth || 0)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm text-gray-600 mb-1">Mês Anterior</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(dashboardData?.commissionAnalysis?.lastMonth || 0)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <div className="text-3xl mb-2">{getGrowthIcon(dashboardData?.commissionAnalysis?.growth || 0)}</div>
                <p className="text-sm text-gray-600 mb-1">Crescimento</p>
                <p className={`text-2xl font-bold ${(dashboardData?.commissionAnalysis?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(dashboardData?.commissionAnalysis?.growth || 0)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-sm text-gray-600 mb-1">Pendente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dashboardData?.commissionAnalysis?.pending || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        {dashboardData.recentSales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">🔥</span>
                Vendas Recentes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{sale.client?.name || sale.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(sale.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(sale.commission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sale.status === 'confirmed' ? '✅ Confirmada' :
                           sale.status === 'pending' ? '⏳ Pendente' :
                           '❌ Cancelada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Clients */}
        {dashboardData.topClients.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">⭐</span>
                Principais Clientes
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.topClients.map((client, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{client.name}</h3>
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Total em Compras</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(client.totalPurchases)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Última Compra</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-3 text-2xl">⚡</span>
              Ações Rápidas
            </h2>
          </div>
          <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <a href="/clients/new" className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-3xl mr-4">👤</div>
                <div>
                  <p className="font-bold text-gray-900">Novo Cliente</p>
                  <p className="text-xs text-gray-600">Cadastro CRM</p>
                </div>
              </a>

              <a href="/sales/new" className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-dashed border-green-300 rounded-2xl hover:border-green-500 transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-3xl mr-4">💰</div>
                <div>
                  <p className="font-bold text-gray-900">Nova Venda</p>
                  <p className="text-xs text-gray-600">Com comissão</p>
                </div>
              </a>

              <a href="/receivables" className="group flex items-center p-6 bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-dashed border-teal-300 rounded-2xl hover:border-teal-500 transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-3xl mr-4">💳</div>
                <div>
                  <p className="font-bold text-gray-900">Contas a Receber</p>
                  <p className="text-xs text-gray-600">Controle financeiro</p>
                </div>
              </a>

              <a href="/goals" className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-3xl mr-4">🎯</div>
                <div>
                  <p className="font-bold text-gray-900">Objetivos</p>
                  <p className="text-xs text-gray-600">Definir metas</p>
                </div>
              </a>

              <button onClick={fetchDashboardData} className="group flex items-center p-6 bg-gradient-to-br from-orange-50 to-yellow-100 border-2 border-dashed border-orange-300 rounded-2xl hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-3xl mr-4">🔄</div>
                <div>
                  <p className="font-bold text-gray-900">Atualizar</p>
                  <p className="text-xs text-gray-600">Recarregar</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Stats Chart */}
        {dashboardData.monthlyStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">📊</span>
                Estatísticas Mensais
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.monthlyStats.slice(-3).map((stat, index) => (
                  <div key={index} className="text-center p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{stat.month}</h3>
                      <div className="text-2xl">
                        {stat.achieved ? '🎯' : '📈'}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Vendas</p>
                        <p className="text-2xl font-bold text-green-600">{stat.sales}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Receita</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(stat.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Comissões</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(stat.commissions)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Meta</p>
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(stat.goal)}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${stat.achieved ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min((stat.revenue / stat.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatPercentage((stat.revenue / stat.goal) * 100)} da meta
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500">
            Sistema de Gestão de Representantes Comerciais
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Desenvolvido para maximizar suas vendas e comissões
          </p>
        </div>
      </div>
    </div>
  );
}


