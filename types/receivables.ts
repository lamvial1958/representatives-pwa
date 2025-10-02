export interface AccountReceivable {
  id: string;
  client_id: string;
  client_name: string;
  sale_id?: string;
  description: string;
  original_amount: number;
  current_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  original_due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'renegotiated' | 'cancelled';
  installment_number?: number;
  total_installments?: number;
  interest_rate?: number;
  discount_amount?: number;
  late_fee?: number;
  notes?: string;
  renegotiation_count: number;
  created_at: string;
  updated_at: string;
}

export interface RenegotiationHistory {
  id: string;
  receivable_id: string;
  old_amount: number;
  new_amount: number;
  old_due_date: string;
  new_due_date: string;
  reason: string;
  discount_applied?: number;
  interest_applied?: number;
  renegotiated_by: string;
  renegotiated_at: string;
}

export interface PaymentHistory {
  id: string;
  receivable_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'check' | 'card' | 'pix';
  notes?: string;
  created_at: string;
}
