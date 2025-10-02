'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import type { Customer } from '@/types';

interface ClientCardProps {
  client: Customer;
  onDeleted: (id: number) => void;
}

export default function ClientCard({ client, onDeleted }: ClientCardProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      
      // Chamar a funÃ§Ã£o onDeleted que foi passada pelo componente pai
      if (client.id !== undefined) { await onDeleted(client.id); }
      
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Info do Cliente */}
        <div className="flex-1">
          {/* Header com nome e estado */}
          <div className="flex items-center gap-2 mb-2">
            <div className="text-lg">
              {client.tipo_pessoa === 'fisica' ? 'ðŸ‘¤' : 'ðŸ¢'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {client.name}
            </h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {client.state === 'RS' ? 'ðŸ´ó ¢ó ²ó ²ó ³ó ¿' : 'ðŸ“'} {client.state}
            </span>
          </div>

          {/* InformaÃ§Ãµes de contato */}
          <div className="space-y-1 text-sm text-gray-600">
            {client.email && (
              <div className="flex items-center gap-2">
                <span>ðŸ“§</span>
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <span>ðŸ“±</span>
                <span>{client.phone}</span>
              </div>
            )}
            {client.city && (
              <div className="flex items-center gap-2">
                <span>ðŸ™ï¸</span>
                <span>{client.city}</span>
              </div>
            )}
          </div>

          {/* Data de criaÃ§Ã£o */}
          {client.created_at && (
            <div className="mt-2 text-xs text-gray-500">
              Criado: {new Date(client.created_at).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        {/* Badge de NegÃ³cios */}
        <div className="ml-4">
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            ðŸ’¼ NegÃ³cios
          </span>
        </div>
      </div>

      {/* BotÃµes de AÃ§Ã£o */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        {/* BotÃ£o Editar */}
        <Link
          href={`/clients/edit/${client.id}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors inline-flex items-center justify-center gap-2"
        >
          âœï¸ {t('common.edit', 'Editar')}
        </Link>

        {/* BotÃ£o Excluir */}
        {!showConfirm ? (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Excluindo...
              </>
            ) : (
              <>
                ðŸ—‘ï¸ {t('common.delete', 'Excluir')}
              </>
            )}
          </button>
        ) : (
          <>
            {/* BotÃ£o Confirmar ExclusÃ£o */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              {isDeleting ? 'Excluindo...' : 'âœ… Confirmar'}
            </button>
            
            {/* BotÃ£o Cancelar */}
            <button
              onClick={cancelDelete}
              disabled={isDeleting}
              className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              âŒ Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

