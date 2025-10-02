'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { SaleFormData, ApiResponse } from '@/types';

export default function NewSalePage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState<SaleFormData>({
    customer_id: 0,
    customer_name: '',
    customer_state: 'RS',
    product_service: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    commission_rate: 5,
    commission_amount: 0,
    payment_method: 'Cartão',
    status: 'Pendente',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calcular automaticamente valores derivados
      if (name === 'quantity' || name === 'unit_price') {
        const quantity = name === 'quantity' ? Number(value) : prev.quantity;
        const unitPrice = name === 'unit_price' ? Number(value) : prev.unit_price;
        updated.total_amount = quantity * unitPrice;
        updated.commission_amount = updated.total_amount * (prev.commission_rate / 100);
      }
      
      if (name === 'commission_rate') {
        updated.commission_amount = prev.total_amount * (Number(value) / 100);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_state: formData.customer_state,
          product_service: formData.product_service,
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          commission_percentage: formData.commission_rate,
          sale_date: formData.sale_date,
          status: formData.status,
          notes: formData.notes
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create sale');
      }

      // Redirecionar para a lista de vendas
      router.push('/sales');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error creating sale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
          { label: t('nav.sales', 'Vendas'), href: '/sales', icon: '💰' },
          { label: t('sales.newSale', 'Nova Venda'), icon: '➕' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ➕ {t('sales.newSale', 'Nova Venda')}
          </h1>
          <p className="text-gray-600">
            {t('sales.newSaleSubtitle', 'Registre uma nova venda e calcule sua comissão automaticamente')}
          </p>
        </div>
        
        <Link
          href="/sales"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          👈 {t('common.backToList', 'Voltar à Lista')}
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">❌</span>
            <span className="text-red-800 font-medium">Erro:</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            📝 Informações da Venda
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Cliente */}
            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                👤 Nome do Cliente *
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome do cliente"
              />
            </div>

            {/* Estado do Cliente */}
            <div>
              <label htmlFor="customer_state" className="block text-sm font-medium text-gray-700 mb-2">
                📍 Estado
              </label>
              <select
                id="customer_state"
                name="customer_state"
                value={formData.customer_state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RS">🏴󠁢󠁲󠁲󠁳󠁿 Rio Grande do Sul</option>
                <option value="SC">Santa Catarina</option>
                <option value="PR">Paraná</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="Outros">Outros Estados</option>
              </select>
            </div>

            {/* Produto/Serviço */}
            <div>
              <label htmlFor="product_service" className="block text-sm font-medium text-gray-700 mb-2">
                📦 Produto/Serviço *
              </label>
              <input
                type="text"
                id="product_service"
                name="product_service"
                value={formData.product_service}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o produto ou serviço"
              />
            </div>

            {/* Data da Venda */}
            <div>
              <label htmlFor="sale_date" className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data da Venda *
              </label>
              <input
                type="date"
                id="sale_date"
                name="sale_date"
                value={formData.sale_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                📊 Quantidade
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preço Unitário */}
            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
                💵 Preço Unitário *
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>

            {/* Taxa de Comissão */}
            <div>
              <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-2">
                💎 Taxa de Comissão (%)
              </label>
              <input
                type="number"
                id="commission_rate"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                📋 Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pendente">⏳ Pendente</option>
                <option value="Pago">✅ Pago</option>
                <option value="Cancelado">❌ Cancelado</option>
              </select>
            </div>
          </div>

          {/* Valores Calculados */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">💰 Cálculos Automáticos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Valor Total:</span>
                <div className="text-lg font-semibold text-green-600">
                  R$ {formData.total_amount.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Comissão:</span>
                <div className="text-lg font-semibold text-blue-600">
                  R$ {formData.commission_amount.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              📝 Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações adicionais (opcional)"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('common.processing', 'Processando...')}
                </>
              ) : (
                <>
                  💾 {t('common.save', 'Salvar Venda')}
                </>
              )}
            </button>
            
            <Link
              href="/sales"
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors text-center"
            >
              🚫 {t('common.cancel', 'Cancelar')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
