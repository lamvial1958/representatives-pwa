'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ContactHistory } from '@/components/crm/ContactHistory'; // CORRIGIDO: named export do caminho correto
import type { Customer } from '@/types';

export default function ClientDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/clients?id=${clientId}`);
        
        if (!response.ok) {
          throw new Error('Cliente não encontrado');
        }
        
        const result = await response.json();
        setCustomer(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar cliente');
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchCustomer();
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          ⏳ Carregando cliente...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          ❌ {error || 'Cliente não encontrado'}
          <br />
          <Link href="/clients" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← Voltar à lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home', 'Início'), href: '/', icon: '🏠' },
          { label: t('nav.clients', 'Clientes'), href: '/clients', icon: '👥' },
          { label: customer.name, icon: '👤' }
        ]}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2c3e50',
            margin: '0 0 8px 0'
          }}>
            👤 {customer.name}
          </h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            Detalhes do cliente e histórico de relacionamento
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href={`/clients/${customer.id}/edit`}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ✏️ Editar Cliente
          </Link>
          <Link
            href="/clients"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            👈 Voltar à Lista
          </Link>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e9ecef'
        }}>
          ℹ️ Informações do Cliente
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {/* Informações Básicas */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
              👤 Dados Básicos
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>Nome:</strong> {customer.name}</div>
              {customer.email && <div><strong>E-mail:</strong> {customer.email}</div>}
              {customer.phone && <div><strong>Telefone:</strong> {customer.phone}</div>}
              {customer.company && <div><strong>Empresa:</strong> {customer.company}</div>}
            </div>
          </div>

          {/* Endereço */}
          {(customer.address || customer.city || customer.state) && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                📍 Endereço
              </h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {customer.address && <div>{customer.address}</div>}
                {(customer.city || customer.state) && (
                  <div>{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}</div>
                )}
                {customer.postal_code && <div>CEP: {customer.postal_code}</div>}
              </div>
            </div>
          )}

          {/* CRM */}
          {(customer.client_profile || customer.client_segment || customer.relationship_stage) && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                🎯 Perfil CRM
              </h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {customer.client_profile && <div><strong>Perfil:</strong> {customer.client_profile}</div>}
                {customer.client_segment && <div><strong>Segmento:</strong> {customer.client_segment}</div>}
                {customer.relationship_stage && <div><strong>Estágio:</strong> {customer.relationship_stage}</div>}
                {customer.communication_pref && <div><strong>Comunicação:</strong> {customer.communication_pref}</div>}
              </div>
            </div>
          )}

          {/* Contatos */}
          {(customer.last_contact || customer.next_contact) && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                📅 Cronograma
              </h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {customer.last_contact && (
                  <div><strong>Último contato:</strong> {new Date(customer.last_contact).toLocaleDateString('pt-BR')}</div>
                )}
                {customer.next_contact && (
                  <div><strong>Próximo contato:</strong> {new Date(customer.next_contact).toLocaleDateString('pt-BR')}</div>
                )}
                {customer.contact_frequency && <div><strong>Frequência:</strong> {customer.contact_frequency}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Anotações */}
        {(customer.client_notes || customer.notes) && (
          <div style={{ marginTop: '20px' }}>
            {customer.client_notes && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                  🎯 Anotações CRM:
                </h4>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#495057',
                  backgroundColor: '#f8f9fa',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  borderLeft: '4px solid #007bff'
                }}>
                  {customer.client_notes}
                </div>
              </div>
            )}
            {customer.notes && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                  📝 Observações Gerais:
                </h4>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#495057',
                  backgroundColor: '#f8f9fa',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  borderLeft: '4px solid #6c757d'
                }}>
                  {customer.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ CONTACTHISTORY COMPONENT */}
      <ContactHistory 
        customer={customer} 
        onContactUpdate={() => {
          // Recarregar dados do cliente se necessário
          console.log('Contact updated for customer:', customer.id);
        }}
      />
    </div>
  );
}