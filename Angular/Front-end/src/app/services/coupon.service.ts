import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/coupons`;

  getCoupon(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  validateCoupon(code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/validate`, { code });
  }
}
