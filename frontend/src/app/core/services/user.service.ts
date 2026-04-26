import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { CreateUserRequest, User } from '../models/user.model';
import { PageResponse } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 10): Observable<ApiResponse<PageResponse<User>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<User>>>(this.url, { params });
  }

  getById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.url}/${id}`);
  }

  create(request: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.url, request);
  }

  assignRole(userId: string, roleId: string): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.url}/${userId}/roles/${roleId}`, {});
  }
}
