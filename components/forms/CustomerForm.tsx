'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, CustomerFormData, ApiResponse } from '@/types';

// ========================================================================
// INTERFACES E TIPOS
// ========================================================================

// Usar tipos do types/index.ts para consistência
type CustomerFormErrors = Partial<Record<keyof CustomerFormData, string>>;
type CustomerFormTouched = Partial<Record<keyof CustomerFormData, boolean>>;

interface CustomerFormProps {
  readonly customer?: Customer | null;
  readonly onSubmit?: (formData: CustomerFormData) => Promise<void>;
  readonly onCancel?: () => void;
  readonly isProcessing?: boolean;
  readonly title?: string;
  readonly onSuccess?: (customer: Customer) => void;
  readonly onError?: (error: string) => void;
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: CustomerFormErrors;
}

// ========================================================================
// CONSTANTES
// ========================================================================

const FORM_FIELD_NAMES = Object.freeze([
  'name', 'email', 'phone', 'company', 'address', 'city', 'state', 'postal_code', 'notes',
  'tipo_pessoa', 'cpf', 'cnpj', 'razao_social', 'inscricao_estadual',
  // CRM Fields
  'client_notes', 'client_profile', 'client_segment', 'communication_pref',
  'last_contact', 'next_contact', 'contact_frequency', 'relationship_stage'
] as const) as readonly (keyof CustomerFormData)[];

// ✅ RS como padrão para novos clientes
const EMPTY_FORM_DATA: Readonly<CustomerFormData> = Object.freeze({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: 'RS', // ← RS COMO PADRÃO
  postal_code: '',
  notes: '',
  tipo_pessoa: 'fisica',
  cpf: '',
  cnpj: '',
  razao_social: '',
  inscricao_estadual: '',
  // CRM Fields
  client_notes: '',
  client_profile: '',
  client_segment: '',
  communication_pref: '',
  last_contact: '',
  next_contact: '',
  contact_frequency: '',
  relationship_stage: ''
});

const VALIDATION_RULES = Object.freeze({
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 100,
  COMPANY_MAX_LENGTH: 100,
  ADDRESS_MAX_LENGTH: 200,
  CITY_MAX_LENGTH: 50,
  STATE_LENGTH: 2,
  CEP_LENGTH: 8,
  NOTES_MAX_LENGTH: 1000,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 11,
  CPF_LENGTH: 11,
  CNPJ_LENGTH: 14,
  RAZAO_SOCIAL_MAX_LENGTH: 255,
  INSCRICAO_ESTADUAL_MAX_LENGTH: 20
});

// ✅ Estados organizados por região, com RS em destaque
const BRAZILIAN_STATES = Object.freeze([
  'RS', // ← RS EM PRIMEIRO LUGAR
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]);

// ========================================================================
// UTILITÁRIOS
// ========================================================================

const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ').slice(0, 500);
};

const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

const formatPhone = (value: string): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};

const formatCEP = (value: string): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const formatCNPJ = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
};

const formatCPF = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

const isValidCNPJFormat = (cnpj: string): boolean => {
  if (!cnpj) return false;
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14 && !/^(\d)\1+$/.test(cleaned);
};

const isValidCPFFormat = (cpf: string): boolean => {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11 && !/^(\d)\1+$/.test(cleaned);
};

const isValidEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.toLowerCase());
};

// ========================================================================
// API FUNCTIONS
// ========================================================================

async function createCustomerAPI(customerData: CustomerFormData): Promise<ApiResponse<{ id: number }>> {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  const result: ApiResponse<{ id: number }> = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao criar cliente');
  }
  
  return result;
}

