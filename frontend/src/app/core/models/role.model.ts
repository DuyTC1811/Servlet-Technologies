export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}
