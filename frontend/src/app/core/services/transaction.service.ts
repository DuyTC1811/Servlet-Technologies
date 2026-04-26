import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { CreateTransactionRequest, PageResponse, Transaction } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private url = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 10): Observable<ApiResponse<PageResponse<Transaction>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Transaction>>>(this.url, { params });
  }

  getById(id: string): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(`${this.url}/${id}`);
  }

  create(request: CreateTransactionRequest): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(this.url, request);
  }

  approve(id: string): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(`${this.url}/${id}/approve`, {});
  }

  reject(id: string): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(`${this.url}/${id}/reject`, {});
  }
}
