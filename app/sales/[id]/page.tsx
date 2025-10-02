'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_state: string;
  customer_email?: string;
  customer_phone?: string;
  product_service: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_method: string;
  status: 'Pendente' | 'Pago' | 'Cancelado';
  sale_date: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/sales?id=${saleId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Venda não encontrada');
        }
        throw new Error('Erro ao carregar venda');
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setSale(data.data);
      } else {
        throw new Error(data.error || 'Venda não encontrada');
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar venda');
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId, fetchSale]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/sales?id=${saleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir venda');
      }

      // Redirect to sales list after successful deletion
      router.push('/sales');
    } catch (error) {
      console.error('Error deleting sale:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir venda');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago': return '✅';
      case 'Cancelado': return '❌';
      default: return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando detalhes da venda...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Erro ao Carregar Venda</h2>
            <p className="text-gray-500 mb-8">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.back()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ← Voltar
              </button>
              <Link
                href="/sales"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
              >
                📊 Lista de Vendas
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Venda Não Encontrada</h2>
            <p className="text-gray-500 mb-8">A venda solicitada não foi encontrada ou foi removida.</p>
            <Link
              href="/sales"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              📊 Voltar para Vendas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
            { label: t('nav.sales', 'Vendas'), href: '/sales', icon: '💰' },
            { label: `Venda #${sale.id}`, icon: '📄' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <span>💰</span>
              <span>Detalhes da Venda #{sale.id}</span>
            </h1>
            <p className="text-gray-600">
              {t('sales.detail.subtitle', 'Informações completas sobre esta transação')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href={`/sales/${sale.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Editar</span>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* Sale Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sale Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <h2 className="text-xl font-bold mb-2 flex items-center space-x-2">
                  <span>📊</span>
                  <span>Resumo da Venda</span>
                </h2>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.status)}`}>
                    {getStatusIcon(sale.status)} {sale.status}
                  </span>
                  <span className="text-green-100 text-sm">
                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product/Service */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produto/Serviço
                    </label>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {sale.product_service}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pagamento
                    </label>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {sale.payment_method}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade
                    </label>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {sale.quantity}
                    </p>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Unitário
                    </label>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                      R$ {sale.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-700">{sale.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>👤</span>
                  <span>Informações do Cliente</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{sale.customer_name}</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center space-x-2">
                        <span>📍</span>
                        <span>{sale.customer_state}</span>
                      </p>
                      {sale.customer_email && (
                        <p className="flex items-center space-x-2">
                          <span>📧</span>
                          <span>{sale.customer_email}</span>
                        </p>
                      )}
                      {sale.customer_phone && (
                        <p className="flex items-center space-x-2">
                          <span>📞</span>
                          <span>{sale.customer_phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/clients/${sale.customer_id}`}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Ver Cliente →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>💎</span>
                  <span>Resumo Financeiro</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Total Amount */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Valor Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Commission */}
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Comissão</p>
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {sale.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {sale.commission_rate}% do valor total
                  </p>
                </div>

                {/* Commission Rate */}
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Taxa de Comissão</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {sale.commission_rate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>🕒</span>
                  <span>Histórico</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Data da Venda</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(sale.sale_date).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Criado em</p>
                  <p className="text-gray-600 text-sm">
                    {new Date(sale.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {sale.updated_at !== sale.created_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Última atualização</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(sale.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Ações Rápidas</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-3">
                <Link
                  href="/sales/new"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 text-center block"
                >
                  ➕ Nova Venda
                </Link>
                
                <Link
                  href="/sales"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 text-center block"
                >
                  📊 Todas as Vendas
                </Link>
                
                <Link
                  href={`/clients/${sale.customer_id}`}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 text-center block"
                >
                  👤 Ver Cliente
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Confirmar Exclusão</span>
                </h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="font-semibold text-gray-900">{sale.product_service}</p>
                  <p className="text-gray-600">{sale.customer_name}</p>
                  <p className="text-green-600 font-bold">
                    R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Excluindo...' : 'Excluir Venda'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
