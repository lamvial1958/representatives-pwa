'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ContactHistory as ContactHistoryType, Customer } from '@/types'; // RENOMEADO para evitar conflito

interface ContactHistoryProps {
  customer: Customer;
  onContactUpdate?: () => void;
}

interface ContactFormData {
  contact_type: 'Email' | 'Ligação' | 'Visita' | 'WhatsApp';
  contact_date: string;
  contact_time: string;
  description: string;
  outcome: 'Positivo' | 'Neutro' | 'Negativo' | 'Agendou reunião';
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
}

const EMPTY_CONTACT: ContactFormData = {
  contact_type: 'Ligação',
  contact_date: new Date().toISOString().split('T')[0],
  contact_time: new Date().toTimeString().slice(0, 5),
  description: '',
  outcome: 'Neutro',
  follow_up_required: false,
  follow_up_date: '',
  notes: ''
};

export const ContactHistory: React.FC<ContactHistoryProps> = ({ 
  customer, 
  onContactUpdate 
}) => {
  const { t } = useTranslation();
  
  // Estados - TIPO CORRIGIDO
  const [contacts, setContacts] = useState<ContactHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactHistoryType | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_CONTACT);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Buscar contatos
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contacts?client_id=${customer.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico de contatos');
      }
      
      const result = await response.json();
      setContacts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [customer.id]);

  // Carregar contatos ao montar
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const contactData: any = {
        client_id: customer.id,
        contact_date: `${formData.contact_date}T${formData.contact_time}:00`, // Usando contact_date
        contact_type: formData.contact_type,
        subject: formData.description, // ContactHistory usa 'subject'
        notes: formData.notes,
        outcome: formData.outcome,
        next_action: formData.follow_up_date // Usando next_action
      };

      const url = editingContact ? '/api/contacts' : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';
      
      if (editingContact) {
        contactData.id = editingContact.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar contato');
      }

      setSuccess(editingContact ? 'Contato atualizado!' : 'Contato adicionado!');
      setFormData(EMPTY_CONTACT);
      setShowForm(false);
      setEditingContact(null);
      await fetchContacts();
      onContactUpdate?.();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contact: ContactHistoryType) => {
    // ContactHistory usa contact_date, não contact_datetime
    const contactDate = new Date(contact.contact_date);
    setFormData({
      contact_type: contact.contact_type as any,
      contact_date: contactDate.toISOString().split('T')[0],
      contact_time: contactDate.toTimeString().slice(0, 5),
      description: contact.subject || '', // ContactHistory usa 'subject', não 'description'
      outcome: contact.outcome as any,
      follow_up_required: false, // Campo não existe no tipo original
      follow_up_date: contact.next_action || '', // Usando next_action como follow_up
      notes: contact.notes || ''
    });
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contactId: string | number | undefined) => {
    if (!contactId) return;
    if (!confirm('Confirma a exclusão deste contato?')) return;

    try {
      const response = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: contactId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir contato');
      }

      setSuccess('Contato excluído!');
      await fetchContacts();
      onContactUpdate?.();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true;
    return contact.contact_type === filter;
  });

  // Estilos
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e9ecef'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: 0
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const filterStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  };

  const filterButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #dee2e6',
    borderRadius: '20px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const activeFilterStyle: React.CSSProperties = {
    ...filterButtonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          📞 {t('crm.contactHistory', 'Histórico de Contatos')} - {customer.name}
        </h3>
        <button
          style={buttonStyle}
          onClick={() => setShowForm(!showForm)}
          disabled={isSubmitting}
        >
          {showForm ? '❌ Cancelar' : '➕ Novo Contato'}
        </button>
      </div>

      {/* Mensagens */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            {editingContact ? '✏️ Editar Contato' : '➕ Novo Contato'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Tipo de Contato
              </label>
              <select
                name="contact_type"
                value={formData.contact_type}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="Ligação">📞 Ligação</option>
                <option value="Email">📧 E-mail</option>
                <option value="WhatsApp">💬 WhatsApp</option>
                <option value="Visita">🤝 Visita</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Data
              </label>
              <input
                type="date"
                name="contact_date"
                value={formData.contact_date}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Horário
              </label>
              <input
                type="time"
                name="contact_time"
                value={formData.contact_time}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Resultado
              </label>
              <select
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="Positivo">✅ Positivo</option>
                <option value="Neutro">➖ Neutro</option>
                <option value="Negativo">❌ Negativo</option>
                <option value="Agendou reunião">📅 Agendou reunião</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Descrição *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Descreva o contato realizado..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              name="follow_up_required"
              checked={formData.follow_up_required}
              onChange={handleInputChange}
              style={{ marginRight: '4px' }}
            />
            <label style={{ fontSize: '14px' }}>
              Requer follow-up
            </label>
          </div>

          {formData.follow_up_required && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Data do Follow-up
              </label>
              <input
                type="date"
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleInputChange}
                style={{
                  width: '200px',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Observações
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Observações adicionais..."
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingContact(null);
                setFormData(EMPTY_CONTACT);
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: '#6c757d',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...buttonStyle,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Salvando...' : (editingContact ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div style={filterStyle}>
        <button
          style={filter === 'all' ? activeFilterStyle : filterButtonStyle}
          onClick={() => setFilter('all')}
        >
          🔍 Todos ({contacts.length})
        </button>
        <button
          style={filter === 'Ligação' ? activeFilterStyle : filterButtonStyle}
          onClick={() => setFilter('Ligação')}
        >
          📞 Ligações ({contacts.filter(c => c.contact_type === 'Ligação').length})
        </button>
        <button
          style={filter === 'Email' ? activeFilterStyle : filterButtonStyle}
          onClick={() => setFilter('Email')}
        >
          📧 E-mails ({contacts.filter(c => c.contact_type === 'Email').length})
        </button>
        <button
          style={filter === 'WhatsApp' ? activeFilterStyle : filterButtonStyle}
          onClick={() => setFilter('WhatsApp')}
        >
          💬 WhatsApp ({contacts.filter(c => c.contact_type === 'WhatsApp').length})
        </button>
        <button
          style={filter === 'Visita' ? activeFilterStyle : filterButtonStyle}
          onClick={() => setFilter('Visita')}
        >
          🤝 Visitas ({contacts.filter(c => c.contact_type === 'Visita').length})
        </button>
      </div>

      {/* Lista de Contatos */}
      <div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            ⏳ Carregando histórico de contatos...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            {filter === 'all' 
              ? '📭 Nenhum contato registrado ainda'
              : `📭 Nenhum contato do tipo "${filter}" encontrado`
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {contact.contact_type === 'Ligação' && '📞'}
                      {contact.contact_type === 'Email' && '📧'}
                      {contact.contact_type === 'WhatsApp' && '💬'}
                      {contact.contact_type === 'Visita' && '🤝'}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6c757d' }}>
                      {new Date(contact.contact_date).toLocaleString('pt-BR')}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: contact.outcome === 'Positivo' ? '#d4edda' : 
                                     contact.outcome === 'Negativo' ? '#f8d7da' : 
                                     contact.outcome === 'Agendou reunião' ? '#cfe2ff' : '#e2e3e5',
                      color: contact.outcome === 'Positivo' ? '#155724' : 
                             contact.outcome === 'Negativo' ? '#721c24' : 
                             contact.outcome === 'Agendou reunião' ? '#052c65' : '#495057'
                    }}>
                      {contact.outcome}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleEdit(contact)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#2c3e50' }}>
                    {contact.subject || 'Sem assunto'}
                  </strong>
                </div>

                {contact.notes && (
                  <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>
                    📝 {contact.notes}
                  </div>
                )}

                {contact.next_action && (
                  <div style={{ fontSize: '12px', color: '#856404', backgroundColor: '#fff3cd', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    ⏰ Próxima ação: {contact.next_action}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactHistory;