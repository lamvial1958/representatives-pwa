'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Sale, SaleFormData, Customer, ApiResponse } from '@/types';

// ========================================================================
// INTERFACES E TIPOS
// ========================================================================

type SaleFormErrors = Partial<Record<keyof SaleFormData, string>>;
type SaleFormTouched = Partial<Record<keyof SaleFormData, boolean>>;

interface SalesFormProps {
  readonly sale?: Sale | null;
  readonly onSubmit?: (formData: SaleFormData) => Promise<void>;
  readonly onCancel?: () => void;
  readonly isProcessing?: boolean;
  readonly title?: string;
  readonly onSuccess?: (sale: Sale) => void;
  readonly onError?: (error: string) => void;
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: SaleFormErrors;
}

interface CustomerOption {
  readonly id: number;
  readonly name: string;
  readonly state: string;
  readonly email?: string;
}

// ========================================================================
// CONSTANTES
// ========================================================================

const FORM_FIELD_NAMES = Object.freeze([
  'customer_id', 'customer_name', 'customer_state', 'sale_date', 'product_service', 'quantity', 'unit_price',
  'total_amount', 'commission_rate', 'commission_amount', 'payment_method',
  'status', 'notes'
] as const) as readonly (keyof SaleFormData)[];

// Dados padrão para nova venda - CORRIGIDO
const EMPTY_FORM_DATA: Readonly<SaleFormData> = Object.freeze({
  customer_id: 0,
  customer_name: '',                    // ← ADICIONADO
  customer_state: 'RS',                 // ← ADICIONADO
  sale_date: new Date().toISOString().split('T')[0], // Data atual
  product_service: '',
  quantity: 1,
  unit_price: 0,
  total_amount: 0,
  commission_rate: 0.05, // 5% padrão
  commission_amount: 0,
  payment_method: 'Dinheiro',
  status: 'Pendente',
  notes: ''
});

const VALIDATION_RULES = Object.freeze({
  PRODUCT_SERVICE_MIN_LENGTH: 2,
  PRODUCT_SERVICE_MAX_LENGTH: 200,
  MIN_QUANTITY: 0.01,
  MAX_QUANTITY: 999999,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999999,
  MIN_COMMISSION_RATE: 0,
  MAX_COMMISSION_RATE: 1,
  NOTES_MAX_LENGTH: 1000
});

const PAYMENT_METHODS = Object.freeze([
  'Dinheiro',
  'PIX',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Transferência',
  'Boleto',
  'Cheque',
  'Outros'
]);

const STATUS_OPTIONS = Object.freeze([
  { value: 'Pendente', label: '🕐 Pendente', color: '#ffc107' },
  { value: 'Pago', label: '✅ Pago', color: '#28a745' },
  { value: 'Cancelado', label: '❌ Cancelado', color: '#dc3545' }
]);

// ========================================================================
// UTILITÁRIOS
// ========================================================================

const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ').slice(0, 500);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const parseNumber = (value: string): number => {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// ========================================================================
// API FUNCTIONS
// ========================================================================

async function getCustomersAPI(): Promise<Customer[]> {
  const response = await fetch('/api/customers');
  const result: ApiResponse<Customer[]> = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao carregar clientes');
  }
  
  return result.data || [];
}

async function createSaleAPI(saleData: SaleFormData): Promise<ApiResponse<{ id: number }>> {
  const response = await fetch('/api/sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  });

  const result: ApiResponse<{ id: number }> = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao criar venda');
  }
  
  return result;
}

