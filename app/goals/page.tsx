'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Goal {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  target_amount: number;
  target_sales?: number;
  current_amount: number;
  current_sales: number;
  status: 'active' | 'completed' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface GoalFormData {
  period_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  target_amount: number;
  target_sales?: number;
  notes?: string;
}

export default function GoalsPage() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    target_amount: 0,
    target_sales: 0,
    notes: ''
  });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/goals');
      if (!response.ok) {
        throw new Error('Erro ao carregar objetivos');
      }
      
      const data = await response.json();
      if (data.success) {
        setGoals(data.data || []);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar objetivos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGoal ? '/api/goals' : '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';
      const body = editingGoal 
        ? { id: editingGoal.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar objetivo');
      }

      // Reset form and refresh data
      setFormData({
        period_type: 'monthly',
        period_start: '',
        period_end: '',
        target_amount: 0,
        target_sales: 0,
        notes: ''
      });
      setShowCreateModal(false);
      setEditingGoal(null);
      await fetchGoals();
      
    } catch (error) {
      console.error('Error saving goal:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar objetivo');
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo?')) return;
    
    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir objetivo');
      }

      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir objetivo');
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    if ((goal as any).targetAmount === 0) return 0;
    return Math.min(((goal as any).currentAmount / (goal as any).targetAmount) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '🏆';
      case 'overdue': return '⚠️';
      default: return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando objetivos...</p>
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
            { label: t('nav.goals', 'Objetivos'), icon: '🎯' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 {t('goals.title', 'Gestão de Objetivos')}
            </h1>
            <p className="text-gray-600">
              {t('goals.subtitle', 'Defina e acompanhe suas metas de vendas e receita')}
            </p>
          </div>

          {/* Ações: Painel + Novo Objetivo */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              title={t('nav.dashboard', 'Painel')}
            >
              🏠 <span>{t('nav.dashboard', 'Painel')}</span>
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>{t('goals.new', 'Novo Objetivo')}</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Goal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {(goal as any).periodType === 'monthly' ? '📅 Meta Mensal' :
                         (goal as any).periodType === 'weekly' ? '📊 Meta Semanal' :
                         (goal as any).periodType === 'daily' ? '⚡ Meta Diária' :
                         '🎯 Meta Personalizada'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {new Date((goal as any).periodStart).toLocaleDateString('pt-BR')} - {new Date((goal as any).periodEnd).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {getStatusIcon(goal.status)} {goal.status === 'completed' ? 'Concluído' : goal.status === 'overdue' ? 'Atrasado' : 'Ativo'}
                    </span>
                  </div>
                </div>

                {/* Goal Content */}
                <div className="p-6">
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progresso da Receita</span>
                      <span className="text-sm text-gray-500">
                        {getProgressPercentage(goal).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(getProgressPercentage(goal), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>R$ {(goal as any).currentAmount.toLocaleString('pt-BR')}</span>
                      <span>R$ {(goal as any).targetAmount.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl mb-1">💰</div>
                      <p className="text-xs text-gray-600">Meta Receita</p>
                      <p className="font-bold text-green-600 text-sm">
                        R$ {(goal as any).targetAmount.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {(goal as any).targetSales && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl mb-1">📊</div>
                        <p className="text-xs text-gray-600">Meta Vendas</p>
                        <p className="font-bold text-blue-600 text-sm">
                          {(goal as any).currentSales}/{(goal as any).targetSales}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {goal.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{goal.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setFormData({
                          period_type: (goal as any).periodType,
                          period_start: (goal as any).periodStart,
                          period_end: (goal as any).periodEnd,
                          target_amount: (goal as any).targetAmount,
                          target_sales: (goal as any).targetSales,
                          notes: goal.notes || ''
                        });
                        setShowCreateModal(true);
                      }}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎯</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">
              {t('goals.empty.title', 'Nenhum objetivo definido')}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {t('goals.empty.description', 'Comece definindo seus primeiros objetivos de vendas e receita para acompanhar seu desempenho.')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ➕ {t('goals.create.first', 'Criar Primeiro Objetivo')}
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold">
                  {editingGoal ? '✏️ Editar Objetivo' : '➕ Novo Objetivo'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Period Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Período
                  </label>
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({...formData, period_type: e.target.value as any})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="daily">⚡ Diário</option>
                    <option value="weekly">📊 Semanal</option>
                    <option value="monthly">📅 Mensal</option>
                    <option value="custom">🎯 Personalizado</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Meta de Receita (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 50000"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Target Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📊 Meta de Vendas (opcional)
                  </label>
                  <input
                    type="number"
                    value={formData.target_sales || ''}
                    onChange={(e) => setFormData({...formData, target_sales: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 50"
                    min="0"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Observações (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Descreva seu objetivo, estratégias ou observações..."
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGoal(null);
                      setFormData({
                        period_type: 'monthly',
                        period_start: '',
                        period_end: '',
                        target_amount: 0,
                        target_sales: 0,
                        notes: ''
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
                    {editingGoal ? 'Atualizar' : 'Criar'} Objetivo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



