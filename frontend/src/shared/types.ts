export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Report {
  id: string;
  title: string;
  description?: string;
  status: ReportStatus;
  totalAmount: number | string;
  createdAt: string;
  user?: { email: string };
  items?: ReportItem[];
}

export interface ReportItem {
  id: string;
  amount: number;
  currency: string | null;
  category: string | null;
  merchantName: string | null;
  transactionDate: string | null;
}
export type ExpenseCategory =
  | 'TRAVEL'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'TRANSPORTATION'
  | 'OFFICE_SUPPLIES'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'OTHER';
