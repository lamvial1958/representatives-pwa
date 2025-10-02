'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Visit {
  id: string;
  client_id: number;
  client_name: string;
  client_state: string;
  visit_date: string;
  visit_time: string;
  visit_type: 'presencial' | 'video_call' | 'phone_call';
  status: 'agendada' | 'realizada' | 'cancelada' | 'reagendada';
  purpose: string;
  notes?: string;
  follow_up_date?: string;
  outcome?: 'venda_fechada' | 'proposta_enviada' | 'negociacoes' | 'sem_interesse' | 'follow_up';
  created_at: string;
  updated_at: string;
}

interface VisitFormData {
  client_id: number;
  client_name: string;
  visit_date: string;
  visit_time: string;
  visit_type: 'presencial' | 'video_call' | 'phone_call';
  purpose: string;
  notes?: string;
  follow_up_date?: string;
}

export default function VisitsPage() {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'agendada' | 'realizada' | 'cancelada'>('all');
  const [formData, setFormData] = useState<VisitFormData>({
    client_id: 0,
    client_name: '',
    visit_date: '',
    visit_time: '',
    visit_type: 'presencial',
    purpose: '',
    notes: '',
    follow_up_date: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Buscar clientes da API
      const clientsResponse = await fetch('/api/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        if (clientsData.success) {
          setClients(clientsData.data || []);
        }
      }

      // Simular dados de visitas (em produção, usar API real)
      const mockVisits: Visit[] = [
        {
          id: 'visit-001',
          client_id: 1,
          client_name: 'Empresa Exemplo Ltda',
          client_state: 'RS',
          visit_date: '2025-02-03',
          visit_time: '14:00',
          visit_type: 'presencial',
          status: 'agendada',
          purpose: 'Apresentação de nova linha de produtos',
          notes: 'Cliente demonstrou interesse em soluções para automação',
          follow_up_date: '2025-02-10',
          created_at: '2025-01-30T10:00:00Z',
          updated_at: '2025-01-30T10:00:00Z'
        },
        {
          id: 'visit-002',
          client_id: 2,
          client_name: 'Tech Solutions SA',
          client_state: 'SC',
          visit_date: '2025-01-28',
          visit_time: '10:30',
          visit_type: 'video_call',
          status: 'realizada',
          purpose: 'Follow-up de proposta comercial',
          notes: 'Proposta aprovada, aguardando assinatura do contrato',
          outcome: 'venda_fechada',
          created_at: '2025-01-25T09:00:00Z',
          updated_at: '2025-01-28T11:30:00Z'
        },
        {
          id: 'visit-003',
          client_id: 3,
          client_name: 'Agro Cooperativa',
          client_state: 'RS',
          visit_date: '2025-02-05',
          visit_time: '09:00',
          visit_type: 'presencial',
          status: 'agendada',
          purpose: 'Reunião estratégica sobre expansão',
          notes: 'Reunião com diretoria para discutir parceria estratégica',
          follow_up_date: '2025-02-12',
          created_at: '2025-02-01T08:00:00Z',
          updated_at: '2025-02-01T08:00:00Z'
        }
      ];
      
      setVisits(mockVisits);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newVisit: Visit = {
        id: editingVisit ? editingVisit.id : `visit-${Date.now()}`,
        ...formData,
        status: editingVisit ? editingVisit.status : 'agendada',
        client_state: clients.find(c => c.id === formData.client_id)?.state || 'RS',
        outcome: editingVisit?.outcome,
        created_at: editingVisit ? editingVisit.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingVisit) {
        setVisits(prev => prev.map(visit => visit.id === editingVisit.id ? newVisit : visit));
      } else {
        setVisits(prev => [...prev, newVisit]);
      }

      // Reset form
      setFormData({
        client_id: 0,
        client_name: '',
        visit_date: '',
        visit_time: '',
        visit_type: 'presencial',
        purpose: '',
        notes: '',
        follow_up_date: ''
      });
      setShowCreateModal(false);
      setEditingVisit(null);
      
    } catch (error) {
      console.error('Error saving visit:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar visita');
    }
  };

  const updateVisitStatus = (visitId: string, status: Visit['status'], outcome?: Visit['outcome']) => {
    setVisits(prev => prev.map(visit => 
      visit.id === visitId 
        ? { ...visit, status, outcome, updated_at: new Date().toISOString() }
        : visit
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'realizada': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      case 'reagendada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'presencial': return '🏢';
      case 'video_call': return '📹';
      case 'phone_call': return '📞';
      default: return '📅';
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'venda_fechada': return 'bg-green-100 text-green-800';
      case 'proposta_enviada': return 'bg-blue-100 text-blue-800';
      case 'negociacoes': return 'bg-yellow-100 text-yellow-800';
      case 'sem_interesse': return 'bg-red-100 text-red-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVisits = visits.filter(visit => 
    statusFilter === 'all' || visit.status === statusFilter
  );

  const todayVisits = visits.filter(visit => 
    visit.visit_date === new Date().toISOString().split('T')[0] && visit.status === 'agendada'
  );

  const upcomingVisits = visits.filter(visit => {
    const visitDate = new Date(visit.visit_date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return visitDate > today && visitDate <= nextWeek && visit.status === 'agendada';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando agenda de visitas...</p>
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
            { label: t('nav.visits', 'Visitas'), icon: '🚗' }
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              🚗 {t('visits.title', 'Gestão de Visitas')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('visits.subtitle', 'Organize sua agenda de visitas e acompanhe o relacionamento com clientes')}
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <span>📅</span>
            <span>Nova Visita</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Hoje</p>
                <p className="text-3xl font-bold text-blue-600">{todayVisits.length}</p>
                <p className="text-blue-600 text-sm mt-1">Visitas agendadas</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Próxima Semana</p>
                <p className="text-3xl font-bold text-green-600">{upcomingVisits.length}</p>
                <p className="text-green-600 text-sm mt-1">Visitas planejadas</p>
              </div>
              <div className="text-4xl">🗓️</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Realizadas</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {visits.filter(v => v.status === 'realizada').length}
                </p>
                <p className="text-emerald-600 text-sm mt-1">Este mês</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Taxa Sucesso</p>
                <p className="text-3xl font-bold text-purple-600">
                  {visits.filter(v => v.status === 'realizada').length > 0 
                    ? Math.round((visits.filter(v => v.outcome === 'venda_fechada').length / visits.filter(v => v.status === 'realizada').length) * 100)
                    : 0}%
                </p>
                <p className="text-purple-600 text-sm mt-1">Conversão</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todas as visitas</option>
                <option value="agendada">Agendadas</option>
                <option value="realizada">Realizadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>

            <div className="ml-auto">
              <button
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visits List */}
        {filteredVisits.length > 0 ? (
          <div className="space-y-4">
            {filteredVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    {/* Visit Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{getTypeIcon(visit.visit_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{visit.client_name}</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
                              {visit.status === 'agendada' ? '📅 Agendada' :
                               visit.status === 'realizada' ? '✅ Realizada' :
                               visit.status === 'cancelada' ? '❌ Cancelada' :
                               '🔄 Reagendada'}
                            </span>
                            {visit.outcome && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(visit.outcome)}`}>
                                {visit.outcome === 'venda_fechada' ? '🎉 Venda Fechada' :
                                 visit.outcome === 'proposta_enviada' ? '📄 Proposta Enviada' :
                                 visit.outcome === 'negociacoes' ? '🤝 Em Negociação' :
                                 visit.outcome === 'sem_interesse' ? '❌ Sem Interesse' :
                                 '📞 Follow-up'}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center">
                              <span className="mr-2">📅</span>
                              {new Date(visit.visit_date).toLocaleDateString('pt-BR')} às {visit.visit_time}
                            </p>
                            <p className="flex items-center">
                              <span className="mr-2">🎯</span>
                              {visit.purpose}
                            </p>
                            <p className="flex items-center">
                              <span className="mr-2">📍</span>
                              {visit.client_state}
                            </p>
                            {visit.follow_up_date && (
                              <p className="flex items-center">
                                <span className="mr-2">🔄</span>
                                Follow-up: {new Date(visit.follow_up_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          
                          {visit.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{visit.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      {visit.status === 'agendada' && (
                        <>
                          <button
                            onClick={() => updateVisitStatus(visit.id, 'realizada', 'venda_fechada')}
                            className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✅ Marcar Realizada
                          </button>
                          <button
                            onClick={() => updateVisitStatus(visit.id, 'cancelada')}
                            className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            ❌ Cancelar
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setEditingVisit(visit);
                          setFormData({
                            client_id: visit.client_id,
                            client_name: visit.client_name,
                            visit_date: visit.visit_date,
                            visit_time: visit.visit_time,
                            visit_type: visit.visit_type,
                            purpose: visit.purpose,
                            notes: visit.notes || '',
                            follow_up_date: visit.follow_up_date || ''
                          });
                          setShowCreateModal(true);
                        }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      
                      <Link
                        href={`/clients/${visit.client_id}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        👤 Ver Cliente
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🚗</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">
              Nenhuma visita encontrada
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {statusFilter === 'all' 
                ? 'Comece agendando sua primeira visita a um cliente.'
                : `Nenhuma visita com status "${statusFilter}" encontrada.`}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              📅 Agendar Primeira Visita
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <h2 className="text-xl font-bold">
                  {editingVisit ? '✏️ Editar Visita' : '📅 Nova Visita'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      const clientId = Number(e.target.value);
                      const client = clients.find(c => c.id === clientId);
                      setFormData({
                        ...formData, 
                        client_id: clientId,
                        client_name: client ? client.name : ''
                      });
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.city}, {client.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data da Visita *
                    </label>
                    <input
                      type="date"
                      value={formData.visit_date}
                      onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário *
                    </label>
                    <input
                      type="time"
                      value={formData.visit_time}
                      onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Visit Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Visita *
                  </label>
                  <select
                    value={formData.visit_type}
                    onChange={(e) => setFormData({...formData, visit_type: e.target.value as any})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="presencial">🏢 Presencial</option>
                    <option value="video_call">📹 Videochamada</option>
                    <option value="phone_call">📞 Ligação</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivo da Visita *
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Apresentação de nova linha de produtos"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Informações adicionais sobre a visita..."
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Follow-up (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingVisit(null);
                      setFormData({
                        client_id: 0,
                        client_name: '',
                        visit_date: '',
                        visit_time: '',
                        visit_type: 'presencial',
                        purpose: '',
                        notes: '',
                        follow_up_date: ''
                      });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300"
                  >
                    {editingVisit ? 'Atualizar' : 'Agendar'} Visita
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
