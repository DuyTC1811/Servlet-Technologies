import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { Permission, Role } from '../models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private url = `${environment.apiUrl}/roles`;
  private permUrl = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.url);
  }

  listPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(this.permUrl);
  }

  assignPermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.url}/${roleId}/permissions`, permissionIds);
  }
}
