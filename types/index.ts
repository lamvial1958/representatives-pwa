// types/index.ts - Interfaces TypeScript compartilhadas

export interface Customer {
  readonly id?: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly company: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly postal_code: string;
  readonly notes: string;
  readonly tipo_pessoa: 'fisica' | 'juridica';
  readonly cpf: string;
  readonly cnpj: string;
  readonly razao_social: string;
  readonly inscricao_estadual: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly active?: boolean;
  zipCode?: string;  
  businessId?: string;

  // CRM Enhancement Fields
  readonly client_notes?: string;
  readonly client_profile?: string;
  readonly client_segment?: string;
  readonly communication_pref?: string;
  readonly last_contact?: string;
  readonly next_contact?: string;
  readonly contact_frequency?: string;
  readonly relationship_stage?: string;
}

export interface CustomerFormData {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly company: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly postal_code: string;
  readonly notes: string;
  readonly tipo_pessoa: 'fisica' | 'juridica';
  readonly cpf: string;
  readonly cnpj: string;
  readonly razao_social: string;
  readonly inscricao_estadual: string;

  // CRM Enhancement Fields
  readonly client_notes?: string;
  readonly client_profile?: string;
  readonly client_segment?: string;
  readonly communication_pref?: string;
  readonly last_contact?: string;
  readonly next_contact?: string;
  readonly contact_frequency?: string;
  readonly relationship_stage?: string;
}

// ========================================
// CRM INTERFACES (NOVAS)
// ========================================

export interface ContactHistory {
  readonly id?: string;
  readonly client_id: string;
  readonly contact_date: string;
  readonly contact_type: 'Visita' | 'Ligação' | 'Email' | 'WhatsApp';
  readonly subject?: string;
  readonly notes: string;
  readonly outcome?: 'Positivo' | 'Neutro' | 'Negativo' | 'Agendou reunião';
  readonly next_action?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface ContactHistoryFormData {
  readonly client_id: string;
  readonly contact_date: string;
  readonly contact_type: 'Visita' | 'Ligação' | 'Email' | 'WhatsApp';
  readonly subject?: string;
  readonly notes: string;
  readonly outcome?: 'Positivo' | 'Neutro' | 'Negativo' | 'Agendou reunião';
  readonly next_action?: string;
}

export interface Goal {
  readonly id?: string;
  readonly period_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  readonly period_start: string;
  readonly period_end: string;
  readonly target_amount: number;
  readonly target_sales?: number;
  readonly current_amount: number;
  readonly current_sales: number;
  readonly status: 'active' | 'completed' | 'overdue';
  readonly notes?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface GoalFormData {
  readonly period_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  readonly period_start: string;
  readonly period_end: string;
  readonly target_amount: number;
  readonly target_sales?: number;
  readonly notes?: string;
}

export interface GoalProgress {
  readonly goal: Goal;
  readonly progress_percentage: number;
  readonly days_remaining: number;
  readonly daily_target_remaining: number;
  readonly projection: number;
  readonly on_track: boolean;
}

// ========================================
// SALES INTERFACES (MANTIDAS)
// ========================================

export interface Sale {
  readonly id?: number;
  readonly customer_id: number;
  readonly customer_name?: string;
  readonly customer_state?: string;
  readonly customer_email?: string;
  readonly sale_date: string;
  readonly product_service: string;
  readonly quantity: number;
  readonly unit_price: number;
  readonly total_amount: number;
  readonly commission_rate: number;
  readonly commission_amount: number;
  readonly payment_method: string;
  readonly status: 'Pendente' | 'Pago' | 'Cancelado';
  readonly notes?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly active?: boolean;
}

export interface SaleFormData {
  readonly customer_id: number;
  readonly customer_name: string;
  readonly customer_state: string;
  readonly sale_date: string;
  readonly product_service: string;
  readonly quantity: number;
  readonly unit_price: number;
  readonly total_amount: number;
  readonly commission_rate: number;
  readonly commission_amount: number;
  readonly payment_method: string;
  readonly status: 'Pendente' | 'Pago' | 'Cancelado';
  readonly notes?: string;
}

export interface SalesStats {
  readonly total_sales: number;
  readonly total_revenue: number;
  readonly total_commission: number;
  readonly paid_sales: number;
  readonly pending_sales: number;
  readonly cancelled_sales: number;
  readonly rs_sales: number;
  readonly rs_revenue: number;
}

export interface SalesByState {
  readonly state: string;
  readonly count: number;
  readonly total_amount: number;
  readonly total_commission: number;
}

export interface SalesByMonth {
  readonly month: string;
  readonly count: number;
  readonly total_amount: number;
  readonly total_commission: number;
}

// ========================================
// API RESPONSE TYPES (MANTIDAS INTACTAS)
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// DATABASE TYPES (MANTIDAS INTACTAS)
// ========================================

export interface DatabaseConfig {
  path: string;
  options?: {
    readonly?: boolean;
    fileMustExist?: boolean;
  };
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowsAffected?: number;
  lastInsertRowid?: number;
}

// ========================================
// VALIDATION TYPES (MANTIDAS INTACTAS)
// ========================================

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
};

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