async function updateCustomerAPI(id: number, customerData: Partial<CustomerFormData>): Promise<ApiResponse> {
  const response = await fetch('/api/clients', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...customerData }),
  });

  const result: ApiResponse = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao atualizar cliente');
  }
  
  return result;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
  isProcessing: externalProcessing = false,
  title,
  onSuccess,
  onError
}) => {
  // ========================================
  // HOOKS
  // ========================================
  
  const { t } = useTranslation();
  
  // ========================================
  // REFS E ESTADO
  // ========================================
  
  const isMountedRef = useRef<boolean>(true);
  const validationTimeoutRef = useRef<number | null>(null);
  
  // Estados para integração com API
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const customerHash = useMemo(() => {
    if (!customer) return null;
    return JSON.stringify({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      updated_at: customer.updated_at
    });
  }, [customer]);
  
  const initialFormData = useMemo((): CustomerFormData => {
    if (!customer) return { ...EMPTY_FORM_DATA };
    
    return {
      name: sanitizeInput(customer.name) || '',
      email: sanitizeInput(customer.email) || '',
      phone: customer.phone || '',
      company: sanitizeInput(customer.company) || '',
      address: sanitizeInput(customer.address) || '',
      city: sanitizeInput(customer.city) || '',
      state: customer.state || 'RS', // ← Mantém RS como fallback
      postal_code: customer.postal_code || '',
      notes: sanitizeInput(customer.notes) || '',
      tipo_pessoa: (customer.tipo_pessoa as 'fisica' | 'juridica') || 'fisica',
      cpf: customer.cpf || '',
      cnpj: customer.cnpj || '',
      razao_social: sanitizeInput(customer.razao_social) || '',
      inscricao_estadual: customer.inscricao_estadual || '',
      // CRM Fields
      client_notes: customer.client_notes || '',
      client_profile: customer.client_profile || '',
      client_segment: customer.client_segment || '',
      communication_pref: customer.communication_pref || '',
      last_contact: customer.last_contact || '',
      next_contact: customer.next_contact || '',
      contact_frequency: customer.contact_frequency || '',
      relationship_stage: customer.relationship_stage || ''
    };
  }, [customerHash]);
  
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [touched, setTouched] = useState<CustomerFormTouched>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  // Estado de processamento combinado
  const isProcessing = externalProcessing || isLoading;

  // ========================================
  // EFEITOS
  // ========================================
  
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
    return () => {}; // Always return cleanup function
  }, [successMessage, errorMessage]);

  // ========================================
  // VALIDAÇÕES
  // ========================================
  
  const validateField = useCallback((name: keyof CustomerFormData, value: string): string => {
    const sanitized = sanitizeInput(value);
    
    // Validação relaxada temporariamente - só nome obrigatório
    if (name === 'name' && !sanitized) {
      return 'Nome é obrigatório';
    }
    
    // Outras validações desabilitadas temporariamente
    return '';
  }, [t, formData.tipo_pessoa]);

  const validateForm = useCallback((): ValidationResult => {
    const newErrors: CustomerFormErrors = {};
    let isValid = true;

    // Validação simplificada - só nome
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }

    return { isValid, errors: newErrors };
  }, [formData]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleFieldChange = useCallback((name: keyof CustomerFormData, value: string) => {
    if (!isMountedRef.current) return;
    
    let processedValue = value;
    
    switch (name) {
      case 'phone':
        processedValue = formatPhone(value);
        break;
      case 'postal_code':
        processedValue = formatCEP(value);
        break;
      case 'state':
        processedValue = value.toUpperCase().slice(0, VALIDATION_RULES.STATE_LENGTH);
        break;
      case 'name':
      case 'city':
      case 'razao_social':
        processedValue = capitalizeWords(value);
        break;
      case 'email':
        processedValue = value.toLowerCase().trim();
        break;
      case 'cpf':
        processedValue = formatCPF(value);
        break;
      case 'cnpj':
        processedValue = formatCNPJ(value);
        break;
      case 'tipo_pessoa':
        processedValue = value as 'fisica' | 'juridica';
        if (value === 'fisica') {
          setFormData(prev => ({ ...prev, cnpj: '', razao_social: '' }));
        } else {
          setFormData(prev => ({ ...prev, cpf: '' }));
        }
        break;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Limpar mensagens de feedback ao editar
    if (successMessage || errorMessage) {
      setSuccessMessage('');
      setErrorMessage('');
    }
    
    if (validationTimeoutRef.current) {
      window.clearTimeout(validationTimeoutRef.current);
    }
    
    validationTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        const error = validateField(name, processedValue);
        setErrors(prev => ({ ...prev, [name]: error }));
        validationTimeoutRef.current = null;
      }
    }, 500);
  }, [validateField, successMessage, errorMessage]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    handleFieldChange(name as keyof CustomerFormData, value);
  }, [handleFieldChange]);

  const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isProcessing || !isMountedRef.current) {
      return;
    }

    const validation = validateForm();
    setErrors(validation.errors);

    const allFieldsTouched = FORM_FIELD_NAMES.reduce((acc, fieldName) => {
      acc[fieldName] = true;
      return acc;
    }, {} as CustomerFormTouched);
    setTouched(allFieldsTouched);

    if (!validation.isValid) {
      const firstErrorField = Object.keys(validation.errors)[0];
      const firstErrorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      firstErrorElement?.focus();
      setErrorMessage('Por favor, corrija os erros no formulário');
      return;
    }

    // Limpar mensagens anteriores
    setSuccessMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Se há um onSubmit customizado, usar ele primeiro
      if (onSubmit) {
        await onSubmit(formData);
        return;
      }

      // Caso contrário, usar a integração com API
      if (customer?.id) {
        // Atualizar cliente existente
        await updateCustomerAPI(customer.id, formData);
        const message = `Cliente "${formData.name}" atualizado com sucesso!`;
        setSuccessMessage(message);
        onSuccess?.(customer);
      } else {
        // Criar novo cliente
        const result = await createCustomerAPI(formData);
        const message = `Cliente "${formData.name}" criado com sucesso!`;
        setSuccessMessage(message);
        
        // Resetar formulário após criação
        setFormData({ ...EMPTY_FORM_DATA });
        setTouched({});
        setErrors({});
        
        onSuccess?.({ ...formData, id: result.data?.id || 0 } as Customer);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onSubmit, isProcessing, customer, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form if no custom cancel handler
      setFormData(initialFormData);
      setErrors({});
      setTouched({});
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [onCancel, initialFormData]);

  // ========================================
  // EFEITO DE VALIDAÇÃO
  // ========================================

  useEffect(() => {
    if (isMountedRef.current) {
      const validation = validateForm();
      setIsFormValid(validation.isValid);
    }
  }, [formData, validateForm]);

  // ========================================
  // ESTILOS
  // ========================================

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0'
  };

  const feedbackStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  };

  const successFeedbackStyle: React.CSSProperties = {
    ...feedbackStyle,
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724'
  };

  const errorFeedbackStyle: React.CSSProperties = {
    ...feedbackStyle,
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '25px',
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa'
  };

  const legendStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '15px',
    paddingBottom: '8px',
    borderBottom: '1px solid #dee2e6'
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px'
  };

  const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '5px'
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    opacity: isProcessing ? 0.7 : 1
  };

  const getInputBorderColor = (fieldName: keyof CustomerFormData): string => {
    if (touched[fieldName] && errors[fieldName]) return '#dc3545';
    if (touched[fieldName] && !errors[fieldName]) return '#28a745';
    return '#ced4da';
  };

  const fieldErrorFeedbackStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#dc3545',
    marginTop: '4px',
    minHeight: '16px'
  };

  const helpFeedbackStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '4px',
    minHeight: '16px'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e9ecef'
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    opacity: isProcessing ? 0.7 : 1
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: isFormValid && !isProcessing ? '#007bff' : '#6c757d',
    color: '#ffffff'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#6c757d',
    color: '#ffffff'
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          {title || (customer?.id ? '✏️ Editar Cliente' : '➕ Novo Cliente')}
        </h2>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div style={successFeedbackStyle}>
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={errorFeedbackStyle}>
          ❌ {errorMessage}
        </div>
      )}

      {isLoading && (
        <div style={{ ...feedbackStyle, backgroundColor: '#cce7ff', border: '1px solid #99d6ff', color: '#0066cc' }}>
          ⏳ {customer?.id ? 'Atualizando cliente...' : 'Criando cliente...'}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Informações Básicas */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            👤 {t('basicInfo', 'Informações Básicas')}
          </div>
          
          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('name', 'Nome')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('name')
                  }}
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="Nome completo"
                  maxLength={VALIDATION_RULES.NAME_MAX_LENGTH}
                  required
                />
                <div style={touched.name && errors.name ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.name && errors.name ? errors.name : t('nameHelp', 'Nome completo do cliente')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('email', 'E-mail')}
                </label>
                <input
                  type="email"
                  name="email"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('email')
                  }}
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="email@exemplo.com"
                  maxLength={VALIDATION_RULES.EMAIL_MAX_LENGTH}
                />
                <div style={touched.email && errors.email ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.email && errors.email ? errors.email : t('emailHelp', 'E-mail para contato')}
                </div>
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('phone', 'Telefone')}
                </label>
                <input
                  type="text"
                  name="phone"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('phone')
                  }}
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                <div style={touched.phone && errors.phone ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.phone && errors.phone ? errors.phone : t('phoneHelp', 'Telefone de contato')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('company', 'Empresa')}
                </label>
                <input
                  type="text"
                  name="company"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('company')
                  }}
                  value={formData.company}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="Nome da empresa"
                  maxLength={VALIDATION_RULES.COMPANY_MAX_LENGTH}
                />
                <div style={touched.company && errors.company ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.company && errors.company ? errors.company : t('companyHelp', 'Empresa onde trabalha')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos Brasileiros */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            📄 {t('documentsTitle', 'Documentos Brasileiros')}
          </div>
          
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('personType', 'Tipo de Pessoa')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  name="tipo_pessoa"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('tipo_pessoa')
                  }}
                  value={formData.tipo_pessoa}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="fisica">👤 Pessoa Física</option>
                  <option value="juridica">🏢 Pessoa Jurídica</option>
                </select>
              </div>
            </div>
            
            {formData.tipo_pessoa === 'fisica' ? (
              <div style={{ flex: 1 }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    {t('cpf', 'CPF')}
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    style={{
                      ...inputStyle,
                      borderColor: getInputBorderColor('cpf')
                    }}
                    value={formData.cpf}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="123.456.789-01"
                    disabled={isProcessing}
                    maxLength={14}
                  />
                  <div style={touched.cpf && errors.cpf ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                    {touched.cpf && errors.cpf ? errors.cpf : t('cpfHelp', 'CPF da pessoa física')}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    {t('cnpj', 'CNPJ')}
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    style={{
                      ...inputStyle,
                      borderColor: getInputBorderColor('cnpj')
                    }}
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="12.345.678/0001-01"
                    disabled={isProcessing}
                    maxLength={18}
                  />
                  <div style={touched.cnpj && errors.cnpj ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                    {touched.cnpj && errors.cnpj ? errors.cnpj : t('cnpjHelp', 'CNPJ da empresa')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {formData.tipo_pessoa === 'juridica' && (
            <div style={rowStyle}>
              <div style={{ flex: 2 }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    {t('razaoSocial', 'Razão Social')}
                  </label>
                  <input
                    type="text"
                    name="razao_social"
                    style={{
                      ...inputStyle,
                      borderColor: getInputBorderColor('razao_social')
                    }}
                    value={formData.razao_social}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Empresa Exemplo Ltda."
                    disabled={isProcessing}
                    maxLength={VALIDATION_RULES.RAZAO_SOCIAL_MAX_LENGTH}
                  />
                  <div style={touched.razao_social && errors.razao_social ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                    {touched.razao_social && errors.razao_social ? errors.razao_social : t('razaoSocialHelp', 'Nome oficial da empresa')}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    {t('inscricaoEstadual', 'Inscrição Estadual')}
                  </label>
                  <input
                    type="text"
                    name="inscricao_estadual"
                    style={{
                      ...inputStyle,
                      borderColor: getInputBorderColor('inscricao_estadual')
                    }}
                    value={formData.inscricao_estadual}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="123.456.789.012"
                    disabled={isProcessing}
                    maxLength={VALIDATION_RULES.INSCRICAO_ESTADUAL_MAX_LENGTH}
                  />
                  <div style={touched.inscricao_estadual && errors.inscricao_estadual ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                    {touched.inscricao_estadual && errors.inscricao_estadual ? errors.inscricao_estadual : t('inscricaoEstadualHelp', 'Inscrição Estadual (opcional)')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Endereço */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            📍 {t('addressTitle', 'Endereço')}
          </div>
          
          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('address', 'Endereço')}
                </label>
                <input
                  type="text"
                  name="address"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('address')
                  }}
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="Rua, número, complemento"
                  maxLength={VALIDATION_RULES.ADDRESS_MAX_LENGTH}
                />
                <div style={touched.address && errors.address ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.address && errors.address ? errors.address : t('addressHelp', 'Endereço completo')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('postalCode', 'CEP')}
                </label>
                <input
                  type="text"
                  name="postal_code"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('postal_code')
                  }}
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="12345-678"
                  maxLength={9}
                />
                <div style={touched.postal_code && errors.postal_code ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.postal_code && errors.postal_code ? errors.postal_code : t('postalCodeHelp', 'CEP (8 dígitos)')}
                </div>
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('city', 'Cidade')}
                </label>
                <input
                  type="text"
                  name="city"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('city')
                  }}
                  value={formData.city}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="Nome da cidade"
                  maxLength={VALIDATION_RULES.CITY_MAX_LENGTH}
                />
                <div style={touched.city && errors.city ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.city && errors.city ? errors.city : t('cityHelp', 'Cidade onde reside')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('state', 'Estado')} 🏴󠁢󠁲󠁲󠁳󠁿
                </label>
                <select
                  name="state"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('state')
                  }}
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  {BRAZILIAN_STATES.map(state => (
                    <option key={state} value={state}>
                      {state === 'RS' ? '🏴󠁢󠁲󠁲󠁳󠁿 RS - Rio Grande do Sul' : state}
                    </option>
                  ))}
                </select>
                <div style={touched.state && errors.state ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.state && errors.state ? errors.state : t('stateHelp', 'Estado brasileiro (padrão: RS)')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ SEÇÃO CRM - GESTÃO DE RELACIONAMENTO */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            🎯 {t('crmTitle', 'Gestão de Relacionamento (CRM)')}
          </div>
          
          {/* Perfil e Segmentação */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('clientProfile', 'Perfil do Cliente')}
                </label>
                <select
                  name="client_profile"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('client_profile')
                  }}
                  value={formData.client_profile}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="">Selecionar perfil...</option>
                  <option value="Decisor">👑 Decisor</option>
                  <option value="Técnico">🔧 Técnico</option>
                  <option value="Comprador">💰 Comprador</option>
                  <option value="Influenciador">📢 Influenciador</option>
                </select>
                <div style={touched.client_profile && errors.client_profile ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.client_profile && errors.client_profile ? errors.client_profile : 'Papel do cliente na decisão de compra'}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('clientSegment', 'Segmento')}
                </label>
                <select
                  name="client_segment"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('client_segment')
                  }}
                  value={formData.client_segment}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="">Selecionar segmento...</option>
                  <option value="Premium">💎 Premium</option>
                  <option value="Standard">⭐ Standard</option>
                  <option value="Prospect">🎯 Prospect</option>
                </select>
                <div style={touched.client_segment && errors.client_segment ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.client_segment && errors.client_segment ? errors.client_segment : 'Classificação do cliente'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('relationshipStage', 'Estágio do Relacionamento')}
                </label>
                <select
                  name="relationship_stage"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('relationship_stage')
                  }}
                  value={formData.relationship_stage}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="">Selecionar estágio...</option>
                  <option value="Prospect">🔍 Prospect</option>
                  <option value="Qualificado">✅ Qualificado</option>
                  <option value="Proposta">📋 Proposta</option>
                  <option value="Cliente">🤝 Cliente</option>
                </select>
                <div style={touched.relationship_stage && errors.relationship_stage ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.relationship_stage && errors.relationship_stage ? errors.relationship_stage : 'Estágio atual do relacionamento'}
                </div>
              </div>
            </div>
          </div>

          {/* Comunicação */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('communicationPref', 'Preferência de Comunicação')}
                </label>
                <select
                  name="communication_pref"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('communication_pref')
                  }}
                  value={formData.communication_pref}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="">Selecionar preferência...</option>
                  <option value="Email">📧 Email</option>
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="Ligação">📞 Ligação</option>
                  <option value="Presencial">🤝 Presencial</option>
                </select>
                <div style={touched.communication_pref && errors.communication_pref ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.communication_pref && errors.communication_pref ? errors.communication_pref : 'Como prefere ser contatado'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('contactFrequency', 'Frequência de Contato')}
                </label>
                <select
                  name="contact_frequency"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('contact_frequency')
                  }}
                  value={formData.contact_frequency}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  <option value="">Selecionar frequência...</option>
                  <option value="Semanal">📅 Semanal</option>
                  <option value="Quinzenal">🗓️ Quinzenal</option>
                  <option value="Mensal">📆 Mensal</option>
                </select>
                <div style={touched.contact_frequency && errors.contact_frequency ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.contact_frequency && errors.contact_frequency ? errors.contact_frequency : 'Frequência ideal de contato'}
                </div>
              </div>
            </div>
          </div>

          {/* Datas de Contato */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('lastContact', 'Último Contato')}
                </label>
                <input
                  type="date"
                  name="last_contact"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('last_contact')
                  }}
                  value={formData.last_contact}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                />
                <div style={touched.last_contact && errors.last_contact ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.last_contact && errors.last_contact ? errors.last_contact : 'Data do último contato realizado'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('nextContact', 'Próximo Contato')}
                </label>
                <input
                  type="date"
                  name="next_contact"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('next_contact')
                  }}
                  value={formData.next_contact}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                />
                <div style={touched.next_contact && errors.next_contact ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.next_contact && errors.next_contact ? errors.next_contact : 'Data planejada para próximo contato'}
                </div>
              </div>
            </div>
          </div>

          {/* Anotações CRM */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {t('clientNotes', 'Anotações CRM')}
            </label>
            <textarea
              name="client_notes"
              style={{
                ...inputStyle,
                borderColor: getInputBorderColor('client_notes'),
                minHeight: '100px',
                resize: 'vertical'
              }}
              value={formData.client_notes}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isProcessing}
              placeholder="Anotações importantes sobre o relacionamento, preferências, histórico de negociações..."
              maxLength={1000}
            />
            <div style={touched.client_notes && errors.client_notes ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
              {touched.client_notes && errors.client_notes ? errors.client_notes : 'Informações estratégicas para o relacionamento (máx. 1000 caracteres)'}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            📝 {t('additionalInfoTitle', 'Informações Adicionais')}
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {t('notes', 'Observações')}
            </label>
            <textarea
              name="notes"
              style={{
                ...inputStyle,
                borderColor: getInputBorderColor('notes'),
                minHeight: '80px',
                resize: 'vertical'
              }}
              value={formData.notes}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isProcessing}
              placeholder="Observações sobre o cliente..."
              maxLength={VALIDATION_RULES.NOTES_MAX_LENGTH}
            />
            <div style={touched.notes && errors.notes ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
              {touched.notes && errors.notes ? errors.notes : t('notesHelp', `Observações adicionais (máx. ${VALIDATION_RULES.NOTES_MAX_LENGTH} caracteres)`)}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div style={buttonGroupStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            {t('cancel', 'Cancelar')}
          </button>
          
          <button
            type="submit"
            style={primaryButtonStyle}
            disabled={isProcessing || !isFormValid}
          >
            {isLoading 
              ? (customer?.id ? 'Atualizando...' : 'Criando...') 
              : customer?.id 
                ? t('update', 'Atualizar') 
                : t('create', 'Criar')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;