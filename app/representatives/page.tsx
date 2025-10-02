'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory?: string;
  specialization?: string;
  hire_date: string;
  status: 'active' | 'inactive';
  commission_rate: number;
  monthly_goal?: number;
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: number;
  customer_name: string;
  total_amount: number;
  commission_amount: number;
  sale_date: string;
  status: string;
}

interface RepresentativeStats {
  totalSales: number;
  totalRevenue: number;
  totalCommissions: number;
  monthlyRevenue: number;
  monthlyCommissions: number;
  averageTicket: number;
  clientsCount: number;
  goalProgress: number;
}

interface RepresentativeFormData {
  name: string;
  email: string;
  phone: string;
  territory?: string;
  specialization?: string;
  commission_rate: number;
  monthly_goal?: number;
  status: 'active' | 'inactive';
}

export default function RepresentativesPage() {
  const { t } = useTranslation();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [repStats, setRepStats] = useState<Map<string, RepresentativeStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [formData, setFormData] = useState<RepresentativeFormData>({
    name: '',
    email: '',
    phone: '',
    territory: '',
    specialization: '',
    commission_rate: 5.0,
    monthly_goal: 50000,
    status: 'active'
  });

  const fetchRepresentatives = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simular dados de representantes (já que não temos API específica)
      // Em produção, você criaria uma API /api/representatives
      const mockRepresentatives: Representative[] = [
        {
          id: 'rep-001',
          name: 'João Silva Santos',
          email: 'joao.silva@empresa.com',
          phone: '(51) 99999-1111',
          territory: 'Porto Alegre e Região Metropolitana',
          specialization: 'Empresas de Tecnologia',
          hire_date: '2023-01-15',
          status: 'active',
          commission_rate: 5.5,
          monthly_goal: 75000,
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2024-12-01T15:30:00Z'
        },
        {
          id: 'rep-002', 
          name: 'Maria Fernanda Costa',
          email: 'maria.costa@empresa.com',
          phone: '(51) 98888-2222',
          territory: 'Interior do Estado',
          specialization: 'Agronegócio e Cooperativas',
          hire_date: '2022-08-20',
          status: 'active',
          commission_rate: 6.0,
          monthly_goal: 60000,
          created_at: '2022-08-20T09:00:00Z',
          updated_at: '2024-11-15T14:20:00Z'
        },
        {
          id: 'rep-003',
          name: 'Carlos Eduardo Oliveira',
          email: 'carlos.oliveira@empresa.com',
          phone: '(51) 97777-3333',
          territory: 'Santa Catarina',
          specialization: 'Indústria e Manufatura',
          hire_date: '2024-03-10',
          status: 'active',
          commission_rate: 4.5,
          monthly_goal: 45000,
          created_at: '2024-03-10T08:00:00Z',
          updated_at: '2024-12-20T16:45:00Z'
        }
      ];
      
      setRepresentatives(mockRepresentatives);
      
      // Buscar vendas reais da API
      const salesResponse = await fetch('/api/sales');
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        if (salesData.success) {
          setSales(salesData.data || []);
          calculateRepresentativeStats(mockRepresentatives, salesData.data || []);
        }
      }
      
    } catch (error) {
      console.error('Error fetching representatives:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar representantes');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRepresentativeStats = (reps: Representative[], salesData: Sale[]) => {
    const statsMap = new Map<string, RepresentativeStats>();
    
    reps.forEach(rep => {
      // Para simulação, vamos distribuir as vendas entre os representantes
      const repSales = salesData.filter((_, index) => {
        // Distribuição simples baseada no ID do representante
        return index % reps.length === reps.findIndex(r => r.id === rep.id);
      });
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // CORREÇÃO: Usar monthlySales ao invés de monthlyStats
      const monthlySales = repSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      });
      
      const totalRevenue = repSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalCommissions = repSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
      
      // CORREÇÃO: Usar monthlySales ao invés de monthlyStats
      const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const monthlyCommissions = monthlySales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
      
      const stats: RepresentativeStats = {
        totalSales: repSales.length,
        totalRevenue,
        totalCommissions,
        monthlyRevenue,
        monthlyCommissions,
        averageTicket: repSales.length > 0 ? totalRevenue / repSales.length : 0,
        clientsCount: new Set(repSales.map(s => s.customer_name)).size,
        goalProgress: rep.monthly_goal ? (monthlyRevenue / rep.monthly_goal) * 100 : 0
      };
      
      statsMap.set(rep.id, stats);
    });
    
    setRepStats(statsMap);
  };

  useEffect(() => {
    fetchRepresentatives();
  }, [fetchRepresentatives]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simulação de salvamento (em produção, usar API real)
      const newRep: Representative = {
        id: editingRep ? editingRep.id : `rep-${Date.now()}`,
        ...formData,
        hire_date: editingRep ? editingRep.hire_date : new Date().toISOString().split('T')[0],
        created_at: editingRep ? editingRep.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingRep) {
        setRepresentatives(prev => prev.map(rep => rep.id === editingRep.id ? newRep : rep));
      } else {
        setRepresentatives(prev => [...prev, newRep]);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        territory: '',
        specialization: '',
        commission_rate: 5.0,
        monthly_goal: 50000,
        status: 'active'
      });
      setShowCreateModal(false);
      setEditingRep(null);
      
    } catch (error) {
      console.error('Error saving representative:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar representante');
    }
  };

  const handleDelete = async (repId: string) => {
    if (!confirm('Tem certeza que deseja excluir este representante?')) return;
    
    try {
      setRepresentatives(prev => prev.filter(rep => rep.id !== repId));
    } catch (error) {
      console.error('Error deleting representative:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir representante');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando equipe de representantes...</p>
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
            { label: t('nav.representatives', 'Representantes'), icon: '👔' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              👔 {t('representatives.title', 'Gestão de Representantes')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('representatives.subtitle', 'Gerencie sua equipe comercial, territórios e desempenho individual')}
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Novo Representante</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Representatives */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total da Equipe</p>
                <p className="text-3xl font-bold text-blue-600">{representatives.length}</p>
                <p className="text-green-600 text-sm mt-1">
                  {representatives.filter(r => r.status === 'active').length} ativos
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Receita Total</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(Array.from(repStats.values()).reduce((sum, stat) => sum + stat.totalRevenue, 0))}
                </p>
                <p className="text-gray-500 text-sm mt-1">Todos os representantes</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Total Commissions */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Comissões Pagas</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(Array.from(repStats.values()).reduce((sum, stat) => sum + stat.totalCommissions, 0))}
                </p>
                <p className="text-gray-500 text-sm mt-1">Equipe total</p>
              </div>
              <div className="text-4xl">💎</div>
            </div>
          </div>

          {/* Average Performance */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Desempenho Médio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {representatives.length > 0 
                    ? Math.round(Array.from(repStats.values()).reduce((sum, stat) => sum + stat.goalProgress, 0) / representatives.length)
                    : 0}%
                </p>
                <p className="text-gray-500 text-sm mt-1">Meta mensal</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Representatives Grid */}
        {representatives.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {representatives.map((rep) => {
              const stats = repStats.get(rep.id);
              return (
                <div key={rep.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Representative Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                          {rep.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{rep.name}</h3>
                          <p className="text-blue-100 text-sm">{rep.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                        {getStatusIcon(rep.status)} {rep.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Representative Content */}
                  <div className="p-6">
                    {/* Contact Info */}
                    <div className="mb-6 space-y-2">
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="mr-2">📞</span>
                        {rep.phone}
                      </p>
                      {rep.territory && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">🗺️</span>
                          {rep.territory}
                        </p>
                      )}
                      {rep.specialization && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">🎯</span>
                          {rep.specialization}
                        </p>
                      )}
                    </div>

                    {/* Performance Stats */}
                    {stats && (
                      <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(stats.monthlyRevenue)}
                            </div>
                            <div className="text-xs text-gray-600">Receita Mensal</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-lg font-bold text-yellow-600">
                              {formatCurrency(stats.monthlyCommissions)}
                            </div>
                            <div className="text-xs text-gray-600">Comissão Mensal</div>
                          </div>
                        </div>

                        {/* Goal Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Meta Mensal</span>
                            <span className="text-sm text-gray-500">
                              {stats.goalProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatCurrency(stats.monthlyRevenue)}</span>
                            <span>{formatCurrency(rep.monthly_goal || 0)}</span>
                          </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{stats.totalSales}</div>
                            <div className="text-xs text-gray-600">Vendas</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{stats.clientsCount}</div>
                            <div className="text-xs text-gray-600">Clientes</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{rep.commission_rate}%</div>
                            <div className="text-xs text-gray-600">Taxa</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between space-x-2">
                      <button
                        onClick={() => {
                          setEditingRep(rep);
                          setFormData({
                            name: rep.name,
                            email: rep.email,
                            phone: rep.phone,
                            territory: rep.territory || '',
                            specialization: rep.specialization || '',
                            commission_rate: rep.commission_rate,
                            monthly_goal: rep.monthly_goal,
                            status: rep.status
                          });
                          setShowCreateModal(true);
                        }}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setSelectedRep(rep)}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        👤 Detalhes
                      </button>
                      <button
                        onClick={() => handleDelete(rep.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-6">👔</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">
              Nenhum representante cadastrado
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Comece montando sua equipe comercial adicionando o primeiro representante.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ➕ Adicionar Primeiro Representante
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold">
                  {editingRep ? '✏️ Editar Representante' : '➕ Novo Representante'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: João Silva Santos"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="joao@empresa.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(51) 99999-9999"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="active">✅ Ativo</option>
                      <option value="inactive">❌ Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Territory & Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Território (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.territory}
                    onChange={(e) => setFormData({...formData, territory: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Porto Alegre e Região Metropolitana"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialização (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Empresas de Tecnologia, Agronegócio, etc."
                  />
                </div>

                {/* Financial Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Comissão (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({...formData, commission_rate: Number(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5.0"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.monthly_goal || ''}
                      onChange={(e) => setFormData({...formData, monthly_goal: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50000"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRep(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        territory: '',
                        specialization: '',
                        commission_rate: 5.0,
                        monthly_goal: 50000,
                        status: 'active'
                      });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300"
                  >
                    {editingRep ? 'Atualizar' : 'Criar'} Representante
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Representative Detail Modal */}
        {selectedRep && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedRep.name}</h2>
                    <p className="text-blue-100">{selectedRep.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRep(null)}
                    className="text-white hover:text-blue-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Representative Full Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <span className="text-gray-600 w-24">📞 Telefone:</span>
                        <span className="font-medium">{selectedRep.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 w-24">📧 E-mail:</span>
                        <span className="font-medium">{selectedRep.email}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 w-24">📅 Contratação:</span>
                        <span className="font-medium">
                          {new Date(selectedRep.hire_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 w-24">💎 Comissão:</span>
                        <span className="font-medium">{selectedRep.commission_rate}%</span>
                      </div>
                    </div>
                    
                    {selectedRep.territory && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">🗺️ Território</h4>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedRep.territory}</p>
                      </div>
                    )}
                    
                    {selectedRep.specialization && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">🎯 Especialização</h4>
                        <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{selectedRep.specialization}</p>
                      </div>
                    )}
                  </div>

                  {/* Performance Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Desempenho</h3>
                    
                    {repStats.get(selectedRep.id) && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(repStats.get(selectedRep.id)!.monthlyRevenue)}
                            </div>
                            <div className="text-sm text-gray-600">Receita Este Mês</div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {formatCurrency(repStats.get(selectedRep.id)!.monthlyCommissions)}
                            </div>
                            <div className="text-sm text-gray-600">Comissão Este Mês</div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">Progresso da Meta Mensal</span>
                            <span className="text-blue-600 font-bold">
                              {repStats.get(selectedRep.id)!.goalProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full"
                              style={{ width: `${Math.min(repStats.get(selectedRep.id)!.goalProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>{formatCurrency(repStats.get(selectedRep.id)!.monthlyRevenue)}</span>
                            <span>{formatCurrency(selectedRep.monthly_goal || 0)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">
                              {repStats.get(selectedRep.id)!.totalSales}
                            </div>
                            <div className="text-xs text-gray-600">Vendas Totais</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">
                              {repStats.get(selectedRep.id)!.clientsCount}
                            </div>
                            <div className="text-xs text-gray-600">Clientes Únicos</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(repStats.get(selectedRep.id)!.averageTicket)}
                            </div>
                            <div className="text-xs text-gray-600">Ticket Médio</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
