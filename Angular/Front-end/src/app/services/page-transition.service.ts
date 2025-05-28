import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PageTransitionService {
  // BehaviorSubject to track loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private router: Router) {
    // Subscribe to router events to track navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingSubject.next(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Add a small delay to make transitions feel smoother
        setTimeout(() => {
          this.loadingSubject.next(false);
        }, 300);
      }
    });
  }

  // Method to manually start loading
  startLoading(): void {
    this.loadingSubject.next(true);
  }

  // Method to manually stop loading
  stopLoading(): void {
    this.loadingSubject.next(false);
  }
} 