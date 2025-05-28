import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payment`;

  createCheckoutSession(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create-checkout-session`, {});
  }

  confirmCheckoutSuccess(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout-success`, { sessionId });
  }
}
