export interface LoginRequest {
  username: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  branchCode: string;
  department: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}