async function updateSaleAPI(id: number, saleData: Partial<SaleFormData>): Promise<ApiResponse> {
  const response = await fetch(`/api/sales?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  });

  const result: ApiResponse = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao atualizar venda');
  }
  
  return result;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const SalesForm: React.FC<SalesFormProps> = ({
  sale,
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
  
  // Estados específicos para vendas
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [customerFilter, setCustomerFilter] = useState<string>('');
  
  const saleHash = useMemo(() => {
    if (!sale) return null;
    return JSON.stringify({
      id: sale.id,
      customer_id: sale.customer_id,
      product_service: sale.product_service,
      updated_at: sale.updated_at
    });
  }, [sale]);
  
  const initialFormData = useMemo((): SaleFormData => {
    if (!sale) return { ...EMPTY_FORM_DATA };
    
    return {
      customer_id: sale.customer_id || 0,
      customer_name: sale.customer_name || '',      // ← ADICIONADO
      customer_state: sale.customer_state || 'RS',  // ← ADICIONADO
      sale_date: sale.sale_date || new Date().toISOString().split('T')[0],
      product_service: sanitizeInput(sale.product_service) || '',
      quantity: sale.quantity || 1,
      unit_price: sale.unit_price || 0,
      total_amount: sale.total_amount || 0,
      commission_rate: sale.commission_rate || 0.05,
      commission_amount: sale.commission_amount || 0,
      payment_method: sale.payment_method || 'Dinheiro',
      status: sale.status || 'Pendente',
      notes: sanitizeInput(sale.notes || "") || ""
    };
  }, [saleHash]);
  
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const [touched, setTouched] = useState<SaleFormTouched>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  // Estado de processamento combinado
  const isProcessing = externalProcessing || isLoading;

  // ========================================
  // EFEITOS
  // ========================================
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (validationTimeoutRef.current) {
        window.clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
      setFormData(initialFormData);
      setErrors({});
      setTouched({});
    }
  }, [initialFormData]);

  // Carregar clientes ao montar componente
  useEffect(() => {
    loadCustomers();
  }, []);

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
    return () => {}; // Always return cleanup
  }, [successMessage, errorMessage]);

  // Recalcular valores quando quantidade ou preço mudam
  useEffect(() => {
    const total = formData.quantity * formData.unit_price;
    const commission = total * formData.commission_rate;
    
    if (formData.total_amount !== total || formData.commission_amount !== commission) {
      setFormData(prev => ({
        ...prev,
        total_amount: Number(total.toFixed(2)),
        commission_amount: Number(commission.toFixed(2))
      }));
    }
  }, [formData.quantity, formData.unit_price, formData.commission_rate]);

  // ========================================
  // FUNÇÕES DE APOIO
  // ========================================

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      const customerData = await getCustomersAPI();
      
      // Converter para CustomerOption e ordenar RS primeiro
      const customerOptions: CustomerOption[] = customerData.map(customer => ({
        id: customer.id!,
        name: customer.name,
        state: customer.state,
        email: customer.email
      })).sort((a, b) => {
        // RS sempre primeiro
        if (a.state === 'RS' && b.state !== 'RS') return -1;
        if (b.state === 'RS' && a.state !== 'RS') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setCustomers(customerOptions);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setErrorMessage('Erro ao carregar lista de clientes');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // Filtrar clientes para dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerFilter.trim()) return customers;
    
    const filter = customerFilter.toLowerCase().trim();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(filter) ||
      customer.email?.toLowerCase().includes(filter) ||
      customer.state.toLowerCase().includes(filter)
    );
  }, [customers, customerFilter]);

  // ========================================
  // VALIDAÇÕES
  // ========================================
  
  const validateField = useCallback((name: keyof SaleFormData, value: any): string => {
    switch (name) {
      case 'customer_id':
        if (!value || value === 0) {
          return t('customerRequired', 'Cliente é obrigatório');
        }
        return '';

      case 'customer_name':
        if (!value || !value.trim()) {
          return t('customerNameRequired', 'Nome do cliente é obrigatório');
        }
        return '';

      case 'customer_state':
        if (!value || !value.trim()) {
          return t('customerStateRequired', 'Estado do cliente é obrigatório');
        }
        return '';

      case 'sale_date':
        if (!value) {
          return t('saleDateRequired', 'Data da venda é obrigatória');
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return t('saleDateInvalid', 'Data deve estar no formato YYYY-MM-DD');
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return t('saleDateInvalid', 'Data inválida');
        }
        return '';

      case 'product_service':
        const sanitized = sanitizeInput(value);
        if (!sanitized) {
          return t('productServiceRequired', 'Produto/Serviço é obrigatório');
        }
        if (sanitized.length < VALIDATION_RULES.PRODUCT_SERVICE_MIN_LENGTH) {
          return t('productServiceMinLength', `Produto/Serviço muito curto (mín. ${VALIDATION_RULES.PRODUCT_SERVICE_MIN_LENGTH} caracteres)`);
        }
        if (sanitized.length > VALIDATION_RULES.PRODUCT_SERVICE_MAX_LENGTH) {
          return t('productServiceMaxLength', `Produto/Serviço muito longo (máx. ${VALIDATION_RULES.PRODUCT_SERVICE_MAX_LENGTH} caracteres)`);
        }
        return '';

      case 'quantity':
        const qty = typeof value === 'number' ? value : parseNumber(value.toString());
        if (qty < VALIDATION_RULES.MIN_QUANTITY) {
          return t('quantityMin', `Quantidade deve ser maior que ${VALIDATION_RULES.MIN_QUANTITY}`);
        }
        if (qty > VALIDATION_RULES.MAX_QUANTITY) {
          return t('quantityMax', `Quantidade muito alta (máx. ${VALIDATION_RULES.MAX_QUANTITY})`);
        }
        return '';

      case 'unit_price':
        const price = typeof value === 'number' ? value : parseNumber(value.toString());
        if (price < VALIDATION_RULES.MIN_PRICE) {
          return t('unitPriceMin', `Preço deve ser maior que ${formatCurrency(VALIDATION_RULES.MIN_PRICE)}`);
        }
        if (price > VALIDATION_RULES.MAX_PRICE) {
          return t('unitPriceMax', `Preço muito alto (máx. ${formatCurrency(VALIDATION_RULES.MAX_PRICE)})`);
        }
        return '';

      case 'commission_rate':
        const rate = typeof value === 'number' ? value : parseNumber(value.toString()) / 100;
        if (rate < VALIDATION_RULES.MIN_COMMISSION_RATE) {
          return t('commissionRateMin', `Taxa de comissão deve ser maior que ${formatPercentage(VALIDATION_RULES.MIN_COMMISSION_RATE)}`);
        }
        if (rate > VALIDATION_RULES.MAX_COMMISSION_RATE) {
          return t('commissionRateMax', `Taxa de comissão deve ser menor que ${formatPercentage(VALIDATION_RULES.MAX_COMMISSION_RATE)}`);
        }
        return '';

      case 'payment_method':
        if (!value || !PAYMENT_METHODS.includes(value)) {
          return t('paymentMethodInvalid', 'Método de pagamento inválido');
        }
        return '';

      case 'status':
        const validStatuses = STATUS_OPTIONS.map(s => s.value);
        if (!value || !validStatuses.includes(value)) {
          return t('statusInvalid', 'Status inválido');
        }
        return '';

      case 'notes':
        const notesSanitized = sanitizeInput(value);
        if (notesSanitized.length > VALIDATION_RULES.NOTES_MAX_LENGTH) {
          return t('notesTooLong', `Observações muito longas (máx. ${VALIDATION_RULES.NOTES_MAX_LENGTH} caracteres)`);
        }
        return '';

      default:
        return '';
    }
  }, [t]);

  const validateForm = useCallback((): ValidationResult => {
    const newErrors: SaleFormErrors = {};
    let isValid = true;

    for (const fieldName of FORM_FIELD_NAMES) {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    return { isValid, errors: newErrors };
  }, [formData, validateField]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleFieldChange = useCallback((name: keyof SaleFormData, value: any) => {
    if (!isMountedRef.current) return;
    
    let processedValue = value;
    
    switch (name) {
      case 'customer_id':
        processedValue = parseInt(value) || 0;
        // Quando selecionar cliente, atualizar nome e estado automaticamente
        const selectedCustomer = customers.find(c => c.id === processedValue);
        if (selectedCustomer) {
          setFormData(prev => ({
            ...prev,
            customer_id: processedValue,
            customer_name: selectedCustomer.name,
            customer_state: selectedCustomer.state
          }));
          setTouched(prev => ({ ...prev, customer_id: true, customer_name: true, customer_state: true }));
          return;
        }
        break;
      case 'quantity':
      case 'unit_price':
        processedValue = typeof value === 'string' ? parseNumber(value) : value;
        if (processedValue < 0) processedValue = 0;
        break;
      case 'commission_rate':
        processedValue = typeof value === 'string' ? parseNumber(value) / 100 : value;
        if (processedValue < 0) processedValue = 0;
        if (processedValue > 1) processedValue = 1;
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
  }, [validateField, successMessage, errorMessage, customers]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    handleFieldChange(name as keyof SaleFormData, value);
  }, [handleFieldChange]);

  const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isProcessing || !isMountedRef.current) return;

    const validation = validateForm();
    setErrors(validation.errors);

    const allFieldsTouched = FORM_FIELD_NAMES.reduce((acc, fieldName) => {
      acc[fieldName] = true;
      return acc;
    }, {} as SaleFormTouched);
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
      if (sale?.id) {
        // Atualizar venda existente
        await updateSaleAPI(sale.id, formData);
        const message = `Venda de "${formData.product_service}" atualizada com sucesso!`;
        setSuccessMessage(message);
        onSuccess?.(sale);
      } else {
        // Criar nova venda
        const result = await createSaleAPI(formData);
        const message = `Venda de "${formData.product_service}" criada com sucesso!`;
        setSuccessMessage(message);
        
        // Resetar formulário após criação
        setFormData({ ...EMPTY_FORM_DATA });
        setTouched({});
        setErrors({});
        
        onSuccess?.({ ...formData, id: result.data?.id });
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no envio do formulário:', error);
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onSubmit, isProcessing, sale, onSuccess, onError]);

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
  // ESTILOS (SEGUINDO PADRÃO CUSTOMERFORM)
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

  const getInputBorderColor = (fieldName: keyof SaleFormData): string => {
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
    backgroundColor: (!isFormValid || isProcessing) ? '#6c757d' : '#007bff',
    color: '#ffffff'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#6c757d',
    color: '#ffffff'
  };

  // Encontrar cliente selecionado para exibição
  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          {title || (sale?.id ? '✏️ Editar Venda' : '💰 Nova Venda')}
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
          ⏳ {sale?.id ? 'Atualizando venda...' : 'Criando venda...'}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Seleção de Cliente */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            👤 {t('customerSelection', 'Seleção de Cliente')}
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {t('customer', 'Cliente')} <span style={{ color: '#dc3545' }}>*</span>
            </label>
            
            {isLoadingCustomers ? (
              <div style={{ ...inputStyle, color: '#6c757d' }}>
                ⏳ Carregando clientes...
              </div>
            ) : (
              <select
                name="customer_id"
                style={{
                  ...inputStyle,
                  borderColor: getInputBorderColor('customer_id')
                }}
                value={formData.customer_id || ''}
                onChange={handleInputChange}
                disabled={isProcessing}
              >
                <option value="">Selecione um cliente...</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.state === 'RS' ? '🏴󠁢󠁲󠁲󠁳󠁿' : '📍'} {customer.name} - {customer.state}
                    {customer.email ? ` (${customer.email})` : ''}
                  </option>
                ))}
              </select>
            )}
            
            <div style={touched.customer_id && errors.customer_id ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
              {touched.customer_id && errors.customer_id ? errors.customer_id : 
               selectedCustomer ? 
                 `Cliente selecionado: ${selectedCustomer.state === 'RS' ? '🏴󠁢󠁲󠁲󠁳󠁿' : '📍'} ${selectedCustomer.name} - ${selectedCustomer.state}` :
                 t('customerHelp', 'Selecione o cliente para esta venda (clientes RS aparecem com 🏴󠁢󠁲󠁲󠁳󠁿)')
              }
            </div>
          </div>
        </div>

        {/* Informações da Venda */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            📦 {t('saleInfo', 'Informações da Venda')}
          </div>
          
          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('productService', 'Produto/Serviço')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="product_service"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('product_service')
                  }}
                  value={formData.product_service}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="Descreva o produto ou serviço vendido"
                  maxLength={VALIDATION_RULES.PRODUCT_SERVICE_MAX_LENGTH}
                  required
                />
                <div style={touched.product_service && errors.product_service ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.product_service && errors.product_service ? errors.product_service : t('productServiceHelp', 'Descreva o que foi vendido')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('saleDate', 'Data da Venda')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="date"
                  name="sale_date"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('sale_date')
                  }}
                  value={formData.sale_date}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  required
                />
                <div style={touched.sale_date && errors.sale_date ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.sale_date && errors.sale_date ? errors.sale_date : t('saleDateHelp', 'Data em que a venda foi realizada')}
                </div>
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('quantity', 'Quantidade')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('quantity')
                  }}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="1"
                  min={VALIDATION_RULES.MIN_QUANTITY}
                  max={VALIDATION_RULES.MAX_QUANTITY}
                  step="0.01"
                  required
                />
                <div style={touched.quantity && errors.quantity ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.quantity && errors.quantity ? errors.quantity : t('quantityHelp', 'Quantidade vendida')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('unitPrice', 'Preço Unitário')} <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('unit_price')
                  }}
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="0.00"
                  min={VALIDATION_RULES.MIN_PRICE}
                  max={VALIDATION_RULES.MAX_PRICE}
                  step="0.01"
                  required
                />
                <div style={touched.unit_price && errors.unit_price ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.unit_price && errors.unit_price ? errors.unit_price : t('unitPriceHelp', 'Preço por unidade em R$')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('totalAmount', 'Valor Total')}
                </label>
                <input
                  type="text"
                  style={{
                    ...inputStyle,
                    backgroundColor: '#e9ecef',
                    fontWeight: '600',
                    color: '#495057'
                  }}
                  value={formatCurrency(formData.total_amount)}
                  disabled={true}
                  placeholder="R$ 0,00"
                />
                <div style={helpFeedbackStyle}>
                  {t('totalAmountHelp', 'Calculado automaticamente (Quantidade × Preço)')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comissão e Pagamento */}
        <div style={sectionStyle}>
          <div style={legendStyle}>
            💰 {t('commissionPayment', 'Comissão e Pagamento')}
          </div>
          
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('commissionRate', 'Taxa de Comissão (%)')}
                </label>
                <input
                  type="number"
                  name="commission_rate"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('commission_rate')
                  }}
                  value={(formData.commission_rate * 100).toFixed(1)}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isProcessing}
                  placeholder="5.0"
                  min={VALIDATION_RULES.MIN_COMMISSION_RATE * 100}
                  max={VALIDATION_RULES.MAX_COMMISSION_RATE * 100}
                  step="0.1"
                />
                <div style={touched.commission_rate && errors.commission_rate ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.commission_rate && errors.commission_rate ? errors.commission_rate : t('commissionRateHelp', 'Percentual de comissão (padrão: 5%)')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('commissionAmount', 'Valor da Comissão')}
                </label>
                <input
                  type="text"
                  style={{
                    ...inputStyle,
                    backgroundColor: '#e9ecef',
                    fontWeight: '600',
                    color: '#28a745'
                  }}
                  value={formatCurrency(formData.commission_amount)}
                  disabled={true}
                  placeholder="R$ 0,00"
                />
                <div style={helpFeedbackStyle}>
                  {t('commissionAmountHelp', 'Calculado automaticamente (Total × Taxa)')}
                </div>
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('paymentMethod', 'Método de Pagamento')}
                </label>
                <select
                  name="payment_method"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('payment_method')
                  }}
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <div style={touched.payment_method && errors.payment_method ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.payment_method && errors.payment_method ? errors.payment_method : t('paymentMethodHelp', 'Como o pagamento foi realizado')}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  {t('status', 'Status')}
                </label>
                <select
                  name="status"
                  style={{
                    ...inputStyle,
                    borderColor: getInputBorderColor('status')
                  }}
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <div style={touched.status && errors.status ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
                  {touched.status && errors.status ? errors.status : t('statusHelp', 'Status atual da venda')}
                </div>
              </div>
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
              placeholder="Observações sobre a venda..."
              maxLength={VALIDATION_RULES.NOTES_MAX_LENGTH}
            />
            <div style={touched.notes && errors.notes ? fieldErrorFeedbackStyle : helpFeedbackStyle}>
              {touched.notes && errors.notes ? errors.notes : t('notesHelp', `Observações adicionais (máx. ${VALIDATION_RULES.NOTES_MAX_LENGTH} caracteres)`)}
            </div>
          </div>
        </div>

        {/* Resumo (se formulário válido) */}
        {isFormValid && selectedCustomer && (
          <div style={{
            ...sectionStyle,
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb'
          }}>
            <div style={legendStyle}>
              📊 {t('saleSummary', 'Resumo da Venda')}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
              <div>
                <strong>Cliente:</strong> {selectedCustomer.state === 'RS' ? '🏴󠁢󠁲󠁲󠁳󠁿' : '📍'} {selectedCustomer.name}
              </div>
              <div>
                <strong>Produto/Serviço:</strong> {formData.product_service}
              </div>
              <div>
                <strong>Quantidade:</strong> {formData.quantity}
              </div>
              <div>
                <strong>Preço Unitário:</strong> {formatCurrency(formData.unit_price)}
              </div>
              <div>
                <strong>Valor Total:</strong> {formatCurrency(formData.total_amount)}
              </div>
              <div style={{ color: '#28a745', fontWeight: '600' }}>
                <strong>Sua Comissão:</strong> {formatCurrency(formData.commission_amount)} ({formatPercentage(formData.commission_rate)})
              </div>
            </div>
          </div>
        )}

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
            disabled={!isFormValid || isProcessing}
          >
            {isLoading 
              ? (sale?.id ? 'Atualizando...' : 'Criando...') 
              : sale?.id 
                ? t('update', 'Atualizar') 
                : t('create', 'Criar')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;
