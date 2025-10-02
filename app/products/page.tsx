'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  margin: number;
  commission_rate: number;
  stock_quantity?: number;
  sku: string;
  status: 'active' | 'inactive' | 'discontinued';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  commission_rate: number;
  stock_quantity?: number;
  sku: string;
  status: 'active' | 'inactive' | 'discontinued';
  tags?: string;
}

const categories = [
  'Software e Tecnologia',
  'Consultoria',
  'Serviços Digitais',
  'Hardware',
  'Licenças',
  'Suporte Técnico',
  'Treinamento',
  'Outros'
];

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: 0,
    cost: 0,
    commission_rate: 5.0,
    stock_quantity: 0,
    sku: '',
    status: 'active',
    tags: ''
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simular dados de produtos (em produção, usar API real)
      const mockProducts: Product[] = [
        {
          id: 'prod-001',
          name: 'Sistema CRM Empresarial',
          description: 'Plataforma completa de gestão de relacionamento com clientes',
          category: 'Software e Tecnologia',
          subcategory: 'CRM',
          price: 2500.00,
          cost: 800.00,
          margin: 68,
          commission_rate: 8.0,
          stock_quantity: 100,
          sku: 'CRM-ENT-001',
          status: 'active',
          tags: ['crm', 'gestao', 'empresarial'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-12-20T15:30:00Z'
        },
        {
          id: 'prod-002',
          name: 'Consultoria em Transformação Digital',
          description: 'Consultoria especializada em processos de digitalização empresarial',
          category: 'Consultoria',
          subcategory: 'Transformação Digital',
          price: 5000.00,
          cost: 2000.00,
          margin: 60,
          commission_rate: 12.0,
          sku: 'CONS-TD-002',
          status: 'active',
          tags: ['consultoria', 'digital', 'transformacao'],
          created_at: '2024-01-20T09:00:00Z',
          updated_at: '2024-11-15T14:20:00Z'
        },
        {
          id: 'prod-003',
          name: 'Licença Microsoft Office 365',
          description: 'Pacote completo de produtividade da Microsoft',
          category: 'Licenças',
          subcategory: 'Produtividade',
          price: 180.00,
          cost: 120.00,
          margin: 33,
          commission_rate: 5.0,
          stock_quantity: 500,
          sku: 'LIC-OFF-003',
          status: 'active',
          tags: ['microsoft', 'office', 'licenca'],
          created_at: '2024-02-01T08:00:00Z',
          updated_at: '2024-12-01T16:45:00Z'
        },
        {
          id: 'prod-004',
          name: 'Treinamento em Vendas B2B',
          description: 'Curso completo de técnicas de vendas para mercado corporativo',
          category: 'Treinamento',
          subcategory: 'Vendas',
          price: 1200.00,
          cost: 400.00,
          margin: 67,
          commission_rate: 10.0,
          sku: 'TRE-VEN-004',
          status: 'active',
          tags: ['treinamento', 'vendas', 'b2b'],
          created_at: '2024-03-10T07:00:00Z',
          updated_at: '2024-12-15T12:30:00Z'
        }
      ];
      
      setProducts(mockProducts);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const margin = formData.price > 0 ? ((formData.price - formData.cost) / formData.price) * 100 : 0;
      const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      const newProduct: Product = {
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
        ...formData,
        margin,
        tags,
        created_at: editingProduct ? editingProduct.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        setProducts(prev => prev.map(product => product.id === editingProduct.id ? newProduct : product));
      } else {
        setProducts(prev => [...prev, newProduct]);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        price: 0,
        cost: 0,
        commission_rate: 5.0,
        stock_quantity: 0,
        sku: '',
        status: 'active',
        tags: ''
      });
      setShowCreateModal(false);
      setEditingProduct(null);
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir produto');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Software e Tecnologia': return '💻';
      case 'Consultoria': return '🎯';
      case 'Serviços Digitais': return '🌐';
      case 'Hardware': return '🖥️';
      case 'Licenças': return '📄';
      case 'Suporte Técnico': return '🔧';
      case 'Treinamento': return '📚';
      default: return '📦';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalValue = products.reduce((sum, product) => sum + product.price, 0);
  const averageMargin = products.length > 0 
    ? products.reduce((sum, product) => sum + product.margin, 0) / products.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando catálogo de produtos...</p>
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
            { label: t('nav.products', 'Produtos'), icon: '📦' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
              📦 {t('products.title', 'Catálogo de Produtos')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('products.subtitle', 'Gerencie seu portfólio de produtos e serviços com preços e margens')}
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Produtos</p>
                <p className="text-3xl font-bold text-purple-600">{products.length}</p>
                <p className="text-purple-600 text-sm mt-1">No catálogo</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-green-600 text-sm mt-1">Do portfólio</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Margem Média</p>
                <p className="text-3xl font-bold text-blue-600">{averageMargin.toFixed(1)}%</p>
                <p className="text-blue-600 text-sm mt-1">Lucratividade</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Produtos Ativos</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {products.filter(p => p.status === 'active').length}
                </p>
                <p className="text-emerald-600 text-sm mt-1">Disponíveis</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nome, SKU ou descrição..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📂 Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="discontinued">Descontinuado</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchProducts}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>🔄</span>
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Product Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getCategoryIcon(product.category)}</div>
                      <div>
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="text-purple-100 text-sm">{product.sku}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                      {product.status === 'active' ? '✅ Ativo' :
                       product.status === 'inactive' ? '⏸️ Inativo' :
                       '❌ Descontinuado'}
                    </span>
                  </div>
                </div>

                {/* Product Content */}
                <div className="p-6">
                  {/* Description */}
                  {product.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                  )}

                  {/* Category & Subcategory */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📂</span>
                      <span>{product.category}</span>
                      {product.subcategory && <span className="ml-2 text-gray-400">• {product.subcategory}</span>}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600">Preço Venda</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {product.margin.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Margem</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Custo:</span>
                      <span className="font-medium">R$ {product.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Comissão:</span>
                      <span className="font-medium text-yellow-600">{product.commission_rate}%</span>
                    </div>
                    {product.stock_quantity !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estoque:</span>
                        <span className="font-medium">{product.stock_quantity} unidades</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name,
                          description: product.description || '',
                          category: product.category,
                          subcategory: product.subcategory || '',
                          price: product.price,
                          cost: product.cost,
                          commission_rate: product.commission_rate,
                          stock_quantity: product.stock_quantity,
                          sku: product.sku,
                          status: product.status,
                          tags: product.tags?.join(', ') || ''
                        });
                        setShowCreateModal(true);
                      }}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar outros produtos.'
                : 'Comece criando seu primeiro produto no catálogo.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ➕ Adicionar Primeiro Produto
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                <h2 className="text-xl font-bold">
                  {editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Sistema CRM Empresarial"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: CRM-ENT-001"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Descreva o produto ou serviço..."
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategoria (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: CRM, ERP, etc."
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="2500.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custo (R$) *
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="800.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa Comissão (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({...formData, commission_rate: Number(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="5.0"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                {/* Stock & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade em Estoque (opcional)
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity || ''}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="100"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="active">✅ Ativo</option>
                      <option value="inactive">⏸️ Inativo</option>
                      <option value="discontinued">❌ Descontinuado</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="crm, gestao, empresarial (separadas por vírgula)"
                  />
                </div>

                {/* Preview Calculations */}
                {formData.price > 0 && formData.cost > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">📊 Cálculos Automáticos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Margem:</span>
                        <span className="font-bold text-blue-600 ml-2">
                          {(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Lucro:</span>
                        <span className="font-bold text-green-600 ml-2">
                          R$ {(formData.price - formData.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Comissão:</span>
                        <span className="font-bold text-yellow-600 ml-2">
                          R$ {((formData.price * formData.commission_rate) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProduct(null);
                      setFormData({
                        name: '',
                        description: '',
                        category: '',
                        subcategory: '',
                        price: 0,
                        cost: 0,
                        commission_rate: 5.0,
                        stock_quantity: 0,
                        sku: '',
                        status: 'active',
                        tags: ''
                      });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300"
                  >
                    {editingProduct ? 'Atualizar' : 'Criar'} Produto
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
