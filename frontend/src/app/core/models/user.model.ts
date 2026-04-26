export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  branchCode: string;
  approvalLimit?: number;
  status: string;
  roles: string[];
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  department: string;
  branchCode: string;
  approvalLimit?: number;
}
