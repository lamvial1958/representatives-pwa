'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import type { Customer } from '@/types';

interface ClientListProps {
  clients: Customer[];
  onClientDeleted: (id: number) => void;
  onClientUpdated: (client: Customer) => void;
  onRefresh: () => void;
}

export default function ClientList({
  clients,
  onClientDeleted,
  onClientUpdated,
  onRefresh
}: ClientListProps) {
  const { t } = useTranslation();

  // Empty state when no clients
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {t('clients.list.noClients', 'Nenhum cliente cadastrado ainda')}
        </h3>
        <p className="text-gray-500 mb-6">
          {t('clients.list.createFirst', 'Comece criando seu primeiro cliente para vê-lo aqui.')}
        </p>
        <Link
          href="/clients/new" // ✅ CORRIGIDO
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          ➕ {t('clients.list.createFirstButton', 'Criar Primeiro Cliente')}
        </Link>
      </div>
    );
  }

  // Helper function for person type display
  const getPersonTypeDisplay = (tipo_pessoa: string) => {
    if (tipo_pessoa === 'fisica') {
      return `👤 ${t('dashboard.charts.individual', 'Individual')}`;
    }
    return `🏢 ${t('dashboard.charts.business', 'Empresa')}`;
  };

  // Handle delete confirmation
  const handleDelete = (client: Customer) => {
    const confirmMessage = `${t('clients.list.deleteConfirm', 'Excluir cliente')} "${client.name}"?`;
    if (confirm(confirmMessage)) {
      onClientDeleted(client.id!);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with client count */}
      <h3 className="text-lg font-medium text-gray-700 mb-4">
        📋 {t('clients.list.title', 'Lista de Clientes')} ({clients.length} {t('clients.list.clientsCount', 'clientes')})
      </h3>
      
      {/* Client cards grid */}
      <div className="grid gap-4">
        {clients.map((client) => (
          <div 
            key={client.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              {/* Client info section */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {client.name}
                </h4>
                
                {/* Contact info */}
                <div className="text-sm text-gray-600 mb-1">
                  {client.email && <span>📧 {client.email}</span>}
                  {client.email && client.phone && <span className="mx-2">•</span>}
                  {client.phone && <span>📱 {client.phone}</span>}
                </div>
                
                {/* State and person type */}
                <div className="text-sm text-gray-500">
                  🏴󠁢󠁲󠁲󠁳󠁿 {client.state} • {getPersonTypeDisplay(client.tipo_pessoa)}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 ml-4">
                <Link
                  href={`/clients/edit/${client.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors inline-flex items-center gap-1"
                >
                  ✏️ {t('common.edit', 'Editar')}
                </Link>
                <button
                  onClick={() => handleDelete(client)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors inline-flex items-center gap-1"
                >
                  🗑️ {t('common.delete', 'Excluir')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
