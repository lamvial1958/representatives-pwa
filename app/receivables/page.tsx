'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ReceivableStatus = 'pending' | 'overdue' | 'received' | 'renegotiated';

interface Receivable {
  id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  status: ReceivableStatus;
  description: string;
  created_at: string;
}

export default function ReceivablesPage() {
  const router = useRouter();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReceivableStatus>('all');

  useEffect(() => {
    fetchReceivables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers de formatação (com fallback seguro)
  const formatBRL = (value: unknown) =>
    Number(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const formatDateBR = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  };

  // Buscar e normalizar dados
  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/receivables');
      if (!response.ok) throw new Error('Falha ao buscar contas');

      const data = await response.json();
      const raw = data?.receivables ?? data?.data ?? data?.items ?? data ?? [];

      const list: Receivable[] = (Array.isArray(raw) ? raw : [])
        .filter(Boolean)
        .map((r: any): Receivable => {
          const id =
            r?.id ?? r?._id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
          const amount = Number(r?.amount ?? r?.value ?? r?.total ?? 0);
          const due_date = r?.due_date ?? r?.dueDate ?? r?.date ?? '';
          const status: ReceivableStatus =
            (r?.status as ReceivableStatus) ?? 'pending';

          return {
            id: String(id),
            customer_name: r?.customerName ?? r?.client?.name ?? r?.client?.name ?? '—',
            amount: Number.isFinite(amount) ? amount : 0,
            due_date: typeof due_date === 'string' ? due_date : '',
            status,
            description: r?.description ?? r?.notes ?? '',
            created_at: r?.created_at ?? r?.createdAt ?? '',
          };
        });

      setReceivables(list);
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ReceivableStatus) => {
    try {
      const response = await fetch(`/api/receivables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        fetchReceivables(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Navegação para nova conta
  const handleNewReceivable = () => {
    router.push('/receivables/new');
  };

  const getStatusColor = (status: ReceivableStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'renegotiated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ReceivableStatus | 'all') => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencida';
      case 'received':
        return 'Recebida';
      case 'renegotiated':
        return 'Renegociada';
      case 'all':
        return 'Todas';
      default:
        return String(status);
    }
  };

  const filteredReceivables = receivables.filter((receivable) =>
    filter === 'all' ? true : receivable.status === filter
  );

  const totalAmount = filteredReceivables.reduce((sum, r) => sum + Number(r?.amount ?? 0), 0);
  const pendingAmount = receivables
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r?.amount ?? 0), 0);
  const overdueAmount = receivables
    .filter((r) => r.status === 'overdue')
    .reduce((sum, r) => sum + Number(r?.amount ?? 0), 0);
  const receivedAmount = receivables
    .filter((r) => r.status === 'received')
    .reduce((sum, r) => sum + Number(r?.amount ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 w-full gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📥 Contas a Receber</h1>
            <p className="text-gray-600">Controle financeiro e gestão de recebíveis</p>
          </div>

          {/* Ações: Painel + Nova Conta */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              title="Ir para o Painel"
            >
              🏠 <span>Painel</span>
            </Link>

            <button
              onClick={handleNewReceivable}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span>➕</span>
              <span>Nova Conta</span>
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Geral</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {formatBRL(totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {formatBRL(pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {formatBRL(overdueAmount)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recebidas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {formatBRL(receivedAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas', icon: '📋' },
              { key: 'pending', label: 'Pendentes', icon: '⏳' },
              { key: 'overdue', label: 'Vencidas', icon: '⚠️' },
              { key: 'received', label: 'Recebidas', icon: '✅' },
              { key: 'renegotiated', label: 'Renegociadas', icon: '🔁' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  filter === (key as any)
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Contas */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-6xl mb-4">📋</span>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma conta encontrada
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {filter === 'all'
                            ? 'Comece adicionando uma nova conta a receber'
                            : `Não há contas com status "${getStatusText(filter)}"`}
                        </p>
                        <button
                          onClick={handleNewReceivable}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          ➕ Adicionar Conta
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((receivable) => (
                    <tr
                      key={receivable.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {receivable.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          R$ {formatBRL(receivable?.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDateBR(receivable?.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            receivable.status
                          )}`}
                        >
                          {getStatusText(receivable.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="max-w-xs truncate">{receivable.description || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {receivable.status !== 'received' && (
                            <>
                              {/* Marcar como Recebido */}
                              <button
                                onClick={() => handleStatusChange(receivable.id, 'received')}
                                className="text-green-600 hover:text-green-900 px-2 py-1 rounded transition-colors duration-200 hover:bg-green-50"
                                title="Marcar como recebido"
                              >
                                ✅ Recebido
                              </button>

                              {/* Renegociar */}
                              <button
                                onClick={() =>
                                  handleStatusChange(receivable.id, 'renegotiated')
                                }
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition-colors duration-200 hover:bg-blue-50"
                                title="Renegociar conta"
                              >
                                🔁 Renegociar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

