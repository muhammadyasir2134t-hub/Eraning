export type UserRole = 'admin' | 'manager' | 'performer';
export type PaymentStatus = 'unpaid' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  referralCode: string;
  role?: UserRole;
  isVerified: boolean;
  paymentStatus?: PaymentStatus;
  profileCompleted?: boolean;
  createdAt?: string;
}

export interface ActivationPayment {
  id: number | string;
  user_id: number | string;
  user_name?: string;
  user_email?: string;
  user_mobile?: string;
  amount: number | string;
  payment_method: 'easypaisa' | 'jazzcash' | 'bank';
  sender_name: string;
  sender_number: string;
  trx_id: string;
  receipt_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Profile {
  id?: string;
  userId?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  skills?: string;
  education?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  isKycVerified?: boolean;
  notificationPreferences?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: string | number;
  pendingBalance: string | number;
  totalEarned: string | number;
  totalWithdrawn: string | number;
  currency: string;
}

export type TaskStatus = 
  | 'available'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface Task {
  id: string;
  title: string;
  category: string;
  description: string;
  instructions: string;
  reward_amount: string | number;
  estimated_minutes: number;
  total_slots: number;
  remaining_slots: number;
  difficulty: string;
  required_proof_type: string;
  status: string;
  created_at?: string;
  user_submission_status?: TaskStatus;
  user_submission_id?: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  status: TaskStatus;
  proof_submission: string;
  feedback?: string;
  reward_amount: string | number;
  submitted_at: string;
  reviewed_at?: string;
  task_title?: string;
  task_category?: string;
  task_difficulty?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  transaction_number: string;
  type: 'task_earning' | 'withdrawal' | 'referral_bonus' | 'service_fee' | 'adjustment';
  amount: string | number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  metadata?: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  withdrawal_number: string;
  amount: string | number;
  fee_amount: string | number;
  net_amount: string | number;
  payment_method: 'easypaisa' | 'jazzcash' | 'bank_transfer';
  account_title: string;
  account_number: string;
  bank_name?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes?: string;
  requested_at: string;
  processed_at?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'answered' | 'in_progress' | 'closed';
  message: string;
  replies: string;
  created_at: string;
  updated_at: string;
}
