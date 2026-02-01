export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'LOGIN';

export interface AuditLog {
  id: number;
  userId: number;
  actionType: AuditAction;
  targetTable: string;
  targetId: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  ipAddress: string | null;
  user: {
    id: number;
    fullname: string;
    role: {
      name: string;
    };
  };
}

export interface AuditLogFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  actionType?: string;
  targetTable?: string;
  search?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  lastPage: number;
}
