export interface Transaction {
  id: string;
  transactionNo: string;
  amount: number;
  currency: string;
  branchCode: string;
  department: string;
  status: TransactionStatus;
  createdById: string;
  createdByUsername: string;
  approvedById?: string;
  approvedByUsername?: string;
  createdAt: string;
  approvedAt?: string;
}

export type TransactionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface CreateTransactionRequest {
  amount: number;
  currency: string;
  department?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
